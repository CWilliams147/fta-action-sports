"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SportDropdown } from "@/components/SportDropdown";
import { UploadClips } from "@/components/UploadClips";
import { BrandEditForm } from "@/components/BrandEditForm";
import { CreativeEditForm } from "@/components/CreativeEditForm";
import {
  type StanceType,
  type ScoutingStatusType,
  type FootForwardType,
  type SnowStyleType,
  type SkateStyleType,
  type DisciplineType,
  SPORT_OPTIONS,
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

export default function EditProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [homeTown, setHomeTown] = useState("");
  const [username, setUsername] = useState("");
  const [sportName, setSportName] = useState("");
  const [stance, setStance] = useState<StanceType | "">("");
  const [snowStyles, setSnowStyles] = useState<SnowStyleType[]>([]);
  const [skateStyles, setSkateStyles] = useState<SkateStyleType[]>([]);
  const [footForward, setFootForward] = useState<FootForwardType | "">("");
  const [disciplines, setDisciplines] = useState<DisciplineType[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"athlete" | "brand" | null>(null);
  const [brandInitial, setBrandInitial] = useState<{
    display_name: string;
    username: string;
    bio: string;
    banner_url: string | null;
    email_public: string;
    twitter: string;
    youtube: string;
    scouting_status: ScoutingStatusType | null;
  } | null>(null);
  const [creativeInitial, setCreativeInitial] = useState<{
    display_name: string;
    username: string;
    bio: string;
    home_town: string;
    equipment_list: string[];
    specialties: string[];
    day_rate: string;
    youtube_portfolio: string;
    vimeo_portfolio: string;
    behance_portfolio: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const selectedSport = SPORT_OPTIONS.find((s) => s.name === sportName);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/sign-in");
        return;
      }
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data: profile, error }) => {
        setFetching(false);
        if (error || !profile) {
          router.replace("/dashboard");
          return;
        }
        setProfileId(profile.id);
        setAccountType(profile.account_type);
        if (profile.account_type === "brand") {
          setBrandInitial({
            display_name: profile.display_name ?? "",
            username: profile.username ?? "",
            bio: profile.bio ?? "",
            banner_url: profile.banner_url ?? null,
            email_public: profile.email_public ?? "",
            twitter: profile.twitter ?? "",
            youtube: profile.youtube ?? "",
            scouting_status: profile.scouting_status ?? null,
          });
          return;
        }
        if (profile.account_type === "creative") {
          setCreativeInitial({
            display_name: profile.display_name ?? "",
            username: profile.username ?? "",
            bio: profile.bio ?? "",
            home_town: profile.home_town ?? "",
            equipment_list: Array.isArray(profile.equipment_list) ? profile.equipment_list : [],
            specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
            day_rate: profile.day_rate != null ? String(profile.day_rate) : "",
            youtube_portfolio: profile.youtube_portfolio ?? "",
            vimeo_portfolio: profile.vimeo_portfolio ?? "",
            behance_portfolio: profile.behance_portfolio ?? "",
          });
          return;
        }
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setHomeTown(profile.home_town ?? "");
        setUsername(profile.username ?? "");
        setSportName(profile.sport_name ?? "");
        setStance((profile.stance as StanceType) ?? "");
        setSnowStyles(Array.isArray(profile.snow_styles) ? profile.snow_styles : []);
        setSkateStyles(Array.isArray(profile.skate_styles) ? profile.skate_styles : []);
        setFootForward((profile.foot_forward as FootForwardType) ?? "");
        setDisciplines(Array.isArray(profile.disciplines) ? profile.disciplines : []);
      });
    });
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSport) {
      setMessage("Pick a sport.");
      return;
    }
    if (sportUsesStance(sportName) && !stance) {
      setMessage("Pick your stance.");
      return;
    }
    if (sportUsesSnowStyle(sportName) && snowStyles.length === 0) {
      setMessage("Pick at least one snow style.");
      return;
    }
    if (sportUsesSkateStyle(sportName) && skateStyles.length === 0) {
      setMessage("Pick at least one style.");
      return;
    }
    if (sportUsesFootForward(sportName) && !footForward) {
      setMessage("Pick your foot forward.");
      return;
    }
    if (sportUsesDiscipline(sportName) && disciplines.length === 0) {
      setMessage("Pick at least one discipline.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Not signed in.");
      setLoading(false);
      return;
    }
    const payload: Record<string, unknown> = {
      id: user.id,
      account_type: "athlete",
      display_name: displayName || null,
      bio: bio || null,
      home_town: homeTown || null,
      username: username.trim() || null,
      sport_category: selectedSport.category,
      sport_name: sportName,
      stance: null,
      snow_styles: [],
      skate_styles: [],
      foot_forward: null,
      disciplines: [],
      updated_at: new Date().toISOString(),
    };
    if (sportUsesStance(sportName)) payload.stance = stance;
    if (sportUsesSnowStyle(sportName)) payload.snow_styles = snowStyles;
    if (sportUsesSkateStyle(sportName)) payload.skate_styles = skateStyles;
    if (sportUsesFootForward(sportName)) payload.foot_forward = footForward;
    if (sportUsesDiscipline(sportName)) payload.disciplines = disciplines;
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (fetching) {
    return (
      <main className="min-h-screen p-8 border-2 border-fta-black">
        <p className="text-fta-black/80">Loading…</p>
      </main>
    );
  }

  if (accountType === "creative" && creativeInitial && profileId) {
    return (
      <main className="min-h-screen p-8 border-2 border-fta-black">
        <header className="border-b-2 border-fta-black pb-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block">
            Edit Creative Profile
          </h1>
          <p className="text-fta-black/80 mt-2">Equipment, specialties, portfolio, day rate.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/dashboard" className="text-sm font-bold text-fta-orange hover:underline">
              ← Dashboard
            </Link>
            {creativeInitial.username && (
              <Link
                href={`/profile/${creativeInitial.username}`}
                className="text-sm font-bold text-fta-orange hover:underline"
              >
                View profile
              </Link>
            )}
          </div>
        </header>
        <CreativeEditForm
          profileId={profileId}
          initial={creativeInitial}
          onSaved={() => router.refresh()}
        />
      </main>
    );
  }

  if (accountType === "brand" && brandInitial && profileId) {
    return (
      <main className="min-h-screen p-8 border-2 border-fta-black">
        <header className="border-b-2 border-fta-black pb-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block">
            Edit Brand Hub
          </h1>
          <p className="text-fta-black/80 mt-2">Banner, scouting status, and contact links.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-bold text-fta-orange hover:underline"
            >
              ← Dashboard
            </Link>
            {brandInitial.username && (
              <Link
                href={`/profile/${brandInitial.username}`}
                className="text-sm font-bold text-fta-orange hover:underline"
              >
                View Brand Hub
              </Link>
            )}
          </div>
        </header>
        <BrandEditForm
          profileId={profileId}
          initial={brandInitial}
          onSaved={() => router.refresh()}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 border-2 border-fta-black">
      <header className="border-b-2 border-fta-black pb-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block">
          Edit profile
        </h1>
        <p className="text-fta-black/80 mt-2">Update your athlete profile.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-fta-orange hover:underline"
          >
            ← Dashboard
          </Link>
          <Link
            href="/discovery"
            className="text-sm font-bold text-fta-orange hover:underline"
          >
            Discovery
          </Link>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div>
          <label htmlFor="display_name" className="block text-sm font-bold mb-1">
            Name
          </label>
          <input
            id="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-bold mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none resize-y"
          />
        </div>
        <div>
          <label htmlFor="home_town" className="block text-sm font-bold mb-1">
            Home town
          </label>
          <input
            id="home_town"
            type="text"
            value={homeTown}
            onChange={(e) => setHomeTown(e.target.value)}
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-bold mb-1">
            Username (for public profile URL)
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. jane-pro"
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
          <p className="text-xs text-fta-black/70 mt-1">Your Pro Card will be at /profile/{username || "username"}</p>
        </div>
        <div>
          <label id="sport-label" className="block text-sm font-bold mb-1">
            Sport
          </label>
          <SportDropdown
            value={sportName}
            onChange={(name) => {
              setSportName(name);
              setStance("");
              setSnowStyles([]);
              setSkateStyles([]);
              setFootForward("");
              setDisciplines([]);
            }}
            labelId="sport-label"
          />
        </div>

        {sportUsesStance(sportName) && (
          <div>
            <label className="block text-sm font-bold mb-2">Stance</label>
            <div className="flex gap-2">
              {STANCE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="radio"
                    name="stance"
                    value={opt.value}
                    checked={stance === opt.value}
                    onChange={() => setStance(opt.value)}
                    className="sr-only"
                  />
                  <span className="font-bold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {sportUsesSkateStyle(sportName) && (
          <div>
            <label className="block text-sm font-bold mb-2">Styles (pick all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {SKATE_STYLE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="checkbox"
                    name="skate_styles"
                    value={opt.value}
                    checked={skateStyles.includes(opt.value)}
                    onChange={() => setSkateStyles((prev) => prev.includes(opt.value) ? prev.filter((v) => v !== opt.value) : [...prev, opt.value])}
                    className="sr-only"
                  />
                  <span className="font-bold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {sportUsesSnowStyle(sportName) && (
          <div>
            <label className="block text-sm font-bold mb-2">Snow styles (pick all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {SNOW_STYLE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="checkbox"
                    name="snow_styles"
                    value={opt.value}
                    checked={snowStyles.includes(opt.value)}
                    onChange={() => setSnowStyles((prev) => prev.includes(opt.value) ? prev.filter((v) => v !== opt.value) : [...prev, opt.value])}
                    className="sr-only"
                  />
                  <span className="font-bold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {sportUsesFootForward(sportName) && (
          <div>
            <label className="block text-sm font-bold mb-2">Foot Forward</label>
            <div className="flex gap-2">
              {FOOT_FORWARD_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="radio"
                    name="foot_forward"
                    value={opt.value}
                    checked={footForward === opt.value}
                    onChange={() => setFootForward(opt.value)}
                    className="sr-only"
                  />
                  <span className="font-bold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {sportUsesDiscipline(sportName) && (
          <div>
            <label className="block text-sm font-bold mb-2">Disciplines (pick all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="checkbox"
                    name="disciplines"
                    value={opt.value}
                    checked={disciplines.includes(opt.value)}
                    onChange={() => setDisciplines((prev) => prev.includes(opt.value) ? prev.filter((v) => v !== opt.value) : [...prev, opt.value])}
                    className="sr-only"
                  />
                  <span className="font-bold">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {message && <p className="text-sm font-medium text-red-600">{message}</p>}
        <button
          type="submit"
          disabled={loading || !selectedSport || (sportUsesStance(sportName) && !stance) || (sportUsesSnowStyle(sportName) && snowStyles.length === 0) || (sportUsesSkateStyle(sportName) && skateStyles.length === 0) || (sportUsesFootForward(sportName) && !footForward) || (sportUsesDiscipline(sportName) && disciplines.length === 0)}
          className="px-6 py-3 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-50 rounded-none"
        >
          {loading ? "Saving…" : "Save profile"}
        </button>
      </form>

      {profileId && (
        <UploadClips profileId={profileId} />
      )}
    </main>
  );
}
