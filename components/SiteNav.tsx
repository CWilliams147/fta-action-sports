"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SiteNav() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <nav className="border-b-[3px] border-fta-black bg-fta-paper px-4 py-3 flex flex-wrap items-center gap-4">
      <Link
        href="/"
        className="font-bold text-fta-black border-b-2 border-fta-orange pb-0.5 hover:text-fta-orange"
      >
        FTA
      </Link>
      <Link href="/discovery" className="font-bold text-fta-black hover:text-fta-orange">
        Discovery
      </Link>
      <Link href="/creatives" className="font-bold text-fta-black hover:text-fta-orange">
        Filmer Directory
      </Link>
      <Link href="/map" className="font-bold text-fta-black hover:text-fta-orange">
        Spot Map
      </Link>
      <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-40 sm:w-56 px-3 py-1.5 border-[3px] border-fta-black bg-fta-paper text-fta-black text-sm font-medium placeholder:text-fta-black/50"
        />
        <button
          type="submit"
          className="px-3 py-1.5 border-[3px] border-fta-black bg-fta-orange text-fta-black font-bold text-sm hover:bg-fta-paper hover:border-fta-orange transition-colors"
        >
          Search
        </button>
      </form>
      <Link href="/auth/sign-in" className="font-bold text-fta-black hover:text-fta-orange">
        Sign in
      </Link>
      <Link href="/dashboard" className="font-bold text-fta-black hover:text-fta-orange">
        Dashboard
      </Link>
    </nav>
  );
}
