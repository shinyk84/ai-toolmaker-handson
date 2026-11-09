import { one, query } from "@/lib/db";
import { apiLearner } from "@/lib/auth";
import { fail, ok, readJson, toIso } from "@/lib/http";
import { normalizeWorkspace } from "@/lib/workspace";

export async function GET() {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const row = await one<{ data: unknown; shared: boolean; updated_at: unknown }>(
    `SELECT data, shared, updated_at FROM workspaces WHERE user_id = $1`,
    [s.uid],
  );
  return ok({ data: normalizeWorkspace(row?.data), shared: row?.shared ?? false, updatedAt: toIso(row?.updated_at) });
}

export async function PUT(req: Request) {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const body = await readJson<{ data?: unknown; shared?: boolean }>(req);
  if (!body) return fail("잘못된 요청입니다.");
  const json = body.data !== undefined ? JSON.stringify(normalizeWorkspace(body.data)) : null;
  if (json && json.length > 900_000) return fail("저장 데이터가 너무 큽니다. 긴 글은 파일로 올려 주세요.", 413);
  const rows = await query<{ updated_at: unknown }>(
    `INSERT INTO workspaces (user_id, data, shared, updated_at)
       VALUES ($1, COALESCE($2::jsonb, '{}'::jsonb), COALESCE($3::boolean, FALSE), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       data = COALESCE($2::jsonb, workspaces.data),
       shared = COALESCE($3::boolean, workspaces.shared),
       updated_at = NOW()
     RETURNING updated_at`,
    [s.uid, json, typeof body.shared === "boolean" ? body.shared : null],
  );
  return ok({ updatedAt: toIso(rows[0]?.updated_at) });
}
