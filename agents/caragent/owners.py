"""Group owner complaints filed with NHTSA into the problems owners report most."""

from __future__ import annotations

from .cars import Car
from .llm import StructuredLLM
from .models import OwnersResult
from .nhtsa import Complaint

SYSTEM = """You read complaints that car owners filed with the US safety regulator (NHTSA)
and group them into the problems they report most. Name each problem plainly, as a buyer
would. Put each complaint in at most one theme, list its ODI number there, and leave out
complaints that fit no common theme. Write in your own words; never quote an owner."""

MAX_SUMMARY_CHARS = 700


def summarize_owners(llm: StructuredLLM, car: Car, complaints: list[Complaint]) -> OwnersResult:
    if not complaints:
        return OwnersResult(overview="", themes=[])
    lines = [
        f"[{c.odi_number}] {', '.join(c.components) or 'Unknown'}: {c.summary[:MAX_SUMMARY_CHARS]}"
        for c in complaints
    ]
    result = llm.ask(
        SYSTEM,
        f"Car: {car.name}\n{len(complaints)} complaints, newest first:\n\n" + "\n".join(lines),
        OwnersResult,
    )
    # Counts come from the complaints Claude assigned, checked against the real ones.
    known = {c.odi_number for c in complaints}
    seen: set[int] = set()
    for theme in result.themes:
        theme.complaint_ids = [i for i in dict.fromkeys(theme.complaint_ids) if i in known and i not in seen]
        seen.update(theme.complaint_ids)
    result.themes = sorted(
        (t for t in result.themes if t.complaint_ids), key=lambda t: len(t.complaint_ids), reverse=True
    )
    return result
