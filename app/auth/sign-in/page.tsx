import { redirect } from "next/navigation";

export default async function SignInAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next ? `/auth/signin?next=${encodeURIComponent(next)}` : "/auth/signin";
  redirect(target);
}
