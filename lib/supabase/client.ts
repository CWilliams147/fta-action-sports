import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components (browser only).
 * Use this in components that run on the client (e.g. auth state, realtime).
 * For Server Components, Server Actions, and Route Handlers use createClient from server.ts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
