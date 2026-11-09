"use client";

import { useEffect, useState } from "react";
import { STEPS } from "@/lib/workspace";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`card max-h-[90vh] w-full overflow-y-auto p-6 shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink" aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CopyButton({ text, label = "복사", className = "btn btn-soft btn-sm" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "✓ 복사됨" : label}
    </button>
  );
}

/** '?' 도움말: 마우스를 올리거나 클릭(모바일)하면 설명 말풍선이 열림 */
export function HelpTip({ title, children, align = "left" }: { title?: string; children: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={title ? `${title} 설명` : "설명"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-ink-3/50 text-[11px] font-bold leading-none text-ink-3 transition hover:border-brand-2 hover:text-brand"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute top-6 z-40 w-[min(340px,80vw)] rounded-xl border border-line bg-white p-4 text-left text-[13px] font-normal leading-relaxed text-ink-2 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
        >
          {title && <span className="mb-1.5 block text-sm font-bold text-ink">{title}</span>}
          {children}
        </span>
      )}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-3">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

export function StepHeader({ no, title, desc, right }: { no: number; title: string; desc: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1.5 inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent">
          {STEPS[no - 1]?.week} 수업
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          {no}단계 · {title}
        </h1>
        <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{desc}</p>
      </div>
      {right}
    </div>
  );
}

export function NumInput({ value, onChange, placeholder, className = "" }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string; className?: string }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      className={`input ${className}`}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
    />
  );
}
