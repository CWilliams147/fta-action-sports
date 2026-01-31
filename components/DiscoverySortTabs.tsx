import Link from "next/link";

interface DiscoverySortTabsProps {
  currentSort: "latest" | "top";
}

/** Physical tab / heavy button filter for Discovery: Latest | Top Daps. 3px borders, Safety Orange active. */
export function DiscoverySortTabs({ currentSort }: DiscoverySortTabsProps) {
  const latestActive = currentSort === "latest";
  const topActive = currentSort === "top";

  return (
    <div className="flex gap-2 mb-6" role="tablist" aria-label="Sort discovery feed">
      <Link
        href="/discovery"
        role="tab"
        aria-selected={latestActive}
        className={`flex-1 text-center py-4 px-6 font-bold text-sm uppercase tracking-wide border-[3px] border-fta-black transition-colors rounded-none ${
          latestActive
            ? "bg-fta-orange text-fta-black border-fta-orange"
            : "bg-fta-paper text-fta-black/80 hover:bg-fta-black/5"
        }`}
      >
        Latest
      </Link>
      <Link
        href="/discovery?sort=top"
        role="tab"
        aria-selected={topActive}
        className={`flex-1 text-center py-4 px-6 font-bold text-sm uppercase tracking-wide border-[3px] border-fta-black transition-colors rounded-none ${
          topActive
            ? "bg-fta-orange text-fta-black border-fta-orange"
            : "bg-fta-paper text-fta-black/80 hover:bg-fta-black/5"
        }`}
      >
        Top Daps
      </Link>
    </div>
  );
}
