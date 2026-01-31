"use server";

import { createClient } from "@/lib/supabase/server";
import type { SpotWithStats } from "@/lib/types/database";
import { SPOT_STYLE_OPTIONS_BY_SPORT } from "@/lib/types/database";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getSpotsWithStats(): Promise<SpotWithStats[]> {
  const supabase = await createClient();
  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - FOUR_HOURS_MS).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();

  const { data: spots = [] } = await supabase.from("spots").select("*").order("name");

  const { data: checkIns = [] } = await supabase
    .from("check_ins")
    .select("id, spot_id, user_id, created_at")
    .gte("created_at", sevenDaysAgo);

  const userIds = [...new Set((checkIns as { user_id: string }[]).map((c) => c.user_id))];
  const { data: profiles = [] } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(
    (profiles as { id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]
    )
  );

  const checkInsList = (checkIns ?? []) as { id: string; spot_id: string; user_id: string; created_at: string }[];
  const spotsList = spots ?? [];

  return spotsList.map((spot: { id: string; name: string; sport: string; type: string; lat: number; lng: number; description: string | null; created_at: string }) => {
    const spotCheckIns = checkInsList.filter((c) => c.spot_id === spot.id);
    const activeNow = spotCheckIns.filter((c) => c.created_at >= fourHoursAgo).length;
    const last7DaysCount = spotCheckIns.length;
    const weeklyAvg = last7DaysCount / 7;
    const heatingUp = weeklyAvg > 0 && activeNow >= weeklyAvg * 1.2;

    const recentCheckIns = spotCheckIns
      .filter((c) => c.created_at >= fourHoursAgo)
      .map((c) => {
        const p = profileMap.get(c.user_id);
        return { user_id: c.user_id, display_name: p?.display_name ?? null, avatar_url: p?.avatar_url ?? null };
      });

    return {
      ...spot,
      type: spot.type,
      active_now: activeNow,
      weekly_avg: Math.round(weeklyAvg * 10) / 10,
      heating_up: heatingUp,
      recent_check_ins: recentCheckIns,
    };
  });
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

export async function createCheckIn(spotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("check_ins").insert({ user_id: user.id, spot_id: spotId });

  if (error) return { error: error.message };
  return {};
}
