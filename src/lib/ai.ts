import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { SCHEMAS, buildPrompt, type AiTask } from "./prompts";
import type { WorkspaceData } from "./workspace";

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export class AiError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

export async function runAiTask(task: AiTask, w: WorkspaceData, ideaId?: string): Promise<unknown> {
  if (!aiEnabled()) throw new AiError("AI 키가 설정되지 않았습니다. '프롬프트 복사'를 이용해 주세요.", 400);
  const prompt = buildPrompt(task, w, ideaId);
  try {
    const response = await getClient().beta.messages.create({
      model: process.env.AI_MODEL || "claude-opus-5-5",
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMAS[task] },
      },
      system:
        "너는 비개발자를 위한 'AI로 나만의 도구 만들기' 핸즈온 교육의 친절한 코치야. 모든 답변은 한국어로, 구체적이고 실천 가능하게 써.",
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") {
      throw new AiError("AI가 이 요청에 답하지 않았습니다. 내용을 조금 바꿔 다시 시도해 주세요.", 422);
    }
    if (response.stop_reason === "max_tokens") {
      throw new AiError("AI 응답이 너무 길어 중간에 끊겼습니다. 입력을 줄여 다시 시도해 주세요.", 422);
    }
    const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return JSON.parse(text);
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("AI API 키가 올바르지 않습니다(관리자 확인 필요).", 500);
    if (e instanceof Anthropic.RateLimitError) throw new AiError("요청이 몰렸습니다. 잠시 후 다시 시도해 주세요.", 429);
    if (e instanceof Anthropic.APIError) throw new AiError(`AI 호출 오류 (${e.status ?? "?"})`, 502);
    if (e instanceof SyntaxError) throw new AiError("AI 응답을 해석하지 못했습니다. 다시 시도해 주세요.", 502);
    throw new AiError("AI 서버에 연결하지 못했습니다.", 502);
  }
}
