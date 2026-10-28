"""Generates the original symptom illustrations in public/symptoms/illustrations.

    python3 scripts/illustrations/generate.py

Each function draws one defect or one comparison option. Titles are written
into the SVG; the alt text shown on the site lives in src/content/visual-assets.ts.
"""

from __future__ import annotations

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from draw import (  # noqa: E402
    BED, BED_EDGE, BED_Y, BRASS, DEFECT, FILM, INK, METAL, METAL_DARK, PART, PART_DARK, PART_LIGHT, PART_TOP,
    RESIN, RESIN_LIGHT, WHITE, Svg, bed, hairs, iso, iso_bed, iso_box, jagged, layer, nozzle, resin_scene, ring, stack,
)

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "symptoms", "illustrations")
DRAWINGS: dict[str, tuple[str, callable]] = {}


def drawing(slug: str, title: str):
    def wrap(fn):
        DRAWINGS[slug] = (title, fn)
        return fn
    return wrap


# --- First layer --------------------------------------------------------------

def cross_section_lines(s: Svg, shape: str):
    """Magnified cross-section of first-layer lines on the bed."""
    s.rect(30, 250, 420, 40, BED, BED_EDGE, 1.5, rx=3)
    xs = [70 + i * 56 for i in range(7)]
    for i, x in enumerate(xs):
        if shape == "round":
            s.circle(x, 228, 20, PART, PART_DARK, 1.5)
        elif shape == "flat":
            s.ellipse(x, 238, 31, 12, PART, PART_DARK, 1.5)
        elif shape == "squashed":
            s.ellipse(x, 243, 40, 7, PART, PART_DARK, 1.5)
        elif shape == "broken":
            if i in (1, 4, 5):
                continue
            s.ellipse(x, 244, 14 if i % 2 else 18, 6, PART, PART_DARK, 1.5)


@drawing("opt-line-round", "Round first-layer lines resting on the bed")
def _(s):
    cross_section_lines(s, "round")
    nozzle(s, 390, 160)
    s.line(390, 172, 390, 248, DEFECT, 2, ' stroke-dasharray="5 4"')
    ring(s, 126, 236, 34)


@drawing("opt-line-flat", "Correct first-layer lines, slightly flattened and touching")
def _(s):
    cross_section_lines(s, "flat")
    nozzle(s, 406, 220)


@drawing("opt-line-squashed", "First-layer lines squashed very flat with ridges")
def _(s):
    cross_section_lines(s, "squashed")
    for x in [98, 154, 210, 266, 322]:
        s.path(f"M{x - 6},236 Q{x},224 {x + 6},236", PART_LIGHT, PART_DARK, 1.2)
    nozzle(s, 406, 236)
    ring(s, 182, 238, 34)


@drawing("opt-line-broken", "Thin first-layer lines with missing sections")
def _(s):
    cross_section_lines(s, "broken")
    ring(s, 154, 244, 30)
    ring(s, 322, 244, 40)


@drawing("first-layer-not-sticking", "First layer not sticking: filament dragged and curled behind the nozzle")
def _(s):
    bed(s)
    s.path("M60,296 C110,296 130,296 160,293 C190,288 200,270 222,262 C246,254 262,278 250,286 C238,294 222,270 240,250 C258,232 290,236 300,242",
           stroke=PART, sw=9)
    s.path("M60,296 C110,296 130,296 160,293", stroke=PART_DARK, sw=1.2)
    nozzle(s, 330, 240)
    ring(s, 238, 268, 46)


@drawing("first-layer-too-squashed", "First layer too squashed: flat, see-through lines with ridges")
def _(s):
    s.rect(40, 90, 400, 200, BED, BED_EDGE, 1.5, rx=6)
    for i in range(12):
        y = 112 + i * 14
        s.rect(70, y, 340, 12, PART_LIGHT, None, rx=2, extra=' opacity="0.75"')
        s.line(70, y + 12, 410, y + 12, PART_DARK, 1.6)
    for i in range(0, 12, 2):
        y = 116 + i * 14
        s.path(f"M80,{y} l20,4 l20,-4 l20,4 l20,-4", stroke=PART_DARK, sw=1)
    ring(s, 150, 190, 60)


@drawing("first-layer-uneven-across-bed", "Uneven first layer: lines gapped on one side and squashed on the other")
def _(s):
    s.rect(40, 70, 400, 230, BED, BED_EDGE, 1.5, rx=6)
    for i in range(14):
        y = 92 + i * 14
        s.line(70, y, 230, y, PART, 3 + (i % 3 == 0))
        s.rect(240, y - 6, 170, 12, PART, PART_DARK, 0.8, rx=2)
    ring(s, 150, 180, 70)


@drawing("nozzle-scraping", "Nozzle scraping: the tip ploughs the first layer and marks the bed")
def _(s):
    bed(s)
    for x in range(70, 250, 14):
        s.line(x, 304, x + 10, 302, METAL_DARK, 1.4)
    s.path("M250,298 L272,296 L278,300 L300,296", stroke=PART, sw=4)
    for x in [252, 262, 272]:
        s.path(f"M{x},294 q4,-6 8,0", stroke=PART_DARK, sw=1.2)
    nozzle(s, 300, 300)
    ring(s, 290, 298, 30)


@drawing("print-detached", "Print detached part way through: the part has tipped and moved off its first layer")
def _(s):
    bed(s)
    s.rect(80, 293, 150, 7, "none", PART_DARK, 1.5, rx=3, extra=' stroke-dasharray="6 4"')
    s.add('<g transform="rotate(-14 260 280)">')
    stack(s, 210, 350, 300, 9)
    s.add("</g>")
    nozzle(s, 300, 150)
    ring(s, 300, 286, 40)


# --- Extrusion and surface ----------------------------------------------------

def two_towers(s):
    bed(s)
    stack(s, 70, 150, BED_Y, 22)
    stack(s, 330, 410, BED_Y, 22)


@drawing("stringing", "Stringing: fine hairs between two separate parts")
def _(s):
    two_towers(s)
    hairs(s, 150, 330, range(110, 270, 9), sag=12, sw=0.9, seed=4)
    ring(s, 240, 190, 70)


@drawing("opt-thick-strings", "Thick strands and drips between two separate parts")
def _(s):
    two_towers(s)
    hairs(s, 150, 330, [120, 170, 225], sag=30, sw=3.5, seed=9)
    s.path("M236,206 q2,18 -2,30", stroke=PART, sw=4)
    s.circle(234, 240, 5, PART, PART_DARK, 1)
    ring(s, 240, 200, 70)


@drawing("blobs-and-zits", "Zits: small bumps in a line on the surface of the print")
def _(s):
    bed(s)
    stack(s, 110, 370, BED_Y, 22)
    rnd = random.Random(2)
    for i in range(22):
        y = BED_Y - 4.5 - i * 9
        s.circle(286 + rnd.uniform(-3, 3), y, 4.2, PART_LIGHT, PART_DARK, 1)
    ring(s, 286, 200, 50)


@drawing("bubbling-or-rough-surface", "Rough, bubbly surface from wet filament")
def _(s):
    bed(s)
    stack(s, 110, 370, BED_Y, 22)
    rnd = random.Random(7)
    for _ in range(46):
        x, y = rnd.uniform(126, 354), rnd.uniform(112, 292)
        s.circle(x, y, rnd.uniform(1.8, 4), "#DBEAFE" if rnd.random() < 0.5 else PART_DARK, None)
    for _ in range(30):
        x, y = rnd.uniform(110, 370), rnd.uniform(110, 296)
        s.line(x, y, x + rnd.uniform(-4, 4), y - rnd.uniform(3, 7), PART_DARK, 0.8)
    ring(s, 240, 200, 70)


@drawing("under-extrusion", "Under-extrusion: thin layers with gaps and missing sections")
def _(s):
    bed(s)
    rnd = random.Random(5)
    for i in range(20):
        y = BED_Y - (i + 1) * 9
        x = 110
        while x < 370:
            seg = rnd.uniform(30, 90)
            end = min(370, x + seg)
            layer(s, x, end, y + 2, 5)
            x = end + rnd.uniform(6, 22)
    ring(s, 240, 200, 70)


@drawing("over-extrusion", "Over-extrusion: bulging, lumpy layers with excess plastic")
def _(s):
    bed(s)
    rnd = random.Random(8)
    for i in range(20):
        y = BED_Y - (i + 1) * 9.5
        layer(s, 104 - rnd.uniform(0, 6), 376 + rnd.uniform(0, 6), y - 1, 11)
    for x in [150, 210, 300, 340]:
        s.circle(x, 104 + rnd.uniform(-4, 4), rnd.uniform(5, 9), PART, PART_DARK, 1.2)
    ring(s, 360, 180, 46)


@drawing("not-extruding", "Clogged nozzle: the printer moves but no plastic comes out")
def _(s):
    bed(s)
    s.rect(70, 292, 300, 8, "none", PART_DARK, 1.5, rx=4, extra=' stroke-dasharray="8 6"')
    s.circle(84, 296, 3, PART)
    s.circle(96, 296, 2, PART)
    nozzle(s, 380, 270, blocked=True)
    ring(s, 380, 252, 32)


@drawing("extruder-clicking", "Grinding filament: the drive gear has chewed a groove into the filament")
def _(s):
    def gear(cx, cy, r):
        pts = []
        for i in range(40):
            a = i * math.pi / 20
            rr = r + (6 if i % 2 == 0 else 0)
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        s.poly(pts, METAL, INK, 1.4)
        s.circle(cx, cy, 6, METAL_DARK, INK, 1.2)

    s.rect(228, 20, 24, 320, PART, PART_DARK, 1.5, rx=4)
    s.path("M228,150 q10,8 0,16 q10,8 0,16 q10,8 0,16 q10,8 0,16", PART_LIGHT, PART_DARK, 1.2)
    gear(178, 190, 44)
    gear(302, 190, 44)
    for x, y in [(200, 260), (214, 274), (262, 282), (276, 262), (244, 298)]:
        s.circle(x, y, 2.5, PART_LIGHT, PART_DARK, 0.8)
    ring(s, 236, 182, 40)


@drawing("brittle-filament", "Brittle filament: the strand has snapped into pieces on its way to the extruder")
def _(s):
    s.circle(110, 180, 80, "#E2E8F0", INK, 2)
    s.circle(110, 180, 60, PART, PART_DARK, 1.5)
    s.circle(110, 180, 24, "#E2E8F0", INK, 1.5)
    s.path("M168,124 C210,100 236,104 250,112", stroke=PART, sw=8)
    s.path("M262,114 C276,120 288,130 296,140", stroke=PART, sw=8)
    s.path("M308,150 C318,162 326,176 330,190", stroke=PART, sw=8)
    s.rect(330, 196, 16, 120, "#E2E8F0", INK, 1.5, rx=6)
    for x, y in [(254, 108), (258, 118), (300, 144), (304, 152)]:
        s.line(x - 4, y - 4, x + 4, y + 4, INK, 1.4)
    ring(s, 280, 130, 40)


@drawing("layer-shift", "Layer shift: the upper part of the print is offset sideways")
def _(s):
    bed(s)
    stack(s, 120, 300, BED_Y, 22, offsets=lambda i: 0 if i < 11 else 46)
    s.line(300, 200, 346, 200, DEFECT, 2, ' stroke-dasharray="5 4"')
    ring(s, 300, 200, 44)


@drawing("opt-shift-once", "One layer shift, after which the print carries on")
def _(s):
    bed(s)
    stack(s, 170, 290, BED_Y, 24, offsets=lambda i: 0 if i < 14 else 30)
    ring(s, 290, 174, 36)


@drawing("opt-shift-repeated", "Several shifts, all in the same direction, like a staircase")
def _(s):
    bed(s)
    stack(s, 120, 240, BED_Y, 24, offsets=lambda i: 22 * (i // 6))
    ring(s, 300, 190, 70)


@drawing("opt-shift-gradual", "A gradual shift, so the whole part leans")
def _(s):
    bed(s)
    stack(s, 140, 260, BED_Y, 24, offsets=lambda i: i * 3.2)
    s.line(140, 300, 213, 84, DEFECT, 2, ' stroke-dasharray="6 5"')


@drawing("layer-separation", "Layer separation: a crack has opened between layers")
def _(s):
    bed(s)
    stack(s, 150, 330, BED_Y, 12)
    stack(s, 150, 330, BED_Y - 12 * 9 - 7, 12)
    s.path("M150,186 L170,190 L190,185 L214,191 L240,186 L266,190 L292,185 L330,189", stroke=INK, sw=2)
    ring(s, 240, 188, 50)


@drawing("ringing", "Ringing: faint ripples repeating after a sharp edge on the wall")
def _(s):
    bed(s)
    stack(s, 70, 410, BED_Y, 22)
    s.rect(130, 140, 50, 120, PART_LIGHT, PART_DARK, 1.6, rx=2)
    for i, op in enumerate([0.9, 0.7, 0.5, 0.35, 0.2]):
        x = 196 + i * 16
        s.path(f"M{x},140 q4,30 0,60 q-4,30 0,60", stroke=PART_DARK, sw=2.2, extra=f' opacity="{op}"')
    ring(s, 226, 200, 54)


@drawing("inconsistent-layers", "Uneven layers: bands and layers of different thickness up the side")
def _(s):
    bed(s)
    rnd = random.Random(11)
    y = BED_Y
    i = 0
    while y > 90:
        h = 9 if i % 6 not in (3, 4) else 12
        dl = 4 if i % 6 in (3, 4) else 0
        layer(s, 130 - dl, 350 + dl, y - h, h, PART_DARK if i % 6 in (3, 4) else PART)
        y -= h
        i += 1
    ring(s, 350, 210, 40)


@drawing("elephants-foot", "Elephant's foot: the bottom layers bulge out wider than the rest")
def _(s):
    bed(s)
    stack(s, 150, 330, BED_Y, 22, widths=lambda i: (max(0, 14 - i * 4), max(0, 14 - i * 4)))
    ring(s, 330, 286, 30)
    ring(s, 150, 286, 30)


@drawing("warping", "Warping: the corners of the print curl up off the bed")
def _(s):
    bed(s)
    for i in range(12):
        y = BED_Y - 6 - i * 9
        lift = max(0, 40 - i * 3)
        s.path(f"M96,{y - lift} Q132,{y} 176,{y} L304,{y} Q348,{y} 384,{y - lift}", stroke=PART, sw=9)
    s.poly([(92, 300), (176, 300), (130, 296), (96, 262)], "#E2E8F0", None)
    s.poly([(388, 300), (304, 300), (350, 296), (384, 262)], "#E2E8F0", None)
    ring(s, 112, 274, 32)
    ring(s, 368, 274, 32)


@drawing("opt-warp-all-corners", "Seen from above at an angle: all four corners lifted by about the same amount")
def _(s):
    iso_bed(s, cy=170)
    # Footprint shadow where the part should sit flat.
    P = lambda x, y, z: iso(x, y, z, cy=170)
    s.poly([P(-100, -64, 0), P(100, -64, 0), P(100, 64, 0), P(-100, 64, 0)], "#A9B6C7", None, extra=' opacity="0.7"')
    lift, th = 26, 26

    def edge(a, b, za, zb):
        (x0, y0), (x1, y1) = a, b
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        p0, pm, p1 = P(x0, y0, za), P(mx, my, 0 + (za - lift)), P(x1, y1, zb)
        c = (2 * pm[0] - (p0[0] + p1[0]) / 2, 2 * pm[1] - (p0[1] + p1[1]) / 2)
        return p0, c, p1

    corners = [(-100, -64), (100, -64), (100, 64), (-100, 64)]
    # Front-left side face (y = 64) and front-right side face (x = 100), bottoms curving down in the middle.
    for a, b, fill in [((-100, 64), (100, 64), PART), ((100, -64), (100, 64), PART_DARK)]:
        b0, bc, b1 = edge(a, b, lift, lift)
        t0, tc, t1 = edge(a, b, lift + th, lift + th)
        s.path(f"M{b0[0]:.1f},{b0[1]:.1f} Q{bc[0]:.1f},{bc[1]:.1f} {b1[0]:.1f},{b1[1]:.1f} L{t1[0]:.1f},{t1[1]:.1f} Q{tc[0]:.1f},{tc[1]:.1f} {t0[0]:.1f},{t0[1]:.1f} Z", fill, PART_DARK, 1.2)
    # Top face.
    pts = []
    for a, b in zip(corners, corners[1:] + corners[:1]):
        p0, c, p1 = edge(a, b, lift + th, lift + th)
        pts.append((p0, c, p1))
    d = f"M{pts[0][0][0]:.1f},{pts[0][0][1]:.1f} " + " ".join(f"Q{c[0]:.1f},{c[1]:.1f} {p1[0]:.1f},{p1[1]:.1f}" for _, c, p1 in pts) + " Z"
    s.path(d, PART_TOP, PART_DARK, 1.2)
    for x, y in [(-100, 64), (100, 64), (100, -64)]:
        top = P(x, y, lift)
        base = P(x, y, 0)
        s.line(top[0], top[1], base[0], base[1], DEFECT, 2, ' stroke-dasharray="4 3"')
    ring(s, *P(100, 64, lift / 2), 26)
    ring(s, *P(-100, 64, lift / 2), 26)


@drawing("opt-warp-one-side", "Only one side of the print has lifted")
def _(s):
    bed(s)
    for i in range(12):
        y = BED_Y - 10 - i * 9
        lift = max(0, 26 - i * 2)
        s.path(f"M100,{y} L300,{y} Q340,{y} 380,{y - lift}", stroke=PART, sw=9)
    ring(s, 368, 278, 30)


@drawing("opt-warp-long-edges", "The long edges have bowed up in the middle")
def _(s):
    bed(s)
    for i in range(6):
        y = BED_Y - 10 - i * 9
        s.path(f"M60,{y} Q240,{y - 34 + i * 3} 420,{y}", stroke=PART, sw=9)
    ring(s, 240, 270, 40)


@drawing("opt-warp-flat", "A print sitting flat on the bed with no visible lift")
def _(s):
    bed(s)
    stack(s, 100, 380, BED_Y, 12)


@drawing("wrong-dimensions", "Inaccurate dimensions: the printed part and hole differ from the designed size")
def _(s):
    s.rect(110, 90, 260, 200, PART, PART_DARK, 1.5, rx=6)
    s.circle(240, 190, 44, "#F6F8FB", PART_DARK, 1.5)
    s.rect(100, 80, 280, 220, "none", INK, 1.5, rx=6, extra=' stroke-dasharray="6 5"')
    s.circle(240, 190, 54, "none", INK, 1.5, ' stroke-dasharray="6 5"')
    s.line(100, 320, 380, 320, INK, 1.5)
    s.line(100, 314, 100, 326, INK, 1.5)
    s.line(380, 314, 380, 326, INK, 1.5)
    ring(s, 240, 190, 70)


@drawing("colour-bleed", "Colour bleed: streaks of the previous colour in the next one")
def _(s):
    bed(s)
    stack(s, 120, 360, BED_Y, 11, fill="#F59E0B")
    stack(s, 120, 360, BED_Y - 99, 11)
    rnd = random.Random(3)
    for _ in range(9):
        x = rnd.uniform(140, 340)
        y = BED_Y - 99 - rnd.uniform(6, 40)
        s.rect(x, y, rnd.uniform(14, 40), 4, "#F59E0B", None, rx=2)
    ring(s, 240, 170, 60)


# --- Overhangs, supports and failures ----------------------------------------

@drawing("poor-bridging", "Poor bridging: lines sag and droop between two supports")
def _(s):
    bed(s)
    stack(s, 70, 140, BED_Y, 18)
    stack(s, 340, 410, BED_Y, 18)
    for i, sag in enumerate([46, 38, 30, 22]):
        y = 140 + i * 6
        s.path(f"M140,{y} Q240,{y + sag * 2} 340,{y}", stroke=PART, sw=6)
    ring(s, 240, 200, 60)


@drawing("supports-failing", "Failed supports: support towers have broken and fallen under an overhang")
def _(s):
    bed(s)
    stack(s, 60, 150, BED_Y, 20)
    s.rect(150, 120, 230, 20, PART, PART_DARK, 1.5, rx=4)
    for x in [180, 220]:
        s.rect(x, 140, 10, 160, PART_LIGHT, PART_DARK, 1)
    s.add('<g transform="rotate(64 300 296)">')
    s.rect(300, 200, 10, 96, PART_LIGHT, PART_DARK, 1)
    s.add("</g>")
    s.rect(340, 140, 10, 60, PART_LIGHT, PART_DARK, 1)
    s.path("M340,200 l4,6 l3,-5 l3,6", stroke=INK, sw=1.4)
    ring(s, 320, 250, 54)


@drawing("spaghetti", "Spaghetti: a tangle of loose filament above a short failed print")
def _(s):
    bed(s)
    stack(s, 170, 300, BED_Y, 5)
    rnd = random.Random(21)
    d = "M240,250"
    x, y = 240, 250
    for _ in range(26):
        nx, ny = x + rnd.uniform(-60, 60), y + rnd.uniform(-40, 30)
        nx, ny = min(max(nx, 110), 370), min(max(ny, 130), 262)
        d += f" Q{(x + nx) / 2 + rnd.uniform(-40, 40):.1f},{(y + ny) / 2 + rnd.uniform(-40, 40):.1f} {nx:.1f},{ny:.1f}"
        x, y = nx, ny
    s.path(d, stroke=PART, sw=3)
    nozzle(s, x, y - 4)
    ring(s, 240, 200, 80)


@drawing("nozzle-dragging", "Nozzle hitting the print where an edge has curled up")
def _(s):
    bed(s)
    stack(s, 100, 300, BED_Y, 16)
    for i in range(3):
        y = BED_Y - 16 * 9 - (i + 1) * 9
        s.path(f"M100,{y} L280,{y} Q320,{y} 340,{y - 22 - i * 6}", stroke=PART, sw=9)
    nozzle(s, 352, 120)
    s.path("M340,128 l8,-6 m-4,10 l10,-2", stroke=DEFECT, sw=2)
    ring(s, 342, 126, 30)


@drawing("unusual-noises", "Unusual noises: a motor and belt drive with vibration marks")
def _(s):
    s.rect(70, 160, 100, 100, METAL_DARK, INK, 1.5, rx=8)
    s.circle(120, 210, 22, METAL, INK, 1.5)
    s.circle(380, 210, 22, METAL, INK, 1.5)
    s.path("M120,188 L380,188 A22,22 0 0 1 380,232 L120,232 A22,22 0 0 1 120,188 Z", stroke="#334155", sw=5)
    for i, r in enumerate([40, 58, 76]):
        op = 1 - i * 0.25
        s.path(f"M{120 - r * 0.6:.1f},{210 - r * 0.8:.1f} A{r},{r} 0 0 1 {120 + r * 0.6:.1f},{210 - r * 0.8:.1f}", stroke=DEFECT, sw=2.4, extra=f' opacity="{op}"')
    for x in [200, 250, 300]:
        s.path(f"M{x},180 l5,-10 l5,10", stroke=DEFECT, sw=2)
    ring(s, 120, 210, 66)


# --- Resin ----------------------------------------------------------------------

@drawing("resin-not-sticking", "Resin print not sticking: the plate is empty and the cured layers are left on the film")
def _(s):
    resin_scene(s)
    s.rect(150, 302, 180, 14, RESIN, "#2F6F6D", 1.5, rx=2)
    ring(s, 240, 310, 50)


@drawing("resin-supports-failing", "Resin supports failing: broken supports with part of the model fallen into the vat")
def _(s):
    resin_scene(s)
    for x in [150, 190, 230, 270, 310]:
        h = 50 if x in (150, 190) else 24
        s.rect(x, 82, 6, h, RESIN, "#2F6F6D", 1)
    s.rect(140, 132, 70, 60, RESIN, "#2F6F6D", 1.5, rx=6)
    s.add('<g transform="rotate(-20 290 300)">')
    s.rect(250, 288, 80, 26, RESIN, "#2F6F6D", 1.5, rx=6)
    s.add("</g>")
    for x in [230, 270, 310]:
        s.path(f"M{x},106 l3,4 l3,-4", stroke=INK, sw=1.2)
    ring(s, 290, 300, 42)


@drawing("resin-partial-print", "Partial resin print: a section of the model never formed")
def _(s):
    resin_scene(s)
    s.rect(160, 82, 160, 18, RESIN, "#2F6F6D", 1.5)
    s.rect(170, 100, 140, 110, RESIN, "#2F6F6D", 1.5, rx=4)
    s.poly(jagged([(260, 210), (262, 160), (310, 150), (310, 210)], amp=3), "#F6F8FB", "#2F6F6D", 1.5)
    s.rect(262, 150, 48, 60, "none", INK, 1.2, extra=' stroke-dasharray="5 4"')
    ring(s, 286, 182, 40)


@drawing("resin-layer-separation", "Resin layer separation: the print has split between layers")
def _(s):
    resin_scene(s)
    s.rect(160, 82, 160, 18, RESIN, "#2F6F6D", 1.5)
    s.rect(180, 100, 120, 60, RESIN, "#2F6F6D", 1.5)
    s.rect(180, 170, 120, 50, RESIN, "#2F6F6D", 1.5)
    s.path("M180,165 L200,162 L220,167 L245,162 L270,167 L300,163", stroke=INK, sw=2)
    ring(s, 240, 165, 50)


@drawing("resin-cracked-print", "Cracked resin print: a jagged crack through a finished part")
def _(s):
    s.rect(60, 300, 360, 10, BED, BED_EDGE, 1.5, rx=3)
    s.rect(150, 90, 180, 210, RESIN, "#2F6F6D", 1.5, rx=14)
    pts = jagged([(230, 90), (238, 150), (226, 210), (240, 260)], amp=5, seed=8)
    s.path("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts), stroke=INK, sw=2.5)
    ring(s, 234, 170, 56)


@drawing("resin-distorted-details", "Distorted resin detail: fine pins swollen and small holes filled in")
def _(s):
    s.rect(60, 280, 360, 20, RESIN, "#2F6F6D", 1.5, rx=3)
    for i, x in enumerate(range(90, 400, 40)):
        w = 8 if i < 4 else 16
        s.rect(x - w / 2, 180, w, 100, RESIN, "#2F6F6D", 1.2, rx=w / 2)
        if i >= 4:
            s.circle(x, 180, w * 0.7, RESIN, "#2F6F6D", 1.2)
    ring(s, 330, 220, 70)


@drawing("resin-surface-defects", "Resin surface defects: drips and cured runs on the surface")
def _(s):
    s.rect(60, 300, 360, 10, BED, BED_EDGE, 1.5, rx=3)
    s.rect(150, 90, 180, 210, RESIN, "#2F6F6D", 1.5, rx=14)
    for x, h in [(180, 40), (230, 70), (290, 30)]:
        s.path(f"M{x},300 q-4,{-h / 2} 0,{-h} q4,{h / 2} 0,{h}", RESIN_LIGHT, "#2F6F6D", 1.2)
        s.circle(x, 300, 7, RESIN_LIGHT, "#2F6F6D", 1.2)
    for i in range(10):
        s.line(160, 110 + i * 18, 320, 112 + i * 18, "#2F6F6D", 0.8, ' opacity="0.5"')
    ring(s, 232, 270, 50)


@drawing("resin-not-curing", "Resin not curing: a soft, sticky surface that keeps a fingerprint")
def _(s):
    s.rect(60, 300, 360, 10, BED, BED_EDGE, 1.5, rx=3)
    s.rect(150, 90, 180, 210, RESIN, "#2F6F6D", 1.5, rx=14)
    s.path("M170,110 q40,-6 70,10", stroke=WHITE, sw=4, extra=' opacity="0.7"')
    for i in range(5):
        s.ellipse(250, 190, 30 - i * 6, 22 - i * 4.5, "none", "#2F6F6D", 1.2)
    for x, y in [(190, 250), (300, 140), (210, 160)]:
        s.ellipse(x, y, 5, 7, RESIN_LIGHT, "#2F6F6D", 1)
    ring(s, 250, 190, 46)


@drawing("resin-film-problems", "Release film problems: a dented, cloudy film with cured resin stuck to it")
def _(s):
    s.rect(60, 120, 360, 140, "none", INK, 2, rx=8)
    s.rect(62, 140, 356, 100, RESIN_LIGHT, None, extra=' opacity="0.6"')
    s.path("M62,240 L170,240 Q200,262 230,240 L418,240", stroke="#94A3B8", sw=4)
    s.ellipse(310, 238, 46, 8, "#CBD5E1", None, ' opacity="0.9"')
    s.rect(280, 228, 40, 9, RESIN, "#2F6F6D", 1.2, rx=2)
    s.rect(80, 266, 320, 18, "#334155", INK, 1.5, rx=2)
    ring(s, 200, 248, 40)
    ring(s, 304, 234, 34)


def main():
    os.makedirs(OUT, exist_ok=True)
    for slug, (title, fn) in DRAWINGS.items():
        s = Svg()
        fn(s)
        with open(os.path.join(OUT, f"{slug}.svg"), "w") as f:
            f.write(s.render(title))
    print(f"Wrote {len(DRAWINGS)} illustrations to {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
