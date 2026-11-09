import Link from "next/link";
import { notFound } from "next/navigation";
import { listCohorts, listMembers } from "@/lib/admin-data";
import { query } from "@/lib/db";
import { toIso } from "@/lib/http";
import { STEPS } from "@/lib/workspace";
import CohortSettings from "./CohortSettings";
import ProgressBoard from "./ProgressBoard";

const ago = (iso: string | null) => {
  if (!iso) return "-";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}분 전`;
  if (m < 60 * 24) return `${Math.round(m / 60)}시간 전`;
  return `${Math.round(m / 1440)}일 전`;
};

export default async function CohortPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const id = Number((await params).id);
  const tab = (await searchParams).tab === "progress" ? "progress" : "members";
  const cohort = (await listCohorts()).find((c) => c.id === id);
  if (!cohort) notFound();
  const members = await listMembers(id);
  const logs = (
    await query(
      `SELECT p.id, p.user_id, p.week, p.done, p.next_goal, p.help_needed, p.feedback, p.updated_at
         FROM progress_logs p JOIN users u ON u.id = p.user_id WHERE u.cohort_id = $1 ORDER BY p.week, u.display_name`,
      [id],
    )
  ).map((l) => ({ ...l, updated_at: toIso(l.updated_at) })) as {
    id: number;
    user_id: number;
    week: number;
    done: string;
    next_goal: string;
    help_needed: string;
    feedback: string;
    updated_at: string | null;
  }[];

  const stepRate = STEPS.map((_, i) => (members.length ? Math.round((members.filter((m) => m.steps[i]).length / members.length) * 100) : 0));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-ink-3 hover:text-brand">
          ← 기수 대시보드
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {cohort.name}
              {cohort.archived && <span className="ml-2 rounded bg-canvas px-2 py-0.5 align-middle text-sm text-ink-3">종료</span>}
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              수강생 {cohort.members}명 · 입장 코드 <b className="font-mono">{cohort.join_code}</b>
              {cohort.description && ` · ${cohort.description}`}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/admin/export?cohort=${id}`} className="btn btn-ghost">
              ⬇ 엑셀(CSV) 내보내기
            </a>
            <CohortSettings cohort={cohort} />
          </div>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-bold">단계별 완료율</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {STEPS.map((s, i) => (
            <div key={s.no}>
              <div className="flex justify-between text-xs">
                <span className="font-semibold">
                  {s.no}. {s.title}
                </span>
                <span className="text-ink-3">{stepRate[i]}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-line-2">
                <div className="h-full bg-brand" style={{ width: `${stepRate[i]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <Link href={`/admin/cohorts/${id}`} className="chip" data-on={tab === "members"}>
          수강생 ({members.length})
        </Link>
        <Link href={`/admin/cohorts/${id}?tab=progress`} className="chip" data-on={tab === "progress"}>
          진도공유 · 피드백 ({logs.length})
        </Link>
      </div>

      {tab === "members" ? (
        members.length === 0 ? (
          <div className="card p-10 text-center text-ink-3">
            아직 가입한 수강생이 없습니다. 수강생에게 사이트 주소와 입장 코드 <b className="font-mono">{cohort.join_code}</b>를 안내하세요.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-3">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-3 py-3">주제 / 도구</th>
                  <th className="px-3 py-3">6단계 진행</th>
                  <th className="px-3 py-3">진도공유</th>
                  <th className="px-3 py-3">배포</th>
                  <th className="px-3 py-3 text-right">월 절감</th>
                  <th className="px-3 py-3 text-right">파일</th>
                  <th className="px-4 py-3 text-right">최근 접속</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line-2 align-top last:border-0 hover:bg-canvas">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${m.id}`} className="font-bold text-brand hover:underline">
                        {m.display_name}
                      </Link>
                      <div className="text-xs text-ink-3">
                        {m.username}
                        {m.affiliation && ` · ${m.affiliation}`}
                      </div>
                    </td>
                    <td className="max-w-[260px] px-3 py-3">
                      <div className="line-clamp-1 font-semibold">{m.toolName || m.ideaTitle || <span className="text-ink-3">미정</span>}</div>
                      {m.form && <div className="text-xs text-ink-3">{m.form}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {m.steps.map((d, i) => (
                          <span
                            key={i}
                            title={STEPS[i].title}
                            className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold ${d ? "bg-ok text-white" : "bg-line-2 text-ink-3"}`}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">{m.progressWeeks.length ? m.progressWeeks.map((w) => `${w}주`).join(" ") : "-"}</td>
                    <td className="px-3 py-3 text-xs">
                      {m.deployUrl ? (
                        <a href={m.deployUrl} target="_blank" rel="noreferrer" className="font-semibold text-ok hover:underline">
                          열기 ↗
                        </a>
                      ) : (
                        "-"
                      )}
                      {m.shared && <div className="text-brand">발표 공유</div>}
                    </td>
                    <td className="px-3 py-3 text-right">{m.savedHours != null ? `${m.savedHours}h` : "-"}</td>
                    <td className="px-3 py-3 text-right">{m.assets}</td>
                    <td className="px-4 py-3 text-right text-xs text-ink-3">{ago(m.last_seen_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <ProgressBoard logs={logs} members={members.map((m) => ({ id: m.id, name: m.display_name }))} />
      )}
    </div>
  );
}
