"use server";

import { createClient } from "@/lib/supabase/server";
import type { SpotWithStats, SpotDetail, SpotLeaderboardEntry } from "@/lib/types/database";
import { SPOT_STYLE_OPTIONS_BY_SPORT } from "@/lib/types/database";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isActiveSession(row: { status: string; expires_at: string }): boolean {
  return row.status === "active" && new Date(row.expires_at) > new Date();
}

type CheckInRow = {
  id: string;
  spot_id: string;
  user_id: string;
  created_at: string;
  status: string;
  expires_at: string;
};

export async function getSpotsWithStats(): Promise<SpotWithStats[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const { data: spotsData } = await supabase.from("spots").select("*").order("name");
  const spots = spotsData ?? [];

  const { data: checkInsData } = await supabase
    .from("check_ins")
    .select("id, spot_id, user_id, created_at, status, expires_at")
    .gte("created_at", sevenDaysAgo);
  const checkIns = checkInsData ?? [];

  const userIds = [...new Set((checkIns as { user_id: string }[]).map((c) => c.user_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, ghost_mode")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profiles = profilesData ?? [];
  const profileMap = new Map(
    (profiles as { id: string; display_name: string | null; avatar_url: string | null; ghost_mode: boolean }[]).map(
      (p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url, ghost_mode: p.ghost_mode ?? false }]
    )
  );

  const checkInsList = (checkIns ?? []) as CheckInRow[];
  const spotsList = spots ?? [];

  return spotsList.map((spot: { id: string; name: string; sport: string; type: string; lat: number; lng: number; description: string | null; created_at: string; radius_meters?: number }) => {
    const spotCheckIns = checkInsList.filter((c) => c.spot_id === spot.id);
    const activeNow = spotCheckIns.filter(isActiveSession).length;
    const last7DaysCount = spotCheckIns.length;
    const weeklyAvg = last7DaysCount / 7;
    const heatingUp = weeklyAvg > 0 && activeNow >= weeklyAvg * 1.2;

    const recentCheckIns = spotCheckIns
      .filter(isActiveSession)
      .map((c) => {
        const p = profileMap.get(c.user_id);
        return {
          user_id: c.user_id,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          ghost_mode: p?.ghost_mode ?? false,
        };
      });

    return {
      ...spot,
      radius_meters: spot.radius_meters ?? 50,
      type: spot.type,
      active_now: activeNow,
      weekly_avg: Math.round(weeklyAvg * 10) / 10,
      heating_up: heatingUp,
      recent_check_ins: recentCheckIns,
    };
  });
}

/** Spot detail: leaderboard this month + sponsors (no clips) */
export async function getSpotDetail(spotId: string): Promise<SpotDetail | null> {
  const supabase = await createClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: spot } = await supabase.from("spots").select("*").eq("id", spotId).single();
  if (!spot) return null;

  const { data: checkInsData } = await supabase
    .from("check_ins")
    .select("id, spot_id, user_id, created_at, status, expires_at")
    .eq("spot_id", spotId)
    .gte("created_at", sevenDaysAgo);

  const checkInsList = (checkInsData ?? []) as CheckInRow[];
  const spotCheckIns = checkInsList.filter((c) => c.spot_id === spot.id);
  const activeNow = spotCheckIns.filter(isActiveSession).length;
  const last7DaysCount = spotCheckIns.length;
  const weeklyAvg = last7DaysCount / 7;
  const heatingUp = weeklyAvg > 0 && activeNow >= weeklyAvg * 1.2;

  const userIds = [...new Set(spotCheckIns.map((c) => c.user_id))];
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, ghost_mode")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profiles = profilesData ?? [];
  const profileMap = new Map(
    (profiles as { id: string; display_name: string | null; avatar_url: string | null; ghost_mode: boolean }[]).map(
      (p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url, ghost_mode: p.ghost_mode ?? false }]
    )
  );

  const recentCheckIns = spotCheckIns
    .filter(isActiveSession)
    .map((c) => {
      const p = profileMap.get(c.user_id);
      return {
        user_id: c.user_id,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        ghost_mode: p?.ghost_mode ?? false,
      };
    });

  const thisMonthCheckIns = spotCheckIns.filter((c) => c.created_at >= startOfMonth);
  const countByUser: Record<string, number> = {};
  for (const c of thisMonthCheckIns) {
    countByUser[c.user_id] = (countByUser[c.user_id] ?? 0) + 1;
  }
  const leaderboardEntries: SpotLeaderboardEntry[] = Object.entries(countByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([user_id]) => {
      const p = profileMap.get(user_id);
      return {
        user_id,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        ghost_mode: p?.ghost_mode ?? false,
        check_ins_this_month: countByUser[user_id],
      };
    });

  const { data: sponsorRowsData } = await supabase
    .from("spot_sponsors")
    .select("brand_id")
    .eq("spot_id", spotId);
  const sponsorRows = sponsorRowsData ?? [];
  const brandIds = (sponsorRows as { brand_id: string }[]).map((r) => r.brand_id);
  const { data: brandProfilesData } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("account_type", "brand")
    .in("id", brandIds.length ? brandIds : ["00000000-0000-0000-0000-000000000000"]);

  const brandProfiles = brandProfilesData ?? [];
  const sponsors = (brandProfiles as { id: string; display_name: string | null; avatar_url: string | null }[]).map((b) => ({
    brand_id: b.id,
    display_name: b.display_name,
    avatar_url: b.avatar_url,
  }));

  const spotRow = spot as { type: string; radius_meters?: number };

  return {
    ...spot,
    radius_meters: spotRow.radius_meters ?? 50,
    type: spotRow.type,
    active_now: activeNow,
    weekly_avg: Math.round(weeklyAvg * 10) / 10,
    heating_up: heatingUp,
    recent_check_ins: recentCheckIns,
    leaderboard_this_month: leaderboardEntries,
    sponsors,
  };
}

/** Active riders at a spot (status active, not expired). */
export async function getActiveRidersCountForSpot(spotId: string): Promise<number> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { count, error } = await supabase
    .from("check_ins")
    .select("*", { count: "exact", head: true })
    .eq("spot_id", spotId)
    .eq("status", "active")
    .gt("expires_at", nowIso);
  if (error) return 0;
  return count ?? 0;
}

/** Spot IDs where the current user has an active session. */
export async function getMyActiveSpotIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("check_ins")
    .select("spot_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("expires_at", nowIso);
  if (error) return [];
  return (data as { spot_id: string }[]).map((r) => r.spot_id);
}

export async function handleCheckIn(spotId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const expiresAt = new Date(Date.now() + FOUR_HOURS_MS).toISOString();
  const { error } = await supabase.from("check_ins").insert({
    user_id: user.id,
    spot_id: spotId,
    status: "active",
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }
  return {};
}

export async function handleCheckOut(spotId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("check_ins")
    .update({ status: "completed" })
    .eq("user_id", user.id)
    .eq("spot_id", spotId)
    .eq("status", "active");

  if (error) return { error: error.message };
  return {};
}

/** Heat data for trend overlay (last 30 days check-in counts per spot) */
export async function getTrendHeatData(): Promise<{ spot_id: string; lat: number; lng: number; count: number }[]> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const { data: checkInsData } = await supabase
    .from("check_ins")
    .select("spot_id")
    .gte("created_at", thirtyDaysAgo);
  const checkIns = checkInsData ?? [];

  const countBySpot: Record<string, number> = {};
  for (const row of checkIns as { spot_id: string }[]) {
    countBySpot[row.spot_id] = (countBySpot[row.spot_id] ?? 0) + 1;
  }

  const spotIds = Object.keys(countBySpot);
  if (spotIds.length === 0) return [];

  const { data: spotsData } = await supabase.from("spots").select("id, lat, lng").in("id", spotIds);
  const spots = spotsData ?? [];

  return (spots as { id: string; lat: number; lng: number }[]).map((s) => ({
    spot_id: s.id,
    lat: s.lat,
    lng: s.lng,
    count: countBySpot[s.id] ?? 0,
  }));
}

export async function updateGhostMode(ghost: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("membership_tier").eq("id", user.id).single();
  if (profile?.membership_tier !== "pro") return { error: "Only Pro users can use Go Ghost" };

  const { error } = await supabase.from("profiles").update({ ghost_mode: ghost, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) return { error: error.message };
  return {};
}

export async function createSpot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const sport = (formData.get("sport") as string) || "Skateboard";
  const type = (formData.get("type") as string) || "street";
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const description = (formData.get("description") as string) || null;

  if (!name?.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: "Name, lat, and lng are required." };
  }

  const validSports = ["Skateboard", "Surf", "Snowboard", "Skiing", "BMX", "MTB", "Moto"];
  const spotSport = validSports.includes(sport) ? sport : "Skateboard";
  const styleOptions = SPOT_STYLE_OPTIONS_BY_SPORT[spotSport];
  const validTypes = styleOptions?.map((o) => o.value) ?? ["street"];
  const spotType = validTypes.includes(type) ? type : validTypes[0];

  const { data, error } = await supabase
    .from("spots")
    .insert({ name: name.trim(), sport: spotSport, type: spotType, lat, lng, description: description?.trim() || null })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function createCheckIn(spotId: string): Promise<{ error?: string }> {
  return handleCheckIn(spotId);
}
