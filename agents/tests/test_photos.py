import httpx

from caragent.cars import Car
from caragent.photos import PhotoCheck, find_photo

from .conftest import FakeLLM

CAR = Car(2024, "Example", "Roadster", "SUV", "Gas")


def page(index: int, title: str, license_name: str, width: int = 1600, height: int = 1000, mime: str = "image/jpeg"):
    return {
        "index": index,
        "title": title,
        "imageinfo": [
            {
                "url": f"https://upload.wikimedia.org/full/{index}.jpg",
                "thumburl": f"https://upload.wikimedia.org/thumb/{index}.jpg",
                "thumbwidth": 1200,
                "thumbheight": 750,
                "width": width,
                "height": height,
                "mime": mime,
                "descriptionurl": f"https://commons.wikimedia.org/wiki/{title}",
                "extmetadata": {
                    "LicenseShortName": {"value": license_name},
                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0"},
                    "Artist": {"value": '<a href="//commons.wikimedia.org/wiki/User:Jane">Jane&nbsp;Doe</a>'},
                },
            }
        ],
    }


PAGES = {
    "1": page(1, "File:Roadster logo.png", "CC BY-SA 4.0", mime="image/png"),  # not a photo
    "2": page(2, "File:Roadster interior.jpg", "All rights reserved"),  # not free
    "3": page(3, "File:Roadster tall.jpg", "CC BY 2.0", width=900, height=1200),  # portrait
    "4": page(4, "File:2019 Roadster rear.jpg", "CC BY-SA 4.0"),
    "5": page(5, "File:2024 Example Roadster front.jpg", "CC0"),
}


def client(requests: list) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.host == "upload.wikimedia.org":
            return httpx.Response(200, content=b"jpeg-bytes")
        return httpx.Response(200, json={"query": {"pages": PAGES}})

    return httpx.Client(transport=httpx.MockTransport(handler))


def test_picks_first_free_photo_claude_accepts():
    requests = []
    llm = FakeLLM(
        PhotoCheck(shows_car=True, right_generation=False, good_photo=True),
        PhotoCheck(shows_car=True, right_generation=True, good_photo=True),
    )
    photo = find_photo(llm, CAR, client(requests))
    assert photo == {
        "url": "https://upload.wikimedia.org/thumb/5.jpg",
        "width": 1200,
        "height": 750,
        "page_url": "https://commons.wikimedia.org/wiki/File:2024 Example Roadster front.jpg",
        "author": "Jane Doe",
        "license": "CC0",
        "license_url": "https://creativecommons.org/licenses/by-sa/4.0",
    }
    assert "2024 Example Roadster" in requests[0].url.params["gsrsearch"]
    assert len(llm.calls) == 2


def test_no_photo_when_every_candidate_is_rejected():
    no = PhotoCheck(shows_car=False, right_generation=False, good_photo=False)
    assert find_photo(FakeLLM(no, no, no, no), CAR, client([])) is None


def test_network_errors_mean_no_photo():
    broken = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(503)))
    assert find_photo(FakeLLM(), CAR, broken) is None
