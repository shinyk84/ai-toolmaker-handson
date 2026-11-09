import "server-only";
import { query } from "./db";
import { toIso } from "./http";
import { normalizeWorkspace, savedHoursPerMonth, selectedIdea, stepCompletion, type WorkspaceData } from "./workspace";

export type CohortRow = {
  id: number;
  name: string;
  join_code: string;
  description: string;
  starts_on: string | null;
  ends_on: string | null;
  archived: boolean;
  members: number;
  active7: number;
  shared: number;
  deployed: number;
  avgSteps: number;
};

export async function listCohorts(): Promise<CohortRow[]> {
  const cohorts = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.cohort_id = c.id)::int AS members,
            (SELECT COUNT(*) FROM users u WHERE u.cohort_id = c.id AND u.last_seen_at > NOW() - INTERVAL '7 days')::int AS active7
       FROM cohorts c ORDER BY c.id DESC`,
  );
  const ws = await query<{ cohort_id: number; data: unknown; shared: boolean }>(
    `SELECT u.cohort_id, w.data, w.shared FROM workspaces w JOIN users u ON u.id = w.user_id`,
  );
  return cohorts.map((c) => {
    const mine = ws.filter((w) => w.cohort_id === c.id).map((w) => ({ d: normalizeWorkspace(w.data), shared: w.shared }));
    const steps = mine.map((m) => stepCompletion(m.d).filter(Boolean).length);
    return {
      id: c.id,
      name: c.name,
      join_code: c.join_code,
      description: c.description,
      starts_on: c.starts_on ? toIso(c.starts_on)!.slice(0, 10) : null,
      ends_on: c.ends_on ? toIso(c.ends_on)!.slice(0, 10) : null,
      archived: c.archived,
      members: c.members,
      active7: c.active7,
      shared: mine.filter((m) => m.shared).length,
      deployed: mine.filter((m) => m.d.build.deployUrl.trim()).length,
      avgSteps: steps.length ? Math.round((steps.reduce((a, b) => a + b, 0) / Math.max(c.members, 1)) * 10) / 10 : 0,
    };
  });
}

export type MemberRow = {
  id: number;
  username: string;
  display_name: string;
  affiliation: string;
  created_at: string | null;
  last_seen_at: string | null;
  updated_at: string | null;
  shared: boolean;
  steps: boolean[];
  ideaTitle: string;
  toolName: string;
  form: string;
  deployUrl: string;
  githubUrl: string;
  savedHours: number | null;
  progressWeeks: number[];
  assets: number;
  data: WorkspaceData;
};

export async function listMembers(cohortId: number): Promise<MemberRow[]> {
  const users = await query(
    `SELECT u.id, u.username, u.display_name, u.affiliation, u.created_at, u.last_seen_at,
            w.data, w.shared, w.updated_at,
            (SELECT COUNT(*) FROM assets a WHERE a.user_id = u.id)::int AS assets
       FROM users u LEFT JOIN workspaces w ON w.user_id = u.id
      WHERE u.cohort_id = $1 ORDER BY u.display_name`,
    [cohortId],
  );
  const logs = await query<{ user_id: number; week: number }>(
    `SELECT p.user_id, p.week FROM progress_logs p JOIN users u ON u.id = p.user_id WHERE u.cohort_id = $1`,
    [cohortId],
  );
  return users.map((u) => {
    const d = normalizeWorkspace(u.data);
    return {
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      affiliation: u.affiliation,
      created_at: toIso(u.created_at),
      last_seen_at: toIso(u.last_seen_at),
      updated_at: toIso(u.updated_at),
      shared: !!u.shared,
      steps: stepCompletion(d),
      ideaTitle: selectedIdea(d).title,
      toolName: d.brief.toolName,
      form: d.brief.form,
      deployUrl: d.build.deployUrl,
      githubUrl: d.build.githubUrl,
      savedHours: savedHoursPerMonth(d),
      progressWeeks: logs.filter((l) => l.user_id === u.id).map((l) => l.week).sort(),
      assets: u.assets,
      data: d,
    };
  });
}
