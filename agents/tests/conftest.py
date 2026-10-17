from __future__ import annotations

import json
from pathlib import Path

import pytest

from caragent.llm import Research
from caragent.nhtsa import SafetyRecord, parse_complaints, parse_recalls

FIXTURES = Path(__file__).parent / "fixtures"


class FakeLLM:
    """Returns canned outputs in order and records the prompts it was given."""

    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls: list[tuple[str, str]] = []

    def ask(self, system, prompt, schema, image=None, image_type="image/webp"):
        self.calls.append((system, prompt))
        response = self.responses.pop(0)
        assert isinstance(response, schema)
        return response

    def research(self, system, prompt, domains, max_searches, max_fetches):
        self.calls.append((system, prompt))
        response = self.responses.pop(0)
        assert isinstance(response, Research)
        return response


@pytest.fixture
def record() -> SafetyRecord:
    return SafetyRecord(
        parse_complaints(json.loads((FIXTURES / "complaints.json").read_text())),
        parse_recalls(json.loads((FIXTURES / "recalls.json").read_text())),
    )
