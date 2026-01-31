"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Check your email for the confirmation link, then you’ll choose Athlete or Brand." });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 border-2 border-fta-black">
      <h1 className="text-3xl font-bold tracking-tight mb-2 border-b-2 border-fta-orange pb-2">
        Sign up
      </h1>
      <p className="text-fta-black/80 mb-6">FTA Action Sports</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-bold mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-bold mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium"
          />
        </div>
        {message && (
          <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-fta-orange"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 border-2 border-fta-black bg-fta-black text-fta-paper font-bold hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-50"
        >
          {loading ? "Signing up…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-fta-black/80">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-bold text-fta-orange hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
