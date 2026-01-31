import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getScoutAthletes,
  getTrendingAthletes,
  type ScoutFilters,
} from "@/app/scout/actions";
import { ScoutFilters as ScoutFiltersUI } from "@/components/ScoutFilters";
import { ScoutProCard } from "@/components/ScoutProCard";
import type { TrendingAthlete } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ScoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    sport?: string;
    stance?: string;
    foot_forward?: string;
    location?: string;
    min_daps?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const filters: ScoutFilters = {
    sport_name: params.sport ?? null,
    stance: params.stance ?? null,
    foot_forward: params.foot_forward ?? null,
    location: params.location ?? null,
    min_daps: Math.max(0, parseInt(params.min_daps ?? "0", 10) || 0),
  };

  const [trending, athletes] = await Promise.all([
    getTrendingAthletes(),
    getScoutAthletes(user.id, filters),
  ]);

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10">
      <header className="w-full max-w-6xl mx-auto border-b-[3px] border-fta-black pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 inline-block">
          Scout
        </h1>
        <p className="text-fta-black/80 mt-2 font-medium">
          Brand dashboard · Filter athletes, save to watchlist.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      {trending.length > 0 && (
        <section className="w-full max-w-6xl mx-auto mb-8 border-2 border-fta-black bg-fta-paper p-4">
          <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 inline-block mb-4">
            Trending
          </h2>
          <p className="text-sm text-fta-black/70 mb-3">
            Top 3 athletes by clip daps in the last 7 days.
          </p>
          <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
            {(trending as TrendingAthlete[]).map((a, i) => (
              <li key={a.id}>
                <Link
                  href={a.username ? `/profile/${a.username}` : "#"}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none"
                >
                  <span className="text-fta-black/70 font-normal">#{i + 1}</span>
                  {a.display_name ?? "Athlete"}
                  {a.sport_name && (
                    <span className="font-normal text-fta-black/80">· {a.sport_name}</span>
                  )}
                  <span className="text-fta-black/80 font-normal">{a.clip_daps_7d} daps (7d)</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <ScoutFiltersUI />
        </aside>

        <section className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 inline-block mb-4">
            Scout Feed
          </h2>
          {athletes.length === 0 ? (
            <div className="border-2 border-fta-black bg-fta-paper p-10 text-center">
              <p className="text-lg font-bold text-fta-black/80">No athletes match your filters.</p>
              <p className="text-sm text-fta-black/60 mt-2">
                Try loosening sport, location, or min daps.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 list-none p-0 m-0">
              {athletes.map((athlete) => (
                <li key={athlete.id}>
                  <ScoutProCard athlete={athlete} brandId={user.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="max-w-6xl mx-auto mt-10 text-sm text-fta-black/60 font-medium">
        FTA Action Sports · Scout
      </p>
    </main>
  );
}
