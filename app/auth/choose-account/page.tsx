"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChooseAccountPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace("/auth/sign-in");
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  async function handleChoose(accountType: "athlete" | "brand") {
    setLoading(accountType);
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Not signed in.");
      setLoading(null);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      account_type: accountType,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setLoading(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (accountType === "athlete") {
      router.push("/auth/onboarding");
      router.refresh();
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 border-2 border-fta-black">
      <h1 className="text-3xl font-bold tracking-tight mb-2 border-b-2 border-fta-orange pb-2">
        Choose your account
      </h1>
      <p className="text-fta-black/80 mb-8">FTA Action Sports</p>
      <div className="grid gap-4 w-full max-w-md">
        <button
          type="button"
          onClick={() => handleChoose("athlete")}
          disabled={!!loading}
          className="w-full px-6 py-6 border-2 border-fta-black bg-fta-paper text-fta-black font-bold text-lg hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-50"
        >
          {loading === "athlete" ? "…" : "Athlete"}
        </button>
        <button
          type="button"
          onClick={() => handleChoose("brand")}
          disabled={!!loading}
          className="w-full px-6 py-6 border-2 border-fta-black bg-fta-black text-fta-paper font-bold text-lg hover:bg-fta-orange hover:border-fta-orange transition-colors disabled:opacity-50"
        >
          {loading === "brand" ? "…" : "Brand"}
        </button>
      </div>
      {message && (
        <p className="mt-6 text-sm font-medium text-red-600">{message}</p>
      )}
    </main>
  );
}
