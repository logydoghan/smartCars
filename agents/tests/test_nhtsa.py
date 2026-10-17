from datetime import date

import httpx

from caragent.cars import Car
from caragent.nhtsa import fetch_safety_record


def test_parses_complaints_newest_first(record):
    assert [c.odi_number for c in record.complaints] == [11550002, 11550003, 11550001]
    first = record.complaints[0]
    assert first.filed == date(2024, 3, 12)
    assert first.components == ["Power train", "Engine"]
    assert first.crash and first.injuries == 1


def test_parses_recalls(record):
    assert [r.campaign for r in record.recalls] == ["24V200000", "24V100000"]
    assert record.recalls[0].park_it
    assert record.recalls[1].reported == date(2024, 2, 15)  # day-first dates parse too


def test_components_are_counted(record):
    assert record.components()[0] == {"component": "Power train", "count": 2}


def test_fetch_uses_nhtsa_spelling():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(dict(request.url.params))
        return httpx.Response(200, json={"results": []})

    car = Car(2024, "Toyota", "RAV4 Hybrid", "SUV", "Hybrid", nhtsa_model="RAV4 HYBRID")
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        record = fetch_safety_record(car, client)
    assert record.complaints == [] and record.recalls == []
    assert seen[0] == {"make": "Toyota", "model": "RAV4 HYBRID", "modelYear": "2024"}
