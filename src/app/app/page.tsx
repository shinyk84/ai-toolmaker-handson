import Link from "next/link";
import { requireLearner } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { STEPS, normalizeWorkspace, savedHoursPerMonth, selectedIdea, stepCompletion } from "@/lib/workspace";
import { DECKS } from "@/content/decks";

export default async function Dashboard() {
  const s = await requireLearner();
  const row = await one<{ data: unknown; shared: boolean }>(`SELECT data, shared FROM workspaces WHERE user_id = $1`, [s.uid]);
  const w = normalizeWorkspace(row?.data);
  const done = stepCompletion(w);
  const next = done.findIndex((d) => !d);
  const idea = selectedIdea(w);
  const saved = savedHoursPerMonth(w);
  const feedback = await query<{ week: number; feedback: string }>(
    `SELECT week, feedback FROM progress_logs WHERE user_id = $1 AND feedback <> '' ORDER BY week DESC LIMIT 2`,
    [s.uid],
  );
  const pct = Math.round((done.filter(Boolean).length / done.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-ink-3">안녕하세요, {s.name}님</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{idea.title ? idea.title : "오늘은 어떤 일을 줄여볼까요?"}</h1>
        {w.brief.toolName && <p className="mt-1 text-ink-2">🛠 {w.brief.toolName}</p>}
      </div>

      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">내 진행 상황</h2>
          <span className="text-sm font-bold text-brand">{pct}% 완료</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-2">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((st, i) => (
            <li key={st.no}>
              <Link
                href={`/app/workflow?step=${st.no}`}
                className={`block rounded-xl border p-3 transition hover:border-brand-2 ${i === next ? "border-accent bg-accent-soft" : done[i] ? "border-ok/30 bg-ok-soft/50" : "border-line"}`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className={done[i] ? "text-ok" : i === next ? "text-accent" : "text-ink-3"}>{done[i] ? "✓ 완료" : i === next ? "▶ 다음" : `${st.no}단계`}</span>
                </div>
                <div className="mt-1 font-bold">{st.title}</div>
                <div className="text-xs text-ink-3">{st.sub}</div>
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/app/workflow?step=${next === -1 ? 6 : next + 1}`} className="btn btn-primary">
            {next === -1 ? "발표 다듬기 →" : `${next + 1}단계 이어서 하기 →`}
          </Link>
          <Link href="/app/progress" className="btn btn-ghost">
            진도공유 쓰기
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="font-bold">성과</h2>
          <div className="mt-3 text-3xl font-black text-brand">{saved != null ? `월 ${saved}시간` : "—"}</div>
          <p className="mt-1 text-sm text-ink-3">{saved != null ? "절감 예상 (5단계 입력 기준)" : "5단계에서 도입 전/후 시간을 입력하세요"}</p>
          {w.build.deployUrl && (
            <a href={w.build.deployUrl} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm font-semibold text-brand hover:underline">
              🔗 {w.build.deployUrl}
            </a>
          )}
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-bold">강사 피드백</h2>
          {feedback.length ? (
            <ul className="mt-3 space-y-3">
              {feedback.map((f) => (
                <li key={f.week} className="rounded-xl bg-brand-soft/60 p-3 text-sm">
                  <div className="mb-1 text-xs font-bold text-brand">{f.week}주차</div>
                  <p className="whitespace-pre-line">{f.feedback}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-3">진도공유를 작성하면 강사 피드백이 여기에 표시됩니다.</p>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 font-bold">수업 PT</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DECKS.map((d) => (
            <Link key={d.id} href={`/class/${d.week}`} target="_blank" className="card p-4 transition hover:border-brand-2">
              <div className="text-xs font-bold text-accent">{d.week}주차</div>
              <div className="mt-1 text-sm font-bold">{d.title.replace(/^\d주차 · /, "")}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
