/** 학습자 워크스페이스(6단계 워크플로우) 데이터 구조 — 클라이언트/서버 공용 */

export const TOOL_OPTIONS = [
  "AI 챗봇(프롬프트)",
  "GPTs·Gem(맞춤 챗봇)",
  "HTML 단일 파일",
  "Python 스크립트",
  "Python 데스크톱 앱",
  "웹앱 + DB",
  "엑셀 VBA",
  "Apps Script",
  "모르겠어요",
] as const;

export type Score = { impact: number; confidence: number; ease: number };

export type Idea = {
  id: string;
  title: string;
  asis: string;
  tobe: string;
  target: string; // 영향 대상 (나 / 우리 팀 / 고객 …)
  frequency: string; // 얼마나 자주 (예: 주 3회)
  minutes: number | null; // 1회 소요 시간(분)
  difficulty: "" | "낮음" | "보통" | "높음";
  tools: string[];
  self: Score | null; // 자가 평가
  ai: (Score & { comments: string[] }) | null; // AI 평가
};

export type FlowStep = {
  id: string;
  text: string;
  actor: "" | "human" | "ai" | "tool";
  tool: string;
  value: number; // 효과 1~5 (3단계)
  effort: number; // 난이도 1~5 (3단계)
  mvp: boolean; // 먼저 구현
};

export type Brief = {
  toolName: string;
  oneLiner: string;
  users: string;
  inputs: string;
  outputs: string;
  rules: string;
  success: string;
  form: string; // 만들 형태 (TOOL_OPTIONS)
  extra: string;
};

export type BuildLog = {
  id: string;
  date: string;
  title: string;
  prompt: string;
  result: string;
  issue: string;
  assetIds: number[];
};

export type Deck = {
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  demoNote: string;
  demoAssetIds: number[];
  results: string;
  lessons: string;
  next: string;
  coverAssetId: number | null;
};

export type WorkspaceData = {
  ideas: Idea[];
  selectedIdeaId: string | null;
  flow: FlowStep[];
  brief: Brief;
  build: {
    githubUrl: string;
    deployUrl: string;
    beforeMinutes: number | null;
    afterMinutes: number | null;
    timesPerMonth: number | null;
    logs: BuildLog[];
  };
  deck: Deck;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyIdea(): Idea {
  return {
    id: uid(),
    title: "",
    asis: "",
    tobe: "",
    target: "",
    frequency: "",
    minutes: null,
    difficulty: "",
    tools: [],
    self: null,
    ai: null,
  };
}

export function emptyStep(text = ""): FlowStep {
  return { id: uid(), text, actor: "", tool: "", value: 3, effort: 3, mvp: false };
}

export function defaultWorkspace(): WorkspaceData {
  const first = emptyIdea();
  return {
    ideas: [first],
    selectedIdeaId: first.id,
    flow: [emptyStep()],
    brief: {
      toolName: "",
      oneLiner: "",
      users: "",
      inputs: "",
      outputs: "",
      rules: "",
      success: "",
      form: "",
      extra: "",
    },
    build: {
      githubUrl: "",
      deployUrl: "",
      beforeMinutes: null,
      afterMinutes: null,
      timesPerMonth: null,
      logs: [],
    },
    deck: {
      title: "",
      subtitle: "",
      problem: "",
      solution: "",
      demoNote: "",
      demoAssetIds: [],
      results: "",
      lessons: "",
      next: "",
      coverAssetId: null,
    },
  };
}

/** 저장된 데이터(이전 버전 포함)를 현재 구조로 보정 */
export function normalizeWorkspace(raw: unknown): WorkspaceData {
  const d = defaultWorkspace();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<WorkspaceData>;
  const ideas = Array.isArray(r.ideas) && r.ideas.length ? r.ideas.map((i) => ({ ...emptyIdea(), ...i })) : d.ideas;
  return {
    ideas,
    selectedIdeaId: r.selectedIdeaId && ideas.some((i) => i.id === r.selectedIdeaId) ? r.selectedIdeaId : ideas[0].id,
    flow: Array.isArray(r.flow) && r.flow.length ? r.flow.map((s) => ({ ...emptyStep(), ...s })) : d.flow,
    brief: { ...d.brief, ...(r.brief ?? {}) },
    build: {
      ...d.build,
      ...(r.build ?? {}),
      logs: Array.isArray(r.build?.logs) ? r.build!.logs : [],
    },
    deck: { ...d.deck, ...(r.deck ?? {}) },
  };
}

export const STEPS = [
  { no: 1, key: "idea", title: "아이디어", sub: "As-is → To-be", week: "1주차" },
  { no: 2, key: "flow", title: "워크플로우", sub: "단계 분해", week: "1주차" },
  { no: 3, key: "priority", title: "우선순위", sub: "MVP 정하기", week: "1주차" },
  { no: 4, key: "brief", title: "AI 명령서", sub: "요구사항·CLAUDE.md", week: "2주차" },
  { no: 5, key: "build", title: "제작 기록", sub: "로그·배포·성과", week: "2~4주차" },
  { no: 6, key: "deck", title: "발표", sub: "PT 만들기", week: "4주차" },
] as const;

/**
 * 주차(수업) ↔ 단계(워크스페이스) 연결표.
 * 수업은 4주, 워크스페이스는 6단계 — 매주 어떤 단계를 하는지 화면 곳곳에서 이 표를 기준으로 보여줍니다.
 */
export const WEEK_PLAN = [
  { week: 1, title: "문제를 찾고, 일을 쪼갠다", steps: [1, 2, 3], todo: ["아이디어를 As-is/To-be로 쓰고 1개 확정", "워크플로우 6~10단계로 쪼개기", "★MVP 단계와 만들 형태 정하기"] },
  { week: 2, title: "에이전트 AI로 첫 MVP 만들기", steps: [4, 5], todo: ["AI 명령서 작성 → 첫 요청문·CLAUDE.md 복사", "내 PC에서 v0.1 만들기", "제작 기록에 요청·결과·스크린샷 남기기"] },
  { week: 3, title: "배포하고, 데이터를 붙인다", steps: [5], todo: ["GitHub 주소·배포 주소 등록", "제작 기록 계속 쌓기", "실제 자료로 써보고 도입 전/후 시간 측정"] },
  { week: 4, title: "다듬고, 검증하고, 발표한다", steps: [5, 6], todo: ["성과(도입 전/후 시간) 입력", "발표 PT 다듬고 데모 화면 선택", "기수 갤러리에 공유 → 발표"] },
] as const;

export const stepRange = (steps: readonly number[]) =>
  steps.length > 1 ? `${steps[0]}~${steps[steps.length - 1]}단계` : `${steps[0]}단계`;

/** 단계별 완료 여부(관리자 대시보드·학습자 진행률 공용) */
export function stepCompletion(w: WorkspaceData): boolean[] {
  const idea = w.ideas.find((i) => i.id === w.selectedIdeaId) ?? w.ideas[0];
  const filledSteps = w.flow.filter((s) => s.text.trim());
  return [
    !!(idea && idea.title.trim() && idea.asis.trim() && idea.tobe.trim()),
    filledSteps.length >= 3 && filledSteps.every((s) => s.actor),
    w.flow.some((s) => s.mvp) && !!w.brief.form,
    !!(w.brief.toolName.trim() && w.brief.inputs.trim() && w.brief.outputs.trim()),
    w.build.logs.length > 0 || !!w.build.deployUrl.trim(),
    !!(w.deck.problem.trim() || w.deck.solution.trim()) && !!w.deck.title.trim(),
  ];
}

export function selectedIdea(w: WorkspaceData) {
  return w.ideas.find((i) => i.id === w.selectedIdeaId) ?? w.ideas[0];
}

export function savedHoursPerMonth(w: WorkspaceData): number | null {
  const { beforeMinutes: b, afterMinutes: a, timesPerMonth: t } = w.build;
  if (b == null || a == null || t == null) return null;
  return Math.round((((b - a) * t) / 60) * 10) / 10;
}
