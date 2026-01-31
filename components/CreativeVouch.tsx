"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CreativeVouchProps {
  creativeId: string;
  initialVouchesCount: number;
  userHasVouched: boolean;
  currentUserId: string | null;
}

export function CreativeVouch({
  creativeId,
  initialVouchesCount,
  userHasVouched,
  currentUserId,
}: CreativeVouchProps) {
  const pathname = usePathname();
  const [vouchesCount, setVouchesCount] = useState(initialVouchesCount);
  const [hasVouched, setHasVouched] = useState(userHasVouched);
  const [loading, setLoading] = useState(false);

  async function handleVouch() {
    if (!currentUserId) {
      const redirectTo = encodeURIComponent(pathname ?? "/creatives");
      window.location.href = `/auth/sign-in?redirectTo=${redirectTo}`;
      return;
    }
    if (currentUserId === creativeId) return;
    setLoading(true);
    const supabase = createClient();
    if (hasVouched) {
      const { error } = await supabase
        .from("creative_vouches")
        .delete()
        .eq("voter_id", currentUserId)
        .eq("creative_id", creativeId);
      setLoading(false);
      if (!error) {
        setHasVouched(false);
        setVouchesCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase
        .from("creative_vouches")
        .insert({ voter_id: currentUserId, creative_id: creativeId });
      setLoading(false);
      if (!error) {
        setHasVouched(true);
        setVouchesCount((c) => c + 1);
      }
    }
  }

  return (
    <div className="border-[3px] border-fta-black bg-fta-paper p-4">
      <p className="text-xs font-bold text-fta-black/70 uppercase tracking-wide mb-2">
        Vouches
      </p>
      <p className="text-2xl font-bold text-fta-orange border-b-[3px] border-fta-black pb-2 inline-block mb-4">
        {vouchesCount} {vouchesCount === 1 ? "vouch" : "vouches"}
      </p>
      <button
        type="button"
        onClick={handleVouch}
        disabled={loading || currentUserId === creativeId}
        className={`inline-flex items-center gap-2 px-4 py-3 border-[3px] rounded-none font-bold transition-colors disabled:opacity-80 ${
          hasVouched
            ? "border-fta-black bg-fta-black text-fta-paper"
            : "border-fta-orange bg-fta-orange text-fta-black hover:bg-fta-paper hover:border-fta-black"
        }`}
      >
        {hasVouched ? "VOUCHED" : "VOUCH FOR THIS FILMER"}
      </button>
    </div>
  );
}
