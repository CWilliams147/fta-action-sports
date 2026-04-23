import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard removed: same information lives on the profile page.
 * Redirect to profile when user has a username, otherwise to map or choose-account.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/signin");
  }
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }
  redirect("/auth/choose-account");
}
