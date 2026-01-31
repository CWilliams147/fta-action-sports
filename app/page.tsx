import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 border-2 border-fta-black">
      <h1 className="text-4xl font-bold tracking-tight mb-4 border-b-2 border-fta-orange pb-2">
        FTA Action Sports
      </h1>
      <p className="text-lg mb-8 text-fta-black/80">Forget the Algorithm.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/map"
          className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors"
        >
          Spot Map
        </Link>
        <Link
          href="/discovery"
          className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
        >
          Discovery
        </Link>
        <Link
          href="/creatives"
          className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
        >
          Filmer Directory
        </Link>
        <Link
          href="/auth/sign-in"
          className="px-6 py-3 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="px-6 py-3 border-2 border-fta-black bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange hover:text-fta-black transition-colors"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
