import bcrypt from "bcryptjs";
import { one } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";

export async function POST(req: Request) {
  const b = await readJson<{
    cohortId: number;
    joinCode: string;
    username: string;
    displayName: string;
    affiliation?: string;
    password: string;
  }>(req);
  if (!b) return fail("잘못된 요청입니다.");
  const username = (b.username || "").trim().toLowerCase();
  const displayName = (b.displayName || "").trim();
  if (!/^[a-z0-9._-]{3,20}$/.test(username)) return fail("아이디는 영문 소문자·숫자·._- 조합 3~20자로 만들어 주세요.");
  if (!displayName) return fail("이름을 입력해 주세요.");
  if (!b.password || b.password.length < 6) return fail("비밀번호는 6자 이상으로 해 주세요.");

  const cohort = await one<{ id: number; join_code: string; archived: boolean }>(
    `SELECT id, join_code, archived FROM cohorts WHERE id = $1`,
    [Number(b.cohortId)],
  );
  if (!cohort || cohort.archived) return fail("가입할 수 없는 기수입니다.");
  if ((b.joinCode || "").trim() !== cohort.join_code) return fail("기수 입장 코드가 올바르지 않습니다. 강사에게 확인해 주세요.", 401);

  const exists = await one(`SELECT 1 FROM users WHERE cohort_id = $1 AND username = $2`, [cohort.id, username]);
  if (exists) return fail("이미 사용 중인 아이디입니다.");

  const hash = await bcrypt.hash(b.password, 10);
  const user = await one<{ id: number }>(
    `INSERT INTO users (cohort_id, username, display_name, affiliation, password_hash)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [cohort.id, username, displayName.slice(0, 40), (b.affiliation || "").trim().slice(0, 60), hash],
  );
  await createSession({ role: "learner", uid: user!.id, cid: cohort.id, name: displayName, username });
  return ok({ redirect: "/app" });
}
