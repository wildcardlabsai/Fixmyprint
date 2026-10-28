"""Drawing helpers for the FixMyPrint symptom illustrations.

Every illustration is a 480 x 360 SVG in one consistent style: a light
background, the bed or vat in neutral greys, printed plastic in the site blue
and, where it helps, a dashed red ring around the defect. Shapes are drawn to
show what the defect looks like, not a particular printer.
"""

from __future__ import annotations

import math
import random

W, H = 480, 360

BG = "#F6F8FB"
INK = "#1E293B"
BED = "#CBD5E1"
BED_EDGE = "#94A3B8"
PART = "#3B8EEA"
PART_DARK = "#1F6FCC"
PART_LIGHT = "#7DB6F2"
PART_TOP = "#9CC8F5"
METAL = "#64748B"
METAL_DARK = "#475569"
BRASS = "#C08A2E"
DEFECT = "#C0392B"
RESIN = "#5EAAA8"
RESIN_LIGHT = "#A7D3D1"
FILM = "#E2E8F0"
WHITE = "#FFFFFF"


class Svg:
    def __init__(self) -> None:
        self.parts: list[str] = []

    def add(self, s: str) -> "Svg":
        self.parts.append(s)
        return self

    def rect(self, x, y, w, h, fill, stroke=None, sw=1.5, rx=0, extra=""):
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        return self.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}"{st}{extra}/>')

    def poly(self, pts, fill, stroke=INK, sw=1.5, extra=""):
        d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ""
        return self.add(f'<polygon points="{d}" fill="{fill}"{st}{extra}/>')

    def path(self, d, fill="none", stroke=INK, sw=1.5, extra=""):
        st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if stroke else ""
        return self.add(f'<path d="{d}" fill="{fill}"{st}{extra}/>')

    def line(self, x1, y1, x2, y2, stroke=INK, sw=1.5, extra=""):
        return self.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round"{extra}/>')

    def circle(self, cx, cy, r, fill, stroke=None, sw=1.5, extra=""):
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        return self.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}"{st}{extra}/>')

    def ellipse(self, cx, cy, rx, ry, fill, stroke=INK, sw=1.5, extra=""):
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        return self.add(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{fill}"{st}{extra}/>')

    def render(self, title: str) -> str:
        body = "\n  ".join(self.parts)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img">\n'
            f"  <title>{title}</title>\n"
            f'  <rect width="{W}" height="{H}" fill="{BG}"/>\n  {body}\n</svg>\n'
        )


# --- Scene pieces -----------------------------------------------------------

BED_Y = 300


def bed(s: Svg, y=BED_Y, x0=36, x1=444):
    """Front view of a build plate."""
    s.rect(x0, y, x1 - x0, 14, BED, BED_EDGE, 1.5, rx=3)
    s.line(x0 + 4, y + 1, x1 - 4, y + 1, WHITE, 1, ' opacity="0.7"')


def nozzle(s: Svg, x, tip_y, blocked=False):
    """Hotend seen from the front, with the nozzle tip at (x, tip_y)."""
    s.rect(x - 34, tip_y - 78, 68, 40, METAL, INK, 1.5, rx=4)  # heater block
    s.rect(x - 20, tip_y - 118, 40, 40, METAL_DARK, INK, 1.5, rx=3)  # heat break / sink
    for i in range(4):
        s.line(x - 20, tip_y - 112 + i * 9, x + 20, tip_y - 112 + i * 9, "#334155", 1.2)
    s.poly([(x - 16, tip_y - 38), (x + 16, tip_y - 38), (x + 5, tip_y), (x - 5, tip_y)], BRASS)
    if blocked:
        s.poly([(x - 6, tip_y - 30), (x + 6, tip_y - 30), (x + 3, tip_y - 6), (x - 3, tip_y - 6)], "#3F2A12", None)


def ring(s: Svg, cx, cy, r):
    """Dashed marker around the defect."""
    s.circle(cx, cy, r, "none", DEFECT, 2.5, ' stroke-dasharray="7 5"')


def layer(s: Svg, x0, x1, y, h=9, fill=PART, stroke=PART_DARK):
    """One extruded layer seen from the side: a rounded bar."""
    s.rect(x0, y, x1 - x0, h, fill, stroke, 1.2, rx=h / 2)


def stack(s: Svg, x0, x1, base_y, n, h=9, offsets=None, widths=None, fill=PART):
    """A printed part as a stack of layers. offsets(i) shifts layer i sideways."""
    for i in range(n):
        dx = offsets(i) if offsets else 0
        dl, dr = widths(i) if widths else (0, 0)
        layer(s, x0 + dx - dl, x1 + dx + dr, base_y - (i + 1) * h, h, fill)


def iso(x, y, z, cx=240, cy=170, k=1.0):
    return (cx + (x - y) * 0.866 * k, cy + (x + y) * 0.5 * k - z * k)


def iso_box(s: Svg, x0, y0, z0, dx, dy, dz, cx=240, cy=170, layers=0, fills=(PART_TOP, PART, PART_DARK)):
    x1, y1, z1 = x0 + dx, y0 + dy, z0 + dz
    P = lambda x, y, z: iso(x, y, z, cx, cy)
    s.poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], fills[1])
    s.poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], fills[2])
    s.poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], fills[0])
    for i in range(1, layers):
        z = z0 + dz * i / layers
        a, b = P(x0, y1, z), P(x1, y1, z)
        s.line(*a, *b, PART_DARK, 0.8, ' opacity="0.6"')
        a, b = P(x1, y0, z), P(x1, y1, z)
        s.line(*a, *b, "#185DAD", 0.8, ' opacity="0.6"')


def iso_bed(s: Svg, size=170, cx=240, cy=170, z=0):
    P = lambda x, y, zz: iso(x, y, zz, cx, cy)
    s.poly([P(-size, -size, z), P(size, -size, z), P(size, size, z), P(-size, size, z)], BED, BED_EDGE)
    s.poly([P(-size, size, z), P(size, size, z), P(size, size, z - 10), P(-size, size, z - 10)], BED_EDGE, BED_EDGE)
    s.poly([P(size, -size, z), P(size, size, z), P(size, size, z - 10), P(size, -size, z - 10)], "#A9B6C7", BED_EDGE)


def hairs(s: Svg, x0, x1, ys, sag=10, sw=0.9, seed=1, colour=PART_DARK):
    rnd = random.Random(seed)
    for y in ys:
        yb = y + rnd.uniform(-3, 3)
        ye = y + rnd.uniform(-6, 6)
        c = (y + ye) / 2 + sag + rnd.uniform(-4, 6)
        s.path(f"M{x0:.1f},{yb:.1f} Q{(x0 + x1) / 2:.1f},{c:.1f} {x1:.1f},{ye:.1f}", stroke=colour, sw=sw)


def resin_scene(s: Svg, plate_y=60, vat_top=250):
    """Upside-down resin printer: plate above, vat with film at the bottom."""
    s.rect(220, 10, 40, plate_y - 10, METAL_DARK, INK, 1.5, rx=3)  # arm
    s.rect(110, plate_y, 260, 22, METAL, INK, 1.5, rx=4)  # build plate
    s.rect(70, vat_top, 340, 70, "none", INK, 2, rx=6)  # vat walls
    s.rect(72, vat_top + 20, 336, 48, RESIN_LIGHT, None, extra=' opacity="0.85"')  # resin
    s.line(72, vat_top + 68, 408, vat_top + 68, "#94A3B8", 3)  # film
    s.rect(80, vat_top + 74, 320, 18, "#334155", INK, 1.5, rx=2)  # screen


def jagged(points, amp=4, seed=3):
    rnd = random.Random(seed)
    out = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        steps = max(2, int(math.hypot(x1 - x0, y1 - y0) / 8))
        for i in range(steps):
            t = i / steps
            out.append((x0 + (x1 - x0) * t + rnd.uniform(-amp, amp), y0 + (y1 - y0) * t + rnd.uniform(-amp, amp)))
    out.append(points[-1])
    return out
