import type { Disagreement } from "@/lib/types";

const ROWS = [
  { key: "critics", label: "Critics", dot: "bg-critics", text: "text-critics" },
  { key: "owners", label: "Owners", dot: "bg-owners", text: "text-owners" },
  { key: "records", label: "Recalls", dot: "bg-records", text: "text-records" },
] as const;

export function DisagreementCard({ d }: { d: Disagreement }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-rule p-5.5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span>{d.topic}</span>
        <span aria-hidden>·</span>
        <span>{d.kind}</span>
        {d.strength === "strong" && (
          <span className="rounded-full bg-records-soft px-2 py-0.5 text-records normal-case tracking-normal">
            Strong signal
          </span>
        )}
      </div>
      <h3 className="font-serif text-[21px] leading-snug font-semibold">{d.headline}</h3>
      <dl className="flex flex-col gap-3">
        {ROWS.filter((r) => d[r.key]).map((r) => (
          <div key={r.key} className="grid grid-cols-[84px_1fr] gap-3 text-[15px] leading-normal">
            <dt className={`flex items-start gap-2 pt-px font-semibold ${r.text}`}>
              <span aria-hidden className={`mt-[7px] size-2 shrink-0 rounded-full ${r.dot}`} />
              {r.label}
            </dt>
            <dd className="text-body">{d[r.key]}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
