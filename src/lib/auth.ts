import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { one, query } from "./db";

export type Session =
  | { role: "admin"; name: string }
  | { role: "learner"; uid: number; cid: number; name: string; username: string };

const COOKIE = "hs_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14일

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (process.env.VERCEL) throw new Error("SESSION_SECRET 환경변수를 16자 이상으로 설정해 주세요.");
    return new TextEncoder().encode("local-dev-only-secret-please-change-me");
  }
  return new TextEncoder().encode(s);
}

export function adminPassword() {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  if (process.env.VERCEL) return null; // 배포 환경에서는 반드시 설정해야 함
  return "admin1234"; // 로컬 개발 기본값
}

export async function createSession(s: Session) {
  const token = await new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** 학습자 세션 확인 (없으면 로그인으로) — 서버 컴포넌트용 */
export async function requireLearner() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role !== "learner") redirect("/admin");
  // 계정이 삭제되었는지 확인하고 마지막 접속 시각 갱신
  const u = await one(`UPDATE users SET last_seen_at = NOW() WHERE id = $1 RETURNING id`, [s.uid]);
  if (!u) {
    redirect("/logout");
  }
  return s;
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin") redirect("/login?admin=1");
  return s;
}

/** API 라우트용: 실패 시 null */
export async function apiLearner() {
  const s = await getSession();
  return s && s.role === "learner" ? s : null;
}
export async function apiAdmin() {
  const s = await getSession();
  return s && s.role === "admin" ? s : null;
}

/** 로그인 화면용 기수 목록 (종료된 기수도 로그인은 가능, 가입만 불가) */
export async function listLoginCohorts() {
  return query<{ id: number; name: string; archived: boolean }>(
    `SELECT id, name, archived FROM cohorts ORDER BY archived ASC, id DESC`,
  );
}
