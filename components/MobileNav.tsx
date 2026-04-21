"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Icons: 24px viewBox, stroke 2.5, no fill — brutalist line style */
function IconMap() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconDiscovery() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconCreatives() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const TABS = [
  { href: "/map", label: "Map", Icon: IconMap },
  { href: "/discovery", label: "Discover", Icon: IconDiscovery },
  { href: "/creatives", label: "Creatives", Icon: IconCreatives },
  { href: "/dashboard", label: "Profile", Icon: IconProfile },
] as const;

/**
 * Mobile-only bottom tab bar. Shown for screens < md (768px).
 * Map, Discover, Creatives, Profile. Paper #F4F4F4, 3px black top border, Safety Orange active.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t-[3px] border-fta-black bg-fta-paper"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 h-14">
        {TABS.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/map" && pathname.startsWith(href + "/")) ||
            (href === "/dashboard" && (pathname.startsWith("/profile/") || pathname.startsWith("/dashboard")));

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-0 py-2 border-0 border-fta-black font-bold text-xs uppercase transition-colors touch-manipulation"
              style={{ minHeight: "44px" }}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              <span className={isActive ? "text-fta-orange" : "text-fta-black"}>
                <Icon />
              </span>
              <span className={isActive ? "text-fta-orange" : "text-fta-black"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
