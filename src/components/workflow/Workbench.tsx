"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STEPS, normalizeWorkspace, stepCompletion, type WorkspaceData } from "@/lib/workspace";
import { useAssets, type UploadCtx } from "../assets";
import StepIdea from "./StepIdea";
import StepFlow from "./StepFlow";
import StepPriority from "./StepPriority";
import StepBrief from "./StepBrief";
import StepBuild from "./StepBuild";
import StepDeck from "./StepDeck";

export type StepProps = {
  data: WorkspaceData;
  update: (fn: (d: WorkspaceData) => WorkspaceData) => void;
  aiEnabled: boolean;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export default function Workbench({ aiEnabled, uploadCtx, name, cohort }: { aiEnabled: boolean; uploadCtx: UploadCtx; name: string; cohort: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const step = Math.min(6, Math.max(1, Number(sp.get("step")) || 1));
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [shared, setShared] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<WorkspaceData | null>(null);
  const assets = useAssets();

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/workspace");
      if (r.status === 401) return (location.href = "/login");
      const j = await r.json();
      setData(normalizeWorkspace(j.data));
      setShared(!!j.shared);
      setSavedAt(j.updatedAt);
    })();
  }, []);

  const flush = useCallback(async () => {
    if (!latest.current) return;
    const body = latest.current;
    latest.current = null;
    setSave("saving");
    try {
      const r = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: body }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSavedAt(j.updatedAt);
      setSave(latest.current ? "dirty" : "saved");
    } catch {
      latest.current = latest.current ?? body;
      setSave("error");
    }
  }, []);

  const update = useCallback(
    (fn: (d: WorkspaceData) => WorkspaceData) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        latest.current = next;
        return next;
      });
      setSave("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1200);
    },
    [flush],
  );

  // 페이지를 떠나기 전 저장 안 된 내용 경고
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (latest.current) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [flush]);

  const go = (n: number) => {
    if (latest.current) flush();
    router.push(`/app/workflow?step=${n}`);
    window.scrollTo({ top: 0 });
  };

  const toggleShare = async (v: boolean) => {
    setShared(v);
    await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shared: v }) });
  };

  if (!data)
    return (
      <div className="flex h-64 items-center justify-center text-ink-3">
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" /> 불러오는 중…
      </div>
    );

  const done = stepCompletion(data);
  const props: StepProps = { data, update, aiEnabled };

  return (
    <div className="pb-28">
      {/* 스테퍼 */}
      <nav className="card mb-6 overflow-x-auto">
        <ol className="flex min-w-[720px]">
          {STEPS.map((s) => {
            const active = s.no === step;
            return (
              <li key={s.no} className="flex-1 border-r border-line-2 last:border-r-0">
                <button onClick={() => go(s.no)} className={`flex w-full items-center gap-2.5 px-4 py-3.5 text-left transition ${active ? "bg-brand-soft" : "hover:bg-canvas"}`}>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      active ? "bg-brand text-white ring-4 ring-brand/15" : done[s.no - 1] ? "bg-ok text-white" : "border border-line text-ink-3"
                    }`}
                  >
                    {done[s.no - 1] && !active ? "✓" : s.no}
                  </span>
                  <span className="min-w-0">
                    <span className={`block whitespace-nowrap text-sm font-bold ${active ? "text-brand" : ""}`}>{s.title}</span>
                    <span className="block truncate text-xs text-ink-3">{s.sub}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {step === 1 && <StepIdea {...props} />}
      {step === 2 && <StepFlow {...props} />}
      {step === 3 && <StepPriority {...props} />}
      {step === 4 && <StepBrief {...props} />}
      {step === 5 && <StepBuild {...props} assets={assets} uploadCtx={uploadCtx} />}
      {step === 6 && <StepDeck {...props} assets={assets} uploadCtx={uploadCtx} shared={shared} onShare={toggleShare} name={name} cohort={cohort} />}

      {/* 하단 고정 바 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
          <SaveBadge state={save} savedAt={savedAt} onRetry={flush} />
          <div className="ml-auto flex gap-2">
            {step > 1 && (
              <button className="btn btn-ghost" onClick={() => go(step - 1)}>
                ← 이전
              </button>
            )}
            {step < 6 ? (
              <button className="btn btn-primary" onClick={() => go(step + 1)}>
                다음 단계 →
              </button>
            ) : (
              <Link className="btn btn-accent" href="/present/me" target="_blank">
                발표 보기 ↗
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveBadge({ state, savedAt, onRetry }: { state: SaveState; savedAt: string | null; onRetry: () => void }) {
  const time = savedAt ? new Date(savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
  if (state === "saving" || state === "dirty") return <span className="text-sm text-ink-3">저장 중…</span>;
  if (state === "error")
    return (
      <button className="text-sm font-semibold text-danger" onClick={onRetry}>
        ⚠ 저장 실패 — 다시 시도
      </button>
    );
  return <span className="text-sm text-ok">✓ 자동 저장됨{time && <span className="ml-1 text-ink-3">{time}</span>}</span>;
}
