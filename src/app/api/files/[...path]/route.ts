import path from "node:path";
import fs from "node:fs/promises";
import { getSession } from "@/lib/auth";
import { LOCAL_ROOT } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

/** 로컬 개발 모드에서 저장한 파일 제공 (로그인 사용자만) */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const rel = (await params).path.join("/");
  const full = path.join(LOCAL_ROOT, rel);
  if (!full.startsWith(LOCAL_ROOT)) return new Response("Bad path", { status: 400 });
  try {
    const buf = await fs.readFile(full);
    const type = TYPES[path.extname(full).toLowerCase()] ?? "application/octet-stream";
    const headers: Record<string, string> = { "Content-Type": type, "Cache-Control": "private, max-age=3600" };
    if (type === "image/svg+xml") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'";
    if (type === "application/octet-stream") headers["Content-Disposition"] = "attachment";
    return new Response(new Uint8Array(buf), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
