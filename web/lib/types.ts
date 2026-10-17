export const BODIES = ["SUV", "Sedan", "Truck", "Hatchback", "Minivan"] as const;
export type Body = (typeof BODIES)[number];
export type Powertrain = "Gas" | "Hybrid" | "Electric";
export type AgreementLevel = "mostly agree" | "mixed" | "split";

export interface CriticReview {
  outlet: string;
  url: string;
  title: string;
  /** YYYY-MM-DD, or "" when the review shows no date. */
  published: string;
  /** The outlet's own rating as printed, e.g. "8/10"; "" when it gives none. */
  score: string;
  score_10: number | null;
  summary: string;
  likes: string[];
  dislikes: string[];
}

export interface OwnerTheme {
  title: string;
  component: string;
  summary: string;
  count: number;
  /** NHTSA ODI numbers of a few complaints in this theme. */
  complaint_ids: number[];
}

export interface Recall {
  campaign: string;
  reported: string | null;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  park_it: boolean;
}

export interface Disagreement {
  topic: string;
  headline: string;
  critics: string;
  owners: string;
  records: string;
  kind: "critics vs owners" | "critics vs recalls" | "critics split";
  strength: "strong" | "some";
}

/** A free photo from Wikimedia Commons, with the credit its license requires. */
export interface CarPhoto {
  url: string;
  width: number;
  height: number;
  page_url: string;
  author: string;
  license: string;
  license_url: string;
}

export interface CarPage {
  slug: string;
  year: number;
  make: string;
  model: string;
  body: Body;
  powertrain: Powertrain;
  price_from: number | null;
  headline: string;
  verdict: string;
  agreement_level: AgreementLevel;
  critic_score: number | null;
  critic_consensus: string;
  critics: CriticReview[];
  owner_overview: string;
  owner_themes: OwnerTheme[];
  complaint_count: number;
  complaint_components: { component: string; count: number }[];
  crash_count: number;
  fire_count: number;
  injury_count: number;
  recalls: Recall[];
  disagreements: Disagreement[];
  agreements: string[];
  photo: CarPhoto | null;
  updated_at: string;
}

export interface CarList {
  cars: CarPage[];
  /** True when the site is showing built-in sample cars instead of database content. */
  sample?: boolean;
}
