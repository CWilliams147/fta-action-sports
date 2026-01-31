import Link from "next/link";
import { SCOUTING_STATUS_OPTIONS } from "@/lib/types/database";
import type { ScoutingStatusType } from "@/lib/types/database";

interface BrandHubProps {
  display_name: string | null;
  username: string | null;
  verified: boolean;
  scouting_status: ScoutingStatusType | null;
  bio: string | null;
  banner_url: string | null;
  email_public: string | null;
  twitter: string | null;
  youtube: string | null;
  isOwnProfile: boolean;
}

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 border-2 border-fta-orange bg-fta-orange text-fta-black text-sm font-bold shrink-0"
      title="Verified"
      aria-label="Verified"
    >
      V
    </span>
  );
}

export function BrandHub({
  display_name,
  verified,
  scouting_status,
  bio,
  banner_url,
  email_public,
  twitter,
  youtube,
  isOwnProfile,
}: BrandHubProps) {
  const name = display_name ?? "Brand";
  const scoutingOption = scouting_status
    ? SCOUTING_STATUS_OPTIONS.find((o) => o.value === scouting_status)
    : null;

  return (
    <main className="min-h-screen bg-fta-paper">
      {/* Hero banner – grayscale for brutalist aesthetic */}
      {banner_url && (
        <div className="w-full aspect-[3/1] max-h-[400px] bg-fta-black border-b-2 border-fta-black overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner_url}
            alt=""
            className="w-full h-full object-cover grayscale"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto p-6 md:p-10">
        {/* Scouting status at top – prominent for athletes */}
        {scoutingOption && (
          <div className="mb-6">
            <p className="text-xs font-bold text-fta-black/70 uppercase tracking-wide mb-2">
              Scouting status
            </p>
            <p
              className={`inline-block px-4 py-2 border-2 font-bold text-sm ${scoutingOption.buttonClass}`}
            >
              {scoutingOption.displayLabel}
            </p>
            <p className="text-sm text-fta-black/70 mt-2">
              {scoutingOption.value === "actively_scouting" &&
                "Open to sponsor-me submissions."}
              {scoutingOption.value === "monitoring" &&
                "Watching the scene; limited openings."}
              {scoutingOption.value === "roster_full" &&
                "Roster full. Check back later."}
            </p>
          </div>
        )}

        {/* Brand name + verified V badge (square box, 2px border, Safety Orange) */}
        <header className="border-b-2 border-fta-black pb-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-fta-black border-b-2 border-fta-orange pb-1 inline-block">
              {name}
            </h1>
            {verified && <VerifiedBadge />}
          </div>
        </header>

        {bio && (
          <div className="border-2 border-fta-black p-4 mb-6">
            <p className="text-sm text-fta-black/90 leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Social & contact – heavy-bordered buttons */}
        <div className="flex flex-wrap gap-3 border-t-2 border-fta-black pt-6">
          {email_public && (
            <a
              href={`mailto:${email_public}`}
              className="px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              Email
            </a>
          )}
          {twitter && (
            <a
              href={twitter.startsWith("http") ? twitter : `https://twitter.com/${twitter.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              Twitter
            </a>
          )}
          {youtube && (
            <a
              href={youtube.startsWith("http") ? youtube : `https://youtube.com/${youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              YouTube
            </a>
          )}
          {!email_public && !twitter && !youtube && (
            <p className="text-sm text-fta-black/60">No contact links added yet.</p>
          )}
        </div>

        {/* Nav */}
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/discovery"
            className="px-4 py-2 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
          >
            Discovery
          </Link>
          {isOwnProfile && (
            <Link
              href="/dashboard/profile/edit"
              className="px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              Edit Brand Hub
            </Link>
          )}
          {isOwnProfile ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
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
