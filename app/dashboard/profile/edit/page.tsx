"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SportDropdown } from "@/components/SportDropdown";
import {
  type StanceType,
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
  const [snowStyle, setSnowStyle] = useState<SnowStyleType | "">("");
  const [skateStyle, setSkateStyle] = useState<SkateStyleType | "">("");
  const [footForward, setFootForward] = useState<FootForwardType | "">("");
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
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
        if (profile.account_type !== "athlete") {
          router.replace("/dashboard");
          return;
        }
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setHomeTown(profile.home_town ?? "");
        setUsername(profile.username ?? "");
        setSportName(profile.sport_name ?? "");
        setStance((profile.stance as StanceType) ?? "");
        setSnowStyle((profile.snow_style as SnowStyleType) ?? "");
        setSkateStyle((profile.skate_style as SkateStyleType) ?? "");
        setFootForward((profile.foot_forward as FootForwardType) ?? "");
        setDiscipline((profile.discipline as DisciplineType) ?? "");
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
    if (sportUsesSnowStyle(sportName) && !snowStyle) {
      setMessage("Pick your snow style.");
      return;
    }
    if (sportUsesSkateStyle(sportName) && !skateStyle) {
      setMessage("Pick your style.");
      return;
    }
    if (sportUsesFootForward(sportName) && !footForward) {
      setMessage("Pick your foot forward.");
      return;
    }
    if (sportUsesDiscipline(sportName) && !discipline) {
      setMessage("Pick your discipline.");
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
      snow_style: null,
      skate_style: null,
      foot_forward: null,
      discipline: null,
      updated_at: new Date().toISOString(),
    };
    if (sportUsesStance(sportName)) payload.stance = stance;
    if (sportUsesSnowStyle(sportName)) payload.snow_style = snowStyle;
    if (sportUsesSkateStyle(sportName)) payload.skate_style = skateStyle;
    if (sportUsesFootForward(sportName)) payload.foot_forward = footForward;
    if (sportUsesDiscipline(sportName)) payload.discipline = discipline;
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

  return (
    <main className="min-h-screen p-8 border-2 border-fta-black">
      <header className="border-b-2 border-fta-black pb-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block">
          Edit profile
        </h1>
        <p className="text-fta-black/80 mt-2">Update your athlete profile.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 text-sm font-bold text-fta-orange hover:underline"
        >
          ← Dashboard
        </Link>
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
              setSnowStyle("");
              setSkateStyle("");
              setFootForward("");
              setDiscipline("");
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
            <label className="block text-sm font-bold mb-2">Style</label>
            <div className="flex flex-wrap gap-2">
              {SKATE_STYLE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="radio"
                    name="skate_style"
                    value={opt.value}
                    checked={skateStyle === opt.value}
                    onChange={() => setSkateStyle(opt.value)}
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
            <label className="block text-sm font-bold mb-2">Snow style</label>
            <div className="flex flex-wrap gap-2">
              {SNOW_STYLE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="radio"
                    name="snow_style"
                    value={opt.value}
                    checked={snowStyle === opt.value}
                    onChange={() => setSnowStyle(opt.value)}
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
            <label className="block text-sm font-bold mb-2">Discipline</label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none">
                  <input
                    type="radio"
                    name="discipline"
                    value={opt.value}
                    checked={discipline === opt.value}
                    onChange={() => setDiscipline(opt.value)}
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
          disabled={loading || !selectedSport || (sportUsesStance(sportName) && !stance) || (sportUsesSnowStyle(sportName) && !snowStyle) || (sportUsesSkateStyle(sportName) && !skateStyle) || (sportUsesFootForward(sportName) && !footForward) || (sportUsesDiscipline(sportName) && !discipline)}
          className="px-6 py-3 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-50 rounded-none"
        >
          {loading ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
