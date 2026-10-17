"use client";

import { useState } from "react";
import { CarCard } from "@/components/CarCard";
import { carName } from "@/lib/format";
import { BODIES, type Body, type CarPage } from "@/lib/types";

const chip = "rounded-full px-3.5 py-2.5 text-sm";

export function CarBrowser({ cars }: { cars: CarPage[] }) {
  const [body, setBody] = useState<Body | null>(null);
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = cars.filter((c) => {
    const text = `${carName(c)} ${c.body} ${c.powertrain}`.toLowerCase();
    return (!body || c.body === body) && words.every((w) => text.includes(w));
  });
  const bodies = BODIES.filter((b) => cars.some((c) => c.body === b));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <nav aria-label="Body style" className="flex flex-wrap gap-1">
          {[null, ...bodies].map((b) => {
            const active = b === body;
            return (
              <button
                key={b ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setBody(b)}
                className={`${chip} ${active ? "bg-ink font-medium text-white" : "text-muted hover:bg-soft hover:text-ink"}`}
              >
                {b === null ? "All cars" : b === "SUV" ? "SUVs" : `${b}s`}
              </button>
            );
          })}
        </nav>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search make or model"
          aria-label="Search make or model"
          className="w-full rounded-lg border border-chip px-4 py-2.5 text-[15px] outline-none focus:border-accent sm:w-72"
        />
      </div>
      {shown.length > 0 ? (
        <section aria-label="Cars" className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-5">
          {shown.map((c) => (
            <CarCard key={c.slug} car={c} />
          ))}
        </section>
      ) : (
        <p className="py-10 text-muted">No cars match. We cover popular models first; more are added each week.</p>
      )}
    </>
  );
}
