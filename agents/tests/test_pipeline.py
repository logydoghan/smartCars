from datetime import datetime, timedelta, timezone

from caragent.cars import CARS, Car
from caragent.compare import compare
from caragent.config import Settings
from caragent.critics import gather_critics
from caragent.llm import Research
from caragent.models import (
    Comparison,
    CriticReview,
    CriticsResult,
    Disagreement,
    OwnersResult,
    OwnerTheme,
)
from caragent.owners import summarize_owners
from caragent.run import due_cars
from caragent.store import CarReport, to_record

from .conftest import FakeLLM

CAR = Car(2024, "Example", "Roadster", "SUV", "Gas")


def review(url: str, outlet: str = "Whatever", score: float | None = 8.0) -> CriticReview:
    return CriticReview(
        outlet=outlet, url=url, title="Review", published="2024-05-01", score="8/10",
        score_10=score, summary="Smooth and quiet.", likes=["Ride"], dislikes=["Screen"],
    )


def test_critics_keep_only_links_claude_saw():
    seen = {"https://www.caranddriver.com/example/roadster-2024/", "https://www.edmunds.com/example/"}
    llm = FakeLLM(
        Research("notes", seen),
        CriticsResult(
            reviews=[
                review("https://www.caranddriver.com/example/roadster-2024"),  # same page, no slash
                review("https://www.caranddriver.com/example/second-review"),  # never seen
                review("https://www.edmunds.com/example/", score=42),  # out-of-range score
                review("https://blog.example.com/roadster"),  # not a review site
            ],
            consensus="Critics like it.",
            starting_price_usd=31000,
        ),
    )
    result = gather_critics(llm, CAR, 5, 6)
    assert [r.outlet for r in result.reviews] == ["Car and Driver", "Edmunds"]
    assert result.reviews[1].score_10 is None
    assert "2024 Example Roadster" in llm.calls[0][1]


def test_owner_theme_counts_use_real_complaints(record):
    llm = FakeLLM(
        OwnersResult(
            overview="Owners report transmission trouble.",
            themes=[
                OwnerTheme(title="Screen goes black", component="Electrical", summary="s",
                           complaint_ids=[11550003]),
                OwnerTheme(title="Transmission shudder", component="Power train", summary="s",
                           complaint_ids=[11550001, 11550002, 11550002, 99999999]),
                OwnerTheme(title="Made up", component="x", summary="s", complaint_ids=[123]),
            ],
        )
    )
    result = summarize_owners(llm, CAR, record.complaints)
    assert [(t.title, t.complaint_ids) for t in result.themes] == [
        ("Transmission shudder", [11550001, 11550002]),
        ("Screen goes black", [11550003]),
    ]


def test_no_complaints_skips_claude():
    assert summarize_owners(FakeLLM(), CAR, []).themes == []


def test_record_shape(record):
    critics = CriticsResult(reviews=[review("u", score=8), review("v", score=7)], consensus="c",
                            starting_price_usd=31000)
    owners = OwnersResult(overview="o", themes=[
        OwnerTheme(title="Shudder", component="Power train", summary="s", complaint_ids=[11550001])
    ])
    comparison = Comparison(
        headline="Critics praise the gearbox; owners report shudder",
        verdict="v", agreement_level="mixed", agreements=["Roomy"],
        disagreements=[Disagreement(topic="Transmission", headline="h", critics="c", owners="o",
                                    records="", kind="critics vs owners", strength="strong")],
    )
    llm = FakeLLM(comparison)
    report = CarReport(CAR, critics, owners, record, compare(llm, CAR, critics, owners, record))
    rec = to_record(report, now=datetime(2026, 10, 17, tzinfo=timezone.utc))
    assert rec["slug"] == "2024-example-roadster"
    assert rec["critic_score"] == 7.5
    assert rec["complaint_count"] == 3 and rec["crash_count"] == 1 and rec["injury_count"] == 1
    assert rec["owner_themes"][0]["count"] == 1
    assert rec["recalls"][0]["park_it"] is True
    assert "Recalls (2)" in llm.calls[0][1]


def test_due_cars_puts_new_then_stale_first():
    now = datetime(2026, 10, 17, tzinfo=timezone.utc)
    fresh, stale = CARS[0], CARS[1]
    updated = {c.slug: now for c in CARS[2:]}
    updated[fresh.slug] = now - timedelta(days=1)
    updated[stale.slug] = now - timedelta(days=60)
    del updated[CARS[2].slug]  # never published
    due = due_cars(Settings(cars_per_run=5), updated, now)
    assert due == [CARS[2], stale]


def test_slugs_are_unique():
    assert len({c.slug for c in CARS}) == len(CARS)
