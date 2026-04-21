import Link from "next/link";
import { BrandLogoFull } from "@/components/BrandLogo";
import { getSpotsWithStats } from "@/app/map/actions";
import type { SpotWithStats } from "@/lib/types/database";

export const dynamic = "force-dynamic";

/** Landing: slightly more contrasting grays for dividers */
const LANDING_CREAM = "#F5F0E8";
const LANDING_PAPER = "#E8E6E2";

/** Wavy SVG divider — full viewport width, fill + stroke for definition */
function WavyDivider({ fill = LANDING_PAPER }: { fill?: string }) {
  const waveEdge = "M0 42 Q 360 0 720 42 T 1440 42";
  const waveFill = "M0 80 L0 42 Q 360 0 720 42 T 1440 42 L 1440 80 Z";
  return (
    <div className="w-full min-w-full h-12 sm:h-16 relative -mb-px" aria-hidden>
      <svg
        viewBox="0 0 1440 80"
        className="w-full h-full block min-w-full"
        preserveAspectRatio="none"
      >
        <path fill={fill} d={waveFill} />
        <path
          d={waveEdge}
          fill="none"
          stroke="#000"
          strokeOpacity="0.24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Jagged / zigzag divider — full viewport width, fill + stroke for definition */
function JaggedDivider({
  fillAbove = LANDING_CREAM,
  fillBelow = LANDING_PAPER,
}: {
  fillAbove?: string;
  fillBelow?: string;
}) {
  const zigzagEdge =
    "M0 20 L 90 0 L 180 20 L 270 0 L 360 20 L 450 0 L 540 20 L 630 0 L 720 20 L 810 0 L 900 20 L 990 0 L 1080 20 L 1170 0 L 1260 20 L 1350 0 L 1440 20";
  const zigzagFill =
    "M0 40 L 0 20 L 90 0 L 180 20 L 270 0 L 360 20 L 450 0 L 540 20 L 630 0 L 720 20 L 810 0 L 900 20 L 990 0 L 1080 20 L 1170 0 L 1260 20 L 1350 0 L 1440 20 L 1440 40 Z";
  return (
    <div className="w-full min-w-full h-8 sm:h-10 relative" aria-hidden>
      <svg
        viewBox="0 0 1440 40"
        className="w-full h-full block min-w-full"
        preserveAspectRatio="none"
      >
        <path fill={fillBelow} d={zigzagFill} />
        <path
          d={zigzagEdge}
          fill="none"
          stroke="#000"
          strokeOpacity="0.24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Hand-drawn style: Check-in (location pin) */
function IconCheckIn() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-14 h-14 sm:w-16 sm:h-16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 4 C24 4 36 16 36 28 C36 36 30 44 24 44 C18 44 12 36 12 28 C12 16 24 4 24 4 Z" />
      <circle cx="24" cy="28" r="6" />
    </svg>
  );
}

/** Hand-drawn style: Ghost mode */
function IconGhost() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-14 h-14 sm:w-16 sm:h-16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 8 C12 8 8 18 8 28 L8 44 L16 36 L24 44 L32 36 L40 44 L40 28 C40 18 36 8 24 8 Z" />
      <circle cx="18" cy="26" r="2.5" fill="currentColor" />
      <circle cx="30" cy="26" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** Hand-drawn style: Heat map (overlapping circles) */
function IconHeatMap() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-14 h-14 sm:w-16 sm:h-16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="28" r="12" opacity="0.7" />
      <circle cx="30" cy="24" r="12" opacity="0.7" />
      <circle cx="24" cy="32" r="10" opacity="0.9" />
    </svg>
  );
}

export default async function HomePage() {
  const spotsWithStats = await getSpotsWithStats();
  const topSpots: SpotWithStats[] = [...spotsWithStats]
    .sort((a, b) => (b.weekly_avg ?? 0) - (a.weekly_avg ?? 0))
    .slice(0, 4);

  return (
    <main className="min-h-screen">
      {/* ——— Hero (no top nav for guests, so hero starts at top) ——— */}
      <section
        className="pt-8 pb-8 sm:pt-12 sm:pb-12"
        style={{ backgroundColor: LANDING_CREAM }}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <div className="flex justify-center mb-8 sm:mb-10">
            <BrandLogoFull
              className="h-28 w-auto max-w-[min(100%,580px)] sm:h-36 md:h-44 object-contain object-center mx-auto"
              priority
            />
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-fta-black"
            style={{
              textShadow:
                "4px 4px 0 rgba(0,0,0,0.15), 6px 6px 0 rgba(0,0,0,0.1)",
            }}
          >
            The map is the mission.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-fta-black/85 font-medium max-w-2xl mx-auto leading-relaxed">
            Real-time check-ins. Ghost mode for pros. Heat maps for brands. Stop
            scrolling, start riding.
          </p>
        </div>
        <WavyDivider />
      </section>

      {/* ——— Tiered Feature Grid (Unspeakable-style cards) ——— */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: LANDING_PAPER }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-fta-black text-center mb-10 sm:mb-14">
            Choose your path
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Card 1: Athlete — Safety Orange shadow */}
            <div
              className="relative border-[3px] border-fta-black bg-fta-paper p-6 sm:p-8"
              style={{ borderRadius: 8, boxShadow: "8px 8px 0 0 #FF5F1F" }}
            >
              <div className="flex justify-center text-fta-black mb-4">
                <IconCheckIn />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-fta-black mb-2">
                See the session.
              </h3>
              <p className="text-sm text-fta-black/80 font-medium mb-6">
                Check in at spots, see who&apos;s there when you&apos;re there.
                Proximity alerts and live counts. Free tier: count only until
                you check in.
              </p>
              <Link
                href="/map"
                className="inline-block px-5 py-2.5 border-[3px] border-fta-black bg-fta-orange text-fta-black font-black text-sm uppercase transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]"
                style={{ boxShadow: "4px 4px 0 0 #000" }}
              >
                Choose your path
              </Link>
            </div>

            {/* Card 2: Pro — Orange shadow */}
            <div
              className="relative border-[3px] border-fta-black bg-fta-paper p-6 sm:p-8"
              style={{ borderRadius: 8, boxShadow: "8px 8px 0 0 #FF5F1F" }}
            >
              <div className="flex justify-center text-fta-black mb-4">
                <IconGhost />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-fta-black mb-2">
                Go ghost.
              </h3>
              <p className="text-sm text-fta-black/80 font-medium mb-6">
                Pro privacy: appear in the &quot;Active now&quot; count without
                showing your name. See who&apos;s at any spot within 10 miles.
                No spot poaching.
              </p>
              <Link
                href="/map"
                className="inline-block px-5 py-2.5 border-[3px] border-fta-black bg-fta-orange text-fta-black font-black text-sm uppercase transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]"
                style={{ boxShadow: "4px 4px 0 0 #000" }}
              >
                Choose your path
              </Link>
            </div>

            {/* Card 3: Brand — Black shadow */}
            <div
              className="relative border-[3px] border-fta-black bg-fta-paper p-6 sm:p-8"
              style={{ borderRadius: 8, boxShadow: "8px 8px 0 0 #000" }}
            >
              <div className="flex justify-center text-fta-black mb-4">
                <IconHeatMap />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-fta-black mb-2">
                Own the spot.
              </h3>
              <p className="text-sm text-fta-black/80 font-medium mb-6">
                Trend overlay: 30-day heat map of check-ins. Sponsor spots, see
                full session analytics. Full visibility, no radius limits.
              </p>
              <Link
                href="/map"
                className="inline-block px-5 py-2.5 border-[3px] border-fta-black bg-fta-orange text-fta-black font-black text-sm uppercase transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]"
                style={{ boxShadow: "4px 4px 0 0 #000" }}
              >
                Choose your path
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-14 sm:mt-16">
          <JaggedDivider />
        </div>
      </section>

      {/* ——— Our Favorites (Top 4 spots by weekly avg) ——— */}
      <section
        className="py-16 sm:py-20"
        style={{ backgroundColor: LANDING_CREAM }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-fta-black text-center mb-10 sm:mb-14">
            Our favorites
          </h2>
          <p className="text-center text-fta-black/75 font-medium mb-10 max-w-xl mx-auto">
            Top spots by weekly check-ins. Hit the map to see who&apos;s there
            now.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topSpots.length > 0 ? (
              topSpots.map((spot) => (
                <Link
                  key={spot.id}
                  href="/map"
                  className="group relative block rounded-lg border-[3px] border-fta-black bg-fta-paper p-5 overflow-hidden transition-all hover:shadow-[6px_6px_0_0_#FF5F1F]"
                  style={{ boxShadow: "5px 5px 0 0 #000" }}
                >
                  {spot.heating_up && (
                    <div
                      className="absolute top-2 right-2 w-24 py-1.5 px-2 border-2 border-fta-black bg-fta-orange text-fta-black font-black text-[10px] uppercase text-center -rotate-12"
                      style={{ boxShadow: "2px 2px 0 0 #000" }}
                    >
                      Heating up
                    </div>
                  )}
                  <span className="text-xs font-bold uppercase text-fta-orange">
                    {spot.sport}
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight text-fta-black mt-1 group-hover:text-fta-orange transition-colors">
                    {spot.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-3 text-sm font-bold text-fta-black/80">
                    <span>{spot.weekly_avg} / wk avg</span>
                    <span className="text-fta-black">
                      {spot.active_now} active now
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-lg border-[3px] border-fta-black bg-fta-paper p-8 text-center text-fta-black/70 font-medium">
                No spots yet. Right-click the map to add one.
              </div>
            )}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/map"
              className="inline-block px-5 py-2.5 border-[3px] border-fta-black bg-fta-orange text-fta-black font-black text-sm uppercase hover:bg-fta-paper hover:border-fta-orange transition-colors"
              style={{ borderRadius: 8 }}
            >
              Open spot map
            </Link>
          </div>
        </div>
        <div className="mt-14 sm:mt-16">
          <WavyDivider />
        </div>
      </section>

      {/* ——— Footer strip ——— */}
      <footer
        className="py-8 border-t-[3px] border-fta-black"
        style={{ backgroundColor: LANDING_PAPER }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-bold text-fta-black uppercase text-sm">
            FTA Action Sports · Find The Adventure
          </p>
          <div className="flex gap-4">
            <Link
              href="/map"
              className="font-bold text-fta-black hover:text-fta-orange text-sm uppercase"
            >
              Map
            </Link>
            <Link
              href="/discovery"
              className="font-bold text-fta-black hover:text-fta-orange text-sm uppercase"
            >
              Athletes
            </Link>
            <Link
              href="/auth/sign-in"
              className="font-bold text-fta-black hover:text-fta-orange text-sm uppercase"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
