"""Shapes Claude answers in (structured outputs)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CriticReview(BaseModel):
    outlet: str = Field(description="Publication name, e.g. 'Car and Driver'.")
    url: str = Field(description="Exact URL of the review, copied from the research notes.")
    title: str
    published: str = Field(description="Publication date as YYYY-MM-DD, or '' if unknown.")
    score: str = Field(description="The outlet's own rating as printed, e.g. '8/10', or '' if none.")
    score_10: float | None = Field(description="That rating on a 0-10 scale, or null if none.")
    summary: str = Field(description="Two or three sentences in your own words. Never quote.")
    likes: list[str] = Field(description="Up to four short points the reviewer praised.")
    dislikes: list[str] = Field(description="Up to four short points the reviewer criticized.")


class CriticsResult(BaseModel):
    reviews: list[CriticReview]
    consensus: str = Field(description="Two sentences on what the critics broadly think.")
    starting_price_usd: int | None = Field(description="Base MSRP in US dollars if a review gives it.")


class OwnerTheme(BaseModel):
    title: str = Field(description="Short plain name for the problem, e.g. 'Transmission shudders'.")
    component: str = Field(description="Vehicle system, e.g. 'Power train'.")
    summary: str = Field(description="Two sentences, in your own words, on what owners describe.")
    complaint_ids: list[int] = Field(description="ODI numbers of the complaints in this theme.")


class OwnersResult(BaseModel):
    overview: str = Field(description="Two sentences on what owners most often report.")
    themes: list[OwnerTheme] = Field(description="Up to six themes, most reported first.")


class Disagreement(BaseModel):
    topic: str = Field(description="What it is about, e.g. 'Transmission'.")
    headline: str = Field(description="One line, e.g. 'Critics praise the smooth CVT; owners report shudder'.")
    critics: str = Field(description="What the critics say about it, one or two sentences.")
    owners: str = Field(description="What owner complaints say, or '' if they are silent.")
    records: str = Field(description="What recalls show, or '' if none apply.")
    kind: Literal["critics vs owners", "critics vs recalls", "critics split"]
    strength: Literal["strong", "some"]


class Comparison(BaseModel):
    headline: str = Field(description="The single most useful finding for a buyer, one line.")
    verdict: str = Field(description="Three or four sentences weighing all three sources for a buyer.")
    agreement_level: Literal["mostly agree", "mixed", "split"]
    disagreements: list[Disagreement] = Field(description="Up to four, most important first.")
    agreements: list[str] = Field(description="Up to four points all sources support.")
