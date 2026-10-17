"""Save a finished car page to Postgres (Supabase) or to a JSON file."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .cars import Car
from .models import Comparison, CriticsResult, OwnersResult
from .nhtsa import SafetyRecord

COLUMNS = (
    "slug", "year", "make", "model", "body", "powertrain", "price_from", "headline", "verdict",
    "agreement_level", "critic_score", "critic_consensus", "critics", "owner_overview",
    "owner_themes", "complaint_count", "complaint_components", "crash_count", "fire_count",
    "injury_count", "recalls", "disagreements", "agreements", "updated_at",
)
JSON_COLUMNS = {"critics", "owner_themes", "complaint_components", "recalls", "disagreements", "agreements"}


@dataclass
class CarReport:
    car: Car
    critics: CriticsResult
    owners: OwnersResult
    record: SafetyRecord
    comparison: Comparison


def to_record(report: CarReport, now: datetime | None = None) -> dict:
    """One car page as plain data, shaped like the `cars` table."""
    car, critics, record, comparison = report.car, report.critics, report.record, report.comparison
    scores = [r.score_10 for r in critics.reviews if r.score_10 is not None]
    return {
        "slug": car.slug,
        "year": car.year,
        "make": car.make,
        "model": car.model,
        "body": car.body,
        "powertrain": car.powertrain,
        "price_from": critics.starting_price_usd,
        "headline": comparison.headline,
        "verdict": comparison.verdict,
        "agreement_level": comparison.agreement_level,
        "critic_score": round(sum(scores) / len(scores), 1) if scores else None,
        "critic_consensus": critics.consensus,
        "critics": [r.model_dump() for r in critics.reviews],
        "owner_overview": report.owners.overview,
        "owner_themes": [
            {
                "title": t.title,
                "component": t.component,
                "summary": t.summary,
                "count": len(t.complaint_ids),
                # Each ODI number links to the owner's complaint on nhtsa.gov.
                "complaint_ids": t.complaint_ids[:5],
            }
            for t in report.owners.themes
        ],
        "complaint_count": len(record.complaints),
        "complaint_components": record.components(),
        "crash_count": sum(c.crash for c in record.complaints),
        "fire_count": sum(c.fire for c in record.complaints),
        "injury_count": sum(c.injuries for c in record.complaints),
        "recalls": [
            {
                "campaign": r.campaign,
                "reported": r.reported.isoformat() if r.reported else None,
                "component": r.component,
                "summary": r.summary,
                "consequence": r.consequence,
                "remedy": r.remedy,
                "park_it": r.park_it,
            }
            for r in record.recalls
        ],
        "disagreements": [d.model_dump() for d in comparison.disagreements],
        "agreements": comparison.agreements,
        "updated_at": (now or datetime.now(timezone.utc)).isoformat(),
    }


def write_json(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, indent=2, ensure_ascii=False))


def last_updated(database_url: str) -> dict[str, datetime]:
    """When each car page was last refreshed, by slug."""
    import psycopg

    with psycopg.connect(database_url, prepare_threshold=None) as conn:
        return dict(conn.execute("select slug, updated_at from cars").fetchall())


def save_to_database(database_url: str, record: dict) -> None:
    """Insert or replace one car's page."""
    import psycopg
    from psycopg.types.json import Jsonb

    values = [Jsonb(record[c]) if c in JSON_COLUMNS else record[c] for c in COLUMNS]
    placeholders = ", ".join(["%s"] * len(COLUMNS))
    updates = ", ".join(f"{c} = excluded.{c}" for c in COLUMNS if c != "slug")
    # prepare_threshold=None keeps this working through Supabase's transaction pooler too.
    with psycopg.connect(database_url, prepare_threshold=None) as conn:
        conn.execute(
            f"insert into cars ({', '.join(COLUMNS)}) values ({placeholders}) "
            f"on conflict (slug) do update set {updates}",
            values,
        )
