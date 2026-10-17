import { CarBrowser } from "@/components/CarBrowser";
import { SampleNotice, SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getCars } from "@/lib/data";

export default async function Home() {
  const { cars, sample } = await getCars();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1240px] px-6 pt-10 pb-20">
        {sample && <SampleNotice />}
        <section className="flex max-w-[820px] flex-col gap-4 pb-10">
          <h1 className="font-serif text-[38px] leading-[1.1] font-bold tracking-tight md:text-[52px]">
            Critics test-drive it. Owners live with it. See where they disagree.
          </h1>
          <p className="text-lg leading-relaxed text-body">
            Each car gets one page that sets professional reviews beside the complaints owners file with the
            government and the official recall record, and points out where they don&apos;t line up.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full bg-critics" /> Professional reviews
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full bg-owners" /> Owner complaints
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full bg-records" /> Safety recalls
            </li>
          </ul>
        </section>
        {cars.length > 0 ? (
          <CarBrowser cars={cars} />
        ) : (
          <p className="text-lg text-muted">The first car pages haven&apos;t been published yet.</p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
