import { one } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function POST(req: Request) {
  if (!(await apiAdmin())) return fail("관리자만 가능합니다.", 403);
  const b = await readJson<{ name: string; joinCode: string; description?: string; startsOn?: string; endsOn?: string }>(req);
  const name = (b?.name || "").trim();
  const joinCode = (b?.joinCode || "").trim();
  if (!name) return fail("기수 이름을 입력해 주세요.");
  if (joinCode.length < 4) return fail("입장 코드는 4자 이상으로 정해 주세요.");
  const row = await one(
    `INSERT INTO cohorts (name, join_code, description, starts_on, ends_on)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name.slice(0, 60), joinCode.slice(0, 40), (b?.description || "").slice(0, 300), b?.startsOn || null, b?.endsOn || null],
  );
  return ok({ id: row!.id });
}
