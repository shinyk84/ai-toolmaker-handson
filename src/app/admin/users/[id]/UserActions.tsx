"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui";

export default function UserActions({ userId, cohortId, name }: { userId: number; cohortId: number; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const reset = async () => {
    const r = await fetch(`/api/admin/users/${userId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    const j = await r.json();
    setMsg(r.ok ? `✓ 비밀번호가 '${pw}'(으)로 바뀌었습니다. 수강생에게 알려주세요.` : j.error);
  };
  const remove = async () => {
    if (prompt(`정말 삭제하려면 이름 '${name}'을(를) 입력하세요. 워크스페이스·진도·파일이 모두 삭제됩니다.`) !== name) return;
    const r = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (r.ok) router.push(`/admin/cohorts/${cohortId}`);
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        계정 관리
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`${name} · 계정 관리`}>
        <label className="label">새 비밀번호 (6자 이상)</label>
        <div className="flex gap-2">
          <input className="input" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="예: temp1234" />
          <button className="btn btn-primary" onClick={reset} disabled={pw.length < 6}>
            초기화
          </button>
        </div>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
        <div className="mt-8 border-t border-line pt-4">
          <button className="btn text-danger" onClick={remove}>
            계정 삭제
          </button>
        </div>
      </Modal>
    </>
  );
}
