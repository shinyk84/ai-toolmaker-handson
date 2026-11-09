/** 학습자 워크스페이스 → 발표 슬라이드 자동 변환 (6단계 · 발표 보기 · 갤러리 공용) */
import type { Slide } from "./slides";
import { savedHoursPerMonth, selectedIdea, type WorkspaceData } from "./workspace";

export type AssetLite = { id: number; url: string; kind: string; caption: string };

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*·]\s*/, "").trim())
    .filter(Boolean);

export function buildLearnerSlides(w: WorkspaceData, assets: AssetLite[], name: string, cohort: string): Slide[] {
  const idea = selectedIdea(w);
  const d = w.deck;
  const byId = new Map(assets.map((a) => [a.id, a]));
  const cover = d.coverAssetId ? byId.get(d.coverAssetId) : undefined;
  const demo = d.demoAssetIds
    .map((id) => byId.get(id))
    .filter((a): a is AssetLite => !!a && (a.kind === "image" || a.kind === "video"))
    .slice(0, 4);
  const saved = savedHoursPerMonth(w);
  const flow = w.flow.filter((s) => s.text.trim());

  const slides: Slide[] = [
    {
      type: "cover",
      kicker: cohort,
      title: d.title || w.brief.toolName || idea.title || "나의 AI 도구",
      subtitle: d.subtitle || w.brief.oneLiner || "",
      meta: name,
      image: cover && cover.kind === "image" ? cover.url : undefined,
    },
    {
      type: "cols",
      title: "문제 — 지금은 이렇게 하고 있었습니다",
      cols: [
        { head: "AS-IS", tone: "muted", items: lines(d.problem || idea.asis).slice(0, 7) },
        {
          head: "얼마나 자주, 얼마나 오래",
          tone: "accent",
          items: [
            idea.target ? `대상: ${idea.target}` : "",
            idea.frequency ? `빈도: ${idea.frequency}` : "",
            idea.minutes != null ? `1회 소요: ${idea.minutes}분` : "",
          ].filter(Boolean),
        },
      ],
    },
    {
      type: "bullets",
      title: "해결 — 이렇게 바꿨습니다",
      lead: w.brief.oneLiner || undefined,
      bullets: lines(d.solution || idea.tobe).slice(0, 6),
    },
  ];

  if (flow.length) {
    slides.push({
      type: "flow",
      title: "워크플로우 — 사람과 AI의 역할 분담",
      lead: "★ 표시는 이번 버전(MVP)에서 구현한 단계",
      steps: flow.slice(0, 12).map((s) => ({ t: s.text, actor: s.actor || undefined, mvp: s.mvp })),
    });
  }

  slides.push({
    type: "media",
    title: "데모",
    lead: w.brief.form ? `형태: ${w.brief.form}` : undefined,
    media: demo.map((a) => ({ url: a.url, kind: a.kind as "image" | "video", caption: a.caption })),
    bullets: lines(d.demoNote).slice(0, 5),
    link: w.build.deployUrl || undefined,
  });

  const { beforeMinutes: b, afterMinutes: a, timesPerMonth: t } = w.build;
  if (b != null || a != null || lines(d.results).length) {
    const metrics = [];
    if (b != null) metrics.push({ label: "도입 전 1회", value: `${b}분` });
    if (a != null) metrics.push({ label: "도입 후 1회", value: `${a}분` });
    if (saved != null) metrics.push({ label: "월 절감", value: `${saved}시간`, sub: t != null ? `월 ${t}회 기준` : undefined });
    slides.push({ type: "metric", title: "성과", metrics, bullets: lines(d.results).slice(0, 4) });
  }

  if (lines(d.lessons).length || lines(d.next).length) {
    slides.push({
      type: "cols",
      title: "배운 점과 다음 계획",
      cols: [
        { head: "배운 점", tone: "muted", items: lines(d.lessons).slice(0, 5) },
        { head: "다음 버전", tone: "brand", items: lines(d.next).slice(0, 5) },
      ],
    });
  }

  slides.push({ type: "quote", text: "감사합니다", by: `${name} · ${w.brief.toolName || idea.title}` });
  return slides;
}
