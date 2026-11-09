import { notFound, redirect } from "next/navigation";
import DeckPlayer from "@/components/slides/DeckPlayer";
import { getSession } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { buildLearnerSlides, type AssetLite } from "@/lib/learner-deck";
import { normalizeWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function Present({ params }: { params: Promise<{ userId: string }> }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const raw = (await params).userId;
  const userId = raw === "me" ? (s.role === "learner" ? s.uid : NaN) : Number(raw);
  if (!Number.isInteger(userId)) notFound();

  const u = await one<{ id: number; cohort_id: number; display_name: string; cohort: string; data: unknown; shared: boolean }>(
    `SELECT u.id, u.cohort_id, u.display_name, c.name AS cohort, w.data, COALESCE(w.shared, FALSE) AS shared
       FROM users u JOIN cohorts c ON c.id = u.cohort_id LEFT JOIN workspaces w ON w.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  if (!u) notFound();
  const allowed = s.role === "admin" || (s.role === "learner" && (s.uid === u.id || (s.cid === u.cohort_id && u.shared)));
  if (!allowed) notFound();

  const assets = await query<AssetLite>(`SELECT id, url, kind, caption FROM assets WHERE user_id = $1`, [u.id]);
  const slides = buildLearnerSlides(normalizeWorkspace(u.data), assets, u.display_name, u.cohort);
  const back = s.role === "admin" ? `/admin/users/${u.id}` : s.uid === u.id ? "/app/workflow?step=6" : "/app/gallery";
  return <DeckPlayer slides={slides} label={`${u.display_name} · ${u.cohort}`} backHref={back} backLabel="돌아가기" />;
}
