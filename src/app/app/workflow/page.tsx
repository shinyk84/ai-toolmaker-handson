import { Suspense } from "react";
import Workbench from "@/components/workflow/Workbench";
import { requireLearner } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai";
import { one } from "@/lib/db";
import { MAX_UPLOAD_MB, storageMode } from "@/lib/storage";

export default async function WorkflowPage() {
  const s = await requireLearner();
  const c = await one<{ name: string }>(`SELECT name FROM cohorts WHERE id = $1`, [s.cid]);
  return (
    <Suspense>
      <Workbench aiEnabled={aiEnabled()} uploadCtx={{ uid: s.uid, mode: storageMode(), maxMb: MAX_UPLOAD_MB }} name={s.name} cohort={c?.name ?? ""} />
    </Suspense>
  );
}
