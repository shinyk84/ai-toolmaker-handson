/** 수업 PT와 학습자 발표 PT가 함께 쓰는 슬라이드 데이터 형식 */

export type Bullet = string | { t: string; sub?: string[] };
export type Tone = "muted" | "brand" | "accent" | "ok";

export type Slide = { notes?: string } & (
  | { type: "cover"; kicker?: string; title: string; subtitle?: string; meta?: string; image?: string }
  | { type: "section"; no?: string; title: string; subtitle?: string }
  | { type: "bullets"; title: string; lead?: string; bullets: Bullet[]; tip?: string }
  | { type: "cols"; title: string; lead?: string; cols: { head: string; tone?: Tone; items: string[] }[]; tip?: string }
  | { type: "steps"; title: string; lead?: string; steps: { t: string; d?: string; tag?: string }[]; tip?: string }
  | { type: "prompt"; title: string; lead?: string; code: string; tip?: string }
  | { type: "table"; title: string; lead?: string; head: string[]; rows: string[][]; tip?: string }
  | { type: "checklist"; title: string; lead?: string; items: string[]; time?: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "grid"; title: string; lead?: string; cards: { icon?: string; t: string; d: string }[]; tip?: string }
  | { type: "agenda"; title: string; items: { time: string; t: string; d?: string }[] }
  | {
      type: "media";
      title: string;
      lead?: string;
      media: { url: string; kind: "image" | "video"; caption?: string }[];
      bullets?: string[];
      link?: string;
    }
  | { type: "metric"; title: string; metrics: { label: string; value: string; sub?: string }[]; bullets?: string[] }
  | { type: "flow"; title: string; lead?: string; steps: { t: string; actor?: string; mvp?: boolean }[] }
);

export type Deck = {
  id: string;
  week: number;
  title: string;
  subtitle: string;
  goal: string[];
  slides: Slide[];
};
