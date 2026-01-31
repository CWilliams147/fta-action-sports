"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  type SportCategory,
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

export default function OnboardingPage() {
  const [sportName, setSportName] = useState<string>("");
  const [sportOpen, setSportOpen] = useState(false);
  const sportRef = useRef<HTMLDivElement>(null);
  const [stance, setStance] = useState<StanceType | "">("");
  const [snowStyle, setSnowStyle] = useState<SnowStyleType | "">("");
  const [skateStyle, setSkateStyle] = useState<SkateStyleType | "">("");
  const [footForward, setFootForward] = useState<FootForwardType | "">("");
  const [discipline, setDiscipline] = useState<DisciplineType | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sportRef.current && !sportRef.current.contains(e.target as Node)) {
        setSportOpen(false);
      }
    }
    if (sportOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sportOpen]);

  const selectedSport = SPORT_OPTIONS.find((s) => s.name === sportName);
  const sportCategory: SportCategory | null = selectedSport?.category ?? null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/sign-in");
        return;
      }
      supabase.from("profiles").select("account_type, sport_category").eq("id", user.id).single().then(({ data }) => {
        if (data?.account_type !== "athlete") {
          router.replace("/dashboard");
        }
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
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();
    const accountType = existingProfile?.account_type ?? "athlete";
    const payload: Record<string, unknown> = {
      id: user.id,
      account_type: accountType,
      sport_category: sportCategory,
      sport_name: sportName,
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 border-2 border-fta-black">
      <h1 className="text-3xl font-bold tracking-tight mb-2 border-b-2 border-fta-orange pb-2">
        Athlete setup
      </h1>
      <p className="text-fta-black/80 mb-6">Pick your sport and technical spec.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div ref={sportRef} className="relative">
          <label id="sport-label" className="block text-sm font-bold mb-1">
            Sport
          </label>
          <button
            type="button"
            id="sport"
            aria-haspopup="listbox"
            aria-expanded={sportOpen}
            aria-labelledby="sport-label"
            onClick={() => setSportOpen((o) => !o)}
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold text-left flex items-center justify-between rounded-none"
          >
            <span>{sportName || "—"}</span>
            <span className="text-fta-orange" aria-hidden>{sportOpen ? "▲" : "▼"}</span>
          </button>
          {sportOpen && (
            <ul
              role="listbox"
              aria-labelledby="sport-label"
              className="absolute z-10 w-full mt-0 border-2 border-t-0 border-fta-black bg-fta-paper shadow-none rounded-none"
            >
              {SPORT_OPTIONS.map((s) => (
                <li
                  key={s.name}
                  role="option"
                  aria-selected={sportName === s.name}
                  onClick={() => {
                    setSportName(s.name);
                    setStance("");
                    setSnowStyle("");
                    setSkateStyle("");
                    setFootForward("");
                    setDiscipline("");
                    setSportOpen(false);
                  }}
                  className={`px-4 py-2 border-b-2 border-fta-black last:border-b-0 font-bold cursor-pointer hover:bg-fta-orange hover:text-fta-black rounded-none ${sportName === s.name ? "bg-fta-orange text-fta-black" : "bg-fta-paper text-fta-black"}`}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Skateboard, Surf, Snowboard: Stance (Regular / Goofy) */}
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

        {/* Skateboard: Style (Street, Vert, Park, Freestyle, Downhill) */}
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

        {/* Skiing & Snowboarding: Snow style (Park/Pipe, Big Mountain, Backcountry) */}
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

        {/* BMX, MTB: Foot Forward (Left / Right) */}
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

        {/* Moto: Discipline (Freestyle, Racing, Enduro) */}
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

        {message && (
          <p className="text-sm font-medium text-red-600">{message}</p>
        )}
        <button
          type="submit"
          disabled={loading || !sportCategory || (sportUsesStance(sportName) && !stance) || (sportUsesSnowStyle(sportName) && !snowStyle) || (sportUsesSkateStyle(sportName) && !skateStyle) || (sportUsesFootForward(sportName) && !footForward) || (sportUsesDiscipline(sportName) && !discipline)}
          className="w-full px-6 py-3 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
