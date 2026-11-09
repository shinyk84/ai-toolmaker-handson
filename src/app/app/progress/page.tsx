"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STEPS, WEEK_PLAN, stepRange } from "@/lib/workspace";

type Log = { id?: number; week: number; done: string; next_goal: string; help_needed: string; feedback?: string };

const WEEKS = [1, 2, 3, 4];

export default function ProgressPage() {
  const [logs, setLogs] = useState<Record<number, Log>>({});
  const [week, setWeek] = useState(1);
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((j) => {
        const m: Record<number, Log> = {};
        for (const l of j.logs ?? []) m[l.week] = l;
        setLogs(m);
        const last = Math.max(1, ...Object.keys(m).map(Number));
        setWeek(Math.min(4, m[last] ? last : 1));
        setLoaded(true);
      });
  }, []);

  const cur: Log = logs[week] ?? { week, done: "", next_goal: "", help_needed: "" };
  const set = (patch: Partial<Log>) => setLogs({ ...logs, [week]: { ...cur, ...patch } });

  const save = async () => {
    setStatus("저장 중…");
    const r = await fetch("/api/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cur) });
    setStatus(r.ok ? "✓ 저장되었습니다" : "저장 실패 — 다시 시도해 주세요");
    setTimeout(() => setStatus(""), 2500);
  };

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">진도공유</h1>
      <p className="mt-1 text-sm text-ink-2">매주 수업 마지막 10분, 이번 주 진행 · 다음 주 목표 · 도움이 필요한 점을 남겨주세요. 강사가 확인하고 피드백을 드립니다.</p>

      <div className="mt-6 flex gap-2">
        {WEEKS.map((w) => (
          <button key={w} onClick={() => setWeek(w)} className={`chip ${logs[w] ? "" : ""}`} data-on={week === w}>
            {w}주차 {logs[w]?.done ? "✓" : ""}
          </button>
        ))}
      </div>
      {(() => {
        const plan = WEEK_PLAN.find((p) => p.week === week);
        return plan ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink-2">
              {week}주차 · {plan.title}
            </span>
            <span className="text-ink-3">— 웹앱 {stepRange(plan.steps)}:</span>
            {plan.steps.map((n) => (
              <Link key={n} href={`/app/workflow?step=${n}`} className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand hover:underline">
                {n}. {STEPS[n - 1].title}
              </Link>
            ))}
          </div>
        ) : null;
      })()}

      {!loaded ? (
        <div className="mt-6 text-ink-3">불러오는 중…</div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="card space-y-5 p-5 md:p-6">
            <div>
              <label className="label">이번 주 진행 사항</label>
              <textarea
                className="input min-h-28"
                value={cur.done}
                onChange={(e) => set({ done: e.target.value })}
                placeholder={"- 주제 확정: 거래처 매출 엑셀 자동 취합기\n- 워크플로우 7단계 작성, MVP 2단계 선택"}
              />
            </div>
            <div>
              <label className="label">다음 주 목표</label>
              <textarea
                className="input min-h-24"
                value={cur.next_goal}
                onChange={(e) => set({ next_goal: e.target.value })}
                placeholder="- material에 실제 엑셀 5개 준비 → v0.1 만들기"
              />
            </div>
            <div>
              <label className="label">지원 필요 사항</label>
              <textarea
                className="input min-h-24"
                value={cur.help_needed}
                onChange={(e) => set({ help_needed: e.target.value })}
                placeholder="- 거래처마다 엑셀 양식이 달라 어떻게 맞춰야 할지 모르겠음"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btn-primary" onClick={save}>
                저장
              </button>
              <span className="text-sm text-ok">{status}</span>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold">강사 피드백 · {week}주차</h2>
              {cur.feedback ? <p className="mt-2 whitespace-pre-line text-sm">{cur.feedback}</p> : <p className="mt-2 text-sm text-ink-3">아직 피드백이 없습니다.</p>}
            </div>
            <div className="rounded-xl bg-accent-soft p-4 text-sm text-[#7a3d00]">
              <b>잘 쓰는 팁</b>
              <br />
              막힌 점은 &apos;무엇을 하려다 → 어떤 화면/오류가 나왔고 → 무엇을 시도했는지&apos;로 쓰면 훨씬 정확한 도움을 받을 수 있어요.
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
