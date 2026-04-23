"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { MobileNav } from "@/components/MobileNav";

/** Hide navigation for all guest sessions. */
export function NavGate({
  initialUser,
  children,
}: {
  initialUser: { id: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string } | null>(initialUser ?? null);

  useEffect(() => {
    setUser(initialUser ?? null);
  }, [initialUser]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        {children}
      </div>
    );
  }

  return (
    <>
      <SiteNav initialUser={user} className="hidden md:block flex-shrink-0" />
      <div className="flex-1 min-h-0 flex flex-col overflow-auto pb-24 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </>
  );
}
