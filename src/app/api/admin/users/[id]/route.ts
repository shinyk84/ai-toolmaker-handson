import bcrypt from "bcryptjs";
import { one, query } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { deleteStored } from "@/lib/storage";

/** 비밀번호 초기화 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await apiAdmin())) return fail("관리자만 가능합니다.", 403);
  const id = Number((await params).id);
  const b = await readJson<{ password: string }>(req);
  if (!b?.password || b.password.length < 6) return fail("새 비밀번호는 6자 이상이어야 합니다.");
  const row = await one(`UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id`, [await bcrypt.hash(b.password, 10), id]);
  if (!row) return fail("사용자를 찾을 수 없습니다.", 404);
  return ok();
}

/** 계정 삭제 (워크스페이스·진도·파일 함께 삭제) */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await apiAdmin())) return fail("관리자만 가능합니다.", 403);
  const id = Number((await params).id);
  const files = await query<{ url: string; pathname: string }>(`SELECT url, pathname FROM assets WHERE user_id = $1`, [id]);
  await query(`DELETE FROM users WHERE id = $1`, [id]);
  for (const f of files) {
    try {
      await deleteStored(f.url, f.pathname);
    } catch {
      /* 무시 */
    }
  }
  return ok();
}
