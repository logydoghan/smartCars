import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { SAMPLE_CARS } from "./sample";
import type { CarList, CarPage } from "./types";

// Without Supabase settings the site serves sample cars, so it runs out of the box.
function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function getCars(): Promise<CarList> {
  "use cache";
  // The agents refresh a few cars each week; re-check within the hour.
  cacheLife("hours");

  const db = supabase();
  if (!db) return { cars: SAMPLE_CARS, sample: true };

  const { data, error } = await db.from("cars").select("*").order("make").order("model");
  if (error) throw new Error(`Could not load cars: ${error.message}`);
  return { cars: data as CarPage[] };
}

export async function getCar(slug: string): Promise<CarPage | null> {
  "use cache";
  cacheLife("hours");

  const db = supabase();
  if (!db) return SAMPLE_CARS.find((c) => c.slug === slug) ?? null;

  const { data, error } = await db.from("cars").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Could not load car: ${error.message}`);
  return data as CarPage | null;
}
