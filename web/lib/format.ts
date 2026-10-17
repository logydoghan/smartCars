import type { CarPage } from "./types";

export function carName(car: Pick<CarPage, "year" | "make" | "model">): string {
  return `${car.year} ${car.make} ${car.model}`;
}

export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? word : pluralWord}`;
}

export function formatPrice(usd: number): string {
  return `$${usd.toLocaleString("en-US")}`;
}

export function formatDate(iso: string): string {
  // Parse as UTC so the calendar date never shifts with the server's time zone.
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** A recall's public page on nhtsa.gov. */
export function recallUrl(campaign: string): string {
  return `https://www.nhtsa.gov/recalls?nhtsaId=${campaign}`;
}
