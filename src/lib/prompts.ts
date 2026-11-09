/**
 * AI 요청 프롬프트 — 서버(API 직접 호출)와 클라이언트(프롬프트 복사 모드)가 같은 문장을 씁니다.
 * 학습자가 '좋은 프롬프트의 구조'를 그대로 볼 수 있도록 <데이터> / <요청사항> / <결과물의 형태> 형식을 유지합니다.
 */
import { TOOL_OPTIONS, type WorkspaceData, selectedIdea } from "./workspace";

export type AiTask = "evaluate" | "flow" | "brief" | "deck";

const clip = (s: string, n = 4000) => (s.length > n ? s.slice(0, n) + " …(생략)" : s);

export function buildPrompt(task: AiTask, w: WorkspaceData, ideaId?: string): string {
  const idea = (ideaId && w.ideas.find((i) => i.id === ideaId)) || selectedIdea(w);
  const ideaBlock = `제목: ${idea.title || "(미정)"}
영향 대상: ${idea.target || "-"}
빈도/소요시간: ${idea.frequency || "-"} / ${idea.minutes ?? "-"}분
AS-IS(현재 방식):
${clip(idea.asis) || "-"}
TO-BE(바라는 모습):
${clip(idea.tobe) || "-"}`;
  const flowBlock = w.flow
    .filter((s) => s.text.trim())
    .map(
      (s, i) =>
        `${i + 1}. ${s.text} [${s.actor === "ai" ? "AI" : s.actor === "human" ? "사람" : s.actor === "tool" ? "도구/자동화" : "미정"}${s.tool ? ` · ${s.tool}` : ""}${s.mvp ? " · ★MVP" : ""}]`,
    )
    .join("\n");

  switch (task) {
    case "evaluate":
      return `<데이터: 자동화 아이디어>
${ideaBlock}

<요청사항>
너는 생성형 AI로 개인용 업무·학업·사업 자동화 도구를 만드는 핸즈온 교육의 코치야.
수강생은 비개발자이고, 에이전트 AI(Claude Code, Codex 등)를 이용해 4주 안에 실제로 작동하는 도구를 만들어야 해.
위 아이디어를 ICE 기준으로 평가해줘.
- Impact(효과, 1~10): 시간·비용·품질 개선 폭, 반복 빈도
- Confidence(확신, 1~10): 입력·출력이 명확하고 AI로 실제 해결 가능한지
- Ease(용이성, 1~10): 비개발자가 4주 안에 MVP를 만들 수 있는지

<결과물의 형태>
- impact, confidence, ease: 정수
- comments: 개선 조언 3~5개. 각 1~2문장, 존댓말("~하면 더 좋아요"), 구체적인 기능·데이터·도구 제안 포함.
  마지막 조언은 '4주 MVP 범위로 무엇부터 만들지'에 대한 제안으로.`;

    case "flow":
      return `<데이터: 선택한 아이디어>
${ideaBlock}

<요청사항>
위 TO-BE를 실현하기 위한 업무 워크플로우를 6~10단계로 나눠줘.
- 한 단계에는 한 가지 동작만, "~한다"로 끝나는 문장으로.
- 입력 자료 수집 → 처리/분석 → 결과물 생성 → 사람 검토 → 최종 확정 흐름을 지켜줘.
- 각 단계를 누가 하는지 actor로 표시: human(사람 판단 필수), ai(생성형 AI), tool(정해진 규칙의 자동화·코드).
- tool에는 다음 중 가장 알맞은 것 하나: ${TOOL_OPTIONS.join(", ")}

<결과물의 형태>
steps 배열. 각 항목 { text, actor, tool }`;

    case "brief":
      return `<데이터: 아이디어>
${ideaBlock}

<데이터: 워크플로우 (★MVP = 먼저 구현할 단계)>
${flowBlock || "-"}

<데이터: 현재 작성한 명령서 초안>
${JSON.stringify(w.brief, null, 2)}

<요청사항>
에이전트 AI에게 '첫 번째 MVP'를 만들어 달라고 요청할 'AI 명령서(요구사항 정의서)'를 다듬어줘.
- ★MVP 단계만 범위에 넣고, 나머지는 '다음 버전'으로 미뤄.
- 비개발자가 4주 안에 만들 수 있는 가장 단순한 형태(form)를 고르되, 이미 정한 형태가 있으면 존중해.
- inputs/outputs는 파일 형식·항목·예시까지 구체적으로.
- rules에는 지켜야 할 규칙, 금지사항(개인정보, 원본 수정 금지 등)을 줄바꿈으로 나열.
- success에는 '이렇게 되면 완성'이라는 확인 기준 3개를 줄바꿈으로.

<결과물의 형태>
{ toolName, oneLiner, users, inputs, outputs, rules, success, form } — form은 다음 중 하나: ${TOOL_OPTIONS.join(", ")}`;

    case "deck":
      return `<데이터: 아이디어>
${ideaBlock}

<데이터: 워크플로우>
${flowBlock || "-"}

<데이터: 만든 도구>
이름: ${w.brief.toolName || "-"} / 한 줄 소개: ${w.brief.oneLiner || "-"}
형태: ${w.brief.form || "-"} / 배포 주소: ${w.build.deployUrl || "-"}
작업 시간: 도입 전 ${w.build.beforeMinutes ?? "-"}분 → 도입 후 ${w.build.afterMinutes ?? "-"}분, 월 ${w.build.timesPerMonth ?? "-"}회
제작 기록:
${clip(w.build.logs.map((l) => `- ${l.date} ${l.title}: ${l.result} ${l.issue ? `(이슈: ${l.issue})` : ""}`).join("\n"), 3000) || "-"}

<요청사항>
5분 데모데이 발표 슬라이드 문구를 써줘. 청중은 같은 기수 동료와 강사야.
- 짧은 개조식, 각 항목 줄바꿈으로 구분, 한 항목 30자 안팎.
- 숫자(시간·횟수·비율)가 있으면 반드시 활용.
- 과장하지 말고 실제 기록에 근거해.

<결과물의 형태>
{ title, subtitle, problem(As-is의 문제 3줄), solution(To-be와 도구 핵심 기능 3줄), results(성과 2~3줄), lessons(배운 점 2~3줄), next(다음 계획 2~3줄) }`;
  }
}

/** 구조화 출력 스키마 (Claude structured outputs) */
export const SCHEMAS: Record<AiTask, Record<string, unknown>> = {
  evaluate: {
    type: "object",
    properties: {
      impact: { type: "integer" },
      confidence: { type: "integer" },
      ease: { type: "integer" },
      comments: { type: "array", items: { type: "string" } },
    },
    required: ["impact", "confidence", "ease", "comments"],
    additionalProperties: false,
  },
  flow: {
    type: "object",
    properties: {
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            actor: { type: "string", enum: ["human", "ai", "tool"] },
            tool: { type: "string" },
          },
          required: ["text", "actor", "tool"],
          additionalProperties: false,
        },
      },
    },
    required: ["steps"],
    additionalProperties: false,
  },
  brief: {
    type: "object",
    properties: Object.fromEntries(
      ["toolName", "oneLiner", "users", "inputs", "outputs", "rules", "success", "form"].map((k) => [k, { type: "string" }]),
    ),
    required: ["toolName", "oneLiner", "users", "inputs", "outputs", "rules", "success", "form"],
    additionalProperties: false,
  },
  deck: {
    type: "object",
    properties: Object.fromEntries(
      ["title", "subtitle", "problem", "solution", "results", "lessons", "next"].map((k) => [k, { type: "string" }]),
    ),
    required: ["title", "subtitle", "problem", "solution", "results", "lessons", "next"],
    additionalProperties: false,
  },
};

/** 4단계: 에이전트 AI에 붙여넣을 '첫 요청' 프롬프트 (AI 없이 템플릿으로 조립) */
export function buildAgentRequest(w: WorkspaceData): string {
  const b = w.brief;
  const mvp = w.flow.filter((s) => s.mvp && s.text.trim());
  return `지금부터 '${b.toolName || "(도구 이름)"}'을(를) 만들 거야. 먼저 계획만 세워서 보여주고, 내가 승인하면 그때 파일을 만들어줘.

## 목적
${b.oneLiner || "(한 줄 소개)"}

## 사용자
${b.users || "(누가 쓰나요?)"}

## 입력
${b.inputs || "(어떤 파일·데이터를 넣나요?)"}
※ 예시 입력 자료는 @material 폴더에 있어.

## 처리 단계 (이번 버전에서 만들 범위)
${mvp.length ? mvp.map((s, i) => `${i + 1}. ${s.text}`).join("\n") : "(3단계에서 ★MVP로 표시한 단계)"}

## 출력
${b.outputs || "(무엇이 어떤 형식으로 나오나요?)"}
※ 원하는 결과물 샘플은 @sample 폴더에 있어. 형식을 최대한 똑같이 맞춰줘.

## 만들 형태
${b.form || "(HTML 단일 파일 / Python / 웹앱 등)"} — 비개발자인 내가 실행할 수 있게, 실행 방법을 README.md에 단계별로 적어줘.

## 규칙
${b.rules || "- 원본 파일은 절대 수정하지 말고 결과는 output 폴더에 저장"}

## 완성 기준
${b.success || "- 샘플 입력으로 실행했을 때 샘플과 같은 형식의 결과가 나온다"}
${b.extra ? `\n## 기타\n${b.extra}` : ""}`;
}

/** 4단계: 프로젝트 폴더에 둘 CLAUDE.md / AGENTS.md */
export function buildClaudeMd(w: WorkspaceData): string {
  const b = w.brief;
  return `# ${b.toolName || "프로젝트 이름"}

${b.oneLiner || "한 줄 소개"}

## 나에 대해
- 나는 개발자가 아니야. 전문 용어는 쉽게 풀어서 설명해줘.
- 작업 전에 항상 계획을 먼저 보여주고 승인을 받아줘.

## 폴더 구조
- material/ : 입력 자료 원본 (읽기만 하고 절대 수정·삭제 금지)
- sample/   : 원하는 결과물 예시 (형식 기준)
- output/   : 도구가 만든 결과물 저장 위치

## 만들 형태
- ${b.form || "(형태)"}
- 실행 방법은 README.md에 단계별로 정리

## 규칙
${b.rules || "- 개인정보·비밀번호·API 키를 코드에 직접 쓰지 말고 .env 파일 사용"}
- 내 허락 없이 git push / 배포 하지 마
- 오류가 나면 원인을 먼저 설명하고 수정해줘

## 완성 기준
${b.success || "- (완성 기준)"}
`;
}
