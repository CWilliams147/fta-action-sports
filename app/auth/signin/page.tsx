import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "../SignInForm";
import { BrandLogoIcon } from "@/components/BrandLogo";

export default async function SignInEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/map");
  }

  return (
    <main className="min-h-screen w-full bg-fta-paper flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandLogoIcon size={140} className="h-28 w-28 md:h-36 md:w-36" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-fta-black text-balance">
          The map is the mission
        </h1>
        <p className="mt-2 mb-8 text-sm md:text-base font-bold uppercase text-fta-black/75">
          Find the Adventure
        </p>

        <div
          className="mx-auto w-full max-w-md border-[3px] border-fta-black bg-fta-paper p-8 text-left"
          style={{ boxShadow: "4px 4px 0 0 #000" }}
        >
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 mb-1">
            Sign in
          </h2>
          <p className="text-fta-black/80 text-sm font-bold uppercase mb-6">Find the Adventure</p>
          <SignInForm next={next ?? null} />
          <p className="mt-6 text-sm font-bold text-fta-black/80">
            No account?{" "}
            <Link href="/auth/sign-up" className="text-fta-orange hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
