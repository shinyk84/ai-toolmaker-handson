import Link from "next/link";
import SlideView from "@/components/slides/SlideView";
import { requireLearner } from "@/lib/auth";
import { query } from "@/lib/db";
import { buildLearnerSlides, type AssetLite } from "@/lib/learner-deck";
import { normalizeWorkspace, savedHoursPerMonth, selectedIdea } from "@/lib/workspace";

export default async function Gallery() {
  const s = await requireLearner();
  const rows = await query<{ id: number; display_name: string; affiliation: string; data: unknown; cohort: string }>(
    `SELECT u.id, u.display_name, u.affiliation, w.data, c.name AS cohort
       FROM workspaces w JOIN users u ON u.id = w.user_id JOIN cohorts c ON c.id = u.cohort_id
      WHERE u.cohort_id = $1 AND w.shared = TRUE ORDER BY w.updated_at DESC`,
    [s.cid],
  );
  const covers = await query<AssetLite & { user_id: number }>(
    `SELECT a.id, a.url, a.kind, a.caption, a.user_id FROM assets a JOIN users u ON u.id = a.user_id WHERE u.cohort_id = $1 AND a.kind = 'image'`,
    [s.cid],
  );

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">발표 갤러리</h1>
      <p className="mt-1 text-sm text-ink-2">같은 기수 동료들이 공유한 발표입니다. 6단계에서 &apos;기수 갤러리에 공유&apos;를 켜면 내 발표도 여기에 나타납니다.</p>

      {rows.length === 0 ? (
        <div className="card mt-8 p-12 text-center text-ink-3">아직 공유된 발표가 없습니다.</div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const w = normalizeWorkspace(r.data);
            const cover = buildLearnerSlides(w, covers.filter((c) => c.user_id === r.id), r.display_name, r.cohort)[0];
            const saved = savedHoursPerMonth(w);
            return (
              <Link key={r.id} href={`/present/${r.id}`} target="_blank" className="card group overflow-hidden transition hover:border-brand-2 hover:shadow-md">
                <div className="pointer-events-none border-b border-line">
                  <SlideView slide={cover} />
                </div>
                <div className="p-4">
                  <div className="font-bold group-hover:text-brand">{w.brief.toolName || selectedIdea(w).title || "제목 없음"}</div>
                  <div className="mt-0.5 text-sm text-ink-3">
                    {r.display_name}
                    {r.affiliation && ` · ${r.affiliation}`}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {w.brief.form && <span className="rounded-full bg-canvas px-2 py-0.5">{w.brief.form}</span>}
                    {saved != null && <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">월 {saved}시간 절감</span>}
                    {w.build.deployUrl && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-ok">배포됨</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
