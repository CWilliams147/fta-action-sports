import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SPORT_OPTIONS } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const ATHLETES_LIMIT = 48;

type AthleteCard = {
  id: string;
  display_name: string | null;
  username: string | null;
  sport_name: string | null;
  avatar_url: string | null;
  daps: number;
};

async function getAthletes(
  q: string | null,
  sport: string | null,
): Promise<AthleteCard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, display_name, username, sport_name, avatar_url")
    .eq("account_type", "athlete")
    .order("display_name", { ascending: true, nullsFirst: false });

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    const pattern = `%${term.replace(/,/g, " ")}%`;
    query = query.or(
      `display_name.ilike.${pattern},username.ilike.${pattern},sport_name.ilike.${pattern},home_town.ilike.${pattern}`,
    );
  }

  if (sport && sport.trim()) {
    query = query.eq("sport_name", sport.trim());
  }

  const { data: rows } = await query.limit(ATHLETES_LIMIT);
  const list = rows ?? [];
  const ids = list.map((r: { id: string }) => r.id);

  const { data: dapsRows } = ids.length
    ? await supabase
        .from("profile_daps")
        .select("athlete_id")
        .in("athlete_id", ids)
    : { data: [] };

  const dapsByAthlete: Record<string, number> = {};
  for (const row of dapsRows ?? []) {
    const aid = (row as { athlete_id: string }).athlete_id;
    dapsByAthlete[aid] = (dapsByAthlete[aid] ?? 0) + 1;
  }

  return list.map(
    (r: {
      id: string;
      display_name: string | null;
      username: string | null;
      sport_name: string | null;
      avatar_url: string | null;
    }) => ({
      id: r.id,
      display_name: r.display_name,
      username: r.username,
      sport_name: r.sport_name,
      avatar_url: r.avatar_url,
      daps: dapsByAthlete[r.id] ?? 0,
    }),
  );
}

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string }>;
}) {
  const { q = "", sport: sportParam = "" } = await searchParams;
  const sportFilter = sportParam.trim() || null;
  const athletes = await getAthletes(q.trim() || null, sportFilter);

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10">
      <header className="w-full max-w-4xl mx-auto border-b-[3px] border-fta-black pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 inline-block uppercase">
          Athletes
        </h1>
        <p className="text-fta-black/80 mt-2 font-medium">
          Search and view athlete profiles.
        </p>
        <form
          action="/discovery"
          method="get"
          className="mt-4 flex flex-wrap gap-2 items-stretch"
        >
          <div className="flex gap-0 flex-1 min-w-0 max-w-md h-[44px]">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name"
              className="flex-1 min-w-0 h-full px-4 py-2 border-[3px] border-fta-black border-r-0 bg-fta-paper text-fta-black font-medium placeholder:text-fta-black/50"
              aria-label="Search athletes"
            />
            <button
              type="submit"
              className="h-full flex-shrink-0 px-4 py-2 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
            >
              Search
            </button>
          </div>
          <select
            name="sport"
            defaultValue={sportFilter ?? ""}
            className="h-[44px] flex-shrink-0 px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium min-w-0"
            aria-label="Filter by sport"
          >
            <option value="">All sports</option>
            {SPORT_OPTIONS.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </form>
      </header>

      <section className="w-full max-w-4xl mx-auto">
        {athletes.length === 0 ? (
          <div
            className="border-[3px] border-fta-black bg-fta-paper p-10 text-center"
            style={{ borderRadius: 8 }}
          >
            <p className="text-lg font-bold text-fta-black/80">
              No athletes found.
            </p>
            <p className="text-sm text-fta-black/60 mt-2">
              {q.trim() || sportFilter
                ? "Try a different search or sport filter."
                : "Athlete profiles will appear here once they sign up."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
            {athletes.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.username ? `/profile/${a.username}` : "#"}
                  className="block border-[3px] border-fta-black bg-fta-paper p-4 hover:border-fta-orange hover:bg-fta-black/5 transition-colors"
                  style={{ borderRadius: 8, boxShadow: "4px 4px 0 0 #000" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 border-2 border-fta-black bg-fta-paper flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ borderRadius: 8 }}
                    >
                      {a.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={a.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black text-fta-black">
                          {(a.display_name ?? "?")[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-fta-black uppercase tracking-tight truncate">
                        {a.display_name ?? "Athlete"}
                      </p>
                      {a.sport_name && (
                        <p className="text-sm font-bold text-fta-orange uppercase mt-0.5">
                          {a.sport_name}
                        </p>
                      )}
                      <p className="text-xs text-fta-black/60 mt-1">
                        {a.daps} daps
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="max-w-4xl mx-auto mt-10 text-sm text-fta-black/60 font-medium">
        FTA Action Sports · Find The Adventure
      </p>
    </main>
  );
}
