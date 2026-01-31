import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CREATIVE_SPECIALTIES } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function CreativesPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; specialty?: string }>;
}) {
  const params = await searchParams;
  const location = (params.location ?? "").trim();
  const specialty = params.specialty ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, display_name, username, home_town, equipment_list, specialties, day_rate")
    .eq("account_type", "creative")
    .order("created_at", { ascending: false });

  if (location) {
    query = query.ilike("home_town", `%${location}%`);
  }
  if (specialty) {
    query = query.contains("specialties", [specialty]);
  }

  const { data: creatives = [] } = await query;

  return (
    <main className="min-h-screen bg-fta-paper p-6 md:p-10">
      <header className="w-full max-w-5xl mx-auto border-b-[3px] border-fta-black pb-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 inline-block">
          Filmer Directory
        </h1>
        <p className="text-fta-black/80 mt-2 font-medium">
          Find filmers by location and specialty.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
          >
            FTA Home
          </Link>
          <Link
            href="/discovery"
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
          >
            Discovery
          </Link>
        </nav>
      </header>

      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">
          <div className="border-[3px] border-fta-black bg-fta-paper p-4">
            <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 mb-4">
              Filters
            </h2>
            <form method="get" action="/creatives" className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-fta-black mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={location}
                  placeholder="e.g. Los Angeles"
                  className="w-full px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-fta-black mb-1">
                  Specialty
                </label>
                <select
                  name="specialty"
                  defaultValue={specialty}
                  className="w-full px-3 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-medium"
                >
                  <option value="">All</option>
                  {CREATIVE_SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-fta-black border-b-2 border-fta-orange pb-2 mb-4">
            Creatives
          </h2>
          {creatives.length === 0 ? (
            <div className="border-[3px] border-fta-black bg-fta-paper p-10 text-center">
              <p className="text-lg font-bold text-fta-black/80">No filmers match your filters.</p>
              <p className="text-sm text-fta-black/60 mt-2">
                Try a different location or specialty.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
              {(creatives as {
                id: string;
                display_name: string | null;
                username: string | null;
                home_town: string | null;
                equipment_list: string[] | null;
                specialties: string[] | null;
                day_rate: number | null;
              }[]).map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.username ? `/profile/${c.username}` : "#"}
                    className="block border-[3px] border-fta-black bg-fta-paper p-4 hover:bg-fta-black/5 transition-colors"
                  >
                    <p className="font-bold text-fta-black text-sm">
                      {c.display_name ?? "Creative"}
                    </p>
                    {c.home_town && (
                      <p className="text-xs text-fta-black/70 mt-0.5">{c.home_town}</p>
                    )}
                    {(c.specialties ?? []).length > 0 && (
                      <p className="text-xs font-medium text-fta-black/80 mt-1">
                        {(c.specialties ?? []).join(", ")}
                      </p>
                    )}
                    {(c.equipment_list ?? []).length > 0 && (
                      <p className="text-xs text-fta-black/70 mt-1">
                        {(c.equipment_list ?? []).join(", ")}
                      </p>
                    )}
                    {c.day_rate != null && c.day_rate > 0 && (
                      <span className="inline-block mt-2 px-2 py-1 border-[3px] border-fta-orange bg-fta-orange text-fta-black text-xs font-bold">
                        Available for Hire
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="max-w-5xl mx-auto mt-10 text-sm text-fta-black/60 font-medium">
        FTA Action Sports · Filmer Directory
      </p>
    </main>
  );
}
