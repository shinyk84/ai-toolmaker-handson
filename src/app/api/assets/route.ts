import { one, query } from "@/lib/db";
import { apiLearner } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { deleteStored, kindOf } from "@/lib/storage";

export async function GET() {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const rows = await query(
    `SELECT id, url, pathname, kind, content_type, size, caption, created_at FROM assets WHERE user_id = $1 ORDER BY id DESC`,
    [s.uid],
  );
  return ok({ assets: rows });
}

/** Vercel Blob으로 브라우저에서 직접 올린 뒤, 파일 정보를 DB에 등록 */
export async function POST(req: Request) {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const b = await readJson<{ url: string; pathname: string; contentType: string; size: number; caption?: string }>(req);
  if (!b?.url || !b.pathname) return fail("잘못된 요청입니다.");
  // 내 폴더(u{id}/)에 올라간 Blob만 등록 허용
  if (!b.pathname.startsWith(`u${s.uid}/`)) return fail("허용되지 않은 파일 경로입니다.", 403);
  if (!/^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i.test(b.url)) return fail("허용되지 않은 파일 주소입니다.", 403);
  const row = await one(
    `INSERT INTO assets (user_id, url, pathname, kind, content_type, size, caption)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, url, pathname, kind, content_type, size, caption, created_at`,
    [s.uid, b.url, b.pathname, kindOf(b.contentType || ""), b.contentType || "", Number(b.size) || 0, (b.caption || "").slice(0, 200)],
  );
  return ok({ asset: row });
}

export async function PATCH(req: Request) {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const b = await readJson<{ id: number; caption: string }>(req);
  if (!b?.id) return fail("잘못된 요청입니다.");
  await query(`UPDATE assets SET caption = $1 WHERE id = $2 AND user_id = $3`, [String(b.caption ?? "").slice(0, 200), b.id, s.uid]);
  return ok();
}

export async function DELETE(req: Request) {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const id = Number(new URL(req.url).searchParams.get("id"));
  const row = await one<{ url: string; pathname: string }>(
    `DELETE FROM assets WHERE id = $1 AND user_id = $2 RETURNING url, pathname`,
    [id, s.uid],
  );
  if (!row) return fail("파일을 찾을 수 없습니다.", 404);
  try {
    await deleteStored(row.url, row.pathname);
  } catch {
    /* 저장소 삭제 실패는 무시 (DB 기록은 이미 삭제됨) */
  }
  return ok();
}
