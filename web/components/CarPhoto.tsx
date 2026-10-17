import Image from "next/image";
import type { CarPage } from "@/lib/types";

/** The car's photo, or a plain drawing of a car while it has none. */
export function CarPhotoImage({ car, sizes, eager = false }: { car: CarPage; sizes: string; eager?: boolean }) {
  if (!car.photo) {
    return (
      <div aria-hidden className="flex aspect-[16/10] items-center justify-center rounded-xl bg-soft text-chip">
        <svg viewBox="0 0 64 32" className="w-2/5" fill="currentColor">
          <path d="M8 22c0-2 1-4 3-5l7-2 6-6c1-1 3-2 5-2h10c2 0 4 1 5 2l6 6 5 1c2 1 3 3 3 5v3h-4a5 5 0 0 0-10 0H25a5 5 0 0 0-10 0H8z" />
          <circle cx="20" cy="25" r="3.5" />
          <circle cx="44" cy="25" r="3.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-soft">
      <Image
        src={car.photo.url}
        alt={`${car.year} ${car.make} ${car.model}`}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="object-cover"
      />
    </div>
  );
}

/** The credit line every Commons photo's license asks for. */
export function PhotoCredit({ car }: { car: CarPage }) {
  if (!car.photo) return null;
  const { author, license, license_url, page_url } = car.photo;
  return (
    <p className="text-[12px] leading-snug text-muted">
      Photo:{" "}
      <a href={page_url} target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
        {author}
      </a>
      ,{" "}
      {license_url ? (
        <a href={license_url} target="_blank" rel="noopener noreferrer license" className="hover:text-ink hover:underline">
          {license}
        </a>
      ) : (
        license
      )}
      , via Wikimedia Commons
    </p>
  );
}
