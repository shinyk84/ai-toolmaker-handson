import { one } from "@/lib/db";
import { apiLearner } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { kindOf, saveLocal, storageMode } from "@/lib/storage";

/** 로컬 개발 모드 전용 업로드 (BLOB_READ_WRITE_TOKEN 이 없을 때) */
export async function POST(req: Request) {
  if (storageMode() !== "local") return fail("로컬 업로드가 비활성화되어 있습니다.", 400);
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("파일이 없습니다.");
  const { url, pathname } = await saveLocal(file, s.uid);
  const row = await one(
    `INSERT INTO assets (user_id, url, pathname, kind, content_type, size, caption)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, url, pathname, kind, content_type, size, caption, created_at`,
    [s.uid, url, pathname, kindOf(file.type), file.type, file.size, String(form.get("caption") ?? file.name).slice(0, 200)],
  );
  return ok({ asset: row });
}
