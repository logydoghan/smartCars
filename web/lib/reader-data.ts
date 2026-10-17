import "server-only";
import type { Reader } from "./auth";
import { readerClient } from "./supabase-server";
import type { CarPage } from "./types";

// These read per reader at request time, so they stay out of the shared car cache.

export interface CarComment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: string;
}

export async function isSaved(reader: Reader, slug: string): Promise<boolean> {
  const db = await readerClient();
  if (!db) return false;
  const { data } = await db.from("bookmarks").select("car_slug").eq("user_id", reader.id).eq("car_slug", slug).maybeSingle();
  return Boolean(data);
}

/** The reader's saved cars, newest save first. Cars no longer covered drop out. */
export async function getSavedCars(reader: Reader): Promise<CarPage[]> {
  const db = await readerClient();
  if (!db) return [];
  const { data: saves, error } = await db
    .from("bookmarks")
    .select("car_slug")
    .eq("user_id", reader.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load saved cars: ${error.message}`);
  const slugs = saves.map((s) => s.car_slug as string);
  if (slugs.length === 0) return [];

  const { data: rows, error: carsError } = await db.from("cars").select("*").in("slug", slugs);
  if (carsError) throw new Error(`Could not load saved cars: ${carsError.message}`);
  const bySlug = new Map((rows as CarPage[]).map((r) => [r.slug, r]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}

export async function getComments(slug: string): Promise<CarComment[]> {
  const db = await readerClient();
  if (!db) return [];
  const { data, error } = await db
    .from("comments")
    .select("id, body, created_at, user_id, profiles (display_name)")
    .eq("car_slug", slug)
    .order("created_at");
  if (error) throw new Error(`Could not load comments: ${error.message}`);
  type Row = Omit<CarComment, "author"> & { profiles: { display_name: string } | null };
  return (data as unknown as Row[]).map(({ profiles, ...c }) => ({ ...c, author: profiles?.display_name ?? "Reader" }));
}
