import { query } from "@/lib/db";
import { apiLearner } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function GET() {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const rows = await query(
    `SELECT id, week, done, next_goal, help_needed, feedback, updated_at FROM progress_logs WHERE user_id = $1 ORDER BY week`,
    [s.uid],
  );
  return ok({ logs: rows });
}

export async function PUT(req: Request) {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const b = await readJson<{ week: number; done: string; next_goal: string; help_needed: string }>(req);
  const week = Number(b?.week);
  if (!b || !Number.isInteger(week) || week < 1 || week > 12) return fail("주차를 확인해 주세요.");
  const cut = (v: unknown) => String(v ?? "").slice(0, 5000);
  await query(
    `INSERT INTO progress_logs (user_id, week, done, next_goal, help_needed)
       VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, week) DO UPDATE SET
       done = EXCLUDED.done, next_goal = EXCLUDED.next_goal, help_needed = EXCLUDED.help_needed, updated_at = NOW()`,
    [s.uid, week, cut(b.done), cut(b.next_goal), cut(b.help_needed)],
  );
  return ok();
}
