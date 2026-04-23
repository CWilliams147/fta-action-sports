import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CREATIVE_SPECIALTIES } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const CREATIVES_LIMIT = 48;

type CreativeCard = {
  id: string;
  display_name: string | null;
  username: string | null;
  home_town: string | null;
  avatar_url: string | null;
  specialties: string[] | null;
  day_rate: number | null;
};

async function getCreatives(
  q: string | null,
  location: string | null,
  specialty: string | null,
): Promise<CreativeCard[]> {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, username, home_town, avatar_url, specialties, day_rate",
    )
    .eq("account_type", "creative")
    .order("display_name", { ascending: true, nullsFirst: false });

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    const pattern = `%${term.replace(/,/g, " ")}%`;
    query = query.or(
      `display_name.ilike.${pattern},username.ilike.${pattern},home_town.ilike.${pattern}`,
    );
  }

  if (location && location.trim()) {
    query = query.ilike("home_town", `%${location.trim()}%`);
  }

  if (specialty && specialty.trim()) {
    query = query.contains("specialties", [specialty.trim()]);
  }

  const { data: rows } = await query.limit(CREATIVES_LIMIT);
  const list = rows ?? [];

  return list.map(
    (r: {
      id: string;
      display_name: string | null;
      username: string | null;
      home_town: string | null;
      avatar_url: string | null;
      specialties: string[] | null;
      day_rate: number | null;
    }) => ({
      id: r.id,
      display_name: r.display_name,
      username: r.username,
      home_town: r.home_town,
      avatar_url: r.avatar_url,
      specialties: r.specialties ?? null,
      day_rate: r.day_rate ?? null,
    }),
  );
}

export default async function CreativesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string; specialty?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim() || null;
  const location = (params.location ?? "").trim() || null;
  const specialty = (params.specialty ?? "").trim() || null;
  const creatives = await getCreatives(q, location, specialty);

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10">
      <header className="w-full max-w-4xl mx-auto border-b-[3px] border-fta-black pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 inline-block uppercase">
          Filmer Directory
        </h1>
        <p className="text-fta-black/80 mt-2 font-medium">
          Search and view filmer profiles.
        </p>
        <form
          action="/creatives"
          method="get"
          className="mt-4 flex flex-col md:flex-row md:flex-wrap items-stretch gap-3 md:gap-4"
        >
          <div className="flex gap-0 w-full min-w-0 h-[44px] md:flex-1 md:max-w-md">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name"
              className="flex-1 min-w-0 h-full px-4 py-2 border-[3px] border-fta-black border-r-0 bg-fta-paper text-fta-black font-medium placeholder:text-fta-black/50"
              aria-label="Search filmers"
            />
            <button
              type="submit"
              className="h-full flex-shrink-0 px-4 py-2 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
            >
              Search
            </button>
          </div>
          <input
            type="text"
            name="location"
            defaultValue={params.location ?? ""}
            placeholder="Location"
            className="h-[44px] w-full md:w-40 flex-shrink-0 px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium placeholder:text-fta-black/50"
            aria-label="Filter by location"
          />
          <select
            name="specialty"
            defaultValue={specialty ?? ""}
            className="h-[44px] w-full md:w-48 flex-shrink-0 min-w-0 px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium"
            aria-label="Filter by specialty"
          >
            <option value="">All specialties</option>
            {CREATIVE_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </form>
      </header>

      <section className="w-full max-w-4xl mx-auto">
        {creatives.length === 0 ? (
          <div
            className="border-[3px] border-fta-black bg-fta-paper p-10 text-center"
            style={{ borderRadius: 8 }}
          >
            <p className="text-lg font-bold text-fta-black/80">
              No filmers found.
            </p>
            <p className="text-sm text-fta-black/60 mt-2">
              {q || location || specialty
                ? "Try a different search or filter."
                : "Filmer profiles will appear here once they sign up."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
            {creatives.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.username ? `/profile/${c.username}` : "#"}
                  className="block border-[3px] border-fta-black bg-fta-paper p-4 hover:border-fta-orange hover:bg-fta-black/5 transition-colors"
                  style={{ borderRadius: 8, boxShadow: "4px 4px 0 0 #000" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 border-2 border-fta-black bg-fta-paper flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ borderRadius: 8 }}
                    >
                      {c.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={c.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black text-fta-black">
                          {(c.display_name ?? "?")[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-fta-black uppercase tracking-tight truncate">
                        {c.display_name ?? "Filmer"}
                      </p>
                      {c.home_town && (
                        <p className="text-sm text-fta-black/70 mt-0.5 truncate">
                          {c.home_town}
                        </p>
                      )}
                      {(c.specialties ?? []).length > 0 && (
                        <p className="text-sm font-bold text-fta-orange uppercase mt-0.5 truncate">
                          {(c.specialties ?? []).join(", ")}
                        </p>
                      )}
                      {c.day_rate != null && c.day_rate > 0 && (
                        <span className="inline-block mt-2 px-2 py-0.5 border-2 border-fta-orange bg-fta-orange text-fta-black text-[10px] font-bold uppercase">
                          Available for hire
                        </span>
                      )}
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
