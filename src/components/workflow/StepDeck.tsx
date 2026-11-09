"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildLearnerSlides } from "@/lib/learner-deck";
import { selectedIdea, type Deck } from "@/lib/workspace";
import SlideView from "../slides/SlideView";
import { AssetPicker, AssetThumb, type UploadCtx, type useAssets } from "../assets";
import { Field, StepHeader } from "../ui";
import AiAction from "./AiAction";
import type { StepProps } from "./Workbench";

type Assets = ReturnType<typeof useAssets>;

export default function StepDeck({
  data,
  update,
  aiEnabled,
  assets,
  uploadCtx,
  shared,
  onShare,
  name,
  cohort,
}: StepProps & { assets: Assets; uploadCtx: UploadCtx; shared: boolean; onShare: (v: boolean) => void; name: string; cohort: string }) {
  const d = data.deck;
  const set = (patch: Partial<Deck>) => update((w) => ({ ...w, deck: { ...w.deck, ...patch } }));
  const [picker, setPicker] = useState<"demo" | "cover" | null>(null);
  const idea = selectedIdea(data);
  const slides = useMemo(() => buildLearnerSlides(data, assets.assets, name, cohort), [data, assets.assets, name, cohort]);
  const byId = new Map(assets.assets.map((a) => [a.id, a]));

  const fill = () =>
    set({
      title: d.title || data.brief.toolName || idea.title,
      subtitle: d.subtitle || data.brief.oneLiner,
      problem: d.problem || idea.asis,
      solution: d.solution || idea.tobe,
    });

  return (
    <div>
      <StepHeader
        no={6}
        title="발표 PT 만들기"
        desc={"지금까지의 기록이 발표 슬라이드로 자동 변환됩니다. 문구를 다듬고 데모 화면을 고르세요.\n5분 구성: 문제 → 해결 → 워크플로우 → 데모 → 성과 → 배운 점"}
        right={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={fill}>
              앞 단계 내용 불러오기
            </button>
            <AiAction
              task="deck"
              data={data}
              aiEnabled={aiEnabled}
              label="AI 문구 초안"
              onResult={(r) => {
                if ((d.problem || d.solution) && !confirm("AI 초안으로 문구를 바꿀까요?")) return;
                const keys = ["title", "subtitle", "problem", "solution", "results", "lessons", "next"] as const;
                const patch: Partial<Deck> = {};
                for (const k of keys) if (typeof r[k] === "string") patch[k] = r[k];
                set(patch);
              }}
            />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="card space-y-4 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="발표 제목">
              <input className="input" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder={data.brief.toolName || "도구 이름"} />
            </Field>
            <Field label="부제">
              <input className="input" value={d.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder={data.brief.oneLiner || "한 줄 소개"} />
            </Field>
          </div>
          <Field label="표지 이미지" hint="(선택)">
            <div className="flex items-center gap-3">
              {d.coverAssetId && byId.get(d.coverAssetId) ? (
                <div className="h-14 w-24 overflow-hidden rounded-lg border border-line">
                  <AssetThumb a={byId.get(d.coverAssetId)!} />
                </div>
              ) : null}
              <button className="btn btn-ghost btn-sm" onClick={() => setPicker("cover")}>
                {d.coverAssetId ? "바꾸기" : "선택"}
              </button>
              {d.coverAssetId && (
                <button className="text-sm text-ink-3 hover:text-danger" onClick={() => set({ coverAssetId: null })}>
                  제거
                </button>
              )}
            </div>
          </Field>
          <Field label="문제 (As-is)" hint="— 줄마다 한 항목">
            <textarea className="input min-h-24" value={d.problem} onChange={(e) => set({ problem: e.target.value })} placeholder={idea.asis} />
          </Field>
          <Field label="해결 (To-be · 핵심 기능)">
            <textarea className="input min-h-24" value={d.solution} onChange={(e) => set({ solution: e.target.value })} placeholder={idea.tobe} />
          </Field>
          <Field label="데모 화면" hint="— 스크린샷·영상 최대 4개">
            <div className="flex flex-wrap items-center gap-2">
              {d.demoAssetIds.map((id) => {
                const a = byId.get(id);
                return a ? (
                  <div key={id} className="h-16 w-28 overflow-hidden rounded-lg border border-line">
                    <AssetThumb a={a} />
                  </div>
                ) : null;
              })}
              <button className="btn btn-ghost btn-sm" onClick={() => setPicker("demo")}>
                🖼 자료실에서 선택
              </button>
            </div>
          </Field>
          <Field label="데모 설명">
            <textarea className="input min-h-16" value={d.demoNote} onChange={(e) => set({ demoNote: e.target.value })} placeholder={"- 엑셀 5개를 폴더에 넣고 실행\n- 30초 만에 요약표 생성"} />
          </Field>
          <Field label="성과" hint="— 5단계 숫자는 자동 반영">
            <textarea className="input min-h-16" value={d.results} onChange={(e) => set({ results: e.target.value })} placeholder={"- 누락 0건\n- 팀원 2명이 함께 사용 중"} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="배운 점">
              <textarea className="input min-h-20" value={d.lessons} onChange={(e) => set({ lessons: e.target.value })} />
            </Field>
            <Field label="다음 계획">
              <textarea className="input min-h-20" value={d.next} onChange={(e) => set({ next: e.target.value })} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <Link href="/present/me" target="_blank" className="btn btn-accent">
              ▶ 발표 보기 (전체화면)
            </Link>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-[#23307a]" checked={shared} onChange={(e) => onShare(e.target.checked)} />
              기수 갤러리에 공유
            </label>
          </div>
          <div className="max-h-[75vh] space-y-3 overflow-y-auto rounded-2xl bg-[#e9ebf3] p-3">
            {slides.map((s, i) => (
              <div key={i} className="overflow-hidden rounded-lg shadow-sm">
                <SlideView slide={s} footer={d.title || data.brief.toolName} page={`${i + 1} / ${slides.length}`} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {picker && (
        <AssetPicker
          open
          onClose={() => setPicker(null)}
          assets={assets.assets}
          multiple={picker === "demo"}
          kinds={picker === "demo" ? ["image", "video"] : ["image"]}
          selected={picker === "demo" ? d.demoAssetIds : d.coverAssetId ? [d.coverAssetId] : []}
          onChange={(ids) => (picker === "demo" ? set({ demoAssetIds: ids.slice(0, 4) }) : set({ coverAssetId: ids[0] ?? null }))}
          ctx={uploadCtx}
          onUploaded={(a) => assets.setAssets((x) => [a, ...x])}
        />
      )}
    </div>
  );
}
