import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, listLoginCohorts } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ admin?: string }> }) {
  const s = await getSession();
  if (s) redirect(s.role === "admin" ? "/admin" : "/app");
  const cohorts = await listLoginCohorts();
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-sm font-bold text-ink-3 hover:text-brand">
          ← AI 툴메이커 핸즈온
        </Link>
        <LoginForm cohorts={cohorts} adminDefault={sp.admin === "1"} />
      </div>
    </main>
  );
}
