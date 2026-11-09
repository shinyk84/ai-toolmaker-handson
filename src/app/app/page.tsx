import Link from "next/link";
import { requireLearner } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { STEPS, WEEK_PLAN, normalizeWorkspace, savedHoursPerMonth, selectedIdea, stepCompletion, stepRange } from "@/lib/workspace";

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

  // 이번 주차: 기수 시작일 기준(없으면 아직 안 끝난 단계가 속한 주차)
  const cohort = await one<{ starts_on: unknown }>(`SELECT starts_on FROM cohorts WHERE id = $1`, [s.cid]);
  const start = cohort?.starts_on ? new Date(String(cohort.starts_on instanceof Date ? cohort.starts_on.toISOString() : cohort.starts_on)) : null;
  const byDate = start && !isNaN(start.getTime()) ? Math.floor((Date.now() - start.getTime()) / (7 * 86400000)) + 1 : null;
  const byProgress = WEEK_PLAN.find((p) => p.steps.some((n) => !done[n - 1]))?.week ?? 4;
  const thisWeek = Math.min(4, Math.max(1, byDate ?? byProgress));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-ink-3">안녕하세요, {s.name}님</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">{idea.title ? idea.title : "오늘은 어떤 일을 줄여볼까요?"}</h1>
        {w.brief.toolName && <p className="mt-1 text-ink-2">🛠 {w.brief.toolName}</p>}
      </div>

      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">주차별 할 일</h2>
            <p className="mt-0.5 text-sm text-ink-3">수업은 4주, 워크스페이스는 6단계입니다. 매주 수업에서 아래 단계를 진행합니다.</p>
          </div>
          <span className="text-sm font-bold text-brand">전체 {pct}% 완료</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-2">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {WEEK_PLAN.map((wk) => {
            const current = wk.week === thisWeek;
            return (
              <li key={wk.week} className={`flex flex-col rounded-xl border p-4 ${current ? "border-accent bg-accent-soft/60 ring-2 ring-accent/20" : "border-line"}`}>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${current ? "bg-accent text-white" : "bg-brand text-white"}`}>
                    {wk.week}주차{current ? " · 이번 주" : ""}
                  </span>
                  <Link href={`/class/${wk.week}`} target="_blank" className="text-xs font-semibold text-ink-3 hover:text-brand">
                    수업 PT ↗
                  </Link>
                </div>
                <div className="mt-2 font-bold">{wk.title}</div>
                <ul className="mt-2 space-y-1 text-xs text-ink-2">
                  {wk.todo.map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-3">
                  <div className="mb-1.5 text-[11px] font-bold text-ink-3">웹앱 {stepRange(wk.steps)}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {wk.steps.map((n) => (
                      <Link
                        key={n}
                        href={`/app/workflow?step=${n}`}
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold transition hover:border-brand-2 ${
                          done[n - 1] ? "border-ok/30 bg-ok-soft text-ok" : n - 1 === next ? "border-accent bg-white text-accent" : "border-line bg-white text-ink-2"
                        }`}
                      >
                        {done[n - 1] ? "✓ " : ""}
                        {n}. {STEPS[n - 1].title}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
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
    </div>
  );
}
