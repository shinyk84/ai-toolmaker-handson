import Link from "next/link";
import { getSession } from "@/lib/auth";
import { STEPS } from "@/lib/workspace";
import { DECKS } from "@/content/decks";

export default async function Home() {
  const s = await getSession();
  const home = s?.role === "admin" ? "/admin" : s ? "/app" : "/login";
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href={home} className="btn btn-primary btn-sm">
          {s ? "내 워크스페이스" : "로그인 / 가입"}
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-14 pt-10 md:pt-16">
        <div className="mb-4 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">4주 핸즈온 · 비개발자 대상</div>
        <h1 className="text-[34px] font-black leading-[1.2] tracking-[-0.03em] md:text-[52px]">
          생성형 AI로
          <br />
          <span className="text-brand">나만의 도구</span>를 만듭니다
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-2">
          학업·사업·업무에서 반복되는 일을 As-is / To-be로 정리하고, 에이전트 AI와 함께 실제로 작동하는 자동화 도구를 만들어 배포하고
          발표까지 하는 과정입니다. 이 웹앱이 아이디어부터 발표 PT까지 모든 과정을 기록합니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={home} className="btn btn-primary">
            {s ? "이어서 하기 →" : "시작하기 →"}
          </Link>
          <Link href="/class" className="btn btn-ghost">
            수업 PT 보기
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="mb-4 text-sm font-bold tracking-widest text-ink-3">워크스페이스 6단계</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {STEPS.map((st) => (
            <li key={st.no} className="card p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{st.no}</div>
              <div className="mt-3 font-bold">{st.title}</div>
              <div className="text-sm text-ink-3">{st.sub}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="mb-4 text-sm font-bold tracking-widest text-ink-3">주차별 수업</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {DECKS.map((d) => (
            <Link key={d.id} href={`/class/${d.week}`} className="card group p-5 transition hover:border-brand-2">
              <div className="text-xs font-bold text-accent">{d.week}주차</div>
              <div className="mt-1 text-lg font-bold group-hover:text-brand">{d.title.replace(/^\d주차 · /, "")}</div>
              <div className="mt-1 text-sm text-ink-3">{d.subtitle}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
        </svg>
      </span>
      AI 툴메이커 핸즈온
    </Link>
  );
}
