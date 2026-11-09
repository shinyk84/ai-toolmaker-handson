"use client";

import { useState } from "react";
import { AssetThumb, Uploader, fmtSize, useAssets, type Asset, type UploadCtx } from "@/components/assets";
import { Modal } from "@/components/ui";

export default function FileLibrary({ ctx }: { ctx: UploadCtx }) {
  const { assets, setAssets, loaded } = useAssets();
  const [filter, setFilter] = useState<"all" | Asset["kind"]>("all");
  const [view, setView] = useState<Asset | null>(null);
  const list = assets.filter((a) => filter === "all" || a.kind === filter);

  const remove = async (a: Asset) => {
    if (!confirm(`'${a.caption}' 파일을 삭제할까요? 발표·기록에서도 사라집니다.`)) return;
    const r = await fetch(`/api/assets?id=${a.id}`, { method: "DELETE" });
    if (r.ok) {
      setAssets((x) => x.filter((y) => y.id !== a.id));
      setView(null);
    }
  };
  const rename = async (a: Asset, caption: string) => {
    setAssets((x) => x.map((y) => (y.id === a.id ? { ...y, caption } : y)));
    await fetch("/api/assets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, caption }) });
  };

  return (
    <div className="mt-6">
      <Uploader ctx={ctx} onUploaded={(a) => setAssets((x) => [a, ...x])} />
      {ctx.mode === "local" && <p className="mt-2 text-xs text-warn">로컬 개발 모드: 파일이 이 PC의 .data/uploads 폴더에 저장됩니다.</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "전체"],
            ["image", "이미지"],
            ["video", "영상"],
            ["pdf", "PDF"],
            ["file", "기타"],
          ] as const
        ).map(([k, t]) => (
          <button key={k} className="chip" data-on={filter === k} onClick={() => setFilter(k)}>
            {t} {k === "all" ? assets.length : assets.filter((a) => a.kind === k).length}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="mt-6 text-ink-3">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="mt-10 text-center text-ink-3">아직 파일이 없습니다.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((a) => (
            <div key={a.id} className="card overflow-hidden">
              <button className="block aspect-video w-full overflow-hidden bg-canvas" onClick={() => setView(a)}>
                <AssetThumb a={a} />
              </button>
              <div className="p-3">
                <input className="w-full truncate bg-transparent text-sm font-semibold outline-none focus:underline" defaultValue={a.caption} onBlur={(e) => e.target.value !== a.caption && rename(a, e.target.value)} />
                <div className="mt-0.5 text-xs text-ink-3">
                  {fmtSize(Number(a.size))} · {new Date(a.created_at).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.caption ?? ""} wide>
        {view && (
          <div>
            <div className="overflow-hidden rounded-xl bg-canvas">
              {view.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={view.url} alt={view.caption} className="mx-auto max-h-[60vh]" />
              ) : view.kind === "video" ? (
                <video src={view.url} controls className="mx-auto max-h-[60vh] w-full" />
              ) : (
                <div className="py-16 text-center text-5xl">{view.kind === "pdf" ? "📄" : "📎"}</div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <a href={view.url} target="_blank" rel="noreferrer" className="btn btn-ghost">
                새 창에서 열기 / 다운로드
              </a>
              <button className="btn ml-auto text-danger" onClick={() => remove(view)}>
                삭제
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
