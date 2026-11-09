"use client";

import { useState } from "react";
import { buildPrompt, type AiTask } from "@/lib/prompts";
import type { WorkspaceData } from "@/lib/workspace";
import { CopyButton, Modal } from "../ui";

type Props = {
  task: AiTask;
  data: WorkspaceData;
  ideaId?: string;
  aiEnabled: boolean;
  label: string;
  onResult: (r: any) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * AI 버튼
 * - 서버에 API 키가 있으면: 바로 AI 호출 → 결과 반영
 * - 없으면: 프롬프트를 보여주고 복사 → 학습자가 자기 챗봇(ChatGPT·Claude·Gemini)에 붙여넣기
 * 두 경우 모두 '어떤 프롬프트가 쓰였는지' 볼 수 있게 해서 프롬프트 작성법을 배우도록 합니다.
 */
export default function AiAction({ task, data, ideaId, aiEnabled, label, onResult, className = "btn btn-accent", disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const prompt = show ? buildPrompt(task, data, ideaId) : "";

  const run = async () => {
    if (!aiEnabled) return setShow(true);
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, data, ideaId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "AI 요청 실패");
      onResult(j.result);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-1.5">
        <button type="button" className={className} onClick={run} disabled={busy || disabled}>
          {busy ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> AI 작성 중…
            </>
          ) : (
            <>✦ {label}</>
          )}
        </button>
        {aiEnabled && (
          <button type="button" className="text-xs text-ink-3 underline-offset-2 hover:underline" onClick={() => setShow(true)}>
            프롬프트 보기
          </button>
        )}
      </span>
      {err && <span className="text-xs text-danger">{err}</span>}
      <Modal open={show} onClose={() => setShow(false)} title={aiEnabled ? "이 버튼이 AI에게 보내는 프롬프트" : "프롬프트 복사 → 내 챗봇에 붙여넣기"} wide>
        {!aiEnabled && (
          <p className="mb-3 text-sm text-ink-2">
            이 과정에서는 AI 버튼 대신 프롬프트를 직접 써봅니다. 아래 내용을 복사해 ChatGPT · Claude · Gemini 등에 붙여넣고, 답변을 보고
            필요한 내용을 직접 옮겨 적으세요.
          </p>
        )}
        <pre className="prose-pre max-h-[55vh] overflow-y-auto rounded-xl bg-[#161a2e] p-4 font-mono text-xs leading-relaxed text-[#e8eaf6]">{prompt}</pre>
        <div className="mt-4 flex justify-end gap-2">
          <CopyButton text={prompt} label="프롬프트 복사" className="btn btn-primary" />
        </div>
      </Modal>
    </span>
  );
}
