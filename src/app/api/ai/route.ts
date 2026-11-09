import { apiLearner } from "@/lib/auth";
import { AiError, runAiTask } from "@/lib/ai";
import { fail, ok, readJson } from "@/lib/http";
import { normalizeWorkspace } from "@/lib/workspace";
import type { AiTask } from "@/lib/prompts";

export const maxDuration = 60;

// 1인당 짧은 시간 연속 호출 방지(서버 인스턴스 메모리 기준의 간단한 제한)
const recent = new Map<number, number[]>();

export async function POST(req: Request) {
  const s = await apiLearner();
  if (!s) return fail("로그인이 필요합니다.", 401);
  const body = await readJson<{ task: AiTask; data: unknown; ideaId?: string }>(req);
  if (!body || !["evaluate", "flow", "brief", "deck"].includes(body.task)) return fail("잘못된 요청입니다.");

  const now = Date.now();
  const list = (recent.get(s.uid) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= 6) return fail("1분에 6번까지 요청할 수 있어요. 잠시 후 다시 시도해 주세요.", 429);
  list.push(now);
  recent.set(s.uid, list);

  try {
    const result = await runAiTask(body.task, normalizeWorkspace(body.data), body.ideaId);
    return ok({ result });
  } catch (e) {
    if (e instanceof AiError) return fail(e.message, e.status);
    return fail("AI 처리 중 오류가 발생했습니다.", 500);
  }
}
