import Link from "next/link";
import { DECKS } from "@/content/decks";
import { getSession } from "@/lib/auth";

export default async function ClassIndex() {
  const s = await getSession();
  const back = s?.role === "admin" ? "/admin" : s ? "/app" : "/";
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href={back} className="text-sm font-semibold text-ink-3 hover:text-brand">
        ← 돌아가기
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">수업 PT</h1>
      <p className="mt-1 text-ink-2">
        카드를 누르면 전체화면 발표 모드로 열립니다. 키보드 ← → 로 이동, F 전체화면, G 슬라이드 목록
        {s?.role === "admin" ? ", N 강사 노트" : ""}.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {DECKS.map((d) => (
          <Link key={d.id} href={`/class/${d.week}`} className="card group flex flex-col p-6 transition hover:border-brand-2 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">{d.week}주차</span>
              <span className="text-xs text-ink-3">{d.slides.length}장</span>
            </div>
            <h2 className="mt-3 text-xl font-bold group-hover:text-brand">{d.title.replace(/^\d주차 · /, "")}</h2>
            <p className="mt-1 text-sm text-ink-3">{d.subtitle}</p>
            <ul className="mt-4 space-y-1 text-sm text-ink-2">
              {d.goal.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  {g}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </main>
  );
}
