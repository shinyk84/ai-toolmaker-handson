import bcrypt from "bcryptjs";
import { one } from "@/lib/db";
import { adminPassword, createSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson<{ cohortId: number | "admin"; username: string; password: string }>(req);
  if (!body?.username || !body.password) return fail("아이디와 비밀번호를 입력해 주세요.");
  const username = body.username.trim().toLowerCase();

  if (body.cohortId === "admin") {
    const pw = adminPassword();
    if (!pw) return fail("관리자 비밀번호(ADMIN_PASSWORD)가 설정되지 않았습니다.", 500);
    if (username !== "admin" || body.password !== pw) return fail("관리자 정보가 올바르지 않습니다.", 401);
    await createSession({ role: "admin", name: "강사" });
    return ok({ redirect: "/admin" });
  }

  const user = await one<{ id: number; cohort_id: number; display_name: string; username: string; password_hash: string }>(
    `SELECT u.id, u.cohort_id, u.display_name, u.username, u.password_hash
       FROM users u JOIN cohorts c ON c.id = u.cohort_id
      WHERE u.cohort_id = $1 AND u.username = $2`,
    [Number(body.cohortId), username],
  );
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    return fail("기수, 아이디 또는 비밀번호를 확인해 주세요.", 401);
  }
  await createSession({ role: "learner", uid: user.id, cid: user.cohort_id, name: user.display_name, username: user.username });
  return ok({ redirect: "/app" });
}
