"""Find a free photo of each car on Wikimedia Commons, with the credit its license requires.

Commons photos are free to reuse under Creative Commons or public-domain terms, as long as
the page credits the photographer and the license. Claude looks at each candidate and keeps
the first that clearly shows the right car.
"""

from __future__ import annotations

import logging
import re
from html import unescape

import httpx
from pydantic import BaseModel, Field

from .cars import Car
from .llm import LLMError, StructuredLLM

log = logging.getLogger(__name__)

API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia asks every automated client to say who it is.
USER_AGENT = "SmartCars/0.1 (https://github.com/logydoghan/smartCars)"
WIDTH = 1200
MAX_CANDIDATES = 4
# Licenses that allow reuse on a commercial site with a credit line.
FREE_LICENSE = re.compile(r"^(cc0|cc[ -]by(-sa)?[ -]\d|public domain|pd)", re.IGNORECASE)


class PhotoCheck(BaseModel):
    shows_car: bool = Field(description="True if the photo clearly shows this exact model.")
    right_generation: bool = Field(description="True if it is the same generation as the model year asked about.")
    good_photo: bool = Field(
        description="True for a sharp, well-lit exterior shot of the whole car, without people as the subject, "
        "heavy damage, modifications or large text."
    )


CHECK_SYSTEM = """You check photos for a car buyer's guide. Judge only what you can see."""


def _text(html: str) -> str:
    """Commons metadata is HTML; credit lines need plain text."""
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", html or ""))).strip()


def _meta(info: dict, key: str) -> str:
    return _text((info.get("extmetadata") or {}).get(key, {}).get("value", ""))


def search(client: httpx.Client, query: str) -> list[dict]:
    """Free-to-use landscape photos on Commons matching `query`, best match first."""
    response = client.get(
        API,
        params={
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": 6,  # files
            "gsrsearch": f"{query} filetype:bitmap",
            "gsrlimit": 15,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": WIDTH,
        },
    )
    response.raise_for_status()
    pages = sorted((response.json().get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    photos = []
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        license_name = _meta(info, "LicenseShortName")
        if info.get("mime") != "image/jpeg" or not FREE_LICENSE.match(license_name):
            continue
        if not info.get("width") or info["width"] < 1.2 * info.get("height", 0) or info["width"] < 800:
            continue
        photos.append(
            {
                "url": info.get("thumburl") or info["url"],
                "width": info.get("thumbwidth") or info["width"],
                "height": info.get("thumbheight") or info["height"],
                "page_url": info.get("descriptionurl", ""),
                "author": _meta(info, "Artist")[:120] or "Unknown author",
                "license": license_name,
                "license_url": _meta(info, "LicenseUrl"),
                "title": page.get("title", ""),
            }
        )
    return photos


def find_photo(llm: StructuredLLM, car: Car, client: httpx.Client | None = None) -> dict | None:
    """A checked Commons photo of the car with its credit details, or None."""
    owns_client = client is None
    client = client or httpx.Client(timeout=httpx.Timeout(30.0), headers={"User-Agent": USER_AGENT})
    try:
        candidates = search(client, f"{car.year} {car.make} {car.model}")
        if len(candidates) < MAX_CANDIDATES:
            seen = {c["url"] for c in candidates}
            candidates += [c for c in search(client, f"{car.make} {car.model}") if c["url"] not in seen]
        for photo in candidates[:MAX_CANDIDATES]:
            image = client.get(photo["url"])
            image.raise_for_status()
            check = llm.ask(
                CHECK_SYSTEM,
                f"Is this a good photo of a {car.name}? File name: {photo['title']}",
                PhotoCheck,
                image=image.content,
                image_type="image/jpeg",
            )
            if check.shows_car and check.right_generation and check.good_photo:
                photo.pop("title")
                return photo
            log.info("%s: rejected %s", car.name, photo["title"])
    except (httpx.HTTPError, LLMError) as exc:
        # A missing photo never stops a car page from publishing.
        log.warning("%s: no photo (%s)", car.name, exc)
    finally:
        if owns_client:
            client.close()
    return None
