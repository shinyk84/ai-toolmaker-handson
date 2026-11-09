import type { Bullet, Slide, Tone } from "@/lib/slides";

const toneCls: Record<Tone, { head: string; box: string }> = {
  muted: { head: "bg-[#eef0f6] text-ink-2", box: "border-line" },
  brand: { head: "bg-brand text-white", box: "border-brand/30" },
  accent: { head: "bg-accent text-white", box: "border-accent/40" },
  ok: { head: "bg-ok text-white", box: "border-ok/30" },
};

const actorLabel: Record<string, { t: string; c: string }> = {
  ai: { t: "AI", c: "bg-brand text-white" },
  human: { t: "사람", c: "bg-[#eef0f6] text-ink-2" },
  tool: { t: "자동화", c: "bg-accent text-white" },
};

function Title({ children, lead }: { children: React.ReactNode; lead?: string }) {
  return (
    <div className="mb-[1.1em]">
      <h2 className="text-[1.75em] font-extrabold leading-[1.25] tracking-[-0.02em]">{children}</h2>
      {lead && <p className="mt-[0.35em] text-[0.95em] text-ink-2">{lead}</p>}
    </div>
  );
}

function Tip({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <div className="mt-auto pt-[0.8em]">
      <div className="flex items-start gap-[0.5em] rounded-[0.5em] bg-accent-soft px-[0.9em] py-[0.55em] text-[0.82em] text-[#7a3d00]">
        <span className="font-bold">TIP</span>
        <span className="whitespace-pre-line">{children}</span>
      </div>
    </div>
  );
}

function BulletList({ items, big }: { items: Bullet[]; big?: boolean }) {
  return (
    <ul className={`space-y-[0.55em] ${big ? "text-[1.08em]" : "text-[0.98em]"}`}>
      {items.map((b, i) => {
        const t = typeof b === "string" ? b : b.t;
        const sub = typeof b === "string" ? undefined : b.sub;
        return (
          <li key={i} className="flex gap-[0.6em]">
            <span className="mt-[0.55em] h-[0.42em] w-[0.42em] shrink-0 rounded-full bg-accent" />
            <div>
              <div className="whitespace-pre-line">{t}</div>
              {sub && (
                <ul className="mt-[0.25em] space-y-[0.15em] text-[0.86em] text-ink-2">
                  {sub.map((s, j) => (
                    <li key={j}>– {s}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Body({ s }: { s: Slide }) {
  switch (s.type) {
    case "cover":
      return (
        <div className="flex h-full">
          <div className="flex flex-1 flex-col justify-center px-[7%]">
            {s.kicker && (
              <div className="mb-[1em] inline-flex w-fit rounded-full bg-accent-soft px-[0.9em] py-[0.25em] text-[0.8em] font-bold text-accent">
                {s.kicker}
              </div>
            )}
            <h1 className="text-[2.6em] font-black leading-[1.18] tracking-[-0.03em] whitespace-pre-line">{s.title}</h1>
            {s.subtitle && <p className="mt-[0.8em] text-[1.15em] text-ink-2 whitespace-pre-line">{s.subtitle}</p>}
            {s.meta && <p className="mt-[2em] text-[0.85em] font-semibold text-ink-3">{s.meta}</p>}
          </div>
          {s.image ? (
            <div className="relative w-[42%] bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : (
            <div className="relative w-[30%] overflow-hidden bg-brand">
              <div className="absolute -left-[30%] top-[18%] h-[60%] w-[120%] rotate-[-12deg] bg-brand-2 opacity-60" />
              <div className="absolute bottom-[10%] right-[12%] h-[18%] aspect-square rounded-full bg-accent" />
            </div>
          )}
        </div>
      );
    case "section":
      return (
        <div className="flex h-full flex-col justify-center bg-brand px-[8%] text-white">
          {s.no && <div className="text-[1em] font-bold tracking-[0.2em] text-accent">{s.no}</div>}
          <h2 className="mt-[0.3em] text-[2.4em] font-black leading-[1.2] tracking-[-0.02em]">{s.title}</h2>
          {s.subtitle && <p className="mt-[0.6em] text-[1.05em] text-white/75 whitespace-pre-line">{s.subtitle}</p>}
        </div>
      );
    case "bullets":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <BulletList items={s.bullets} big={s.bullets.length <= 4} />
          <Tip>{s.tip}</Tip>
        </Frame>
      );
    case "cols":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <div className="grid flex-1 gap-[0.9em]" style={{ gridTemplateColumns: `repeat(${s.cols.length}, minmax(0,1fr))` }}>
            {s.cols.map((c, i) => {
              const tone = toneCls[c.tone ?? (i === s.cols.length - 1 && s.cols.length > 1 ? "brand" : "muted")];
              return (
                <div key={i} className={`flex flex-col overflow-hidden rounded-[0.6em] border ${tone.box}`}>
                  <div className={`px-[0.9em] py-[0.45em] text-[0.92em] font-bold ${tone.head}`}>{c.head}</div>
                  <ul className="space-y-[0.4em] p-[0.9em] text-[0.86em]">
                    {c.items.map((it, j) => (
                      <li key={j} className="flex gap-[0.45em]">
                        <span className="text-ink-3">•</span>
                        <span className="whitespace-pre-line">{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <Tip>{s.tip}</Tip>
        </Frame>
      );
    case "steps":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <ol className={`grid gap-[0.55em] ${s.steps.length > 5 ? "grid-cols-2" : ""}`}>
            {s.steps.map((st, i) => (
              <li key={i} className="flex items-start gap-[0.7em] rounded-[0.55em] border border-line px-[0.8em] py-[0.5em]">
                <span className="flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center rounded-full bg-brand text-[0.8em] font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[0.95em] font-bold">
                    {st.t}
                    {st.tag && <span className="ml-[0.5em] rounded bg-accent-soft px-[0.4em] text-[0.7em] text-accent">{st.tag}</span>}
                  </div>
                  {st.d && <div className="text-[0.8em] text-ink-2 whitespace-pre-line">{st.d}</div>}
                </div>
              </li>
            ))}
          </ol>
          <Tip>{s.tip}</Tip>
        </Frame>
      );
    case "prompt": {
      // 코드 영역에 쓸 수 있는 높이(슬라이드 기본 글자 em 단위)를 줄 수로 나눠 글자 크기 결정,
      // 너무 작아지면 가운데에 가장 가까운 빈 줄에서 2단으로 나눔 (문단 중간에서 끊기지 않게)
      const all = s.code.split("\n");
      const avail = 16 - (s.tip ? 3.6 : 0) - (s.lead ? 1.5 : 0); // 코드 상자 높이 (기본 글자 em)
      const lineW = (l: string) => [...l].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 0.95 : 0.55), 0); // 한글/영문 폭
      // 글자 크기 sz에서 줄바꿈까지 포함한 실제 줄 수가 상자에 들어가는지
      const fits = (parts: string[][], sz: number) => {
        const colW = (40 - (parts.length - 1) * 2) / parts.length;
        const rows = Math.max(...parts.map((p) => p.reduce((n, l) => n + Math.max(1, Math.ceil((lineW(l) * sz) / colW)), 0)));
        return rows * 1.55 * sz + 1.6 * sz <= avail;
      };
      const best = (parts: string[][]) => {
        for (let sz = 0.72; sz > 0.3; sz -= 0.02) if (fits(parts, sz)) return sz;
        return 0.3;
      };
      let parts = [all];
      let size = best(parts);
      if (size < 0.6 && all.length > 10) {
        const blanks = all.map((l, i) => (l.trim() === "" ? i : -1)).filter((i) => i > 0);
        const mid = all.length / 2;
        const cut = blanks.length ? blanks.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : Math.ceil(mid);
        const two = [all.slice(0, cut), all.slice(cut).filter((l, i) => i > 0 || l.trim() !== "")];
        const size2 = best(two);
        if (size2 >= size + 0.1) [parts, size] = [two, size2];
      }
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <div
            className={`grid min-h-0 flex-1 content-start gap-[2em] overflow-hidden rounded-[0.6em] bg-[#161a2e] p-[1em] ${parts.length > 1 ? "grid-cols-2" : ""}`}
            style={{ fontSize: `${size}em` }}
          >
            {parts.map((p, i) => (
              <pre key={i} className="font-mono leading-[1.55] text-[#e8eaf6] whitespace-pre-wrap">
                {p.join("\n")}
              </pre>
            ))}
          </div>
          <Tip>{s.tip}</Tip>
        </Frame>
      );
    }
    case "table":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <div className="overflow-hidden rounded-[0.6em] border border-line">
            <table className="w-full border-collapse text-[0.8em]">
              <thead>
                <tr className="bg-brand text-left text-white">
                  {s.head.map((h, i) => (
                    <th key={i} className="px-[0.8em] py-[0.45em] font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r, i) => (
                  <tr key={i} className={i % 2 ? "bg-canvas" : "bg-white"}>
                    {r.map((c, j) => (
                      <td key={j} className={`px-[0.8em] py-[0.42em] align-top whitespace-pre-line ${j === 0 ? "font-semibold" : ""}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Tip>{s.tip}</Tip>
        </Frame>
      );
    case "checklist":
      return (
        <Frame>
          <div className="mb-[1em] flex items-end justify-between gap-[1em]">
            <div>
              <div className="mb-[0.3em] text-[0.8em] font-bold tracking-[0.15em] text-accent">PRACTICE</div>
              <h2 className="text-[1.75em] font-extrabold leading-[1.25] tracking-[-0.02em]">{s.title}</h2>
              {s.lead && <p className="mt-[0.3em] text-[0.95em] text-ink-2">{s.lead}</p>}
            </div>
            {s.time && <div className="shrink-0 rounded-full bg-brand px-[0.9em] py-[0.3em] text-[0.85em] font-bold text-white">⏱ {s.time}</div>}
          </div>
          <ul className="space-y-[0.5em]">
            {s.items.map((it, i) => (
              <li key={i} className="flex items-start gap-[0.6em] text-[1em]">
                <span className="mt-[0.2em] flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-[0.25em] border-2 border-brand" />
                <span className="whitespace-pre-line">{it}</span>
              </li>
            ))}
          </ul>
        </Frame>
      );
    case "quote":
      return (
        <div className="flex h-full flex-col justify-center px-[12%]">
          <div className="text-[4em] font-black leading-none text-accent">“</div>
          <p className="text-[1.7em] font-bold leading-[1.45] tracking-[-0.02em] whitespace-pre-line">{s.text}</p>
          {s.by && <p className="mt-[1em] text-[0.95em] text-ink-2">— {s.by}</p>}
        </div>
      );
    case "grid":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <div className={`grid gap-[0.7em] ${s.cards.length > 6 ? "grid-cols-4" : s.cards.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}>
            {s.cards.map((c, i) => (
              <div key={i} className="rounded-[0.6em] border border-line bg-white p-[0.8em]">
                <div className="flex items-center gap-[0.45em] text-[0.92em] font-bold">
                  {c.icon && <span>{c.icon}</span>}
                  {c.t}
                </div>
                <div className="mt-[0.3em] text-[0.76em] leading-[1.5] text-ink-2 whitespace-pre-line">{c.d}</div>
              </div>
            ))}
          </div>
          <Tip>{s.tip}</Tip>
        </Frame>
      );
    case "agenda":
      return (
        <Frame>
          <Title>{s.title}</Title>
          <ol className="space-y-[0.35em]">
            {s.items.map((it, i) => (
              <li key={i} className="flex items-baseline gap-[1em] border-b border-line-2 pb-[0.35em]">
                <span className="w-[5.5em] shrink-0 font-mono text-[0.85em] font-bold text-brand">{it.time}</span>
                <span className="text-[1em] font-semibold">{it.t}</span>
                {it.d && <span className="text-[0.82em] text-ink-3">{it.d}</span>}
              </li>
            ))}
          </ol>
        </Frame>
      );
    case "media":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <div className="flex min-h-0 flex-1 gap-[1em]">
            <div className={`grid min-h-0 flex-[3] gap-[0.6em] ${s.media.length > 1 ? "grid-cols-2" : ""}`}>
              {s.media.length === 0 && (
                <div className="flex items-center justify-center rounded-[0.6em] border-2 border-dashed border-line text-[0.85em] text-ink-3">
                  자료실에서 스크린샷·데모 영상을 선택하세요
                </div>
              )}
              {s.media.map((m, i) => (
                <figure key={i} className="flex min-h-0 flex-col">
                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-[0.5em] border border-line bg-canvas">
                    {m.kind === "video" ? (
                      <video src={m.url} controls className="absolute inset-0 h-full w-full object-contain" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt={m.caption ?? ""} className="absolute inset-0 h-full w-full object-contain" />
                    )}
                  </div>
                  {m.caption && <figcaption className="mt-[0.3em] text-[0.7em] text-ink-3">{m.caption}</figcaption>}
                </figure>
              ))}
            </div>
            {(s.bullets?.length || s.link) && (
              <div className="flex flex-[2] flex-col gap-[0.8em]">
                {s.bullets && <BulletList items={s.bullets} />}
                {s.link && (
                  <div className="mt-auto rounded-[0.5em] bg-brand-soft px-[0.8em] py-[0.5em] text-[0.75em] break-all text-brand">🔗 {s.link}</div>
                )}
              </div>
            )}
          </div>
        </Frame>
      );
    case "metric":
      return (
        <Frame>
          <Title>{s.title}</Title>
          <div className="grid gap-[0.8em]" style={{ gridTemplateColumns: `repeat(${Math.max(1, s.metrics.length)}, minmax(0,1fr))` }}>
            {s.metrics.map((m, i) => (
              <div key={i} className={`rounded-[0.7em] p-[1em] ${i === s.metrics.length - 1 ? "bg-brand text-white" : "bg-canvas"}`}>
                <div className={`text-[0.8em] font-semibold ${i === s.metrics.length - 1 ? "text-white/75" : "text-ink-2"}`}>{m.label}</div>
                <div className="mt-[0.2em] text-[2.2em] font-black tracking-[-0.03em]">{m.value}</div>
                {m.sub && <div className={`text-[0.75em] ${i === s.metrics.length - 1 ? "text-white/75" : "text-ink-3"}`}>{m.sub}</div>}
              </div>
            ))}
          </div>
          {s.bullets && (
            <div className="mt-[1.2em]">
              <BulletList items={s.bullets} />
            </div>
          )}
        </Frame>
      );
    case "flow":
      return (
        <Frame>
          <Title lead={s.lead}>{s.title}</Title>
          <ol className={`grid gap-[0.45em] ${s.steps.length > 6 ? "grid-cols-2" : ""}`}>
            {s.steps.map((st, i) => {
              const a = actorLabel[st.actor ?? ""];
              return (
                <li
                  key={i}
                  className={`flex items-center gap-[0.6em] rounded-[0.5em] border px-[0.75em] py-[0.45em] ${st.mvp ? "border-accent bg-accent-soft" : "border-line"}`}
                >
                  <span className="w-[1.4em] shrink-0 text-[0.85em] font-black text-brand">{i + 1}</span>
                  <span className="flex-1 text-[0.82em] leading-[1.45]">{st.t}</span>
                  {a && <span className={`shrink-0 rounded-full px-[0.6em] py-[0.1em] text-[0.65em] font-bold ${a.c}`}>{a.t}</span>}
                  {st.mvp && <span className="shrink-0 text-[0.7em] font-bold text-accent">★MVP</span>}
                </li>
              );
            })}
          </ol>
        </Frame>
      );
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col px-[5.5%] pb-[6%] pt-[4.5%]">{children}</div>;
}

export default function SlideView({ slide, footer, page }: { slide: Slide; footer?: string; page?: string }) {
  const dark = slide.type === "section";
  return (
    <div className="slide-root w-full">
      <div className="slide">
        <Body s={slide} />
        {slide.type !== "cover" && (footer || page) && (
          <div
            className={`pointer-events-none absolute inset-x-[5.5%] bottom-[2.2%] flex justify-between text-[0.6em] font-semibold ${dark ? "text-white/50" : "text-ink-3"}`}
          >
            <span>{footer}</span>
            <span>{page}</span>
          </div>
        )}
      </div>
    </div>
  );
}
