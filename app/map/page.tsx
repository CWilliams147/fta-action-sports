import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MembershipTier } from "@/lib/types/database";

const SpotMapClient = dynamic(() => import("./SpotMapClient"), { ssr: false });

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/map");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_tier, ghost_mode")
    .eq("id", user.id)
    .single();

  const viewerTier: MembershipTier = (profile?.membership_tier as MembershipTier) ?? "free";
  const viewerGhostMode = profile?.ghost_mode ?? false;

  return (
    <SpotMapClient
      currentUserId={user.id}
      viewerTier={viewerTier}
      viewerGhostMode={viewerGhostMode}
    />
  );
}
