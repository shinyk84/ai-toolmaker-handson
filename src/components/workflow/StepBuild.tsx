"use client";

import { useState } from "react";
import { savedHoursPerMonth, uid, type BuildLog } from "@/lib/workspace";
import { AssetPicker, AssetThumb, Uploader, type UploadCtx, type useAssets } from "../assets";
import { Field, NumInput, StepHeader } from "../ui";
import type { StepProps } from "./Workbench";

type Assets = ReturnType<typeof useAssets>;

const today = () => new Date().toLocaleDateString("sv-SE");

export default function StepBuild({ data, update, assets, uploadCtx }: StepProps & { assets: Assets; uploadCtx: UploadCtx }) {
  const bld = data.build;
  const setB = (patch: Partial<typeof bld>) => update((d) => ({ ...d, build: { ...d.build, ...patch } }));
  const setLog = (id: string, patch: Partial<BuildLog>) => setB({ logs: bld.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const [pick, setPick] = useState<string | null>(null);
  const saved = savedHoursPerMonth(data);
  const byId = new Map(assets.assets.map((a) => [a.id, a]));

  const addLog = () =>
    setB({ logs: [{ id: uid(), date: today(), title: "", prompt: "", result: "", issue: "", assetIds: [] }, ...bld.logs] });

  return (
    <div>
      <StepHeader
        no={5}
        title="제작 기록"
        desc={"만드는 과정을 남겨두세요. 어떤 요청을 했고, 무엇이 됐고, 어디서 막혔는지 —\n이 기록이 발표 자료가 되고, 다음 도구를 만들 때 나만의 레시피가 됩니다."}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-4 p-5 md:p-6">
          <h2 className="font-bold">링크</h2>
          <Field label="GitHub 레포지토리">
            <input className="input" placeholder="https://github.com/아이디/레포이름" value={bld.githubUrl} onChange={(e) => setB({ githubUrl: e.target.value.trim() })} />
          </Field>
          <Field label="배포 주소" hint="(웹 형태가 아니면 비워두세요)">
            <input className="input" placeholder="https://my-tool.vercel.app" value={bld.deployUrl} onChange={(e) => setB({ deployUrl: e.target.value.trim() })} />
          </Field>
          {bld.deployUrl.startsWith("http") && (
            <a href={bld.deployUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold text-brand hover:underline">
              배포 사이트 열기 ↗
            </a>
          )}
        </section>

        <section className="card p-5 md:p-6">
          <h2 className="font-bold">성과 측정</h2>
          <p className="mt-1 text-sm text-ink-3">실제 자료로 써보고 1회 작업 시간을 비교하세요.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Field label="도입 전 1회" hint="(분)">
              <NumInput value={bld.beforeMinutes} onChange={(v) => setB({ beforeMinutes: v })} placeholder="120" />
            </Field>
            <Field label="도입 후 1회" hint="(분)">
              <NumInput value={bld.afterMinutes} onChange={(v) => setB({ afterMinutes: v })} placeholder="20" />
            </Field>
            <Field label="월 횟수">
              <NumInput value={bld.timesPerMonth} onChange={(v) => setB({ timesPerMonth: v })} placeholder="12" />
            </Field>
          </div>
          <div className="mt-4 rounded-xl bg-brand p-4 text-white">
            <div className="text-xs text-white/70">월 절감 시간</div>
            <div className="text-3xl font-black">{saved != null ? `${saved}시간` : "—"}</div>
            {saved != null && bld.beforeMinutes ? (
              <div className="text-xs text-white/70">
                1회당 {Math.round(((bld.beforeMinutes - (bld.afterMinutes ?? 0)) / bld.beforeMinutes) * 100)}% 단축
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">제작 로그 ({bld.logs.length})</h2>
          <button className="btn btn-primary btn-sm" onClick={addLog}>
            + 오늘의 기록 추가
          </button>
        </div>
        {bld.logs.length === 0 && (
          <div className="card p-8 text-center text-sm text-ink-3">
            아직 기록이 없습니다. 에이전트에게 요청한 내용과 결과를 남겨보세요.
          </div>
        )}
        <div className="space-y-4">
          {bld.logs.map((l) => (
            <article key={l.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <input type="date" className="input !w-auto" value={l.date} onChange={(e) => setLog(l.id, { date: e.target.value })} />
                <input
                  className="input min-w-0 flex-1 font-semibold"
                  placeholder="무엇을 했나요? 예) 엑셀 열 이름 통일 기능"
                  value={l.title}
                  onChange={(e) => setLog(l.id, { title: e.target.value })}
                />
                <button
                  className="text-ink-3 hover:text-danger"
                  aria-label="삭제"
                  onClick={() => confirm("이 기록을 삭제할까요?") && setB({ logs: bld.logs.filter((x) => x.id !== l.id) })}
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Field label="AI에게 한 요청">
                  <textarea className="input min-h-24 font-mono text-xs" value={l.prompt} onChange={(e) => setLog(l.id, { prompt: e.target.value })} placeholder="붙여넣기" />
                </Field>
                <Field label="결과 · 잘 된 점">
                  <textarea className="input min-h-24" value={l.result} onChange={(e) => setLog(l.id, { result: e.target.value })} />
                </Field>
                <Field label="문제 · 막힌 점">
                  <textarea className="input min-h-24" value={l.issue} onChange={(e) => setLog(l.id, { issue: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {l.assetIds.map((id) => {
                  const a = byId.get(id);
                  return a ? (
                    <a key={id} href={a.url} target="_blank" rel="noreferrer" className="block h-16 w-28 overflow-hidden rounded-lg border border-line">
                      <AssetThumb a={a} />
                    </a>
                  ) : null;
                })}
                <button className="btn btn-ghost btn-sm" onClick={() => setPick(l.id)}>
                  🖼 스크린샷·영상 첨부
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">자료 올리기</h2>
        <Uploader ctx={uploadCtx} onUploaded={(a) => assets.setAssets((x) => [a, ...x])} />
        <p className="mt-2 text-xs text-ink-3">올린 파일은 왼쪽 메뉴 '자료실'에서 모아볼 수 있습니다.</p>
      </section>

      {pick && (
        <AssetPicker
          open
          onClose={() => setPick(null)}
          assets={assets.assets}
          selected={bld.logs.find((l) => l.id === pick)?.assetIds ?? []}
          onChange={(ids) => setLog(pick, { assetIds: ids })}
          ctx={uploadCtx}
          onUploaded={(a) => assets.setAssets((x) => [a, ...x])}
          kinds={["image", "video", "pdf", "file"]}
        />
      )}
    </div>
  );
}
