"""
수업 PT(JSON) → PowerPoint(.pptx) 변환기

웹앱의 수업 PT와 같은 원본(src/content/weekN.json)으로 편집 가능한 PPT 파일을 만듭니다.
  사용법:  pip install python-pptx
           python tools/build_pptx.py            → dist/1주차.pptx ~ 4주차.pptx
           python tools/build_pptx.py 2          → 2주차만
강사 노트(notes)는 PPT의 '슬라이드 노트'로 들어갑니다.
"""
import json
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content"
OUT = ROOT / "dist"

INK = RGBColor(0x16, 0x1A, 0x2E)
INK2 = RGBColor(0x4A, 0x50, 0x68)
INK3 = RGBColor(0x8A, 0x8F, 0xA6)
BRAND = RGBColor(0x23, 0x30, 0x7A)
BRAND2 = RGBColor(0x3A, 0x4B, 0xB0)
ACCENT = RGBColor(0xEE, 0x7D, 0x16)
ACCENT_SOFT = RGBColor(0xFF, 0xF1, 0xE3)
CANVAS = RGBColor(0xF5, 0xF6, 0xFA)
LINE = RGBColor(0xE3, 0xE5, 0xEE)
MUTED = RGBColor(0xEE, 0xF0, 0xF6)
OK = RGBColor(0x18, 0x8A, 0x55)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CODE_BG = RGBColor(0x16, 0x1A, 0x2E)
CODE_FG = RGBColor(0xE8, 0xEA, 0xF6)

FONT = "Pretendard"  # 없으면 PowerPoint가 맑은 고딕 등으로 대체
MONO = "D2Coding"

W, H = Emu(12192000), Emu(6858000)  # 16:9
MX = Emu(int(W * 0.055))
CW = W - 2 * MX


def tone_colors(tone):
    return {
        "muted": (MUTED, INK2),
        "brand": (BRAND, WHITE),
        "accent": (ACCENT, WHITE),
        "ok": (OK, WHITE),
    }.get(tone or "muted", (MUTED, INK2))


def rect(slide, x, y, w, h, fill=None, line=None, shape=MSO_SHAPE.RECTANGLE, radius=None):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(0.75)
    s.shadow.inherit = False
    return s


def text(slide, x, y, w, h, value, size=18, color=INK, bold=False, font=FONT, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.15):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Emu(0)
    tf.margin_top = tf.margin_bottom = Emu(0)
    lines = str(value).split("\n")
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        r = p.add_run()
        r.text = line
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
        r.font.name = font
    return tb


def bullets(slide, x, y, w, h, items, size=18, color=INK, gap=8, marker="•", marker_color=ACCENT):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Emu(0)
    first = True
    for it in items:
        t = (it if isinstance(it, str) else it.get("t", "")).replace("\n", " ")
        subs = [] if isinstance(it, str) else it.get("sub", [])
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_before = Pt(gap)
        p.line_spacing = 1.15
        m = p.add_run()
        m.text = f"{marker}  "
        m.font.size = Pt(size)
        m.font.color.rgb = marker_color
        m.font.bold = True
        m.font.name = FONT
        r = p.add_run()
        r.text = t
        r.font.size = Pt(size)
        r.font.color.rgb = color
        r.font.name = FONT
        for s in subs:
            sp = tf.add_paragraph()
            sp.level = 1
            sp.space_before = Pt(2)
            sr = sp.add_run()
            sr.text = f"    – {s}"
            sr.font.size = Pt(size * 0.78)
            sr.font.color.rgb = INK2
            sr.font.name = FONT
    return tb


def title(slide, value, lead=None, kicker=None):
    y = Emu(int(H * 0.08))
    if kicker:
        text(slide, MX, y - Emu(330000), CW, Emu(300000), kicker, size=12, color=ACCENT, bold=True)
    text(slide, MX, y, CW, Emu(700000), value, size=30, bold=True)
    y += Emu(720000)
    if lead:
        text(slide, MX, y, CW, Emu(400000), lead, size=16, color=INK2)
        y += Emu(480000)
    return y + Emu(120000)


def tip(slide, value):
    if not value:
        return
    h = Emu(560000)
    y = H - Emu(int(H * 0.08)) - h
    rect(slide, MX, y, CW, h, fill=ACCENT_SOFT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    text(slide, MX + Emu(200000), y, CW - Emu(400000), h, "TIP   " + value, size=13, color=RGBColor(0x7A, 0x3D, 0x00), anchor=MSO_ANCHOR.MIDDLE)


def footer(slide, label, page):
    y = H - Emu(int(H * 0.055))
    text(slide, MX, y, CW // 2, Emu(250000), label, size=10, color=INK3)
    text(slide, MX + CW // 2, y, CW // 2, Emu(250000), page, size=10, color=INK3, align=PP_ALIGN.RIGHT)


def render(prs, s, label, page):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    t = s["type"]
    bottom = H - Emu(int(H * 0.1)) - (Emu(640000) if s.get("tip") else 0)

    if t == "cover":
        rect(slide, int(W * 0.7), 0, W - int(W * 0.7), H, fill=BRAND)
        rect(slide, int(W * 0.84), int(H * 0.7), Emu(900000), Emu(900000), fill=ACCENT, shape=MSO_SHAPE.OVAL)
        x, w = Emu(int(W * 0.07)), Emu(int(W * 0.6))
        if s.get("kicker"):
            text(slide, x, Emu(int(H * 0.22)), w, Emu(350000), s["kicker"], size=14, color=ACCENT, bold=True)
        text(slide, x, Emu(int(H * 0.3)), w, Emu(1800000), s["title"], size=44, bold=True, spacing=1.05)
        if s.get("subtitle"):
            text(slide, x, Emu(int(H * 0.6)), w, Emu(600000), s["subtitle"], size=20, color=INK2)
        if s.get("meta"):
            text(slide, x, Emu(int(H * 0.75)), w, Emu(400000), s["meta"], size=13, color=INK3, bold=True)

    elif t == "section":
        rect(slide, 0, 0, W, H, fill=BRAND)
        x = Emu(int(W * 0.08))
        if s.get("no"):
            text(slide, x, Emu(int(H * 0.33)), CW, Emu(400000), s["no"], size=16, color=ACCENT, bold=True)
        text(slide, x, Emu(int(H * 0.4)), CW, Emu(900000), s["title"], size=40, color=WHITE, bold=True)
        if s.get("subtitle"):
            text(slide, x, Emu(int(H * 0.56)), CW, Emu(800000), s["subtitle"], size=18, color=RGBColor(0xC8, 0xCC, 0xE8))

    elif t == "bullets":
        y = title(slide, s["title"], s.get("lead"))
        bullets(slide, MX, y, CW, bottom - y, s["bullets"], size=20 if len(s["bullets"]) <= 4 else 18)
        tip(slide, s.get("tip"))

    elif t == "cols":
        y = title(slide, s["title"], s.get("lead"))
        n = len(s["cols"])
        gap = Emu(200000)
        cw = (CW - gap * (n - 1)) // n
        for i, c in enumerate(s["cols"]):
            tone = c.get("tone") or ("brand" if i == n - 1 and n > 1 else "muted")
            fill, fg = tone_colors(tone)
            x = MX + i * (cw + gap)
            rect(slide, x, y, cw, bottom - y, fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.04)
            rect(slide, x, y, cw, Emu(460000), fill=fill, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
            text(slide, x + Emu(180000), y, cw - Emu(360000), Emu(460000), c["head"], size=15, color=fg, bold=True, anchor=MSO_ANCHOR.MIDDLE)
            bullets(slide, x + Emu(180000), y + Emu(560000), cw - Emu(360000), bottom - y - Emu(600000), c["items"], size=14, gap=6, marker_color=INK3)
        tip(slide, s.get("tip"))

    elif t in ("steps", "flow"):
        y = title(slide, s["title"], s.get("lead"))
        items = s["steps"]
        two = len(items) > (5 if t == "steps" else 6)
        cols = 2 if two else 1
        rows = (len(items) + cols - 1) // cols
        gap = Emu(120000)
        rh = min(Emu(720000), (bottom - y - gap * (rows - 1)) // rows)
        cw = (CW - Emu(200000) * (cols - 1)) // cols
        for i, st in enumerate(items):
            r, c = (i % rows, i // rows) if two else (i, 0)
            x = MX + c * (cw + Emu(200000))
            yy = y + r * (rh + gap)
            mvp = st.get("mvp")
            rect(slide, x, yy, cw, rh, fill=ACCENT_SOFT if mvp else WHITE, line=ACCENT if mvp else LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
            d = Emu(int(rh * 0.5))
            circ = rect(slide, x + Emu(140000), yy + (rh - d) // 2, d, d, fill=BRAND, shape=MSO_SHAPE.OVAL)
            circ.text_frame.text = str(i + 1)
            p = circ.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            p.runs[0].font.size = Pt(12)
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = WHITE
            tx = x + Emu(140000) + d + Emu(160000)
            tw = cw - (tx - x) - Emu(140000)
            if t == "steps":
                label_ = st["t"] + (f"  [{st['tag']}]" if st.get("tag") else "")
                body = label_ + ("\n" + st["d"] if st.get("d") else "")
                tb = text(slide, tx, yy, tw, rh, body, size=13, anchor=MSO_ANCHOR.MIDDLE)
                tb.text_frame.paragraphs[0].runs[0].font.bold = True
                for p in tb.text_frame.paragraphs[1:]:
                    for r_ in p.runs:
                        r_.font.size = Pt(11)
                        r_.font.color.rgb = INK2
            else:
                actor = {"ai": "AI", "human": "사람", "tool": "자동화"}.get(st.get("actor", ""), "")
                tag = f"   [{actor}]" if actor else ""
                text(slide, tx, yy, tw, rh, st["t"] + tag + ("  ★MVP" if mvp else ""), size=12, anchor=MSO_ANCHOR.MIDDLE)
        tip(slide, s.get("tip"))

    elif t == "prompt":
        y = title(slide, s["title"], s.get("lead"))
        n = s["code"].count("\n") + 1
        rect(slide, MX, y, CW, bottom - y, fill=CODE_BG, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.03)
        size = max(8, min(14, int(260 / max(n, 1))))
        text(slide, MX + Emu(250000), y + Emu(200000), CW - Emu(500000), bottom - y - Emu(400000), s["code"], size=size, color=CODE_FG, font=MONO, spacing=1.1)
        tip(slide, s.get("tip"))

    elif t == "table":
        y = title(slide, s["title"], s.get("lead"))
        rows, cols = len(s["rows"]) + 1, len(s["head"])
        rh = Emu(min(520000, (bottom - y) // rows))
        tbl = slide.shapes.add_table(rows, cols, MX, y, CW, rh * rows).table
        # 열 너비: 내용 길이에 비례 (최소 10%)
        lens = [max(len(s["head"][j]), *(len(r[j]) for r in s["rows"])) for j in range(cols)]
        lens = [max(l, sum(lens) * 0.1) for l in lens]
        for j, l in enumerate(lens):
            tbl.columns[j].width = Emu(int(CW * l / sum(lens)))
        for j, h_ in enumerate(s["head"]):
            cell = tbl.cell(0, j)
            cell.text = h_
            cell.fill.solid()
            cell.fill.fore_color.rgb = BRAND
            r_ = cell.text_frame.paragraphs[0].runs[0]
            r_.font.size, r_.font.bold, r_.font.color.rgb, r_.font.name = Pt(13), True, WHITE, FONT
        for i, row in enumerate(s["rows"], start=1):
            for j, v in enumerate(row):
                cell = tbl.cell(i, j)
                cell.text = v
                cell.fill.solid()
                cell.fill.fore_color.rgb = CANVAS if i % 2 == 0 else WHITE
                for p in cell.text_frame.paragraphs:
                    for r_ in p.runs:
                        r_.font.size, r_.font.color.rgb, r_.font.name = Pt(12), INK, FONT
                        r_.font.bold = j == 0
        tip(slide, s.get("tip"))

    elif t == "checklist":
        y = title(slide, s["title"], s.get("lead"), kicker="PRACTICE")
        if s.get("time"):
            b = rect(slide, W - MX - Emu(1300000), Emu(int(H * 0.09)), Emu(1300000), Emu(420000), fill=BRAND, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)
            text(slide, W - MX - Emu(1300000), Emu(int(H * 0.09)), Emu(1300000), Emu(420000), "⏱ " + s["time"], size=14, color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        bullets(slide, MX, y, CW, bottom - y, s["items"], size=19, gap=10, marker="☐", marker_color=BRAND)

    elif t == "quote":
        text(slide, Emu(int(W * 0.12)), Emu(int(H * 0.2)), Emu(int(W * 0.76)), Emu(900000), "“", size=72, color=ACCENT, bold=True)
        text(slide, Emu(int(W * 0.12)), Emu(int(H * 0.36)), Emu(int(W * 0.76)), Emu(1800000), s["text"], size=30, bold=True)
        if s.get("by"):
            text(slide, Emu(int(W * 0.12)), Emu(int(H * 0.68)), Emu(int(W * 0.76)), Emu(500000), "— " + s["by"], size=15, color=INK2)

    elif t == "grid":
        y = title(slide, s["title"], s.get("lead"))
        cards = s["cards"]
        cols = 4 if len(cards) > 6 else 3 if len(cards) > 4 else 2
        rows = (len(cards) + cols - 1) // cols
        gap = Emu(160000)
        cw = (CW - gap * (cols - 1)) // cols
        ch = (bottom - y - gap * (rows - 1)) // rows
        for i, c in enumerate(cards):
            x = MX + (i % cols) * (cw + gap)
            yy = y + (i // cols) * (ch + gap)
            rect(slide, x, yy, cw, ch, fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
            text(slide, x + Emu(150000), yy + Emu(130000), cw - Emu(300000), Emu(400000), f"{c.get('icon', '')} {c['t']}".strip(), size=14, bold=True)
            text(slide, x + Emu(150000), yy + Emu(520000), cw - Emu(300000), ch - Emu(600000), c["d"], size=11, color=INK2)
        tip(slide, s.get("tip"))

    elif t == "agenda":
        y = title(slide, s["title"])
        rh = min(Emu(560000), (bottom - y) // max(1, len(s["items"])))
        for i, it in enumerate(s["items"]):
            yy = y + i * rh
            text(slide, MX, yy, Emu(1100000), rh, it["time"], size=15, color=BRAND, bold=True, font=MONO, anchor=MSO_ANCHOR.MIDDLE)
            text(slide, MX + Emu(1300000), yy, Emu(4200000), rh, it["t"], size=17, bold=True, anchor=MSO_ANCHOR.MIDDLE)
            if it.get("d"):
                text(slide, MX + Emu(5600000), yy, CW - Emu(5600000), rh, it["d"], size=13, color=INK3, anchor=MSO_ANCHOR.MIDDLE)
            ln = slide.shapes.add_connector(1, MX, yy + rh, MX + CW, yy + rh)
            ln.line.color.rgb = LINE

    elif t == "metric":
        y = title(slide, s["title"])
        ms = s["metrics"]
        gap = Emu(200000)
        cw = (CW - gap * (len(ms) - 1)) // max(1, len(ms))
        for i, m in enumerate(ms):
            last = i == len(ms) - 1
            x = MX + i * (cw + gap)
            rect(slide, x, y, cw, Emu(1500000), fill=BRAND if last else CANVAS, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
            fg = WHITE if last else INK
            text(slide, x + Emu(200000), y + Emu(150000), cw - Emu(400000), Emu(300000), m["label"], size=13, color=fg)
            text(slide, x + Emu(200000), y + Emu(480000), cw - Emu(400000), Emu(600000), m["value"], size=34, color=fg, bold=True)
            if m.get("sub"):
                text(slide, x + Emu(200000), y + Emu(1100000), cw - Emu(400000), Emu(300000), m["sub"], size=11, color=fg)
        if s.get("bullets"):
            bullets(slide, MX, y + Emu(1750000), CW, bottom - y - Emu(1750000), s["bullets"], size=16)

    if t not in ("cover",):
        footer(slide, label, page)
    if s.get("notes"):
        slide.notes_slide.notes_text_frame.text = s["notes"]


def build(week_file: Path):
    deck = json.loads(week_file.read_text(encoding="utf-8"))
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    n = len(deck["slides"])
    for i, s in enumerate(deck["slides"], start=1):
        render(prs, s, deck["title"], f"{i} / {n}")
    OUT.mkdir(exist_ok=True)
    out = OUT / f"{deck['week']}주차_{deck['title'].split('·', 1)[-1].strip()}.pptx"
    prs.save(out)
    print(f"✓ {out.relative_to(ROOT)}  ({n}장)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    weeks = sys.argv[1:] or ["1", "2", "3", "4"]
    for w in weeks:
        build(CONTENT / f"week{w}.json")
