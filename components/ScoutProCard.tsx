"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleWatchlist } from "@/app/scout/actions";
import type { ScoutAthlete } from "@/lib/types/database";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

interface ScoutProCardProps {
  athlete: ScoutAthlete;
  brandId: string;
}

export function ScoutProCard({ athlete, brandId }: ScoutProCardProps) {
  const [onWatchlist, setOnWatchlist] = useState(athlete.on_watchlist);
  const [loading, setLoading] = useState(false);

  async function handleToggleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const result = await toggleWatchlist(brandId, athlete.id);
    setLoading(false);
    if (!result.error) setOnWatchlist(result.on_watchlist);
  }

  const name = athlete.display_name ?? "Athlete";
  const sport = athlete.sport_name ?? "—";
  const daps = athlete.athlete_daps_count;
  const latestClip = athlete.latest_clip;

  return (
    <article className="border-2 border-fta-black bg-fta-paper overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-fta-black">
        {latestClip ? (
          <Link
            href={athlete.username ? `/profile/${athlete.username}` : "#"}
            className="block w-full h-full"
          >
            <video
              src={latestClip.video_url}
              poster={latestClip.thumbnail_url ?? undefined}
              muted
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
              aria-label={`Latest clip from ${name}`}
            />
          </Link>
        ) : (
          <Link
            href={athlete.username ? `/profile/${athlete.username}` : "#"}
            className="flex w-full h-full items-center justify-center text-fta-paper/50"
          >
            <span className="text-4xl" aria-hidden>▶</span>
          </Link>
        )}
        <button
          type="button"
          onClick={handleToggleWatchlist}
          disabled={loading}
          className="absolute top-2 right-2 p-2 border-2 border-fta-black bg-fta-paper text-fta-black hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-70"
          aria-label={onWatchlist ? "Remove from watchlist" : "Save to watchlist"}
          title={onWatchlist ? "Remove from watchlist" : "Save to watchlist"}
        >
          <StarIcon filled={onWatchlist} />
        </button>
      </div>
      <div className="p-3 border-t-2 border-fta-black flex-1 flex flex-col">
        <p className="font-bold text-fta-black text-sm">
          {athlete.username ? (
            <Link
              href={`/profile/${athlete.username}`}
              className="text-fta-orange hover:underline"
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
        <p className="text-xs font-medium text-fta-black/80 mt-0.5">{sport}</p>
        {athlete.home_town && (
          <p className="text-xs text-fta-black/70 mt-0.5">{athlete.home_town}</p>
        )}
        <p className="mt-auto pt-2 text-xs font-bold text-fta-orange border-t border-fta-black/20">
          {daps} athlete daps
        </p>
      </div>
    </article>
  );
}
