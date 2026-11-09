import { requireLearner } from "@/lib/auth";
import { MAX_UPLOAD_MB, storageMode } from "@/lib/storage";
import FileLibrary from "./FileLibrary";

export default async function FilesPage() {
  const s = await requireLearner();
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight">자료실</h1>
      <p className="mt-1 text-sm text-ink-2">스크린샷 · 화면 녹화 · 결과 파일을 모아두는 곳입니다. 제작 기록과 발표 PT에서 여기의 파일을 골라 씁니다.</p>
      <FileLibrary ctx={{ uid: s.uid, mode: storageMode(), maxMb: MAX_UPLOAD_MB }} />
    </div>
  );
}
