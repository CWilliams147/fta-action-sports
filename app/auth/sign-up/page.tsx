import Link from "next/link";
import { SignUpForm } from "../SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-fta-paper">
      <div
        className="w-full max-w-sm border-[3px] border-fta-black bg-fta-paper p-8"
        style={{ boxShadow: "4px 4px 0 0 #000" }}
      >
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-fta-black border-b-[3px] border-fta-orange pb-2 mb-1">
          Sign up
        </h1>
        <p className="text-fta-black/80 text-sm font-bold uppercase mb-6">FTA Action Sports</p>
        <SignUpForm next={next ?? null} />
        <p className="mt-6 text-sm font-bold text-fta-black/80">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-fta-orange hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
