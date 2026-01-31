import Link from "next/link";
import { CreativeVouch } from "@/components/CreativeVouch";

interface CreativeHubProps {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  home_town: string | null;
  equipment_list: string[] | null;
  specialties: string[] | null;
  day_rate: number | null;
  youtube_portfolio: string | null;
  vimeo_portfolio: string | null;
  behance_portfolio: string | null;
  creativeId: string;
  vouchesCount: number;
  userHasVouched: boolean;
  currentUserId: string | null;
  isOwnProfile: boolean;
}

function ensureUrl(url: string | null, prefix: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("http")) return u;
  return `${prefix}${u}`;
}

export function CreativeHub({
  display_name,
  username,
  bio,
  home_town,
  equipment_list,
  specialties,
  day_rate,
  youtube_portfolio,
  vimeo_portfolio,
  behance_portfolio,
  creativeId,
  vouchesCount,
  userHasVouched,
  currentUserId,
  isOwnProfile,
}: CreativeHubProps) {
  const name = display_name ?? "Creative";
  const equipment = equipment_list ?? [];
  const specs = specialties ?? [];
  const hasDayRate = day_rate != null && day_rate > 0;
  const yt = ensureUrl(youtube_portfolio, "https://youtube.com/");
  const vimeo = ensureUrl(vimeo_portfolio, "https://vimeo.com/");
  const behance = ensureUrl(behance_portfolio, "https://behance.net/");

  return (
    <main className="min-h-screen bg-fta-paper">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <header className="border-b-[3px] border-fta-black pb-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-2 border-fta-orange pb-1 inline-block">
              {name}
            </h1>
            {hasDayRate && (
              <span className="inline-block px-3 py-1 border-[3px] border-fta-orange bg-fta-orange text-fta-black text-sm font-bold">
                Available for Hire
              </span>
            )}
          </div>
          {(home_town || specs.length > 0) && (
            <p className="text-sm font-bold text-fta-black/80 mt-2">
              {[home_town, specs.join(", ")].filter(Boolean).join(" · ")}
            </p>
          )}
        </header>

        {equipment.length > 0 && (
          <div className="border-[3px] border-fta-black p-4 mb-6">
            <p className="text-xs font-bold text-fta-black/70 uppercase tracking-wide mb-2">
              Equipment
            </p>
            <p className="text-sm font-bold text-fta-black">{equipment.join(", ")}</p>
          </div>
        )}

        {bio && (
          <div className="border-[3px] border-fta-black p-4 mb-6">
            <p className="text-sm text-fta-black/90 leading-relaxed">{bio}</p>
          </div>
        )}

        {hasDayRate && (
          <div className="border-[3px] border-fta-black p-4 mb-6">
            <p className="text-xs font-bold text-fta-black/70 uppercase tracking-wide mb-1">
              Day rate
            </p>
            <p className="text-lg font-bold text-fta-orange">${Number(day_rate).toLocaleString()}</p>
          </div>
        )}

        <div className="border-[3px] border-fta-black p-4 mb-6">
          <CreativeVouch
            creativeId={creativeId}
            initialVouchesCount={vouchesCount}
            userHasVouched={userHasVouched}
            currentUserId={currentUserId}
          />
        </div>

        <div className="border-[3px] border-fta-black p-4 mb-6">
          <p className="text-xs font-bold text-fta-black/70 uppercase tracking-wide mb-3">
            Portfolio
          </p>
          <div className="flex flex-wrap gap-3">
            {yt && (
              <a
                href={yt}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
              >
                YouTube
              </a>
            )}
            {vimeo && (
              <a
                href={vimeo}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
              >
                Vimeo
              </a>
            )}
            {behance && (
              <a
                href={behance}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
              >
                Behance
              </a>
            )}
            {!yt && !vimeo && !behance && (
              <p className="text-sm text-fta-black/60">No portfolio links yet.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/creatives"
            className="px-4 py-2 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
          >
            Filmer Directory
          </Link>
          {isOwnProfile && (
            <Link
              href="/dashboard/profile/edit"
              className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              Edit profile
            </Link>
          )}
          {isOwnProfile ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 border-[3px] border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              FTA Home
            </Link>
          )}
        </div>
      </div>
      <p className="max-w-3xl mx-auto px-6 pb-10 text-sm text-fta-black/60">
        FTA Action Sports · Forget the Algorithm
      </p>
    </main>
  );
}
