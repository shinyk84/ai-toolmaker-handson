import "server-only";
import path from "node:path";
import fs from "node:fs/promises";

export const MAX_UPLOAD_MB = 200;

export const storageMode = (): "blob" | "local" => (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local");

export function kindOf(contentType: string): "image" | "video" | "pdf" | "file" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "file";
}

export const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

export function safeName(name: string) {
  const ext = path.extname(name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

/** 로컬 개발 모드: .data/uploads/u{userId}/파일 */
export async function saveLocal(file: File, userId: number) {
  const rel = `u${userId}/${safeName(file.name)}`;
  const full = path.join(LOCAL_ROOT, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, Buffer.from(await file.arrayBuffer()));
  return { url: `/api/files/${rel}`, pathname: rel };
}

export async function deleteStored(url: string, pathname: string) {
  if (url.startsWith("/api/files/")) {
    const full = path.join(LOCAL_ROOT, pathname);
    if (full.startsWith(LOCAL_ROOT)) await fs.rm(full, { force: true });
    return;
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { del } = await import("@vercel/blob");
    await del(url);
  }
}
