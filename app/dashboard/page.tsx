import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SNOW_STYLE_OPTIONS, SKATE_STYLE_OPTIONS, DISCIPLINE_OPTIONS } from "@/lib/types/database";

function formatLabels(vals: string[] | null | undefined, opts: { value: string; label: string }[]): string {
  if (!vals?.length) return "";
  return vals.map((v) => opts.find((o) => o.value === v)?.label ?? v).join(", ");
}

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
          {profile.account_type === "athlete" ? "Athlete" : profile.account_type === "brand" ? "Brand" : "Creative"} dashboard
          {profile.account_type === "athlete" && profile.sport_name && (
            <> · {profile.sport_name}</>
          )}
          {profile.account_type === "athlete" && profile.stance && (
            <> · Stance: {profile.stance}</>
          )}
          {profile.account_type === "athlete" && profile.snow_styles?.length ? (
            <> · Snow styles: {formatLabels(profile.snow_styles as string[], SNOW_STYLE_OPTIONS)}</>
          ) : null}
          {profile.account_type === "athlete" && profile.skate_styles?.length ? (
            <> · Styles: {formatLabels(profile.skate_styles as string[], SKATE_STYLE_OPTIONS)}</>
          ) : null}
          {profile.account_type === "athlete" && profile.foot_forward && (
            <> · Foot forward: {profile.foot_forward}</>
          )}
          {profile.account_type === "athlete" && profile.disciplines?.length ? (
            <> · Disciplines: {formatLabels(profile.disciplines as string[], DISCIPLINE_OPTIONS)}</>
          ) : null}
        </p>
      </header>
      <p className="text-fta-black/80 mb-6">
        Signed in as {user.email}. Clip catalogs and The Vouch coming next.
      </p>
      {profile.account_type === "creative" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/creatives"
            className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none"
          >
            Filmer Directory
          </Link>
          <Link
            href="/dashboard/profile/edit"
            className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
          >
            Edit profile
          </Link>
          {profile.username ? (
            <Link
              href={`/profile/${profile.username}`}
              className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
            >
              My Profile
            </Link>
          ) : null}
        </div>
      )}
      {profile.account_type === "brand" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/scout"
            className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none"
          >
            Scout
          </Link>
          {profile.username ? (
            <Link
              href={`/profile/${profile.username}`}
              className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
            >
              My Profile
            </Link>
          ) : null}
          <Link
            href="/dashboard/profile/edit"
            className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
          >
            {profile.username ? "Edit Brand Hub" : "Set up Brand Hub"}
          </Link>
        </div>
      )}
      {profile.account_type === "athlete" && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/discovery"
            className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors rounded-none"
          >
            Discovery
          </Link>
          <Link
            href="/dashboard/profile/edit"
            className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors rounded-none"
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
