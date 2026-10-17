import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CarCard } from "@/components/CarCard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getReader } from "@/lib/auth";
import { getSavedCars } from "@/lib/reader-data";
import { accountsEnabled } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Saved cars" };

export default function SavedPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1240px] px-6 pt-10 pb-20">
        <div className="text-[13px] font-semibold uppercase tracking-widest text-accent">Your shortlist</div>
        <h1 className="mt-1.5 mb-8 font-serif text-[44px] font-semibold tracking-tight">Saved cars</h1>
        <Suspense fallback={<p className="text-muted">Loading your saved cars…</p>}>
          <SavedList />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function SavedList() {
  if (!accountsEnabled) {
    return <p className="text-lg text-muted">Saving cars turns on once the site is connected to its database.</p>;
  }
  const reader = await getReader();
  if (!reader) redirect("/login?next=/saved");
  const cars = await getSavedCars(reader);

  if (cars.length === 0) {
    return (
      <p className="text-lg text-muted">
        Nothing saved yet. Open any car from the{" "}
        <Link href="/" className="text-accent hover:text-accent-strong">
          car list
        </Link>{" "}
        and press Save car to keep it here.
      </p>
    );
  }
  return (
    <section aria-label="Saved cars" className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-5">
      {cars.map((c) => (
        <CarCard key={c.slug} car={c} />
      ))}
    </section>
  );
}
