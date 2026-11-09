import { apiAdmin } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { listMembers } from "@/lib/admin-data";
import { STEPS, selectedIdea } from "@/lib/workspace";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 기수별 전체 데이터 CSV 내보내기 (엑셀에서 열 수 있도록 UTF-8 BOM 포함) */
export async function GET(req: Request) {
  if (!(await apiAdmin())) return new Response("Forbidden", { status: 403 });
  const cohortId = Number(new URL(req.url).searchParams.get("cohort"));
  const cohort = await one<{ name: string }>(`SELECT name FROM cohorts WHERE id = $1`, [cohortId]);
  if (!cohort) return new Response("Not found", { status: 404 });
  const members = await listMembers(cohortId);
  const logs = await query<{ user_id: number; week: number; done: string; next_goal: string; help_needed: string; feedback: string }>(
    `SELECT p.* FROM progress_logs p JOIN users u ON u.id = p.user_id WHERE u.cohort_id = $1 ORDER BY p.week`,
    [cohortId],
  );
  const maxWeek = Math.max(4, ...logs.map((l) => l.week));

  const head = [
    "이름", "아이디", "소속", "가입일", "최근 접속",
    ...STEPS.map((s) => `${s.no}.${s.title}`),
    "아이디어 제목", "AS-IS", "TO-BE", "워크플로우", "도구 이름", "한 줄 소개", "형태",
    "GitHub", "배포 URL", "도입 전(분)", "도입 후(분)", "월 횟수", "월 절감(시간)", "발표 공유",
    ...Array.from({ length: maxWeek }, (_, i) => [`${i + 1}주 진행`, `${i + 1}주 다음목표`, `${i + 1}주 지원필요`, `${i + 1}주 피드백`]).flat(),
  ];
  const rows = members.map((m) => {
    const idea = selectedIdea(m.data);
    const flow = m.data.flow.filter((s) => s.text.trim()).map((s, i) => `${i + 1}. ${s.text}${s.mvp ? " ★" : ""}`).join("\n");
    const weekCols = Array.from({ length: maxWeek }, (_, i) => {
      const l = logs.find((x) => x.user_id === m.id && x.week === i + 1);
      return [l?.done ?? "", l?.next_goal ?? "", l?.help_needed ?? "", l?.feedback ?? ""];
    }).flat();
    return [
      m.display_name, m.username, m.affiliation, m.created_at?.slice(0, 10), m.last_seen_at?.slice(0, 16).replace("T", " "),
      ...m.steps.map((d) => (d ? "완료" : "")),
      idea.title, idea.asis, idea.tobe, flow, m.data.brief.toolName, m.data.brief.oneLiner, m.data.brief.form,
      m.githubUrl, m.deployUrl, m.data.build.beforeMinutes, m.data.build.afterMinutes, m.data.build.timesPerMonth, m.savedHours,
      m.shared ? "Y" : "",
      ...weekCols,
    ];
  });
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const filename = encodeURIComponent(`${cohort.name}_핸즈온_데이터_${new Date().toISOString().slice(0, 10)}.csv`);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
