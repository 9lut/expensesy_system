"""สร้างโลโก้ EXPENSE เบิกจ่าย เป็น SVG แบบเวกเตอร์ล้วน (ตัวอักษรแปลงเป็นเส้น ไม่ต้องพึ่งฟอนต์)

ฟอนต์: Anuphan (SIL Open Font License) — ไฟล์ที่ next/font ดาวน์โหลดไว้ใน .next/static/media
ขั้นตอน: instance น้ำหนักฟอนต์ → จัดรูปอักษรไทยด้วย HarfBuzz (สระ/วรรณยุกต์ถูกตำแหน่ง) → แปลง glyph เป็น path

ใช้:  pip install fonttools brotli uharfbuzz
      python scripts/build-logo.py            (รันจากโฟลเดอร์ expensesy_system หลัง npm run build)
ผลลัพธ์: public/brand/{logo-mark,logo,logo-white,logo-stacked}.svg และ src/app/icon.svg
"""
import glob
import io
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brand"

COLORS = {"ink": "#0f172a", "blue": "#2563eb", "muted": "#64748b"}


def find_font(test_char: str) -> str:
    for f in sorted(glob.glob(str(ROOT / ".next" / "static" / "media" / "*.woff2"))):
        t = TTFont(f)
        if t["name"].getDebugName(1) == "Anuphan" and ord(test_char) in t.getBestCmap():
            return f
    raise SystemExit(f"ไม่พบฟอนต์ Anuphan ที่มีอักษร {test_char!r} — รัน npm run build ก่อน")


_cache: dict = {}


def instance(path: str, wght: int):
    key = (path, wght)
    if key not in _cache:
        f = instantiateVariableFont(TTFont(path), {"wght": wght}, inplace=False)
        f.flavor = None
        buf = io.BytesIO()
        f.save(buf)
        _cache[key] = (TTFont(io.BytesIO(buf.getvalue())), buf.getvalue())
    return _cache[key]


def ntos(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def text_path(text: str, font_path: str, wght: int, size: float, x0: float, baseline: float) -> tuple[str, float]:
    """คืน (path d, ความกว้าง) ของข้อความ วางที่ x0 / baseline"""
    font, data = instance(font_path, wght)
    upem = font["head"].unitsPerEm
    hfont = hb.Font(hb.Face(data))
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hfont, buf, {})
    glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
    k = size / upem
    x, parts = 0, []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs, ntos=ntos)
        t = TransformPen(pen, (k, 0, 0, -k, x0 + (x + pos.x_offset) * k, baseline - pos.y_offset * k))
        glyphs[order[info.codepoint]].draw(t)
        parts.append(pen.getCommands())
        x += pos.x_advance
    return " ".join(p for p in parts if p), x * k


# ── เครื่องหมาย (64×64): ใบเสร็จสีขาว + ป้ายเครื่องหมายถูก บนพื้น gradient แบรนด์ ──
MARK_DEFS = """<linearGradient id="exg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>"""
MARK = """<rect width="64" height="64" rx="16" fill="url(#exg)"/>
<path d="M20 13H44A3 3 0 0 1 47 16V50L42 47L37 50L32 47L27 50L22 47L17 50V16A3 3 0 0 1 20 13Z" fill="#fff"/>
<rect x="22" y="20" width="20" height="3.2" rx="1.6" fill="#bfdbfe"/>
<rect x="22" y="27" width="14" height="3.2" rx="1.6" fill="#bfdbfe"/>
<rect x="22" y="34" width="9" height="3.2" rx="1.6" fill="#bfdbfe"/>
<circle cx="46" cy="45" r="10.5" fill="#10b981" stroke="#fff" stroke-width="3"/>
<path d="M41.2 45.2L44.6 48.4L50.8 42" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>"""


def svg(w: float, h: float, body: str, title: str) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ntos(w)} {ntos(h)}" width="{ntos(w)}" height="{ntos(h)}" role="img" aria-label="{title}">'
            f"<title>{title}</title><defs>{MARK_DEFS}</defs>{body}</svg>\n")


def main() -> None:
    latin, thai = find_font("E"), find_font("บ")
    OUT.mkdir(parents=True, exist_ok=True)
    title = "EXPENSE เบิกจ่าย — ระบบเบิกค่าใช้จ่าย"

    # เครื่องหมายอย่างเดียว (favicon / app icon)
    mark = svg(64, 64, MARK, "EXPENSE เบิกจ่าย")
    (OUT / "logo-mark.svg").write_text(mark, encoding="utf-8")
    (ROOT / "src" / "app" / "icon.svg").write_text(mark, encoding="utf-8")

    def horizontal(ink: str, accent: str, muted: str) -> str:
        x = 78
        d1, w1 = text_path("EXPENSE", latin, 700, 25, x, 31)
        d2, w2 = text_path("เบิกจ่าย", thai, 600, 25, x + w1 + 7, 31)
        d3, w3 = text_path("ระบบเบิกค่าใช้จ่าย", thai, 500, 14.5, x + 1, 53)
        w = x + max(w1 + 7 + w2, w3 + 1) + 4
        body = (f'<g>{MARK}</g><path d="{d1}" fill="{ink}"/><path d="{d2}" fill="{accent}"/><path d="{d3}" fill="{muted}"/>')
        return svg(w, 64, body, title)

    (OUT / "logo.svg").write_text(horizontal(COLORS["ink"], COLORS["blue"], COLORS["muted"]), encoding="utf-8")
    (OUT / "logo-white.svg").write_text(horizontal("#ffffff", "#bfdbfe", "#cbd5e1"), encoding="utf-8")

    # แบบตั้ง (หน้า Login / LIFF)
    d1, w1 = text_path("EXPENSE", latin, 700, 30, 0, 0)
    d2, w2 = text_path("เบิกจ่าย", thai, 600, 30, 0, 0)
    d3, w3 = text_path("ระบบเบิกค่าใช้จ่าย", thai, 500, 16, 0, 0)
    W = max(w1 + 8 + w2, w3, 96) + 8
    cx = W / 2
    l1x = cx - (w1 + 8 + w2) / 2
    p1, _ = text_path("EXPENSE", latin, 700, 30, l1x, 122)
    p2, _ = text_path("เบิกจ่าย", thai, 600, 30, l1x + w1 + 8, 122)
    p3, _ = text_path("ระบบเบิกค่าใช้จ่าย", thai, 500, 16, cx - w3 / 2, 150)
    body = (f'<g transform="translate({ntos(cx - 40)} 0) scale(1.25)">{MARK}</g>'
            f'<path d="{p1}" fill="{COLORS["ink"]}"/><path d="{p2}" fill="{COLORS["blue"]}"/><path d="{p3}" fill="{COLORS["muted"]}"/>')
    (OUT / "logo-stacked.svg").write_text(svg(W, 160, body, title), encoding="utf-8")

    for f in sorted(OUT.glob("*.svg")):
        print(f.relative_to(ROOT), f.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
