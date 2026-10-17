"""Owner complaints and safety recalls from NHTSA's free public API (api.nhtsa.gov).

Complaints are reports owners file with the US government; recalls are the fixes
carmakers must announce. Both are public records and free to republish.
"""

from __future__ import annotations

import logging
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime

import httpx

from .cars import Car

log = logging.getLogger(__name__)

API = "https://api.nhtsa.gov"
TIMEOUT = httpx.Timeout(30.0)


@dataclass
class Complaint:
    odi_number: int
    filed: date | None
    components: list[str]
    summary: str
    crash: bool = False
    fire: bool = False
    injuries: int = 0


@dataclass
class Recall:
    campaign: str
    reported: date | None
    component: str
    summary: str
    consequence: str
    remedy: str
    park_it: bool = False


@dataclass
class SafetyRecord:
    complaints: list[Complaint] = field(default_factory=list)
    recalls: list[Recall] = field(default_factory=list)

    def components(self, limit: int = 8) -> list[dict]:
        """Complaint counts by vehicle system, biggest first."""
        counts = Counter(c for complaint in self.complaints for c in complaint.components)
        return [{"component": name, "count": n} for name, n in counts.most_common(limit)]


def _date(value: str | None) -> date | None:
    if not value:
        return None
    for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value[:10], fmt).date()
        except ValueError:
            continue
    return None


def _component_names(raw: str) -> list[str]:
    # "ELECTRICAL SYSTEM,ENGINE" -> ["Electrical system", "Engine"]
    return [part.strip().capitalize() for part in raw.split(",") if part.strip()]


def parse_complaints(payload: dict) -> list[Complaint]:
    complaints = []
    for row in payload.get("results") or []:
        try:
            odi = int(row.get("odiNumber"))
        except (TypeError, ValueError):
            continue
        complaints.append(
            Complaint(
                odi_number=odi,
                filed=_date(row.get("dateComplaintFiled")),
                components=_component_names(row.get("components") or ""),
                summary=(row.get("summary") or "").strip(),
                crash=bool(row.get("crash")),
                fire=bool(row.get("fire")),
                injuries=int(row.get("numberOfInjuries") or 0),
            )
        )
    # Newest first, so a capped read keeps the most recent reports.
    complaints.sort(key=lambda c: c.filed or date.min, reverse=True)
    return complaints


def parse_recalls(payload: dict) -> list[Recall]:
    recalls = []
    for row in payload.get("results") or []:
        campaign = row.get("NHTSACampaignNumber")
        if not campaign:
            continue
        recalls.append(
            Recall(
                campaign=campaign,
                reported=_date(row.get("ReportReceivedDate")),
                component=(row.get("Component") or "").strip().capitalize(),
                summary=(row.get("Summary") or "").strip(),
                consequence=(row.get("Consequence") or "").strip(),
                remedy=(row.get("Remedy") or "").strip(),
                park_it=bool(row.get("parkIt")),
            )
        )
    recalls.sort(key=lambda r: r.reported or date.min, reverse=True)
    return recalls


def fetch_safety_record(car: Car, client: httpx.Client | None = None) -> SafetyRecord:
    params = {
        "make": car.nhtsa_make or car.make,
        "model": car.nhtsa_model or car.model,
        "modelYear": str(car.year),
    }
    owns_client = client is None
    client = client or httpx.Client(timeout=TIMEOUT, headers={"User-Agent": "SmartCars/0.1"})
    try:
        complaints = client.get(f"{API}/complaints/complaintsByVehicle", params=params)
        complaints.raise_for_status()
        recalls = client.get(f"{API}/recalls/recallsByVehicle", params=params)
        recalls.raise_for_status()
    finally:
        if owns_client:
            client.close()
    record = SafetyRecord(parse_complaints(complaints.json()), parse_recalls(recalls.json()))
    log.info("%s: %d complaints, %d recalls", car.name, len(record.complaints), len(record.recalls))
    return record
