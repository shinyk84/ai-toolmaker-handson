"use client";

import { TOOL_OPTIONS, emptyIdea, type Idea } from "@/lib/workspace";
import { Field, HelpTip, NumInput, StepHeader } from "../ui";
import AiAction from "./AiAction";
import type { StepProps } from "./Workbench";

const MAX = 7;

export default function StepIdea({ data, update, aiEnabled }: StepProps) {
  const setIdea = (id: string, patch: Partial<Idea>) =>
    update((d) => ({ ...d, ideas: d.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  return (
    <div>
      <StepHeader
        no={1}
        title="아이디어 도출"
        desc={"평소 답답했던 일을 자유롭게 적어보세요. 최대 7개까지, 모든 입력은 자동 저장됩니다.\n빈도와 시간을 숫자로 적어두면 4주 뒤 성과를 계산할 수 있어요."}
      />

      <div className="space-y-5">
        {data.ideas.map((idea, n) => {
          const selected = data.selectedIdeaId === idea.id;
          return (
            <section key={idea.id} className={`card p-5 md:p-6 ${selected ? "border-brand-2 ring-2 ring-brand/10" : ""}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-canvas text-sm font-bold text-ink-2">{n + 1}</span>
                <input
                  className="min-w-0 flex-1 border-b-2 border-transparent bg-transparent py-1 text-lg font-bold outline-none placeholder:text-ink-3 focus:border-accent"
                  placeholder="아이디어 제목 — 어떤 일을 자동화하고 싶나요?"
                  value={idea.title}
                  onChange={(e) => setIdea(idea.id, { title: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => update((d) => ({ ...d, selectedIdeaId: idea.id }))}
                  className={`chip ${selected ? "" : "hover:border-ink-3"}`}
                  data-on={selected}
                >
                  {selected ? "★ 이 카드로 진행 중" : "○ 이 카드로 진행"}
                </button>
                {data.ideas.length > 1 && (
                  <button
                    type="button"
                    className="text-ink-3 hover:text-danger"
                    aria-label="삭제"
                    onClick={() => {
                      if (!confirm("이 아이디어 카드를 삭제할까요?")) return;
                      update((d) => {
                        const ideas = d.ideas.filter((i) => i.id !== idea.id);
                        return { ...d, ideas, selectedIdeaId: d.selectedIdeaId === idea.id ? ideas[0].id : d.selectedIdeaId };
                      });
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="AS-IS · 지금 어떻게 하고 있나요?">
                  <textarea
                    className="input min-h-36"
                    placeholder={"예)\n1. 거래처 5곳에서 엑셀을 메일로 받는다\n2. 열 이름이 달라 손으로 맞춘다\n3. 합계를 계산해 요약표에 옮긴다\n→ 매주 2시간, 가끔 누락"}
                    value={idea.asis}
                    onChange={(e) => setIdea(idea.id, { asis: e.target.value })}
                  />
                </Field>
                <Field label="TO-BE · 어떻게 바뀌면 좋을까요?">
                  <textarea
                    className="input min-h-36"
                    placeholder={"예)\n엑셀 5개를 폴더에 넣고 실행하면\n요약표와 이상치 코멘트가 자동으로 나온다.\n최종 확인만 내가 한다."}
                    value={idea.tobe}
                    onChange={(e) => setIdea(idea.id, { tobe: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="영향 대상">
                  <input className="input" placeholder="예: 나 / 우리 팀 / 고객" value={idea.target} onChange={(e) => setIdea(idea.id, { target: e.target.value })} />
                </Field>
                <Field label="빈도">
                  <input className="input" placeholder="예: 주 3회" value={idea.frequency} onChange={(e) => setIdea(idea.id, { frequency: e.target.value })} />
                </Field>
                <Field label="1회 소요 시간" hint="(분)">
                  <NumInput value={idea.minutes} onChange={(v) => setIdea(idea.id, { minutes: v })} placeholder="예: 120" />
                </Field>
                <Field label="예상 난이도">
                  <select className="input" value={idea.difficulty} onChange={(e) => setIdea(idea.id, { difficulty: e.target.value as Idea["difficulty"] })}>
                    <option value="">선택</option>
                    <option>낮음</option>
                    <option>보통</option>
                    <option>높음</option>
                  </select>
                </Field>
              </div>

              <div className="mt-4">
                <span className="label">
                  떠오르는 도구 <span className="font-normal text-ink-3">(여러 개 선택 가능)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((t) => {
                    const on = idea.tools.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        className="chip"
                        data-on={on}
                        onClick={() => setIdea(idea.id, { tools: on ? idea.tools.filter((x) => x !== t) : [...idea.tools, t] })}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-start gap-4 border-t border-line-2 pt-4">
                <SelfScore idea={idea} onChange={(self) => setIdea(idea.id, { self })} />
                <div className="ml-auto">
                  <AiAction
                    task="evaluate"
                    data={data}
                    ideaId={idea.id}
                    aiEnabled={aiEnabled}
                    label={idea.ai ? "AI 다시 평가" : "AI 주제 평가 받기"}
                    disabled={!idea.title.trim() || !idea.asis.trim()}
                    className="btn btn-soft"
                    onResult={(r) =>
                      setIdea(idea.id, {
                        ai: {
                          impact: clamp(r.impact),
                          confidence: clamp(r.confidence),
                          ease: clamp(r.ease),
                          comments: Array.isArray(r.comments) ? r.comments.map(String).slice(0, 6) : [],
                        },
                      })
                    }
                  />
                </div>
              </div>

              {idea.ai && <AiResult ai={idea.ai} />}
            </section>
          );
        })}
      </div>

      {data.ideas.length < MAX && (
        <button
          type="button"
          className="mt-5 w-full rounded-2xl border-2 border-dashed border-line py-4 text-sm font-semibold text-ink-2 hover:border-brand-2 hover:text-brand"
          onClick={() => update((d) => ({ ...d, ideas: [...d.ideas, emptyIdea()] }))}
        >
          + 아이디어 추가 ({data.ideas.length}/{MAX})
        </button>
      )}
    </div>
  );
}

/** ICE 점수 설명 말풍선 */
function IceHelp() {
  return (
    <HelpTip title="ICE 점수란?">
      <span className="block">여러 아이디어 중 <b>무엇부터 만들지</b> 고르는 간단한 평가법입니다. 세 가지를 1~10점으로 매겨 더합니다(30점 만점).</span>
      <span className="mt-2.5 block">
        <b className="text-ink">I · Impact (효과)</b>
        <br />
        만들면 얼마나 도움이 되나? 자주 하는 일일수록, 시간이 많이 드는 일일수록 높게.
      </span>
      <span className="mt-2 block">
        <b className="text-ink">C · Confidence (확신)</b>
        <br />
        AI로 정말 될 것 같은가? 넣을 자료와 원하는 결과물이 분명할수록 높게.
      </span>
      <span className="mt-2 block">
        <b className="text-ink">E · Ease (쉬움)</b>
        <br />
        4주 안에 작은 버전을 만들 수 있나? 쉬울수록 높게.
      </span>
      <span className="mt-2.5 block rounded-lg bg-accent-soft px-2.5 py-2 text-[12px] text-[#7a3d00]">
        예) 주 3회 2시간 걸리는 엑셀 취합 → 효과 8 · 확신 7 · 쉬움 7 = 22점
        <br />
        점수가 비슷하면 <b>쉬움(E)</b>이 높은 쪽을 고르세요. 첫 도구는 끝까지 완성해 보는 경험이 가장 중요합니다.
      </span>
    </HelpTip>
  );
}

const clamp = (v: unknown) => Math.min(10, Math.max(1, Math.round(Number(v) || 1)));

function SelfScore({ idea, onChange }: { idea: Idea; onChange: (s: Idea["self"]) => void }) {
  const s = idea.self ?? { impact: 5, confidence: 5, ease: 5 };
  const items: [keyof typeof s, string][] = [
    ["impact", "Impact 효과"],
    ["confidence", "Confidence 확신"],
    ["ease", "Ease 용이성"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-2">
        내 ICE 점수 <IceHelp />
      </span>
      {items.map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 text-xs text-ink-2">
          {label}
          <input type="range" min={1} max={10} value={s[k]} onChange={(e) => onChange({ ...s, [k]: Number(e.target.value) })} className="w-20 accent-[#23307a]" />
          <b className="w-4 text-ink">{idea.self ? s[k] : "-"}</b>
        </label>
      ))}
      {idea.self && <span className="text-sm font-bold text-brand">{s.impact + s.confidence + s.ease}/30</span>}
    </div>
  );
}

function AiResult({ ai }: { ai: NonNullable<Idea["ai"]> }) {
  const total = ai.impact + ai.confidence + ai.ease;
  return (
    <div className="mt-4 rounded-xl bg-brand-soft/60 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">AI 평가</span>
        <IceHelp />
        {(
          [
            ["Impact", ai.impact],
            ["Confidence", ai.confidence],
            ["Ease", ai.ease],
          ] as const
        ).map(([k, v]) => (
          <span key={k} className="text-sm">
            <span className="text-ink-3">{k}</span> <b className="text-lg">{v}</b>
          </span>
        ))}
        <span className="ml-auto text-lg font-black text-brand">{total}/30</span>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
        {ai.comments.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent">•</span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
