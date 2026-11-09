"use client";

import { TOOL_OPTIONS, type FlowStep } from "@/lib/workspace";
import { StepHeader } from "../ui";
import type { StepProps } from "./Workbench";

const FORM_GUIDE: Record<string, string> = {
  "AI 챗봇(프롬프트)": "판단·글쓰기 위주, 파일 처리가 적을 때. 프롬프트 세트 + 체크리스트로 완성",
  "GPTs·Gem(맞춤 챗봇)": "같은 지시를 반복할 때. 지침과 참고자료를 넣은 나만의 챗봇",
  "HTML 단일 파일": "입력 화면 + 계산/정리. 서버·저장 불필요, 브라우저에서 바로 실행",
  "Python 스크립트": "엑셀·한글·PDF 대량 처리. 폴더에 넣고 실행하면 결과 파일 생성",
  "Python 데스크톱 앱": "버튼 있는 창이 필요할 때. exe로 만들어 동료에게 전달",
  "웹앱 + DB": "여러 사람이 쓰고 데이터가 쌓여야 할 때. 로그인·배포 필요",
  "엑셀 VBA": "이미 엑셀로 일할 때. 버튼 한 번으로 시트 취합·서식",
  "Apps Script": "구글 시트·드라이브·메일 자동화",
  "모르겠어요": "가장 단순한 것부터: HTML 단일 파일 또는 Python 스크립트를 추천해요",
};

const quad = (s: FlowStep) => {
  if (s.value >= 4 && s.effort <= 3) return { t: "바로 만들기", c: "bg-accent text-white" };
  if (s.value >= 4) return { t: "MVP 이후", c: "bg-brand text-white" };
  if (s.effort <= 2) return { t: "가볍게", c: "bg-ok-soft text-ok" };
  return { t: "보류", c: "bg-[#eef0f6] text-ink-3" };
};

export default function StepPriority({ data, update }: StepProps) {
  const steps = data.flow.filter((s) => s.text.trim());
  const setStep = (id: string, patch: Partial<FlowStep>) => update((d) => ({ ...d, flow: d.flow.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const recommend = () => {
    const ranked = [...steps]
      .filter((s) => s.actor !== "human")
      .sort((a, b) => b.value - b.effort - (a.value - a.effort) || b.value - a.value)
      .slice(0, 2)
      .map((s) => s.id);
    update((d) => ({ ...d, flow: d.flow.map((s) => ({ ...s, mvp: ranked.includes(s.id) })) }));
  };

  return (
    <div>
      <StepHeader
        no={3}
        title="우선순위 · MVP 정하기"
        desc={"전부가 아니라 '가장 아픈 1~3단계'부터 만듭니다.\n각 단계의 효과(얼마나 시간이 줄까)와 난이도(만들기 어려운가)를 매기고 ★MVP를 고르세요."}
        right={
          <button className="btn btn-soft" onClick={recommend} disabled={!steps.length}>
            ✦ 점수로 MVP 추천
          </button>
        }
      />

      {steps.length === 0 ? (
        <div className="card p-10 text-center text-ink-3">2단계에서 워크플로우를 먼저 작성해 주세요.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-3">
                  <th className="px-4 py-3">#</th>
                  <th className="px-2 py-3">단계</th>
                  <th className="px-2 py-3 text-center">효과</th>
                  <th className="px-2 py-3 text-center">난이도</th>
                  <th className="px-2 py-3 text-center">판정</th>
                  <th className="px-4 py-3 text-center">★MVP</th>
                </tr>
              </thead>
              <tbody>
                {data.flow.map((s, i) =>
                  s.text.trim() ? (
                    <tr key={s.id} className={`border-b border-line-2 last:border-0 ${s.mvp ? "bg-accent-soft/60" : ""}`}>
                      <td className="px-4 py-3 font-bold text-brand">{i + 1}</td>
                      <td className="px-2 py-3">
                        <div className="line-clamp-2">{s.text}</div>
                        <div className="mt-0.5 text-xs text-ink-3">
                          {s.actor === "ai" ? "AI" : s.actor === "human" ? "사람" : s.actor === "tool" ? "자동화" : "미정"}
                          {s.tool && ` · ${s.tool}`}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <Dots value={s.value} onChange={(v) => setStep(s.id, { value: v })} color="bg-accent" />
                      </td>
                      <td className="px-2 py-3">
                        <Dots value={s.effort} onChange={(v) => setStep(s.id, { effort: v })} color="bg-brand" />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${quad(s).c}`}>{quad(s).t}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" className="h-5 w-5 accent-[#ee7d16]" checked={s.mvp} onChange={(e) => setStep(s.id, { mvp: e.target.checked })} />
                      </td>
                    </tr>
                  ) : null,
                )}
              </tbody>
            </table>
          </div>

          <Matrix steps={data.flow} />
        </div>
      )}

      <section className="card mt-6 p-5 md:p-6">
        <h2 className="font-bold">만들 형태</h2>
        <p className="mt-1 text-sm text-ink-3">모르겠으면 '모르겠어요'를 고르고 강사와 상의하세요. 가장 단순한 형태가 가장 빨리 완성됩니다.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_OPTIONS.map((t) => {
            const on = data.brief.form === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => update((d) => ({ ...d, brief: { ...d.brief, form: on ? "" : t } }))}
                className={`rounded-xl border p-3 text-left transition ${on ? "border-brand bg-brand-soft" : "border-line hover:border-ink-3"}`}
              >
                <div className={`text-sm font-bold ${on ? "text-brand" : ""}`}>
                  {on ? "● " : "○ "}
                  {t}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-ink-3">{FORM_GUIDE[t]}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Dots({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className={`h-3.5 w-3.5 rounded-full transition ${n <= value ? color : "bg-line"}`}
        />
      ))}
    </div>
  );
}

function Matrix({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-bold">효과 × 난이도</div>
      <div className="relative aspect-square">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 text-[11px] font-semibold">
          <div className="rounded-tl-lg bg-accent-soft p-2 text-accent">바로 만들기</div>
          <div className="rounded-tr-lg bg-brand-soft p-2 text-right text-brand">MVP 이후</div>
          <div className="rounded-bl-lg bg-ok-soft/70 p-2 text-ok">가볍게</div>
          <div className="rounded-br-lg bg-canvas p-2 text-right text-ink-3">보류</div>
        </div>
        {steps.map((s, i) =>
          s.text.trim() ? (
            <span
              key={s.id}
              title={s.text}
              className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold shadow ${s.mvp ? "bg-accent text-white" : "bg-white text-brand ring-1 ring-brand/40"}`}
              style={{ left: `${10 + ((s.effort - 1) / 4) * 80 + ((i % 3) - 1) * 3}%`, top: `${90 - ((s.value - 1) / 4) * 80 + ((i % 2) - 0.5) * 4}%` }}
            >
              {i + 1}
            </span>
          ) : null,
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-3">
        <span>← 쉬움</span>
        <span>난이도</span>
        <span>어려움 →</span>
      </div>
      <p className="mt-1 text-[11px] text-ink-3">세로: 효과 (위로 갈수록 큼)</p>
    </div>
  );
}
