"use client";

import { useState } from "react";
import { TOOL_OPTIONS, emptyStep, selectedIdea, type FlowStep } from "@/lib/workspace";
import { StepHeader } from "../ui";
import AiAction from "./AiAction";
import type { StepProps } from "./Workbench";

export const ACTORS: { v: FlowStep["actor"]; t: string; c: string }[] = [
  { v: "human", t: "사람이 한다", c: "bg-[#eef0f6] text-ink-2 border-line" },
  { v: "ai", t: "AI가 한다", c: "bg-brand text-white border-brand" },
  { v: "tool", t: "자동화(코드)", c: "bg-accent text-white border-accent" },
];

export default function StepFlow({ data, update, aiEnabled }: StepProps) {
  const idea = selectedIdea(data);
  const [open, setOpen] = useState(false);
  const setStep = (id: string, patch: Partial<FlowStep>) => update((d) => ({ ...d, flow: d.flow.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const move = (i: number, dir: -1 | 1) =>
    update((d) => {
      const f = [...d.flow];
      const j = i + dir;
      if (j < 0 || j >= f.length) return d;
      [f[i], f[j]] = [f[j], f[i]];
      return { ...d, flow: f };
    });
  const filled = data.flow.filter((s) => s.text.trim()).length;

  return (
    <div>
      <StepHeader
        no={2}
        title="워크플로우 설계"
        desc={"선택한 아이디어를 실제로 어떻게 처리할지 단계별 할 일로 나눠주세요.\n한 항목에 한 가지 동작만, '~한다'로 끝나게 쓰는 것이 좋습니다."}
      />

      <section className="card mb-5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-ink-3">선택한 아이디어</span>
          <span className="font-bold">{idea.title || "(제목 없음 — 1단계에서 작성)"}</span>
          <button className="ml-auto text-sm text-brand hover:underline" onClick={() => setOpen((v) => !v)}>
            {open ? "접기" : "As-is / To-be 보기"}
          </button>
        </div>
        {open && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-canvas p-4">
              <div className="mb-2 text-xs font-bold text-ink-3">AS-IS</div>
              <p className="prose-pre text-sm">{idea.asis || "-"}</p>
            </div>
            <div className="rounded-xl bg-brand-soft/60 p-4">
              <div className="mb-2 text-xs font-bold text-brand">TO-BE</div>
              <p className="prose-pre text-sm">{idea.tobe || "-"}</p>
            </div>
          </div>
        )}
      </section>

      <ol className="space-y-3">
        {data.flow.map((s, i) => (
          <li key={s.id} className="card flex gap-3 p-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <button className="text-xs text-ink-3 hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="위로">
                ▲
              </button>
              <button className="text-xs text-ink-3 hover:text-ink disabled:opacity-30" disabled={i === data.flow.length - 1} onClick={() => move(i, 1)} aria-label="아래로">
                ▼
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <textarea
                className="input min-h-[52px]"
                placeholder="예) 거래처 엑셀 파일들을 한 폴더에 모은다"
                value={s.text}
                onChange={(e) => setStep(s.id, { text: e.target.value })}
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {ACTORS.map((a) => (
                  <button
                    key={a.v}
                    type="button"
                    onClick={() => setStep(s.id, { actor: s.actor === a.v ? "" : a.v })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${s.actor === a.v ? a.c : "border-line bg-white text-ink-3 hover:border-ink-3"}`}
                  >
                    {a.t}
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-line" />
                <select className="input !w-auto !py-1 text-xs" value={s.tool} onChange={(e) => setStep(s.id, { tool: e.target.value })}>
                  <option value="">도구 선택 안 함</option>
                  {TOOL_OPTIONS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              className="self-start text-ink-3 hover:text-danger"
              aria-label="삭제"
              onClick={() => update((d) => ({ ...d, flow: d.flow.length > 1 ? d.flow.filter((x) => x.id !== s.id) : [emptyStep()] }))}
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn btn-ghost" onClick={() => update((d) => ({ ...d, flow: [...d.flow, emptyStep()] }))}>
          + 항목 추가
        </button>
        <AiAction
          task="flow"
          data={data}
          aiEnabled={aiEnabled}
          label="AI 초안 생성"
          disabled={!idea.tobe.trim()}
          onResult={(r) => {
            const steps: FlowStep[] = (Array.isArray(r.steps) ? r.steps : [])
              .filter((x: any) => x && typeof x.text === "string")
              .slice(0, 14)
              .map((x: any) => ({
                ...emptyStep(String(x.text)),
                actor: ["human", "ai", "tool"].includes(x.actor) ? x.actor : "",
                tool: TOOL_OPTIONS.includes(x.tool) ? x.tool : "",
              }));
            if (!steps.length) return;
            const hasContent = data.flow.some((x) => x.text.trim());
            const replace = !hasContent || confirm("지금 작성한 단계를 AI 초안으로 바꿀까요?\n[취소]를 누르면 기존 단계 뒤에 추가합니다.");
            update((d) => ({ ...d, flow: replace ? steps : [...d.flow.filter((x) => x.text.trim()), ...steps] }));
          }}
        />
        <span className="text-sm text-ink-3">{filled}개 항목 작성됨</span>
      </div>

      <div className="mt-8 rounded-xl bg-accent-soft p-4 text-sm text-[#7a3d00]">
        <b>체크</b> · 사람이 최종 검토하는 단계가 있나요? · 입력 자료를 모으는 단계부터 시작하나요? · AI 초안은 그대로 쓰지 말고, 내 업무에 맞게 고치세요.
      </div>
    </div>
  );
}
