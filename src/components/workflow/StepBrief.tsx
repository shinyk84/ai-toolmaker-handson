"use client";

import { useState } from "react";
import { buildAgentRequest, buildClaudeMd } from "@/lib/prompts";
import { TOOL_OPTIONS, selectedIdea, type Brief } from "@/lib/workspace";
import { CopyButton, Field, StepHeader } from "../ui";
import AiAction from "./AiAction";
import type { StepProps } from "./Workbench";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StepBrief({ data, update, aiEnabled }: StepProps) {
  const b = data.brief;
  const set = (patch: Partial<Brief>) => update((d) => ({ ...d, brief: { ...d.brief, ...patch } }));
  const [tab, setTab] = useState<"request" | "claude">("request");
  const idea = selectedIdea(data);
  const mvp = data.flow.filter((s) => s.mvp && s.text.trim());
  const request = buildAgentRequest(data);
  const claudeMd = buildClaudeMd(data);

  return (
    <div>
      <StepHeader
        no={4}
        title="AI 명령서"
        desc={"에이전트 AI(Claude Code · Codex)에게 줄 '요구사항 정의서'를 씁니다.\n칸을 채우면 오른쪽에 첫 요청문과 CLAUDE.md가 자동으로 만들어집니다."}
        right={
          <AiAction
            task="brief"
            data={data}
            aiEnabled={aiEnabled}
            label="AI로 다듬기"
            onResult={(r) => {
              if (!confirm("AI가 다듬은 내용으로 칸을 채울까요? (기존 내용은 바뀝니다)")) return;
              const keys = ["toolName", "oneLiner", "users", "inputs", "outputs", "rules", "success"] as const;
              const patch: Partial<Brief> = {};
              for (const k of keys) if (typeof r[k] === "string" && r[k].trim()) patch[k] = r[k];
              if (typeof r.form === "string" && (TOOL_OPTIONS as readonly string[]).includes(r.form) && !b.form) patch.form = r.form;
              set(patch);
            }}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="도구 이름">
              <input className="input" placeholder="예: 거래처 매출 취합기" value={b.toolName} onChange={(e) => set({ toolName: e.target.value })} />
            </Field>
            <Field label="만들 형태" hint="(3단계)">
              <select className="input" value={b.form} onChange={(e) => set({ form: e.target.value })}>
                <option value="">선택</option>
                {TOOL_OPTIONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="한 줄 소개 (목적)">
            <input
              className="input"
              placeholder={idea.tobe ? idea.tobe.split("\n")[0] : "예: 거래처별 엑셀을 하나의 월간 요약표로 합친다"}
              value={b.oneLiner}
              onChange={(e) => set({ oneLiner: e.target.value })}
            />
          </Field>
          <Field label="사용자 · 사용 상황">
            <input className="input" placeholder="예: 나와 팀원 3명, 매주 월요일 오전" value={b.users} onChange={(e) => set({ users: e.target.value })} />
          </Field>
          <Field label="입력" hint="— 어떤 파일·항목·형식?">
            <textarea className="input min-h-20" placeholder="예: 거래처별 엑셀 5개 (.xlsx). 열: 날짜, 품목, 매출액(파일마다 '금액'/'공급가액'으로 다름)" value={b.inputs} onChange={(e) => set({ inputs: e.target.value })} />
          </Field>
          <div className="rounded-xl bg-canvas p-3 text-sm">
            <div className="mb-1 text-xs font-bold text-ink-3">처리 단계 (3단계 ★MVP에서 자동 반영)</div>
            {mvp.length ? (
              <ol className="list-inside list-decimal space-y-0.5">
                {mvp.map((s) => (
                  <li key={s.id}>{s.text}</li>
                ))}
              </ol>
            ) : (
              <span className="text-ink-3">3단계에서 ★MVP 단계를 선택하세요.</span>
            )}
          </div>
          <Field label="출력" hint="— 무엇이 어떤 형식으로 어디에?">
            <textarea className="input min-h-20" placeholder="예: output 폴더에 요약표.xlsx. 시트1 거래처별 합계, 시트2 이상치 목록" value={b.outputs} onChange={(e) => set({ outputs: e.target.value })} />
          </Field>
          <Field label="규칙 · 금지사항">
            <textarea className="input min-h-20" placeholder={"- material 원본은 수정 금지\n- 고객 이름은 결과물에 넣지 않기"} value={b.rules} onChange={(e) => set({ rules: e.target.value })} />
          </Field>
          <Field label="완성 기준" hint="— 이렇게 되면 v0.1 완성">
            <textarea className="input min-h-20" placeholder={"- 샘플 5개로 실행하면 1분 안에 요약표가 나온다\n- 합계가 손계산과 같다"} value={b.success} onChange={(e) => set({ success: e.target.value })} />
          </Field>
          <Field label="기타 요청" hint="(선택)">
            <textarea className="input min-h-14" placeholder="예: 화면은 파란색 계열로 깔끔하게" value={b.extra} onChange={(e) => set({ extra: e.target.value })} />
          </Field>
        </section>

        <section className="xl:sticky xl:top-6 xl:self-start">
          <div className="card overflow-hidden">
            <div className="flex border-b border-line">
              {(
                [
                  ["request", "① 첫 요청문"],
                  ["claude", "② CLAUDE.md / AGENTS.md"],
                ] as const
              ).map(([k, t]) => (
                <button key={k} onClick={() => setTab(k)} className={`flex-1 px-4 py-3 text-sm font-bold ${tab === k ? "border-b-2 border-brand text-brand" : "text-ink-3"}`}>
                  {t}
                </button>
              ))}
            </div>
            <pre className="prose-pre max-h-[60vh] overflow-y-auto bg-[#161a2e] p-5 font-mono text-xs leading-relaxed text-[#e8eaf6]">
              {tab === "request" ? request : claudeMd}
            </pre>
            <div className="flex flex-wrap items-center gap-2 p-4">
              <CopyButton text={tab === "request" ? request : claudeMd} label="복사" className="btn btn-primary btn-sm" />
              {tab === "claude" && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => download("CLAUDE.md", claudeMd)}>
                    CLAUDE.md 다운로드
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => download("AGENTS.md", claudeMd)}>
                    AGENTS.md (Codex)
                  </button>
                </>
              )}
              <span className="text-xs text-ink-3">
                {tab === "request" ? "플랜 모드에서 에이전트에게 붙여넣으세요" : "my-tool 폴더 맨 위에 저장하세요"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
