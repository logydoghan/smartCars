"""The cars the site covers. Add a line here to give a car its own page."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

Body = Literal["SUV", "Sedan", "Truck", "Hatchback", "Minivan"]
Powertrain = Literal["Gas", "Hybrid", "Electric"]


@dataclass(frozen=True)
class Car:
    year: int
    make: str
    model: str
    body: Body
    powertrain: Powertrain
    # NHTSA spells some models differently from the badge; set these when it does.
    nhtsa_make: str | None = None
    nhtsa_model: str | None = None

    @property
    def name(self) -> str:
        return f"{self.year} {self.make} {self.model}"

    @property
    def slug(self) -> str:
        return re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")


# Model year 2024 by default: owners have had a year to report problems, and most of these
# carry over to 2025 largely unchanged. Bump the year once newer cars have owner history.
CARS: tuple[Car, ...] = (
    Car(2024, "Toyota", "RAV4", "SUV", "Gas"),
    Car(2024, "Toyota", "RAV4 Hybrid", "SUV", "Hybrid", nhtsa_model="RAV4 HYBRID"),
    Car(2024, "Honda", "CR-V", "SUV", "Gas"),
    Car(2024, "Tesla", "Model Y", "SUV", "Electric"),
    Car(2024, "Ford", "F-150", "Truck", "Gas"),
    Car(2024, "Chevrolet", "Silverado 1500", "Truck", "Gas"),
    Car(2024, "Toyota", "Tacoma", "Truck", "Gas"),
    Car(2024, "Toyota", "Camry", "Sedan", "Gas"),
    Car(2024, "Honda", "Civic", "Sedan", "Gas"),
    Car(2024, "Honda", "Accord", "Sedan", "Gas"),
    Car(2024, "Toyota", "Corolla", "Sedan", "Gas"),
    Car(2024, "Hyundai", "Tucson", "SUV", "Gas"),
    Car(2024, "Kia", "Telluride", "SUV", "Gas"),
    Car(2024, "Subaru", "Outback", "SUV", "Gas"),
    Car(2024, "Subaru", "Forester", "SUV", "Gas"),
    Car(2024, "Mazda", "CX-5", "SUV", "Gas"),
    Car(2024, "Nissan", "Rogue", "SUV", "Gas"),
    Car(2024, "Chevrolet", "Equinox", "SUV", "Gas"),
    Car(2024, "Ford", "Explorer", "SUV", "Gas"),
    Car(2024, "Jeep", "Grand Cherokee", "SUV", "Gas"),
    Car(2024, "Hyundai", "Ioniq 5", "SUV", "Electric"),
    Car(2024, "Ford", "Mustang Mach-E", "SUV", "Electric"),
    Car(2024, "Toyota", "Prius", "Hatchback", "Hybrid"),
    Car(2024, "Honda", "Odyssey", "Minivan", "Gas"),
)


def find_car(slug: str) -> Car | None:
    return next((c for c in CARS if c.slug == slug), None)
