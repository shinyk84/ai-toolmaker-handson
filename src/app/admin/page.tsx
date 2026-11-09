import Link from "next/link";
import { listCohorts } from "@/lib/admin-data";
import { aiEnabled } from "@/lib/ai";
import { storageMode } from "@/lib/storage";
import NewCohort from "./NewCohort";

export default async function AdminHome() {
  const cohorts = await listCohorts();
  const active = cohorts.filter((c) => !c.archived);
  const archived = cohorts.filter((c) => c.archived);
  const total = cohorts.reduce((a, c) => a + c.members, 0);
  const dbLocal = !(process.env.DATABASE_URL || process.env.POSTGRES_URL);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">기수 대시보드</h1>
          <p className="mt-1 text-sm text-ink-2">모든 기수의 참여·진행 현황을 한눈에. 종료된 기수도 보관되어 언제든 다시 확인할 수 있습니다.</p>
        </div>
        <NewCohort />
      </div>

      {(dbLocal || storageMode() === "local" || !aiEnabled()) && (
        <div className="rounded-xl border border-warn/30 bg-[#fff8e6] p-4 text-sm text-[#7a5200]">
          <b>환경 상태</b>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {dbLocal && <li>DB: 로컬 개발용 내장 DB 사용 중 (배포 시 Vercel Storage → Neon 연결)</li>}
            {storageMode() === "local" && <li>파일: 로컬 폴더 저장 중 (배포 시 Vercel Storage → Blob 연결)</li>}
            {!aiEnabled() && <li>AI: API 키 없음 → 학습자에게 &apos;프롬프트 복사&apos; 모드로 표시됩니다 (ANTHROPIC_API_KEY 설정 시 자동 평가)</li>}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="운영 중인 기수" value={active.length} />
        <Stat label="누적 기수" value={cohorts.length} />
        <Stat label="누적 수강생" value={total} />
      </div>

      <section>
        <h2 className="mb-3 font-bold">기수별 현황</h2>
        {cohorts.length === 0 ? (
          <div className="card p-10 text-center text-ink-3">아직 기수가 없습니다. 오른쪽 위 &apos;새 기수 만들기&apos;로 시작하세요.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-3">
                  <th className="px-4 py-3">기수</th>
                  <th className="px-3 py-3">기간</th>
                  <th className="px-3 py-3">입장 코드</th>
                  <th className="px-3 py-3 text-right">수강생</th>
                  <th className="px-3 py-3 text-right">최근 7일 접속</th>
                  <th className="px-3 py-3">평균 진행 (6단계)</th>
                  <th className="px-3 py-3 text-right">배포</th>
                  <th className="px-4 py-3 text-right">발표 공유</th>
                </tr>
              </thead>
              <tbody>
                {[...active, ...archived].map((c) => (
                  <tr key={c.id} className={`border-b border-line-2 last:border-0 hover:bg-canvas ${c.archived ? "text-ink-3" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/cohorts/${c.id}`} className="font-bold text-brand hover:underline">
                        {c.name}
                      </Link>
                      {c.archived && <span className="ml-2 rounded bg-canvas px-1.5 py-0.5 text-[11px]">종료</span>}
                    </td>
                    <td className="px-3 py-3 text-xs">{c.starts_on ? `${c.starts_on} ~ ${c.ends_on ?? ""}` : "-"}</td>
                    <td className="px-3 py-3 font-mono text-xs">{c.join_code}</td>
                    <td className="px-3 py-3 text-right font-semibold">{c.members}</td>
                    <td className="px-3 py-3 text-right">{c.active7}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-line-2">
                          <div className="h-full bg-brand" style={{ width: `${(c.avgSteps / 6) * 100}%` }} />
                        </div>
                        <span className="text-xs">{c.avgSteps}/6</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{c.deployed}</td>
                    <td className="px-4 py-3 text-right">{c.shared}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink-3">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  );
}
