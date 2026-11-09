import Sidebar from "@/components/Sidebar";
import { requireLearner } from "@/lib/auth";
import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/app", label: "홈", icon: "🏠" },
  { href: "/app/workflow", label: "워크스페이스 6단계", icon: "🧭" },
  { href: "/app/progress", label: "진도공유", icon: "🗓" },
  { href: "/app/files", label: "자료실", icon: "🗂" },
  { href: "/app/gallery", label: "발표 갤러리", icon: "🎤" },
  { href: "/class", label: "수업 PT", icon: "📽", external: true },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireLearner();
  const c = await one<{ name: string }>(`SELECT name FROM cohorts WHERE id = $1`, [s.cid]);
  return (
    <div className="min-h-screen">
      <Sidebar items={NAV} title="AI 툴메이커" sub={c?.name ?? ""} user={s.name} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
