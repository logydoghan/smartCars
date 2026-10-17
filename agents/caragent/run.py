"""Refresh car pages: critic reviews, owner complaints, recalls, and where they disagree.

    caragent                        # refresh the cars that are due, save to DATABASE_URL
    caragent --car 2024-toyota-rav4 # refresh one car now
    caragent --no-db --json out.json --car 2024-honda-cr-v   # dry run
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

from .cars import CARS, Car, find_car
from .compare import compare
from .config import Settings
from .critics import gather_critics
from .llm import ClaudeLLM, LLMError, StructuredLLM
from .nhtsa import fetch_safety_record
from .owners import summarize_owners
from .store import CarReport, last_updated, save_to_database, to_record, write_json

log = logging.getLogger("caragent")


def due_cars(settings: Settings, updated: dict[str, datetime], now: datetime) -> list[Car]:
    """Cars never published first, then the stalest, up to the per-run limit."""
    cutoff = now - timedelta(days=settings.refresh_days)
    oldest = datetime.min.replace(tzinfo=timezone.utc)
    due = [c for c in CARS if updated.get(c.slug, oldest) < cutoff]
    due.sort(key=lambda c: updated.get(c.slug, oldest))
    return due[: settings.cars_per_run]


def build_report(settings: Settings, llm: StructuredLLM, car: Car) -> CarReport:
    record = fetch_safety_record(car)
    critics = gather_critics(llm, car, settings.max_searches, settings.max_fetches)
    owners = summarize_owners(llm, car, record.complaints[: settings.max_complaints])
    return CarReport(car, critics, owners, record, compare(llm, car, critics, owners, record))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Refresh SmartCars car pages.")
    parser.add_argument("--car", action="append", default=[], help="Refresh this car (slug); repeatable.")
    parser.add_argument("--json", type=Path, help="Also write the pages to this JSON file.")
    parser.add_argument("--no-db", action="store_true", help="Do not read or write the database.")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    settings = Settings.from_env()
    if not args.no_db and not settings.database_url:
        parser.error("DATABASE_URL is not set (use --no-db with --json for a dry run)")

    if args.car:
        cars = [find_car(slug) for slug in args.car]
        if None in cars:
            parser.error(f"Unknown car; choose from: {', '.join(c.slug for c in CARS)}")
    else:
        updated = {} if args.no_db else last_updated(settings.database_url)
        cars = due_cars(settings, updated, datetime.now(timezone.utc))
    if not cars:
        log.info("Every car page is up to date")
        return 0

    llm = ClaudeLLM(settings.model)
    records, failed = [], 0
    for car in cars:
        try:
            record = to_record(build_report(settings, llm, car))
        except (LLMError, httpx.HTTPError) as exc:
            # One failed car should not stop the rest; it stays due for the next run.
            log.error("Skipping %s: %s", car.name, exc)
            failed += 1
            continue
        if not args.no_db:
            save_to_database(settings.database_url, record)
        log.info("Saved %s: %s", car.name, record["headline"])
        records.append(record)

    if args.json:
        write_json(args.json, records)
        log.info("Wrote %s", args.json)
    return 1 if failed and not records else 0


if __name__ == "__main__":
    sys.exit(main())
