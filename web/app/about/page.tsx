import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  {
    dot: "bg-critics",
    title: "Professional reviews",
    body: "An AI agent searches a short list of outlets that road-test cars, such as Car and Driver, MotorTrend, Edmunds and Consumer Reports, reads each car's latest full review, and summarizes it in its own words. Every summary links to the original, and only links the agent actually opened are kept.",
  },
  {
    dot: "bg-owners",
    title: "Owner complaints",
    body: "Owners report problems to the US National Highway Traffic Safety Administration (NHTSA), which publishes them. The agent groups each car's complaints into the problems owners report most. Complaints are self-reported and not adjusted for sales, so a popular car gets more of them.",
  },
  {
    dot: "bg-records",
    title: "Safety recalls",
    body: "Recalls come straight from NHTSA's public records: what was recalled, the risk, and the free fix.",
  },
];

export default function About() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[820px] flex-col gap-8 px-6 pt-10 pb-20">
        <h1 className="font-serif text-[40px] leading-tight font-bold tracking-tight">How SmartCars works</h1>
        <p className="text-lg leading-relaxed text-body">
          Reviewers drive a car for a week. Owners live with it for years. The recall record shows what the carmaker
          had to fix. Each car page puts the three side by side and then points out where they disagree, such as a
          transmission that critics call smooth and owners say shudders.
        </p>
        <ol className="flex flex-col gap-6">
          {STEPS.map((s) => (
            <li key={s.title} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-3 font-serif text-[24px] font-semibold">
                <span aria-hidden className={`size-3 rounded-full ${s.dot}`} />
                {s.title}
              </h2>
              <p className="text-[16px] leading-relaxed text-body">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="text-[16px] leading-relaxed text-body">
          Pages are refreshed every few weeks. The comparison is written by AI from those three sources and is not
          this site&apos;s opinion, so read the full reviews before you buy.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
