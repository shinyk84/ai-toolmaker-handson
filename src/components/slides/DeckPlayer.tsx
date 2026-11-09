"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/slides";
import SlideView from "./SlideView";

type Props = {
  slides: Slide[];
  label: string;
  backHref: string;
  backLabel?: string;
  showNotes?: boolean; // 강사 노트 기능 사용 여부
};

/** 전체화면 발표 플레이어: ←/→/스페이스 이동, F 전체화면, G 목록, N 노트 */
export default function DeckPlayer({ slides, label, backHref, backLabel = "나가기", showNotes = false }: Props) {
  const [i, setI] = useState(0);
  const [grid, setGrid] = useState(false);
  const [notes, setNotes] = useState(false);
  const [chrome, setChrome] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = slides.length;

  // 주소의 #번호로 시작 위치 지정 / 이동 시 주소 갱신
  useEffect(() => {
    const read = () => {
      const h = parseInt(location.hash.slice(1), 10);
      if (h >= 1 && h <= n) setI(h - 1);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [n]);
  useEffect(() => {
    history.replaceState(null, "", `#${i + 1}`);
  }, [i]);

  const go = useCallback((d: number) => setI((v) => Math.min(n - 1, Math.max(0, v + d))), [n]);
  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        if (!grid) go(1);
      } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
        e.preventDefault();
        if (!grid) go(-1);
      } else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
      else if (e.key === "f" || e.key === "F") fullscreen();
      else if (e.key === "g" || e.key === "G") setGrid((v) => !v);
      else if ((e.key === "n" || e.key === "N") && showNotes) setNotes((v) => !v);
      else if (e.key === "Escape") setGrid(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, fullscreen, grid, n, showNotes]);

  const poke = () => {
    setChrome(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChrome(false), 2500);
  };

  const slide = slides[i];
  const note = slide?.notes;

  return (
    <div ref={root} onMouseMove={poke} className="fixed inset-0 flex flex-col bg-[#0d1020] text-white">
      {/* 상단 바 */}
      <div
        className={`no-print absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 py-3 text-sm transition-opacity ${chrome || grid ? "opacity-100" : "opacity-0"}`}
      >
        <Link href={backHref} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">
          ← {backLabel}
        </Link>
        <span className="truncate font-semibold text-white/80">{label}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setGrid((v) => !v)} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" title="G">
            {grid ? "슬라이드" : "전체 목록"}
          </button>
          {showNotes && (
            <button onClick={() => setNotes((v) => !v)} className={`rounded-lg px-3 py-1.5 ${notes ? "bg-accent" : "bg-white/10 hover:bg-white/20"}`} title="N">
              강사 노트
            </button>
          )}
          <button onClick={fullscreen} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" title="F">
            전체화면
          </button>
        </div>
      </div>

      {grid ? (
        <div className="flex-1 overflow-y-auto px-6 pb-10 pt-16">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {slides.map((s, k) => (
              <button
                key={k}
                onClick={() => {
                  setI(k);
                  setGrid(false);
                }}
                className={`overflow-hidden rounded-lg text-left ring-2 transition ${k === i ? "ring-accent" : "ring-transparent hover:ring-white/40"}`}
              >
                <SlideView slide={s} />
                <div className="bg-black/40 px-2 py-1 text-xs text-white/70">{k + 1}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="relative flex min-w-0 flex-1 items-center justify-center p-2 sm:p-4">
            <div style={{ width: `min(100%, calc((100vh - 2rem) * 16 / 9))` }} className="shadow-2xl">
              {slide && <SlideView slide={slide} footer={label} page={`${i + 1} / ${n}`} />}
            </div>
            {/* 좌우 클릭 영역 */}
            <button aria-label="이전" onClick={() => go(-1)} className="absolute inset-y-0 left-0 w-[12%] cursor-w-resize" />
            <button aria-label="다음" onClick={() => go(1)} className="absolute inset-y-0 right-0 w-[12%] cursor-e-resize" />
          </div>
          {notes && (
            <aside className="w-[min(380px,35vw)] shrink-0 overflow-y-auto border-l border-white/10 bg-[#151935] p-5 pt-16 text-sm leading-relaxed">
              <div className="mb-2 text-xs font-bold tracking-widest text-accent">SPEAKER NOTE</div>
              <p className="whitespace-pre-line text-white/85">{note || "이 슬라이드에는 노트가 없습니다."}</p>
              {slides[i + 1] && (
                <div className="mt-6 opacity-70">
                  <div className="mb-1 text-xs text-white/50">다음 슬라이드</div>
                  <SlideView slide={slides[i + 1]} />
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {/* 진행 바 */}
      {!grid && (
        <div className="no-print absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${((i + 1) / n) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
