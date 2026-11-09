import { query } from "@/lib/db";
import { apiAdmin } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await apiAdmin())) return fail("관리자만 가능합니다.", 403);
  const id = Number((await params).id);
  const b = await readJson<{ name?: string; joinCode?: string; description?: string; startsOn?: string | null; endsOn?: string | null; archived?: boolean }>(req);
  if (!b) return fail("잘못된 요청입니다.");
  await query(
    `UPDATE cohorts SET
       name = COALESCE($2, name),
       join_code = COALESCE($3, join_code),
       description = COALESCE($4, description),
       starts_on = CASE WHEN $5::boolean THEN $6::date ELSE starts_on END,
       ends_on = CASE WHEN $7::boolean THEN $8::date ELSE ends_on END,
       archived = COALESCE($9::boolean, archived)
     WHERE id = $1`,
    [
      id,
      b.name?.trim() || null,
      b.joinCode?.trim() || null,
      b.description ?? null,
      b.startsOn !== undefined,
      b.startsOn || null,
      b.endsOn !== undefined,
      b.endsOn || null,
      typeof b.archived === "boolean" ? b.archived : null,
    ],
  );
  return ok();
}
