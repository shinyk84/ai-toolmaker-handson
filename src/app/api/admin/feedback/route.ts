import { query } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

/** 진도공유 글에 강사 피드백 작성 */
export async function PUT(req: Request) {
  if (!(await apiAdmin())) return fail("관리자만 가능합니다.", 403);
  const b = await readJson<{ logId: number; feedback: string }>(req);
  if (!b?.logId) return fail("잘못된 요청입니다.");
  await query(`UPDATE progress_logs SET feedback = $1 WHERE id = $2`, [String(b.feedback ?? "").slice(0, 5000), b.logId]);
  return ok();
}
