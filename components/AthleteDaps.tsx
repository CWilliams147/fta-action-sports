"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

interface AthleteDapsProps {
  athleteId: string;
  initialDapsCount: number;
  userHasDapped: boolean;
  currentUserId: string | null;
}

export function AthleteDaps({
  athleteId,
  initialDapsCount,
  userHasDapped,
  currentUserId,
}: AthleteDapsProps) {
  const pathname = usePathname();
  const [dapsCount, setDapsCount] = useState(initialDapsCount);
  const [hasDapped, setHasDapped] = useState(userHasDapped);
  const [loading, setLoading] = useState(false);

  async function handleGiveDaps() {
    if (!currentUserId) {
      const redirectTo = encodeURIComponent(pathname ?? "/discovery");
      window.location.href = `/auth/sign-in?redirectTo=${redirectTo}`;
      return;
    }
    if (currentUserId === athleteId) return; // cannot dap yourself
    if (hasDapped) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_daps")
      .insert({ voter_id: currentUserId, athlete_id: athleteId });
    setLoading(false);
    if (!error) {
      setHasDapped(true);
      setDapsCount((c) => c + 1);
    }
  }

  return (
    <div className="border-[3px] border-fta-black bg-fta-paper p-4">
      <p className="text-xs font-bold text-fta-black/70 uppercase tracking-wide mb-2">
        Reputation
      </p>
      <p className="text-2xl font-bold text-fta-orange border-b-[3px] border-fta-black pb-2 inline-block mb-4">
        Total Athlete Daps: {dapsCount}
      </p>
      <button
        type="button"
        onClick={handleGiveDaps}
        disabled={loading || hasDapped || currentUserId === athleteId}
        className={`inline-flex items-center gap-2 px-4 py-3 border-[3px] rounded-none font-bold transition-colors disabled:opacity-80 ${
          hasDapped
            ? "border-fta-black bg-fta-black text-fta-paper"
            : "border-fta-orange bg-fta-orange text-fta-black hover:bg-fta-paper hover:border-fta-black"
        }`}
      >
        {hasDapped ? (
          <>DAPPED UP</>
        ) : (
          <>
            <FistBumpIcon className="w-5 h-5" />
            GIVE DAPS
          </>
        )}
      </button>
    </div>
  );
}
