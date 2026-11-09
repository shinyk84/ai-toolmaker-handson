"use client";

import Link from "next/link";
import { useState } from "react";

type Log = { id: number; user_id: number; week: number; done: string; next_goal: string; help_needed: string; feedback: string; updated_at: string | null };

export default function ProgressBoard({ logs, members }: { logs: Log[]; members: { id: number; name: string }[] }) {
  const weeks = Array.from(new Set([1, 2, 3, 4, ...logs.map((l) => l.week)])).sort((a, b) => a - b);
  const [week, setWeek] = useState(() => Math.max(1, ...logs.map((l) => l.week)));
  const [onlyHelp, setOnlyHelp] = useState(false);
  const name = new Map(members.map((m) => [m.id, m.name]));
  const list = logs.filter((l) => l.week === week && (!onlyHelp || l.help_needed.trim()));
  const missing = members.filter((m) => !logs.some((l) => l.week === week && l.user_id === m.id));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {weeks.map((w) => (
          <button key={w} className="chip" data-on={week === w} onClick={() => setWeek(w)}>
            {w}주차 ({logs.filter((l) => l.week === w).length})
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyHelp} onChange={(e) => setOnlyHelp(e.target.checked)} />
          지원 필요만 보기
        </label>
      </div>
      {missing.length > 0 && (
        <p className="mt-3 text-sm text-ink-3">
          미작성: {missing.map((m) => m.name).join(", ")}
        </p>
      )}
      <div className="mt-4 space-y-4">
        {list.length === 0 && <div className="card p-8 text-center text-ink-3">이 주차의 진도공유가 없습니다.</div>}
        {list.map((l) => (
          <LogCard key={l.id} log={l} name={name.get(l.user_id) ?? "?"} />
        ))}
      </div>
    </div>
  );
}

function LogCard({ log, name }: { log: Log; name: string }) {
  const [fb, setFb] = useState(log.feedback);
  const [status, setStatus] = useState("");
  const save = async () => {
    setStatus("저장 중…");
    const r = await fetch("/api/admin/feedback", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logId: log.id, feedback: fb }) });
    setStatus(r.ok ? "✓ 저장됨" : "실패");
  };
  return (
    <article className="card p-5">
      <div className="flex items-center justify-between">
        <Link href={`/admin/users/${log.user_id}`} className="font-bold text-brand hover:underline">
          {name}
        </Link>
        <span className="text-xs text-ink-3">{log.updated_at ? new Date(log.updated_at).toLocaleString("ko-KR") : ""}</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Block title="이번 주 진행" text={log.done} />
        <Block title="다음 주 목표" text={log.next_goal} />
        <Block title="지원 필요" text={log.help_needed} accent />
      </div>
      <div className="mt-4">
        <label className="label">강사 피드백</label>
        <textarea className="input min-h-20" value={fb} onChange={(e) => setFb(e.target.value)} placeholder="수강생 홈과 진도공유 화면에 표시됩니다" />
        <div className="mt-2 flex items-center gap-3">
          <button className="btn btn-primary btn-sm" onClick={save}>
            피드백 저장
          </button>
          <span className="text-sm text-ok">{status}</span>
        </div>
      </div>
    </article>
  );
}

function Block({ title, text, accent }: { title: string; text: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-sm ${accent && text.trim() ? "bg-accent-soft" : "bg-canvas"}`}>
      <div className={`mb-1 text-xs font-bold ${accent && text.trim() ? "text-accent" : "text-ink-3"}`}>{title}</div>
      <p className="whitespace-pre-line">{text || "-"}</p>
    </div>
  );
}
