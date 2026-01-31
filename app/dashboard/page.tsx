import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) {
    redirect("/auth/choose-account");
  }
  if (profile.account_type === "athlete" && !profile.sport_category) {
    redirect("/auth/onboarding");
  }

  return (
    <main className="min-h-screen p-8 border-2 border-fta-black">
      <header className="border-b-2 border-fta-black pb-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block">
          FTA Action Sports
        </h1>
        <p className="text-fta-black/80 mt-2">
          {profile.account_type === "athlete" ? "Athlete" : "Brand"} dashboard
          {profile.account_type === "athlete" && profile.sport_name && (
            <> · {profile.sport_name}</>
          )}
          {profile.account_type === "athlete" && profile.stance && (
            <> · Stance: {profile.stance}</>
          )}
          {profile.account_type === "athlete" && profile.snow_style && (
            <> · Snow style: {profile.snow_style}</>
          )}
          {profile.account_type === "athlete" && profile.skate_style && (
            <> · Style: {profile.skate_style}</>
          )}
          {profile.account_type === "athlete" && profile.foot_forward && (
            <> · Foot forward: {profile.foot_forward}</>
          )}
          {profile.account_type === "athlete" && profile.discipline && (
            <> · Discipline: {profile.discipline}</>
          )}
        </p>
      </header>
      <p className="text-fta-black/80 mb-6">
        Signed in as {user.email}. Clip catalogs and The Vouch coming next.
      </p>
      {profile.account_type === "athlete" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/dashboard/profile/edit"
            className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none"
          >
            Edit profile
          </Link>
          {profile.username && (
            <Link
              href={`/profile/${profile.username}`}
              className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
            >
              View Pro Card
            </Link>
          )}
        </div>
      )}
      <form action="/auth/sign-out" method="POST">
        <button
          type="submit"
          className="px-6 py-3 border-2 border-fta-black bg-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
