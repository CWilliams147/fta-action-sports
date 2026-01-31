import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Scout is brand-only. Athletes and unauthenticated users are redirected. */
export default async function ScoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?redirectTo=/scout");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();
  if (!profile || profile.account_type !== "brand") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
