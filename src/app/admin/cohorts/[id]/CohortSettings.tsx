"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Modal } from "@/components/ui";
import type { CohortRow } from "@/lib/admin-data";

export default function CohortSettings({ cohort }: { cohort: CohortRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: cohort.name,
    joinCode: cohort.join_code,
    description: cohort.description,
    startsOn: cohort.starts_on ?? "",
    endsOn: cohort.ends_on ?? "",
  });
  const [err, setErr] = useState("");

  const patch = async (body: object) => {
    const r = await fetch(`/api/admin/cohorts/${cohort.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      setErr((await r.json()).error);
      return false;
    }
    router.refresh();
    return true;
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        ⚙ 설정
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="기수 설정">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await patch(f)) setOpen(false);
          }}
        >
          <Field label="기수 이름">
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="입장 코드">
            <input className="input font-mono" value={f.joinCode} onChange={(e) => setF({ ...f, joinCode: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일">
              <input type="date" className="input" value={f.startsOn} onChange={(e) => setF({ ...f, startsOn: e.target.value })} />
            </Field>
            <Field label="종료일">
              <input type="date" className="input" value={f.endsOn} onChange={(e) => setF({ ...f, endsOn: e.target.value })} />
            </Field>
          </div>
          <Field label="메모">
            <input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn btn-primary w-full">저장</button>
        </form>
        <div className="mt-6 border-t border-line pt-4">
          <p className="text-sm text-ink-2">
            {cohort.archived
              ? "종료된 기수입니다. 다시 열면 신규 가입이 가능해집니다."
              : "기수를 종료하면 신규 가입이 막히고 대시보드에서 '종료'로 표시됩니다. 데이터는 그대로 보관되며, 수강생은 계속 로그인해 자기 기록을 볼 수 있습니다."}
          </p>
          <button
            className="btn btn-ghost mt-3"
            onClick={async () => {
              if (await patch({ archived: !cohort.archived })) setOpen(false);
            }}
          >
            {cohort.archived ? "기수 다시 열기" : "기수 종료(보관)"}
          </button>
        </div>
      </Modal>
    </>
  );
}
