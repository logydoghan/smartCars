"""Find professional reviews of a car on the web and summarize them in our own words."""

from __future__ import annotations

import logging
from urllib.parse import urlsplit

from .cars import Car
from .llm import StructuredLLM
from .models import CriticsResult

log = logging.getLogger(__name__)

# Outlets that road-test cars. Claude may only search and read these sites.
REVIEW_SITES: dict[str, str] = {
    "caranddriver.com": "Car and Driver",
    "motortrend.com": "MotorTrend",
    "edmunds.com": "Edmunds",
    "consumerreports.org": "Consumer Reports",
    "cars.com": "Cars.com",
    "kbb.com": "Kelley Blue Book",
    "roadandtrack.com": "Road & Track",
    "autoblog.com": "Autoblog",
}

RESEARCH_SYSTEM = """You research professional car reviews for a buyer's guide.
Find the most recent full test-drive review of the exact model year asked about (or the
nearest year of the same generation) from as many different outlets as you can, one review
per outlet. Read each review page. Skip news items, previews and comparison tests.
Write notes for each review: outlet, exact URL, title, date, rating as printed, what the
reviewer liked and disliked, and the starting price if given. Paraphrase; do not copy
sentences."""

STRUCTURE_SYSTEM = """You turn research notes into structured review summaries for a buyer's
guide. Write every summary in your own words; never quote or closely paraphrase a sentence.
Only include reviews that appear in the notes, with the URL exactly as the notes give it."""


def _host(url: str) -> str:
    host = urlsplit(url).hostname or ""
    return host.removeprefix("www.")


def _same_page(url: str) -> str:
    parts = urlsplit(url)
    return f"{_host(url)}{parts.path.rstrip('/')}"


def gather_critics(llm: StructuredLLM, car: Car, max_searches: int, max_fetches: int) -> CriticsResult:
    research = llm.research(
        RESEARCH_SYSTEM,
        f"Find professional reviews of the {car.name}.",
        list(REVIEW_SITES),
        max_searches,
        max_fetches,
    )
    result = llm.ask(
        STRUCTURE_SYSTEM,
        f"Car: {car.name}\n\nResearch notes:\n{research.notes}",
        CriticsResult,
    )

    # Keep only links Claude actually found, on the allowed sites, one review per outlet.
    seen_pages = {_same_page(u) for u in research.urls}
    kept, outlets = [], set()
    for review in result.reviews:
        host = _host(review.url)
        if _same_page(review.url) not in seen_pages or host not in REVIEW_SITES:
            log.warning("%s: dropping review with unverified link %s", car.name, review.url)
            continue
        if host in outlets:
            continue
        outlets.add(host)
        review.outlet = REVIEW_SITES[host]
        if review.score_10 is not None and not 0 <= review.score_10 <= 10:
            review.score_10 = None
        kept.append(review)
    result.reviews = kept
    return result
