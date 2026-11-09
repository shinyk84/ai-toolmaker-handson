import Sidebar from "@/components/Sidebar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "기수 대시보드", icon: "📊" },
  { href: "/class", label: "수업 PT (강사 노트)", icon: "📽", external: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <Sidebar items={NAV} title="AI 툴메이커" sub="강사 관리자" user="강사" />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
