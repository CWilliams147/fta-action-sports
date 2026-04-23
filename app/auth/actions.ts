"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRedirectPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/map";
}

export async function signIn(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect(getRedirectPath(next));
}

export async function signUp(prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  // If session exists, user is already authenticated.
  if (data.session) {
    redirect(getRedirectPath(next));
  }

  // Fallback: sign in right away so onboarding/testing doesn't require email confirmation.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: signInError.message };
  }

  redirect(getRedirectPath(next));
}
