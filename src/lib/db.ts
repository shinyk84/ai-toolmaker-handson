import "server-only";

/**
 * DB 어댑터
 * - DATABASE_URL 이 있으면 Neon(Postgres, Vercel Storage) 사용
 * - 없으면 로컬 개발용 내장 Postgres(PGlite, .data/pglite 폴더) 사용
 * 두 경우 모두 같은 SQL($1, $2 … 파라미터)을 씁니다.
 */

type Row = Record<string, any>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS cohorts (
     id          SERIAL PRIMARY KEY,
     name        TEXT NOT NULL,
     join_code   TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     starts_on   DATE,
     ends_on     DATE,
     archived    BOOLEAN NOT NULL DEFAULT FALSE,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS users (
     id            SERIAL PRIMARY KEY,
     cohort_id     INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
     username      TEXT NOT NULL,
     display_name  TEXT NOT NULL,
     affiliation   TEXT NOT NULL DEFAULT '',
     password_hash TEXT NOT NULL,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     last_seen_at  TIMESTAMPTZ,
     UNIQUE (cohort_id, username)
   )`,
  `CREATE TABLE IF NOT EXISTS workspaces (
     user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     data        JSONB NOT NULL DEFAULT '{}'::jsonb,
     shared      BOOLEAN NOT NULL DEFAULT FALSE,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS progress_logs (
     id          SERIAL PRIMARY KEY,
     user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     week        INTEGER NOT NULL,
     done        TEXT NOT NULL DEFAULT '',
     next_goal   TEXT NOT NULL DEFAULT '',
     help_needed TEXT NOT NULL DEFAULT '',
     feedback    TEXT NOT NULL DEFAULT '',
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (user_id, week)
   )`,
  `CREATE TABLE IF NOT EXISTS assets (
     id           SERIAL PRIMARY KEY,
     user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     url          TEXT NOT NULL,
     pathname     TEXT NOT NULL,
     kind         TEXT NOT NULL,
     content_type TEXT NOT NULL DEFAULT '',
     size         BIGINT NOT NULL DEFAULT 0,
     caption      TEXT NOT NULL DEFAULT '',
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS users_cohort_idx ON users(cohort_id)`,
  `CREATE INDEX IF NOT EXISTS assets_user_idx ON assets(user_id)`,
];

declare global {
  // 개발 서버 핫리로드 시 연결을 재사용하기 위한 전역 캐시
  // eslint-disable-next-line no-var
  var __handsonDb: Promise<Runner> | undefined;
}

async function createRunner(): Promise<Runner> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  let run: Runner;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    run = async (text, params = []) => (await sql.query(text, params as any[])) as Row[];
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        "DATABASE_URL이 설정되지 않았습니다. Vercel > Storage에서 Neon(Postgres)을 연결해 주세요.",
      );
    }
    const { PGlite } = await import("@electric-sql/pglite");
    const path = await import("node:path");
    const fs = await import("node:fs");
    const dir = path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(dir, { recursive: true });
    const db = await PGlite.create(dir);
    run = async (text, params = []) => (await db.query<Row>(text, params as any[])).rows;
  }
  for (const stmt of SCHEMA) await run(stmt);
  return run;
}

function runner(): Promise<Runner> {
  if (!globalThis.__handsonDb) {
    globalThis.__handsonDb = createRunner().catch((e) => {
      globalThis.__handsonDb = undefined;
      throw e;
    });
  }
  return globalThis.__handsonDb;
}

export async function query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const run = await runner();
  return (await run(text, params)) as T[];
}

export async function one<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
