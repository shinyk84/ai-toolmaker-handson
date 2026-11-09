import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { apiLearner } from "@/lib/auth";
import { MAX_UPLOAD_MB } from "@/lib/storage";

/** Vercel Blob 클라이언트 업로드용 토큰 발급 (대용량 동영상도 서버를 거치지 않고 바로 업로드) */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const s = await apiLearner();
        if (!s) throw new Error("로그인이 필요합니다.");
        if (!pathname.startsWith(`u${s.uid}/`)) throw new Error("허용되지 않은 경로입니다.");
        return {
          allowedContentTypes: [
            "image/*",
            "video/*",
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/zip",
            "application/vnd.openxmlformats-officedocument.*",
            "application/vnd.ms-excel",
            "application/x-hwp",
            "application/haansofthwp",
            "application/octet-stream",
          ],
          maximumSizeInBytes: MAX_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
