import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  STANCE_OPTIONS,
  SNOW_STYLE_OPTIONS,
  SKATE_STYLE_OPTIONS,
  FOOT_FORWARD_OPTIONS,
  DISCIPLINE_OPTIONS,
  sportUsesStance,
  sportUsesSnowStyle,
  sportUsesSkateStyle,
  sportUsesFootForward,
  sportUsesDiscipline,
} from "@/lib/types/database";

function formatSpecLabel(value: string, options: { value: string; label: string }[]): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, sport_name")
    .eq("username", username)
    .eq("account_type", "athlete")
    .single();
  if (!profile) return { title: "Profile | FTA Action Sports" };
  const name = profile.display_name || "Athlete";
  const sport = profile.sport_name ? ` · ${profile.sport_name}` : "";
  return { title: `${name}${sport} | FTA Action Sports` };
}

export default async function ProCardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("account_type", "athlete")
    .single();

  if (!profile) notFound();

  const sportName = profile.sport_name ?? "";
  const specParts: string[] = [];
  if (sportUsesStance(sportName) && profile.stance) specParts.push(formatSpecLabel(profile.stance, STANCE_OPTIONS));
  if (sportUsesSnowStyle(sportName) && profile.snow_style) specParts.push(formatSpecLabel(profile.snow_style, SNOW_STYLE_OPTIONS));
  if (sportUsesSkateStyle(sportName) && profile.skate_style) specParts.push(formatSpecLabel(profile.skate_style, SKATE_STYLE_OPTIONS));
  if (sportUsesFootForward(sportName) && profile.foot_forward) specParts.push(formatSpecLabel(profile.foot_forward, FOOT_FORWARD_OPTIONS));
  if (sportUsesDiscipline(sportName) && profile.discipline) specParts.push(formatSpecLabel(profile.discipline, DISCIPLINE_OPTIONS));
  const specLabel = specParts.length ? specParts.join(" · ") : null;

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-md border-2 border-fta-black bg-fta-paper overflow-hidden">
        {/* Pro Card – ID / trading card layout */}
        <div className="border-b-2 border-fta-black p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-2 border-fta-orange pb-1 inline-block">
                {profile.display_name || "Athlete"}
              </h1>
              {profile.sport_name && (
                <p className="text-lg font-bold text-fta-black/80 mt-2">{profile.sport_name}</p>
              )}
              {specLabel && (
                <p className="text-sm font-bold text-fta-black/70 mt-0.5">{specLabel}</p>
              )}
            </div>
            {profile.verified && (
              <span className="shrink-0 px-2 py-1 border-2 border-fta-orange bg-fta-orange text-fta-black text-xs font-bold uppercase tracking-wide">
                Verified
              </span>
            )}
          </div>
        </div>

        {profile.avatar_url && (
          <div className="border-b-2 border-fta-black aspect-[4/3] bg-fta-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-4 border-b-2 border-fta-black">
          {profile.home_town && (
            <p className="text-sm font-bold text-fta-black/80">
              <span className="text-fta-black/60">Home</span> {profile.home_town}
            </p>
          )}
          {profile.bio && (
            <p className="text-sm text-fta-black/90 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        <div className="p-4 flex gap-2 border-t-2 border-fta-black">
          <Link
            href="/"
            className="flex-1 text-center px-4 py-2 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none text-sm"
          >
            FTA Home
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm text-fta-black/60">FTA Action Sports · Forget the Algorithm</p>
    </main>
  );
}
