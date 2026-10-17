import Link from "next/link";
import { AgreementBadge, SourceStats } from "@/components/Badges";
import { carName, formatPrice } from "@/lib/format";
import type { CarPage } from "@/lib/types";

export function CarCard({ car }: { car: CarPage }) {
  return (
    <Link
      href={`/cars/${car.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-rule p-5.5 transition-colors hover:border-chip hover:bg-soft"
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">
        {car.body} · {car.powertrain}
        {car.price_from !== null && ` · from ${formatPrice(car.price_from)}`}
      </div>
      <h2 className="font-serif text-[24px] leading-tight font-semibold group-hover:text-accent">{carName(car)}</h2>
      <p className="text-[15px] leading-normal text-body">{car.headline}</p>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <SourceStats car={car} />
        <div>
          <AgreementBadge level={car.agreement_level} />
        </div>
      </div>
    </Link>
  );
}
