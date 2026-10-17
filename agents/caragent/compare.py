"""Compare the critics, the owners and the recall record, and say where they disagree."""

from __future__ import annotations

from .cars import Car
from .llm import StructuredLLM
from .models import Comparison, CriticsResult, OwnersResult
from .nhtsa import SafetyRecord

SYSTEM = """You help car buyers by comparing three sources on one car: professional
reviews, complaints owners filed with NHTSA, and safety recalls. Point out where they
disagree, for example critics praising a transmission that owners complain about, or
critics split on the ride. Owner complaints are self-reported and not adjusted for how many
cars were sold, so treat a handful of complaints as a weak signal and say so. Do not invent
anything that is not in the material. Write plainly, in your own words."""


def compare(
    llm: StructuredLLM,
    car: Car,
    critics: CriticsResult,
    owners: OwnersResult,
    record: SafetyRecord,
) -> Comparison:
    reviews = "\n".join(
        f"- {r.outlet} ({r.score or 'no score'}): {r.summary} Liked: {'; '.join(r.likes)}. "
        f"Disliked: {'; '.join(r.dislikes)}."
        for r in critics.reviews
    ) or "No professional reviews found."
    themes = "\n".join(
        f"- {t.title} ({t.component}, {len(t.complaint_ids)} complaints): {t.summary}" for t in owners.themes
    ) or "No common owner complaints."
    recalls = "\n".join(
        f"- {r.reported or 'undated'} {r.component}: {r.summary[:400]}" for r in record.recalls
    ) or "No recalls."
    prompt = (
        f"Car: {car.name}\n\n"
        f"Critic reviews:\n{reviews}\n\n"
        f"Owner complaints ({len(record.complaints)} filed in total):\n{themes}\n\n"
        f"Recalls ({len(record.recalls)}):\n{recalls}"
    )
    return llm.ask(SYSTEM, prompt, Comparison)
