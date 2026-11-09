"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Modal } from "@/components/ui";

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function NewCohort() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", joinCode: randomCode(), description: "", startsOn: "", endsOn: "" });
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/cohorts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    setOpen(false);
    router.push(`/admin/cohorts/${j.id}`);
    router.refresh();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + 새 기수 만들기
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="새 기수 만들기">
        <form onSubmit={submit} className="space-y-4">
          <Field label="기수 이름">
            <input className="input" required placeholder="예: 2026 겨울 1기" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="입장 코드" hint="— 수강생 가입 시 입력">
            <div className="flex gap-2">
              <input className="input font-mono" required value={f.joinCode} onChange={(e) => setF({ ...f, joinCode: e.target.value })} />
              <button type="button" className="btn btn-ghost" onClick={() => setF({ ...f, joinCode: randomCode() })}>
                새로 생성
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일">
              <input type="date" className="input" value={f.startsOn} onChange={(e) => setF({ ...f, startsOn: e.target.value })} />
            </Field>
            <Field label="종료일">
              <input type="date" className="input" value={f.endsOn} onChange={(e) => setF({ ...f, endsOn: e.target.value })} />
            </Field>
          </div>
          <Field label="메모" hint="(선택)">
            <input className="input" placeholder="예: 편집국 대상 / 매주 목 14시" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn btn-primary w-full">만들기</button>
        </form>
      </Modal>
    </>
  );
}
