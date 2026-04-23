import { redirect } from "next/navigation";

export default async function LegacySignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next ? `/auth/sign-in?next=${encodeURIComponent(next)}` : "/auth/sign-in";
  redirect(target);
}
