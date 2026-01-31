"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  SPORT_OPTIONS,
  STANCE_OPTIONS,
  FOOT_FORWARD_OPTIONS,
  sportUsesStance,
  sportUsesFootForward,
} from "@/lib/types/database";

const SPORT_NAMES = SPORT_OPTIONS.map((o) => o.name);

export function ScoutFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sport = searchParams.get("sport") ?? "";
  const stance = searchParams.get("stance") ?? "";
  const footForward = searchParams.get("foot_forward") ?? "";
  const location = searchParams.get("location") ?? "";
  const minDaps = Math.max(0, parseInt(searchParams.get("min_daps") ?? "0", 10) || 0);

  const showStance = sport && sportUsesStance(sport);
  const showFootForward = sport && sportUsesFootForward(sport);

  function updateParams(updates: Record<string, string | number>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    }
    router.push(`/scout?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="border-2 border-fta-black bg-fta-paper p-4 space-y-4">
      <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 inline-block">
        Filters
      </h2>

      <div>
        <label className="block text-sm font-bold text-fta-black mb-1">Sport</label>
        <select
          value={sport}
          onChange={(e) => {
            updateParams({ sport: e.target.value, stance: "", foot_forward: "" });
          }}
          className="w-full border-2 border-fta-black bg-fta-paper px-3 py-2 font-medium text-fta-black focus:outline-none focus:ring-2 focus:ring-fta-orange"
        >
          <option value="">All sports</option>
          {SPORT_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {showStance && (
        <div>
          <label className="block text-sm font-bold text-fta-black mb-1">Stance</label>
          <select
            value={stance}
            onChange={(e) => updateParams({ stance: e.target.value })}
            className="w-full border-2 border-fta-black bg-fta-paper px-3 py-2 font-medium text-fta-black focus:outline-none focus:ring-2 focus:ring-fta-orange"
          >
            <option value="">Any</option>
            {STANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showFootForward && (
        <div>
          <label className="block text-sm font-bold text-fta-black mb-1">Foot Forward</label>
          <select
            value={footForward}
            onChange={(e) => updateParams({ foot_forward: e.target.value })}
            className="w-full border-2 border-fta-black bg-fta-paper px-3 py-2 font-medium text-fta-black focus:outline-none focus:ring-2 focus:ring-fta-orange"
          >
            <option value="">Any</option>
            {FOOT_FORWARD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-fta-black mb-1">Location (home town)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => updateParams({ location: e.target.value })}
          placeholder="e.g. Venice, CA"
          className="w-full border-2 border-fta-black bg-fta-paper px-3 py-2 font-medium text-fta-black placeholder:text-fta-black/50 focus:outline-none focus:ring-2 focus:ring-fta-orange"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-fta-black mb-1">
          Min Athlete Daps: {minDaps}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={minDaps}
          onChange={(e) => updateParams({ min_daps: parseInt(e.target.value, 10) })}
          className="w-full h-3 border-2 border-fta-black accent-[#FF5F1F]"
        />
      </div>

      <button
        type="button"
        onClick={() =>
          router.push("/scout", { scroll: false })
        }
        className="w-full px-4 py-2 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}
