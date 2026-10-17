import Link from "next/link";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="font-serif text-[30px] font-bold tracking-tight text-ink">
          SmartCars
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
          {children}
          <Link href="/about" className="py-2.5 text-muted hover:text-ink">
            How it works
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule">
      <p className="mx-auto max-w-[1240px] px-6 py-6 text-[13px] leading-relaxed text-muted">
        Review summaries are written by AI in its own words and link to the full reviews; the comparison is
        AI analysis of all three sources, not this site&apos;s opinion. Read the originals before you buy. Owner complaints and recalls come from the US National Highway Traffic Safety
        Administration (NHTSA). Complaints are reported by owners, are not verified, and are not adjusted for how
        many cars were sold.
      </p>
    </footer>
  );
}

export function SampleNotice() {
  return (
    <p className="mb-8 rounded-lg bg-soft px-4 py-3 text-sm text-body">
      Showing sample cars. The carmakers, reviews, complaints and recalls are made up to show the layout. Connect
      the Supabase database to see real cars.
    </p>
  );
}
