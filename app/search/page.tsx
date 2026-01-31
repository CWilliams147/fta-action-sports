import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchResults = {
  athletes: { id: string; display_name: string | null; username: string | null; sport_name: string | null; daps: number }[];
  brands: { id: string; display_name: string | null; username: string | null; verified: boolean }[];
  creatives: { id: string; display_name: string | null; username: string | null; home_town: string | null; equipment_list: string[] | null }[];
  spots: { id: string; name: string; sport: string; check_ins: number }[];
};

async function runSearch(q: string): Promise<SearchResults> {
  const supabase = await createClient();
  const term = q.trim().toLowerCase();
  if (!term) {
    return { athletes: [], brands: [], creatives: [], spots: [] };
  }

  const pattern = `%${term.replace(/,/g, " ")}%`;

  const [athletesRes, brandsRes, creativesRes, spotsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, sport_name")
      .eq("account_type", "athlete")
      .or(`display_name.ilike.${pattern},username.ilike.${pattern},sport_name.ilike.${pattern},home_town.ilike.${pattern}`)
      .limit(20),
    supabase
      .from("profiles")
      .select("id, display_name, username, verified")
      .eq("account_type", "brand")
      .or(`display_name.ilike.${pattern},username.ilike.${pattern}`)
      .limit(20),
    supabase
      .from("profiles")
      .select("id, display_name, username, home_town, equipment_list")
      .eq("account_type", "creative")
      .or(`display_name.ilike.${pattern},username.ilike.${pattern},home_town.ilike.${pattern}`)
      .limit(20),
    supabase
      .from("spots")
      .select("id, name, sport")
      .ilike("name", pattern)
      .limit(20),
  ]);

  const athleteIds = (athletesRes.data ?? []).map((r: { id: string }) => r.id);
  const { data: profileDapsRows } = athleteIds.length
    ? await supabase.from("profile_daps").select("athlete_id").in("athlete_id", athleteIds)
    : { data: [] };
  const dapsByAthlete: Record<string, number> = {};
  for (const row of profileDapsRows ?? []) {
    const aid = (row as { athlete_id: string }).athlete_id;
    dapsByAthlete[aid] = (dapsByAthlete[aid] ?? 0) + 1;
  }

  const spotIds = (spotsRes.data ?? []).map((s: { id: string }) => s.id);
  const { data: checkInRows } = spotIds.length
    ? await supabase.from("check_ins").select("spot_id").in("spot_id", spotIds)
    : { data: [] };
  const checkInsBySpot: Record<string, number> = {};
  for (const row of checkInRows ?? []) {
    const sid = (row as { spot_id: string }).spot_id;
    checkInsBySpot[sid] = (checkInsBySpot[sid] ?? 0) + 1;
  }

  const athletes = (athletesRes.data ?? []).map((r: { id: string; display_name: string | null; username: string | null; sport_name: string | null }) => ({
    id: r.id,
    display_name: r.display_name,
    username: r.username,
    sport_name: r.sport_name,
    daps: dapsByAthlete[r.id] ?? 0,
  }));

  const brands = (brandsRes.data ?? []).map((r: { id: string; display_name: string | null; username: string | null; verified: boolean }) => ({
    id: r.id,
    display_name: r.display_name,
    username: r.username,
    verified: r.verified ?? false,
  }));

  const creatives = (creativesRes.data ?? []).map((r: { id: string; display_name: string | null; username: string | null; home_town: string | null; equipment_list: string[] | null }) => ({
    id: r.id,
    display_name: r.display_name,
    username: r.username,
    home_town: r.home_town,
    equipment_list: r.equipment_list,
  }));

  const spots = (spotsRes.data ?? []).map((s: { id: string; name: string; sport: string }) => ({
    id: s.id,
    name: s.name,
    sport: s.sport,
    check_ins: checkInsBySpot[s.id] ?? 0,
  }));

  return { athletes, brands, creatives, spots };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await runSearch(q);

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10">
      <header className="w-full max-w-4xl mx-auto border-b-[3px] border-fta-black pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 inline-block">
          Search
        </h1>
        <p className="text-fta-black/80 mt-2 font-medium">
          Athletes, brands, filmers, and spots.
        </p>
        <form action="/search" method="get" className="mt-4 flex gap-2 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search…"
            className="flex-1 px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium placeholder:text-fta-black/50"
          />
          <button
            type="submit"
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
          >
            Search
          </button>
        </form>
      </header>

      <div className="w-full max-w-4xl mx-auto space-y-8">
        {!q.trim() ? (
          <p className="text-fta-black/70">Enter a query to search.</p>
        ) : (
          <>
            {results.athletes.length > 0 && (
              <section className="border-[3px] border-fta-black bg-fta-paper p-4">
                <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 mb-4">
                  Athletes
                </h2>
                <ul className="space-y-2 list-none p-0 m-0">
                  {results.athletes.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={a.username ? `/profile/${a.username}` : "#"}
                        className="flex flex-wrap items-center gap-2 py-2 border-b border-fta-black/20 last:border-0 hover:bg-fta-black/5 -mx-2 px-2"
                      >
                        <span className="font-bold text-fta-black">{a.display_name ?? "Athlete"}</span>
                        {a.sport_name && <span className="text-sm text-fta-black/80">{a.sport_name}</span>}
                        <span className="text-sm font-bold text-fta-orange">{a.daps} daps</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results.brands.length > 0 && (
              <section className="border-[3px] border-fta-black bg-fta-paper p-4">
                <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 mb-4">
                  Brands
                </h2>
                <ul className="space-y-2 list-none p-0 m-0">
                  {results.brands.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={b.username ? `/profile/${b.username}` : "#"}
                        className="flex flex-wrap items-center gap-2 py-2 border-b border-fta-black/20 last:border-0 hover:bg-fta-black/5 -mx-2 px-2"
                      >
                        <span className="font-bold text-fta-black">{b.display_name ?? "Brand"}</span>
                        {b.verified && (
                          <span className="inline-flex items-center justify-center w-6 h-6 border-2 border-fta-orange bg-fta-orange text-fta-black text-xs font-bold">
                            V
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results.creatives.length > 0 && (
              <section className="border-[3px] border-fta-black bg-fta-paper p-4">
                <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 mb-4">
                  Creatives
                </h2>
                <ul className="space-y-2 list-none p-0 m-0">
                  {results.creatives.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={c.username ? `/profile/${c.username}` : "#"}
                        className="flex flex-wrap items-center gap-2 py-2 border-b border-fta-black/20 last:border-0 hover:bg-fta-black/5 -mx-2 px-2"
                      >
                        <span className="font-bold text-fta-black">{c.display_name ?? "Creative"}</span>
                        {(c.equipment_list ?? []).length > 0 && (
                          <span className="text-sm text-fta-black/80">{(c.equipment_list ?? []).join(", ")}</span>
                        )}
                        {c.home_town && <span className="text-sm text-fta-black/70">{c.home_town}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results.spots.length > 0 && (
              <section className="border-[3px] border-fta-black bg-fta-paper p-4">
                <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 mb-4">
                  Spots
                </h2>
                <ul className="space-y-2 list-none p-0 m-0">
                  {results.spots.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/map?spot=${s.id}`}
                        className="flex flex-wrap items-center gap-2 py-2 border-b border-fta-black/20 last:border-0 hover:bg-fta-black/5 -mx-2 px-2"
                      >
                        <span className="font-bold text-fta-black">{s.name}</span>
                        <span className="text-sm font-bold text-fta-orange">{s.check_ins} check-ins</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results.athletes.length === 0 &&
              results.brands.length === 0 &&
              results.creatives.length === 0 &&
              results.spots.length === 0 && (
                <p className="text-fta-black/70">No results for &quot;{q}&quot;.</p>
              )}
          </>
        )}
      </div>

      <p className="max-w-4xl mx-auto mt-10 text-sm text-fta-black/60 font-medium">
        FTA Action Sports · Search
      </p>
    </main>
  );
}
