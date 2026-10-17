import { plural } from "@/lib/format";
import type { AgreementLevel, CarPage } from "@/lib/types";

const AGREEMENT: Record<AgreementLevel, { label: string; className: string }> = {
  "mostly agree": { label: "Sources mostly agree", className: "bg-accent/10 text-accent-strong" },
  mixed: { label: "Sources partly disagree", className: "bg-owners-soft text-owners" },
  split: { label: "Sources disagree", className: "bg-records-soft text-records" },
};

export function AgreementBadge({ level }: { level: AgreementLevel }) {
  const { label, className } = AGREEMENT[level];
  return <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${className}`}>{label}</span>;
}

/** The three sources at a glance, each in its own color. */
export function SourceStats({ car, size = "sm" }: { car: CarPage; size?: "sm" | "lg" }) {
  const stats = [
    {
      color: "bg-critics",
      label: "Critics",
      value: car.critic_score !== null ? `${car.critic_score.toFixed(1)} / 10` : "No score",
      note: plural(car.critics.length, "review"),
    },
    {
      color: "bg-owners",
      label: "Owners",
      value: car.complaint_count.toLocaleString("en-US"),
      note: car.complaint_count === 1 ? "complaint to NHTSA" : "complaints to NHTSA",
    },
    { color: "bg-records", label: "Recalls", value: String(car.recalls.length), note: car.recalls.length === 1 ? "safety recall" : "safety recalls" },
  ];
  if (size === "sm") {
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        {stats.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${s.color}`} />
            <span className="sr-only">{s.label}: </span>
            {s.label === "Critics"
              ? s.value
              : plural(s.label === "Owners" ? car.complaint_count : car.recalls.length, s.label === "Owners" ? "complaint" : "recall")}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-rule bg-rule">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1 bg-white px-3.5 py-3.5 sm:px-5">
          <dt className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-muted">
            <span aria-hidden className={`size-2.5 rounded-full ${s.color}`} />
            {s.label}
          </dt>
          <dd className="font-serif text-[21px] leading-tight font-semibold whitespace-nowrap sm:text-[26px]">{s.value}</dd>
          <dd className="text-[13px] text-muted">{s.note}</dd>
        </div>
      ))}
    </dl>
  );
}
