"""Runtime settings, read from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    model: str = "claude-sonnet-5-5"
    # Cars refreshed per run. Each costs roughly $0.30 in Claude usage, most of it reading reviews.
    cars_per_run: int = 6
    # A car is due for a refresh once its page is this many days old.
    refresh_days: int = 28
    # Web searches and page reads Claude may use per car to find critic reviews.
    max_searches: int = 5
    max_fetches: int = 6
    # The most recent owner complaints read per car; older ones still count in the totals.
    max_complaints: int = 150
    database_url: str | None = None

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            model=os.environ.get("CARAGENT_MODEL", cls.model),
            cars_per_run=int(os.environ.get("CARAGENT_CARS_PER_RUN", cls.cars_per_run)),
            refresh_days=int(os.environ.get("CARAGENT_REFRESH_DAYS", cls.refresh_days)),
            max_searches=int(os.environ.get("CARAGENT_MAX_SEARCHES", cls.max_searches)),
            max_fetches=int(os.environ.get("CARAGENT_MAX_FETCHES", cls.max_fetches)),
            max_complaints=int(os.environ.get("CARAGENT_MAX_COMPLAINTS", cls.max_complaints)),
            database_url=os.environ.get("DATABASE_URL") or None,
        )
