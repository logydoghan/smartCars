"""Thin wrapper around the Claude API for structured (pydantic) responses."""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass, field
from typing import Protocol, TypeVar

import anthropic
from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMError(RuntimeError):
    pass


@dataclass
class Research:
    """Claude's notes from a web research turn, and every URL it actually saw."""

    notes: str
    urls: set[str] = field(default_factory=set)


class StructuredLLM(Protocol):
    def ask(
        self,
        system: str,
        prompt: str,
        schema: type[T],
        image: bytes | None = None,
        image_type: str = "image/webp",
    ) -> T:
        """Answer in the schema's shape; an `image` is shown to Claude before the prompt."""
        ...

    def research(
        self, system: str, prompt: str, domains: list[str], max_searches: int, max_fetches: int
    ) -> Research:
        """Let Claude search and read pages on `domains` only, and return its notes."""
        ...


# Server-side web tools run a few turns at a time; a paused turn is resumed this many times.
MAX_CONTINUATIONS = 4


class ClaudeLLM:
    def __init__(self, model: str, client: anthropic.Anthropic | None = None) -> None:
        self.model = model
        self.client = client or anthropic.Anthropic()

    def ask(
        self,
        system: str,
        prompt: str,
        schema: type[T],
        image: bytes | None = None,
        image_type: str = "image/webp",
    ) -> T:
        content: str | list[dict] = prompt
        if image is not None:
            content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": image_type,
                        "data": base64.b64encode(image).decode(),
                    },
                },
                {"type": "text", "text": prompt},
            ]
        try:
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=16000,
                system=system,
                messages=[{"role": "user", "content": content}],
                output_config={
                    "format": {
                        "type": "json_schema",
                        "schema": anthropic.transform_schema(schema.model_json_schema()),
                    }
                },
                # If a safety classifier declines, retry server-side on the recommended model.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
        except anthropic.RateLimitError as exc:
            raise LLMError(f"Rate limited by the Claude API: {exc.message}") from exc
        except anthropic.APIStatusError as exc:
            raise LLMError(f"Claude API error {exc.status_code}: {exc.message}") from exc
        except anthropic.APIConnectionError as exc:
            raise LLMError("Could not reach the Claude API") from exc

        if response.stop_reason == "refusal":
            category = response.stop_details.category if response.stop_details else None
            raise LLMError(f"Claude declined the request (category: {category})")
        if response.stop_reason == "max_tokens":
            raise LLMError("Claude's response was cut off at max_tokens")
        text = next((block.text for block in response.content if block.type == "text"), None)
        if text is None:
            raise LLMError("Claude returned no structured output")
        log.debug("Claude usage: %s", response.usage)
        try:
            return schema.model_validate_json(text)
        except ValidationError as exc:
            raise LLMError(f"Claude's output did not match {schema.__name__}: {exc}") from exc

    def research(
        self, system: str, prompt: str, domains: list[str], max_searches: int, max_fetches: int
    ) -> Research:
        tools = [
            {
                "type": "web_search_20260209",
                "name": "web_search",
                "max_uses": max_searches,
                "allowed_domains": domains,
            },
            {
                "type": "web_fetch_20260209",
                "name": "web_fetch",
                "max_uses": max_fetches,
                "allowed_domains": domains,
                "max_content_tokens": 12000,
            },
        ]
        messages: list[dict] = [{"role": "user", "content": prompt}]
        urls: set[str] = set()
        for _ in range(MAX_CONTINUATIONS + 1):
            try:
                response = self.client.beta.messages.create(
                    model=self.model,
                    max_tokens=16000,
                    system=system,
                    messages=messages,
                    tools=tools,
                    betas=["server-side-fallback-2026-07-01"],
                    fallbacks="default",
                )
            except anthropic.RateLimitError as exc:
                raise LLMError(f"Rate limited by the Claude API: {exc.message}") from exc
            except anthropic.APIStatusError as exc:
                raise LLMError(f"Claude API error {exc.status_code}: {exc.message}") from exc
            except anthropic.APIConnectionError as exc:
                raise LLMError("Could not reach the Claude API") from exc

            urls |= _seen_urls(response.content)
            if response.stop_reason == "refusal":
                raise LLMError("Claude declined the research request")
            if response.stop_reason != "pause_turn":
                break
            # A long search turn pauses; send it back as-is so Claude carries on.
            messages = [messages[0], {"role": "assistant", "content": response.content}]
        log.debug("Claude usage: %s", response.usage)
        notes = "\n".join(block.text for block in response.content if block.type == "text").strip()
        if not notes:
            raise LLMError("Claude's research turn returned no notes")
        return Research(notes, urls)


def _seen_urls(content: list) -> set[str]:
    """URLs from search results and fetched pages, so links Claude cites can be checked."""
    urls: set[str] = set()
    for block in content:
        if block.type == "web_search_tool_result" and isinstance(block.content, list):
            urls.update(r.url for r in block.content if getattr(r, "url", None))
        elif block.type == "web_fetch_tool_result":
            url = getattr(block.content, "url", None)
            if url:
                urls.add(url)
    return urls
