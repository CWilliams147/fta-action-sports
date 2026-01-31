"use server";

import { createClient } from "@/lib/supabase/server";
import type { ScoutAthlete, TrendingAthlete } from "@/lib/types/database";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export interface ScoutFilters {
  sport_name: string | null;
  stance: string | null;
  foot_forward: string | null;
  location: string | null;
  min_daps: number;
}

export async function getTrendingAthletes(): Promise<TrendingAthlete[]> {
  const supabase = await createClient();
  const { data: dapsRows } = await supabase
    .from("daps")
    .select("clip_id, created_at")
    .gte("created_at", SEVEN_DAYS_AGO);
  if (!dapsRows?.length) return [];

  const clipIdToCount: Record<string, number> = {};
  for (const row of dapsRows as { clip_id: string }[]) {
    clipIdToCount[row.clip_id] = (clipIdToCount[row.clip_id] ?? 0) + 1;
  }
  const clipIds = Object.keys(clipIdToCount);
  if (clipIds.length === 0) return [];

  const { data: clips } = await supabase
    .from("clips")
    .select("id, profile_id")
    .in("id", clipIds);
  if (!clips?.length) return [];

  const profileIdToClipDaps: Record<string, number> = {};
  for (const c of clips as { id: string; profile_id: string }[]) {
    const count = clipIdToCount[c.id] ?? 0;
    profileIdToClipDaps[c.profile_id] = (profileIdToClipDaps[c.profile_id] ?? 0) + count;
  }
  const sortedProfileIds = Object.entries(profileIdToClipDaps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  if (sortedProfileIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, sport_name")
    .eq("account_type", "athlete")
    .in("id", sortedProfileIds);

  const order = sortedProfileIds;
  return (profiles ?? []).map((p: { id: string; display_name: string | null; username: string | null; sport_name: string | null }) => ({
    id: p.id,
    display_name: p.display_name,
    username: p.username,
    sport_name: p.sport_name,
    clip_daps_7d: profileIdToClipDaps[p.id] ?? 0,
  })).sort((a, b) => order.indexOf(b.id) - order.indexOf(a.id));
}

export async function getScoutAthletes(
  brandId: string,
  filters: ScoutFilters
): Promise<ScoutAthlete[]> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, sport_name, home_town, stance, foot_forward")
    .eq("account_type", "athlete");

  if (filters.sport_name) {
    query = query.eq("sport_name", filters.sport_name);
  }
  if (filters.stance) {
    query = query.eq("stance", filters.stance);
  }
  if (filters.foot_forward) {
    query = query.eq("foot_forward", filters.foot_forward);
  }
  if (filters.location?.trim()) {
    query = query.ilike("home_town", `%${filters.location.trim()}%`);
  }

  const { data: athletes = [] } = await query.order("created_at", { ascending: false });
  const athleteIds = (athletes as { id: string }[]).map((a) => a.id);
  if (athleteIds.length === 0) return [];

  const { data: profileDapsRows } = await supabase
    .from("profile_daps")
    .select("athlete_id");
  const dapsByAthlete: Record<string, number> = {};
  for (const row of profileDapsRows ?? []) {
    const aid = (row as { athlete_id: string }).athlete_id;
    dapsByAthlete[aid] = (dapsByAthlete[aid] ?? 0) + 1;
  }

  const { data: watchlistRows } = await supabase
    .from("watchlist")
    .select("athlete_id")
    .eq("brand_id", brandId);
  const watchlistIds = new Set((watchlistRows ?? []).map((r: { athlete_id: string }) => r.athlete_id));

  const { data: clipsRows } = await supabase
    .from("clips")
    .select("id, profile_id, video_url, thumbnail_url")
    .in("profile_id", athleteIds)
    .order("created_at", { ascending: false });
  const latestClipByProfile: Record<string, { id: string; video_url: string; thumbnail_url: string | null }> = {};
  for (const c of (clipsRows ?? []) as { id: string; profile_id: string; video_url: string; thumbnail_url: string | null }[]) {
    if (!latestClipByProfile[c.profile_id]) {
      latestClipByProfile[c.profile_id] = { id: c.id, video_url: c.video_url, thumbnail_url: c.thumbnail_url };
    }
  }

  let result: ScoutAthlete[] = (athletes as {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    sport_name: string | null;
    home_town: string | null;
    stance: string | null;
    foot_forward: string | null;
  }[]).map((a) => ({
    id: a.id,
    display_name: a.display_name,
    username: a.username,
    avatar_url: a.avatar_url,
    sport_name: a.sport_name,
    home_town: a.home_town,
    stance: a.stance as ScoutAthlete["stance"],
    foot_forward: a.foot_forward as ScoutAthlete["foot_forward"],
    athlete_daps_count: dapsByAthlete[a.id] ?? 0,
    latest_clip: latestClipByProfile[a.id] ?? null,
    on_watchlist: watchlistIds.has(a.id),
  }));

  if (filters.min_daps > 0) {
    result = result.filter((a) => a.athlete_daps_count >= filters.min_daps);
  }

  return result;
}

export async function toggleWatchlist(brandId: string, athleteId: string): Promise<{ on_watchlist: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("watchlist")
    .select("id")
    .eq("brand_id", brandId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("brand_id", brandId)
      .eq("athlete_id", athleteId);
    if (error) return { on_watchlist: true, error: error.message };
    return { on_watchlist: false };
  }

  const { error } = await supabase.from("watchlist").insert({ brand_id: brandId, athlete_id: athleteId });
  if (error) return { on_watchlist: false, error: error.message };
  return { on_watchlist: true };
}
