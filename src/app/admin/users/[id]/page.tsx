import Link from "next/link";
import { notFound } from "next/navigation";
import { one, query } from "@/lib/db";
import { toIso } from "@/lib/http";
import { STEPS, normalizeWorkspace, savedHoursPerMonth, stepCompletion } from "@/lib/workspace";
import UserActions from "./UserActions";

const ACTOR: Record<string, string> = { ai: "AI", human: "사람", tool: "자동화" };

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const u = await one(
    `SELECT u.*, c.name AS cohort, w.data, w.shared, w.updated_at
       FROM users u JOIN cohorts c ON c.id = u.cohort_id LEFT JOIN workspaces w ON w.user_id = u.id WHERE u.id = $1`,
    [id],
  );
  if (!u) notFound();
  const w = normalizeWorkspace(u.data);
  const done = stepCompletion(w);
  const logs = await query(`SELECT week, done, next_goal, help_needed, feedback FROM progress_logs WHERE user_id = $1 ORDER BY week`, [id]);
  const assets = await query(`SELECT id, url, kind, caption, size FROM assets WHERE user_id = $1 ORDER BY id DESC`, [id]);
  const saved = savedHoursPerMonth(w);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/cohorts/${u.cohort_id}`} className="text-sm font-semibold text-ink-3 hover:text-brand">
          ← {u.cohort}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{u.display_name}</h1>
            <p className="text-sm text-ink-2">
              {u.username}
              {u.affiliation && ` · ${u.affiliation}`} · 가입 {toIso(u.created_at)?.slice(0, 10)} · 최근 수정 {toIso(u.updated_at)?.slice(0, 16).replace("T", " ") ?? "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/present/${id}`} target="_blank" className="btn btn-accent">
              ▶ 발표 보기
            </Link>
            <UserActions userId={id} cohortId={u.cohort_id} name={u.display_name} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s.no} className={`rounded-full px-3 py-1 text-xs font-semibold ${done[i] ? "bg-ok text-white" : "bg-line-2 text-ink-3"}`}>
            {s.no}. {s.title}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="1. 아이디어">
          {w.ideas.map((i) => (
            <div key={i.id} className={`rounded-xl border p-4 ${i.id === w.selectedIdeaId ? "border-brand-2 bg-brand-soft/40" : "border-line"}`}>
              <div className="font-bold">
                {i.id === w.selectedIdeaId && "★ "}
                {i.title || "(제목 없음)"}
              </div>
              <div className="mt-1 text-xs text-ink-3">
                {[i.target, i.frequency, i.minutes != null ? `${i.minutes}분` : "", i.difficulty].filter(Boolean).join(" · ")}
                {i.ai && ` · AI ICE ${i.ai.impact + i.ai.confidence + i.ai.ease}/30`}
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <p className="prose-pre">
                  <b className="text-xs text-ink-3">AS-IS</b>
                  <br />
                  {i.asis || "-"}
                </p>
                <p className="prose-pre">
                  <b className="text-xs text-brand">TO-BE</b>
                  <br />
                  {i.tobe || "-"}
                </p>
              </div>
            </div>
          ))}
        </Section>

        <Section title="2·3. 워크플로우 / MVP">
          <ol className="space-y-1.5 text-sm">
            {w.flow
              .filter((s) => s.text.trim())
              .map((s, i) => (
                <li key={s.id} className={`flex gap-2 rounded-lg px-3 py-2 ${s.mvp ? "bg-accent-soft" : "bg-canvas"}`}>
                  <b className="text-brand">{i + 1}</b>
                  <span className="flex-1">{s.text}</span>
                  <span className="shrink-0 text-xs text-ink-3">
                    {ACTOR[s.actor] ?? ""} {s.tool && `· ${s.tool}`} {s.mvp && "★"}
                  </span>
                </li>
              ))}
          </ol>
          <p className="mt-3 text-sm">
            만들 형태: <b>{w.brief.form || "-"}</b>
          </p>
        </Section>

        <Section title="4. AI 명령서">
          <dl className="grid gap-2 text-sm">
            {(
              [
                ["도구 이름", w.brief.toolName],
                ["한 줄 소개", w.brief.oneLiner],
                ["사용자", w.brief.users],
                ["입력", w.brief.inputs],
                ["출력", w.brief.outputs],
                ["규칙", w.brief.rules],
                ["완성 기준", w.brief.success],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-xs font-bold text-ink-3">{k}</dt>
                <dd className="prose-pre">{v || "-"}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="5. 제작 기록 · 성과">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              GitHub:{" "}
              {w.build.githubUrl ? (
                <a className="text-brand hover:underline" href={w.build.githubUrl} target="_blank" rel="noreferrer">
                  열기
                </a>
              ) : (
                "-"
              )}
            </div>
            <div>
              배포:{" "}
              {w.build.deployUrl ? (
                <a className="text-brand hover:underline" href={w.build.deployUrl} target="_blank" rel="noreferrer">
                  열기
                </a>
              ) : (
                "-"
              )}
            </div>
            <div>
              도입 전/후: {w.build.beforeMinutes ?? "-"}분 → {w.build.afterMinutes ?? "-"}분 (월 {w.build.timesPerMonth ?? "-"}회)
            </div>
            <div className="font-bold text-brand">월 절감 {saved != null ? `${saved}시간` : "-"}</div>
          </div>
          <ul className="mt-4 space-y-2">
            {w.build.logs.map((l) => (
              <li key={l.id} className="rounded-lg bg-canvas p-3 text-sm">
                <div className="font-semibold">
                  {l.date} · {l.title || "(제목 없음)"}
                </div>
                {l.result && <p className="mt-1 whitespace-pre-line text-ink-2">✓ {l.result}</p>}
                {l.issue && <p className="mt-1 whitespace-pre-line text-danger">⚠ {l.issue}</p>}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="진도공유">
        {logs.length === 0 ? (
          <p className="text-sm text-ink-3">작성한 진도공유가 없습니다.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {logs.map((l) => (
              <div key={l.week} className="rounded-xl border border-line p-4 text-sm">
                <div className="font-bold text-brand">{l.week}주차</div>
                <p className="mt-2 whitespace-pre-line">
                  <b className="text-xs text-ink-3">진행</b> {l.done || "-"}
                </p>
                <p className="mt-1 whitespace-pre-line">
                  <b className="text-xs text-ink-3">다음</b> {l.next_goal || "-"}
                </p>
                <p className="mt-1 whitespace-pre-line">
                  <b className="text-xs text-accent">지원</b> {l.help_needed || "-"}
                </p>
                {l.feedback && <p className="mt-2 whitespace-pre-line rounded-lg bg-brand-soft/60 p-2">💬 {l.feedback}</p>}
              </div>
            ))}
          </div>
        )}
        <Link href={`/admin/cohorts/${u.cohort_id}?tab=progress`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          피드백 작성하러 가기 →
        </Link>
      </Section>

      <Section title={`자료실 (${assets.length})`}>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {assets.map((a) => (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line" title={a.caption}>
              <div className="aspect-video bg-canvas">
                {a.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.caption} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">{a.kind === "video" ? "🎬" : a.kind === "pdf" ? "📄" : "📎"}</div>
                )}
              </div>
              <div className="truncate px-2 py-1 text-xs">{a.caption}</div>
            </a>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
