"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signUp } from "./actions";

export function SignUpForm({ next }: { next: string | null }) {
  const [state, formAction] = useFormState(signUp, null);

  return (
    <form action={formAction} className="space-y-4">
      {next != null && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="block text-xs font-black uppercase text-fta-black mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-2.5 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold placeholder:text-fta-black/50 rounded-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-black uppercase text-fta-black mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full px-4 py-2.5 border-[3px] border-fta-black bg-fta-paper text-fta-black font-bold placeholder:text-fta-black/50 rounded-none"
        />
      </div>
      {(state?.error || state?.success) && (
        <p
          className={`text-sm font-bold ${state.error ? "text-fta-black/90" : "text-fta-orange"}`}
          role="alert"
        >
          {state.error ?? state.success}
        </p>
      )}
      <button
        type="submit"
        className="w-full px-6 py-3 border-[3px] border-fta-black bg-fta-orange text-fta-black font-black text-sm uppercase tracking-tight hover:bg-fta-paper hover:border-fta-black transition-colors rounded-none"
      >
        Sign up
      </button>
    </form>
  );
}
