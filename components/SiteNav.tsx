"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { BrandLogoFullLink, BRAND_LOGO_NAV_CLASS } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";

type ProfileInfo = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type SiteNavProps = {
  className?: string;
  /** Server-resolved user for initial paint (avoids flash of Sign in). */
  initialUser?: { id: string } | null;
};

export function SiteNav({ className = "", initialUser = null }: SiteNavProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [user, setUser] = useState<{ id: string } | null>(initialUser ?? null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("display_name, username, avatar_url")
          .eq("id", u.id)
          .single();
        setProfile(p ?? null);
      } else {
        setProfile(null);
      }
    }

    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      init();
    });
    return () => subscription.unsubscribe();
  }, [initialUser]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const profileHref = profile?.username ? `/profile/${profile.username}` : "/dashboard";

  return (
    <nav className={`sticky top-0 z-50 border-b-[3px] border-fta-black bg-fta-paper px-4 py-3 flex flex-wrap items-center gap-4 ${className}`}>
      <BrandLogoFullLink
        href="/"
        className="shrink-0 border-b-[3px] border-fta-orange pb-1 hover:opacity-95"
        logoClassName={BRAND_LOGO_NAV_CLASS}
      />
      <Link href="/discovery" className="font-bold text-fta-black hover:text-fta-orange">
        Athletes
      </Link>
      <Link href="/creatives" className="font-bold text-fta-black hover:text-fta-orange">
        Filmer Directory
      </Link>
      <Link href="/map" className="font-bold text-fta-black hover:text-fta-orange">
        Spot Map
      </Link>
      <div className="ml-auto flex items-stretch gap-2">
        <form onSubmit={handleSearch} className="flex h-10 w-[200px] sm:w-[240px] flex-none gap-0">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-full flex-1 min-w-0 px-3 border-[3px] border-fta-black border-r-0 bg-fta-paper text-fta-black text-sm font-bold uppercase placeholder:text-fta-black/50"
            aria-label="Search"
          />
          <button
            type="submit"
            className="h-full flex-shrink-0 px-4 border-[3px] border-fta-black bg-fta-orange text-fta-black font-black text-xs uppercase hover:bg-fta-paper hover:border-fta-orange transition-colors"
          >
            Search
          </button>
        </form>
        {user ? (
          <div ref={menuRef} className="relative h-10 w-[200px] sm:w-[240px] flex-none">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`h-full w-full flex items-center gap-2 px-3 border-[3px] border-fta-black font-black text-xs uppercase transition-colors ${
                menuOpen
                  ? "bg-fta-orange text-fta-black border-fta-orange"
                  : "bg-fta-paper text-fta-black hover:bg-fta-orange hover:border-fta-orange"
              }`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              <span className="w-6 h-6 flex-shrink-0 border-2 border-fta-black bg-fta-paper flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-fta-black font-bold text-[10px]">
                    {(profile?.display_name ?? "?")[0]}
                  </span>
                )}
              </span>
              <span className="flex-1 min-w-0 truncate text-left">
                {profile?.display_name ?? "Profile"}
              </span>
              <span className="flex-shrink-0 font-bold text-fta-orange" aria-hidden>
                {menuOpen ? "▲" : "▼"}
              </span>
            </button>
            {menuOpen && (
              <ul
                role="menu"
                className="absolute right-0 top-full mt-1 w-full min-w-[200px] border-[3px] border-fta-black bg-fta-paper z-[100] [&>li:last-child>*]:border-b-0"
                style={{ boxShadow: "4px 4px 0 0 #000" }}
                aria-label="Account"
              >
                <li role="none">
                  <Link
                    href={profileHref}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 border-b-2 border-fta-black/20 font-bold text-fta-black transition-colors hover:bg-fta-orange hover:text-fta-black active:bg-fta-orange/90"
                  >
                    Profile
                  </Link>
                </li>
                <li role="none">
                  <Link
                    href="/dashboard/profile/edit"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 border-b-2 border-fta-black/20 font-bold text-fta-black transition-colors hover:bg-fta-orange hover:text-fta-black active:bg-fta-orange/90"
                  >
                    Edit profile
                  </Link>
                </li>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 border-b-2 border-fta-black/20 font-bold text-fta-black transition-colors hover:bg-fta-orange hover:text-fta-black active:bg-fta-orange/90"
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <Link
            href="/auth/sign-in"
            className="flex h-10 w-[200px] sm:w-[240px] flex-none items-center justify-center border-[3px] border-fta-orange bg-fta-paper text-fta-black font-black text-xs uppercase hover:bg-fta-orange hover:text-fta-black transition-colors"
          >
            SIGN IN
          </Link>
        )}
      </div>
    </nav>
  );
}
