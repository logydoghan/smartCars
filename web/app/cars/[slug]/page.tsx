import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AgreementBadge, SourceStats } from "@/components/Badges";
import { CarComments, CarSave } from "@/components/CarAccountParts";
import { CarPhotoImage, PhotoCredit } from "@/components/CarPhoto";
import { DisagreementCard } from "@/components/Disagreements";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getCar, getCars } from "@/lib/data";
import { carName, formatDate, formatPrice, plural, recallUrl } from "@/lib/format";
import type { CarPage } from "@/lib/types";

// Before the first car exists, Cache Components still needs one param to build.
// The placeholder renders as a 404; real cars render on request.
const NO_CARS_YET = "no-cars-yet";

export async function generateStaticParams() {
  const { cars } = await getCars();
  return cars.length > 0 ? cars.map((c) => ({ slug: c.slug })) : [{ slug: NO_CARS_YET }];
}

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const car = await getCar((await params).slug);
  return car ? { title: carName(car), description: car.headline } : {};
}

export default function CarRoute(props: PageProps<"/cars/[slug]">) {
  return (
    <>
      <SiteHeader>
        <Link href="/" className="py-2.5 text-accent hover:text-accent-strong">
          All cars
        </Link>
      </SiteHeader>
      <main className="mx-auto w-full max-w-[1240px] px-6 pt-10 pb-20">
        <Suspense fallback={<p className="text-muted">Loading car…</p>}>
          <CarContent params={props.params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

const h2 = "font-serif text-[28px] font-semibold";

async function CarContent({ params }: Pick<PageProps<"/cars/[slug]">, "params">) {
  const car = await getCar((await params).slug);
  if (!car) notFound();

  return (
    <div className="flex flex-col gap-14">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] gap-10">
        <div className="flex flex-col gap-4">
          <div className="text-[13px] font-semibold uppercase tracking-wider text-muted">
            {car.body} · {car.powertrain}
            {car.price_from !== null && ` · from ${formatPrice(car.price_from)}`}
          </div>
          <h1 className="font-serif text-[38px] leading-[1.08] font-bold tracking-tight md:text-[52px]">
            {carName(car)}
          </h1>
          <p className="text-xl leading-snug text-body">{car.headline}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <AgreementBadge level={car.agreement_level} />
            <span>Updated {formatDate(car.updated_at)}</span>
          </div>
          <Suspense>
            <CarSave slug={car.slug} />
          </Suspense>
          <div className="rounded-xl bg-soft p-5.5">
            <h2 className="pb-1.5 text-[13px] font-semibold uppercase tracking-wider text-muted">The short version</h2>
            <p className="text-[16px] leading-relaxed text-body">{car.verdict}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <figure className="flex flex-col gap-1.5">
            <CarPhotoImage car={car} sizes="(min-width: 1240px) 590px, (min-width: 860px) 50vw, 100vw" eager />
            <figcaption>
              <PhotoCredit car={car} />
            </figcaption>
          </figure>
          <SourceStats car={car} size="lg" />
        </div>
      </section>

      <section aria-labelledby="disagree" className="flex flex-col gap-5">
        <h2 id="disagree" className={h2}>
          Where they disagree
        </h2>
        {car.disagreements.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-5">
            {car.disagreements.map((d) => (
              <DisagreementCard key={d.topic} d={d} />
            ))}
          </div>
        ) : (
          <p className="text-[17px] text-body">
            Nothing worth flagging. The critics, the owners and the recall record tell the same story.
          </p>
        )}
        {car.agreements.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <h3 className="text-[15px] font-semibold">Where they agree</h3>
            <ul className="flex flex-wrap gap-2">
              {car.agreements.map((a) => (
                <li key={a} className="rounded-full border border-chip px-3.5 py-1.5 text-[14px] text-body">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <CriticsSection car={car} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] gap-14">
        <OwnersSection car={car} />
        <RecallsSection car={car} />
      </div>

      <section id="comments" aria-labelledby="comments-heading" className="flex max-w-[820px] scroll-mt-6 flex-col gap-4">
        <h2 id="comments-heading" className={h2}>
          Owners and shoppers talk
        </h2>
        <Suspense fallback={<p className="text-muted">Loading comments…</p>}>
          <CarComments slug={car.slug} />
        </Suspense>
      </section>

    </div>
  );
}

function SectionHeading({ id, title, dot, children }: { id: string; title: string; dot: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 id={id} className={`${h2} flex items-center gap-3`}>
        <span aria-hidden className={`size-3 rounded-full ${dot}`} />
        {title}
      </h2>
      {children && <p className="max-w-[820px] text-[16px] leading-relaxed text-body">{children}</p>}
    </div>
  );
}

function CriticsSection({ car }: { car: CarPage }) {
  return (
    <section aria-labelledby="critics" className="flex flex-col gap-5">
      <SectionHeading id="critics" title="What critics say" dot="bg-critics">
        {car.critic_consensus}
      </SectionHeading>
      {car.critics.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-5">
          {car.critics.map((r) => (
            <article key={r.url} className="flex flex-col gap-3 rounded-xl bg-critics-soft p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold">{r.outlet}</h3>
                {r.score && <span className="font-serif text-[22px] font-semibold text-critics">{r.score}</span>}
              </div>
              <p className="text-[15px] leading-normal text-body">{r.summary}</p>
              <ProsCons label="Liked" items={r.likes} sign="+" />
              <ProsCons label="Disliked" items={r.dislikes} sign="–" />
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto pt-1 text-[14px] font-medium text-critics hover:underline"
              >
                Read the full review{r.published && `, ${formatDate(r.published)}`}
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-muted">No professional reviews found yet.</p>
      )}
    </section>
  );
}

function ProsCons({ label, items, sign }: { label: string; items: string[]; sign: string }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className="flex flex-col gap-1 text-[14px] text-body">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="w-3 shrink-0 font-semibold text-muted">
            {sign}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function OwnersSection({ car }: { car: CarPage }) {
  const max = Math.max(1, ...car.complaint_components.map((c) => c.count));
  const serious = [
    car.crash_count && plural(car.crash_count, "crash", "crashes"),
    car.fire_count && plural(car.fire_count, "fire"),
    car.injury_count && plural(car.injury_count, "injury", "injuries"),
  ].filter(Boolean);
  return (
    <section aria-labelledby="owners" className="flex flex-col gap-5">
      <SectionHeading id="owners" title="What owners report" dot="bg-owners">
        {car.complaint_count > 0
          ? `${plural(car.complaint_count, "complaint")} filed with NHTSA${
              serious.length ? `, mentioning ${serious.join(", ")}` : ""
            }. ${car.owner_overview}`
          : "No owner complaints filed with NHTSA."}
      </SectionHeading>
      {car.owner_themes.map((t) => (
        <article key={t.title} className="flex flex-col gap-1.5 border-l-[3px] border-owners pl-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 className="font-semibold">{t.title}</h3>
            <span className="text-[14px] font-semibold text-owners">{plural(t.count, "complaint")}</span>
          </div>
          <p className="text-[15px] leading-normal text-body">{t.summary}</p>
          <p className="text-[13px] text-muted">{t.component}</p>
        </article>
      ))}
      {car.complaint_components.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <h3 className="text-[15px] font-semibold">All complaints by system</h3>
          <ul className="flex flex-col gap-1.5">
            {car.complaint_components.map((c) => (
              <li key={c.component} className="grid grid-cols-[minmax(0,180px)_1fr_40px] items-center gap-3 text-[14px]">
                <span className="truncate text-body">{c.component}</span>
                <span className="h-2.5 rounded-full bg-owners-soft">
                  <span className="block h-full rounded-full bg-owners" style={{ width: `${(c.count / max) * 100}%` }} />
                </span>
                <span className="text-right text-muted tabular-nums">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RecallsSection({ car }: { car: CarPage }) {
  return (
    <section aria-labelledby="recalls" className="flex flex-col gap-5">
      <SectionHeading id="recalls" title="Safety recalls" dot="bg-records">
        {car.recalls.length > 0
          ? `${plural(car.recalls.length, "recall")} for this model year. Dealers fix recalls free; check a specific car by its VIN at nhtsa.gov.`
          : "No recalls for this model year."}
      </SectionHeading>
      {car.recalls.map((r) => (
        <article key={r.campaign} className="flex flex-col gap-1.5 rounded-xl bg-records-soft p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px] text-muted">
            <span className="font-semibold uppercase tracking-wider text-records">{r.component}</span>
            <span>{r.reported && formatDate(r.reported)}</span>
          </div>
          {r.park_it && (
            <p className="text-[14px] font-semibold text-records">Park it: do not drive until repaired.</p>
          )}
          <p className="text-[15px] leading-normal text-body">{r.summary}</p>
          {r.consequence && <p className="text-[14px] leading-normal text-muted">Risk: {r.consequence}</p>}
          <p className="text-[14px] leading-normal text-muted">Fix: {r.remedy}</p>
          <a
            href={recallUrl(r.campaign)}
            target="_blank"
            rel="noopener noreferrer"
            className="pt-1 text-[14px] font-medium text-records hover:underline"
          >
            NHTSA recall {r.campaign}
          </a>
        </article>
      ))}
    </section>
  );
}
