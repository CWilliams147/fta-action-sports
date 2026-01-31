import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DiscoveryClip } from "@/lib/types/database";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { DiscoverySortTabs } from "@/components/DiscoverySortTabs";

export const dynamic = "force-dynamic";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = sortParam === "top" ? "top" : "latest";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clipsRows = [] } = await supabase
    .from("clips")
    .select("*, profiles(display_name, username)")
    .order("created_at", { ascending: false });

  const { data: dapsRows = [] } = await supabase.from("daps").select("clip_id, user_id, created_at");

  const dapsCountByClip: Record<string, number> = {};
  const dapsCountLast7ByClip: Record<string, number> = {};
  const userDappedClipIds = new Set<string>();
  for (const row of dapsRows as { clip_id: string; user_id: string; created_at: string }[]) {
    dapsCountByClip[row.clip_id] = (dapsCountByClip[row.clip_id] ?? 0) + 1;
    if (row.created_at >= SEVEN_DAYS_AGO) {
      dapsCountLast7ByClip[row.clip_id] = (dapsCountLast7ByClip[row.clip_id] ?? 0) + 1;
    }
    if (user?.id && row.user_id === user.id) userDappedClipIds.add(row.clip_id);
  }

  type ClipRow = {
    id: string;
    profile_id: string;
    video_url: string;
    thumbnail_url: string | null;
    trick_name: string | null;
    location: string | null;
    spot_name: string | null;
    created_at: string;
    profiles: { display_name: string | null; username: string | null } | null;
  };

  let clips: DiscoveryClip[] = (clipsRows as ClipRow[]).map((row) => ({
    id: row.id,
    profile_id: row.profile_id,
    video_url: row.video_url,
    thumbnail_url: row.thumbnail_url,
    trick_name: row.trick_name,
    location: row.location,
    spot_name: row.spot_name,
    created_at: row.created_at,
    profiles: row.profiles,
    daps_count: dapsCountByClip[row.id] ?? 0,
    user_has_dapped: userDappedClipIds.has(row.id),
  }));

  if (sort === "top") {
    clips = [...clips].sort((a, b) => {
      const aWeek = dapsCountLast7ByClip[a.id] ?? 0;
      const bWeek = dapsCountLast7ByClip[b.id] ?? 0;
      if (bWeek !== aWeek) return bWeek - aWeek;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10">
      <header className="w-full max-w-4xl mx-auto border-b-[3px] border-fta-black pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 inline-block">
          Discovery
        </h1>
        <p className="text-fta-black/80 mt-2 font-medium">Clips from the community. Give daps.</p>
        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
          >
            FTA Home
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="px-4 py-2 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none"
            >
              Dashboard
            </Link>
          )}
        </nav>
      </header>

      <section className="w-full max-w-4xl mx-auto">
        <DiscoverySortTabs currentSort={sort} />

        {clips.length === 0 ? (
          <div className="border-[3px] border-fta-black bg-fta-paper p-10 text-center">
            <p className="text-lg font-bold text-fta-black/80">No clips yet.</p>
            <p className="text-sm text-fta-black/60 mt-2">Upload clips from your profile to see them here.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
            {clips.map((clip) => (
              <li key={clip.id}>
                <DiscoveryCard clip={clip} currentUserId={user?.id ?? null} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="max-w-4xl mx-auto mt-10 text-sm text-fta-black/60 font-medium">
        FTA Action Sports · Forget the Algorithm
      </p>
    </main>
  );
}
