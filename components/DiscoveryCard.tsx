"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { DiscoveryClip } from "@/lib/types/database";

/** Fist bump icon – geometric, brutalist */
function FistBumpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      aria-hidden
    >
      <path d="M8 12v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M8 12h2v4h4v-4h2" />
      <path d="M6 14v-1a1 1 0 0 1 1-1h1" />
      <path d="M18 14v-1a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

interface DiscoveryCardProps {
  clip: DiscoveryClip;
  currentUserId: string | null;
}

export function DiscoveryCard({ clip, currentUserId }: DiscoveryCardProps) {
  const [userHasDapped, setUserHasDapped] = useState(clip.user_has_dapped);
  const [dapsCount, setDapsCount] = useState(clip.daps_count);
  const [loading, setLoading] = useState(false);

  const athleteName = clip.profiles?.display_name ?? "Athlete";
  const athleteUsername = clip.profiles?.username ?? null;
  const location = clip.spot_name || clip.location;
  const trick = clip.trick_name ?? "Clip";

  async function handleGiveDaps() {
    if (!currentUserId) {
      window.location.href = "/auth/sign-in?redirectTo=/discovery";
      return;
    }
    if (userHasDapped) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("daps").insert({ user_id: currentUserId, clip_id: clip.id });
    setLoading(false);
    if (!error) {
      setUserHasDapped(true);
      setDapsCount((c) => c + 1);
    }
  }

  return (
    <article className="border-[3px] border-fta-black bg-fta-paper overflow-hidden rounded-none">
      <Link href={clip.video_url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-video bg-fta-black relative">
          {clip.thumbnail_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={clip.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-fta-paper/50">
              <span className="text-4xl" aria-hidden>▶</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 border-t-[3px] border-fta-black space-y-2">
        <p className="text-sm font-bold text-fta-black">
          {athleteUsername ? (
            <Link href={`/profile/${athleteUsername}`} className="text-fta-orange hover:underline">
              {athleteName}
            </Link>
          ) : (
            athleteName
          )}
        </p>
        <p className="text-sm font-bold text-fta-orange">{trick}</p>
        {location && <p className="text-xs text-fta-black/70 font-medium">{location}</p>}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleGiveDaps}
            disabled={loading || userHasDapped}
            className={`inline-flex items-center gap-2 px-4 py-2 border-[3px] rounded-none font-bold transition-colors disabled:opacity-80 ${
              userHasDapped
                ? "border-fta-black bg-fta-black text-fta-paper"
                : "border-fta-orange bg-fta-orange text-fta-black hover:bg-fta-paper hover:border-fta-black"
            }`}
          >
            {userHasDapped ? (
              <>DAPPED UP</>
            ) : (
              <>
                <FistBumpIcon className="w-4 h-4" />
                GIVE DAPS
              </>
            )}
            <span className="text-sm opacity-90">{dapsCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
