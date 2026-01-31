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
import { ClipCatalog } from "@/components/ClipCatalog";
import { AthleteDaps } from "@/components/AthleteDaps";
import type { Clip } from "@/lib/types/database";

function formatSpecLabel(value: string, options: { value: string; label: string }[]): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, sport_name, account_type")
    .eq("username", username)
    .single();
  if (!profile) return { title: "Profile | FTA Action Sports" };
  const name = profile.display_name || (profile.account_type === "brand" ? "Brand" : "Athlete");
  const suffix = profile.account_type === "brand" ? " · Brand" : profile.sport_name ? ` · ${profile.sport_name}` : "";
  return { title: `${name}${suffix} | FTA Action Sports` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  if (profile.account_type === "brand") {
    const { BrandHub: BrandHubView } = await import("@/components/BrandHub");
    return (
      <BrandHubView
        display_name={profile.display_name}
        username={profile.username}
        verified={profile.verified ?? false}
        scouting_status={profile.scouting_status}
        bio={profile.bio}
        banner_url={profile.banner_url}
        email_public={profile.email_public}
        twitter={profile.twitter}
        youtube={profile.youtube}
        isOwnProfile={user?.id === profile.id}
      />
    );
  }

  const { data: clips = [] } = await supabase
    .from("clips")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: profileDapsRows } = await supabase
    .from("profile_daps")
    .select("voter_id")
    .eq("athlete_id", profile.id);
  const profileDapsList = profileDapsRows ?? [];
  const athleteDapsCount = profileDapsList.length;
  const userHasDappedAthlete =
    !!user?.id && profileDapsList.some((r: { voter_id: string }) => r.voter_id === user.id);

  const sportName = profile.sport_name ?? "";
  const specParts: string[] = [];
  if (sportUsesStance(sportName) && profile.stance) specParts.push(formatSpecLabel(profile.stance, STANCE_OPTIONS));
  if (sportUsesSnowStyle(sportName) && profile.snow_styles?.length) specParts.push((profile.snow_styles as string[]).map((v) => formatSpecLabel(v, SNOW_STYLE_OPTIONS)).join(", "));
  if (sportUsesSkateStyle(sportName) && profile.skate_styles?.length) specParts.push((profile.skate_styles as string[]).map((v) => formatSpecLabel(v, SKATE_STYLE_OPTIONS)).join(", "));
  if (sportUsesFootForward(sportName) && profile.foot_forward) specParts.push(formatSpecLabel(profile.foot_forward, FOOT_FORWARD_OPTIONS));
  if (sportUsesDiscipline(sportName) && profile.disciplines?.length) specParts.push((profile.disciplines as string[]).map((v) => formatSpecLabel(v, DISCIPLINE_OPTIONS)).join(", "));
  const specLabel = specParts.length ? specParts.join(" · ") : null;

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10 flex flex-col items-center">
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

        <div className="p-4 border-b-2 border-fta-black">
          <AthleteDaps
            athleteId={profile.id}
            initialDapsCount={athleteDapsCount}
            userHasDapped={userHasDappedAthlete}
            currentUserId={user?.id ?? null}
          />
        </div>

        <div className="p-4 flex flex-wrap gap-2 border-t-2 border-fta-black">
          <Link
            href="/discovery"
            className="px-4 py-2 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none text-sm"
          >
            Discovery
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none text-sm"
            >
              Back to Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none text-sm"
            >
              FTA Home
            </Link>
          )}
        </div>
      </div>

      <ClipCatalog clips={(clips ?? []) as Clip[]} />

      <p className="mt-6 text-sm text-fta-black/60">FTA Action Sports · Forget the Algorithm</p>
    </main>
  );
}
