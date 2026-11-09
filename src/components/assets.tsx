"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./ui";

export type Asset = {
  id: number;
  url: string;
  pathname: string;
  kind: "image" | "video" | "pdf" | "file";
  content_type: string;
  size: number;
  caption: string;
  created_at: string;
};

export type UploadCtx = { uid: number; mode: "blob" | "local"; maxMb: number };

export function fmtSize(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(async () => {
    const r = await fetch("/api/assets");
    if (r.ok) setAssets((await r.json()).assets);
    setLoaded(true);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { assets, setAssets, loaded, reload };
}

async function uploadOne(file: File, ctx: UploadCtx, onProgress: (p: number) => void): Promise<Asset> {
  if (file.size > ctx.maxMb * 1024 * 1024) throw new Error(`${file.name}: ${ctx.maxMb}MB 이하만 올릴 수 있어요.`);
  if (ctx.mode === "local") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", file.name);
    const r = await fetch("/api/upload/local", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "업로드 실패");
    onProgress(100);
    return j.asset;
  }
  const { upload } = await import("@vercel/blob/client");
  const ext = (file.name.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? "").toLowerCase();
  const blob = await upload(`u${ctx.uid}/${Date.now().toString(36)}${ext}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    multipart: file.size > 30 * 1024 * 1024,
    onUploadProgress: (e) => onProgress(Math.round(e.percentage)),
  });
  const r = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: blob.url, pathname: blob.pathname, contentType: file.type || blob.contentType, size: file.size, caption: file.name }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "등록 실패");
  return j.asset;
}

/** 드래그&드롭 / 클릭 업로드 영역 */
export function Uploader({ ctx, onUploaded, accept, compact }: { ctx: UploadCtx; onUploaded: (a: Asset) => void; accept?: string; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<{ name: string; p: number } | null>(null);
  const [err, setErr] = useState("");

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    for (const f of Array.from(files)) {
      setProgress({ name: f.name, p: 0 });
      try {
        const a = await uploadOne(f, ctx, (p) => setProgress({ name: f.name, p }));
        onUploaded(a);
      } catch (e) {
        setErr((e as Error).message);
      }
    }
    setProgress(null);
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition ${compact ? "px-4 py-4" : "px-6 py-8"} ${drag ? "border-brand-2 bg-brand-soft" : "border-line bg-white hover:border-ink-3"}`}
      >
        <input ref={input} type="file" multiple hidden accept={accept} onChange={(e) => handle(e.target.files)} />
        {progress ? (
          <div className="w-full max-w-xs">
            <div className="truncate text-sm font-semibold">{progress.name}</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-2">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress.p}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold">{compact ? "+ 파일 올리기" : "여기로 파일을 끌어오거나 클릭해서 올리기"}</div>
            {!compact && <div className="mt-1 text-xs text-ink-3">스크린샷 · 화면 녹화 영상 · PDF · 결과 파일 (최대 {ctx.maxMb}MB)</div>}
          </>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
    </div>
  );
}

export function AssetThumb({ a, className = "" }: { a: Asset; className?: string }) {
  if (a.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.url} alt={a.caption} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  if (a.kind === "video") return <video src={a.url} className={`h-full w-full object-cover ${className}`} muted preload="metadata" />;
  return (
    <div className={`flex h-full w-full items-center justify-center bg-canvas text-2xl ${className}`}>{a.kind === "pdf" ? "📄" : "📎"}</div>
  );
}

/** 자료실에서 이미지·영상 고르기 */
export function AssetPicker({
  open,
  onClose,
  assets,
  selected,
  onChange,
  multiple = true,
  ctx,
  onUploaded,
  kinds = ["image", "video"],
}: {
  open: boolean;
  onClose: () => void;
  assets: Asset[];
  selected: number[];
  onChange: (ids: number[]) => void;
  multiple?: boolean;
  ctx: UploadCtx;
  onUploaded: (a: Asset) => void;
  kinds?: Asset["kind"][];
}) {
  const list = assets.filter((a) => kinds.includes(a.kind));
  const toggle = (id: number) => {
    if (!multiple) return onChange(selected.includes(id) ? [] : [id]);
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  return (
    <Modal open={open} onClose={onClose} title="자료실에서 선택" wide>
      <Uploader ctx={ctx} onUploaded={onUploaded} compact accept={kinds.includes("video") ? "image/*,video/*" : "image/*"} />
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {list.map((a) => {
          const on = selected.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={`relative aspect-video overflow-hidden rounded-lg border-2 ${on ? "border-accent" : "border-transparent"}`}
            >
              <AssetThumb a={a} />
              {on && (
                <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {multiple ? selected.indexOf(a.id) + 1 : "✓"}
                </span>
              )}
              {a.kind === "video" && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] text-white">영상</span>}
            </button>
          );
        })}
        {list.length === 0 && <p className="col-span-full py-6 text-center text-sm text-ink-3">아직 올린 이미지·영상이 없습니다.</p>}
      </div>
      <div className="mt-5 flex justify-end">
        <button className="btn btn-primary" onClick={onClose}>
          선택 완료
        </button>
      </div>
    </Modal>
  );
}
