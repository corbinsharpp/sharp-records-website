#!/usr/bin/env python3
"""Generate original grainy monochrome imagery for the Sharp Records site."""
from __future__ import annotations

import math
import os
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

OUT = Path(__file__).resolve().parents[1] / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

BLACK = (13, 13, 13)
PAPER = (242, 240, 234)
GREY = (138, 141, 145)


def rng(seed: int) -> random.Random:
    return random.Random(seed)


def noise_array(w: int, h: int, seed: int, sigma: float = 1.0) -> np.ndarray:
    rs = np.random.default_rng(seed)
    return rs.normal(128, 40 * sigma, (h, w)).clip(0, 255).astype(np.uint8)


def grain_layer(w: int, h: int, seed: int, amount: int = 70) -> Image.Image:
    rs = np.random.default_rng(seed)
    noise = rs.integers(-amount, amount + 1, (h, w), dtype=np.int16)
    return Image.fromarray(np.clip(noise + 128, 0, 255).astype(np.uint8), mode="L")


def add_grain(img: Image.Image, seed: int, amount: float = 0.28) -> Image.Image:
    g = grain_layer(img.size[0], img.size[1], seed, amount=70)
    g = ImageEnhance.Contrast(g).enhance(1.4)
    img = img.convert("RGB")
    g_rgb = Image.merge("RGB", (g, g, g))
    return Image.blend(img, g_rgb, amount)


def scratches(img: Image.Image, seed: int, count: int = 40, tone: int = 180) -> Image.Image:
    r = rng(seed)
    overlay = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    for _ in range(count):
        x1, y1 = r.randint(-20, w), r.randint(0, h)
        length = r.randint(20, int(w * 0.55))
        angle = r.uniform(-0.25, 0.25)
        x2 = x1 + int(length * math.cos(angle))
        y2 = y1 + int(length * math.sin(angle))
        width = 1 if r.random() > 0.15 else 2
        shade = r.randint(max(0, tone - 40), min(255, tone + 40))
        d.line((x1, y1, x2, y2), fill=shade, width=width)
    for _ in range(count * 8):
        x, y = r.randint(0, w - 1), r.randint(0, h - 1)
        overlay.putpixel((x, y), r.randint(80, 220))
    scratches_rgb = Image.merge("RGB", (overlay, overlay, overlay))
    return ImageChops.screen(img.convert("RGB"), scratches_rgb)


def vignette(img: Image.Image, strength: float = 0.55) -> Image.Image:
    w, h = img.size
    y, x = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    dist = np.sqrt(((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2)
    mask = np.clip(1 - (dist ** 1.6) * strength, 0.18, 1)
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    arr *= mask[..., None]
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGB")


def to_paper_bw(img: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(img)
    arr = np.asarray(gray, dtype=np.float32) / 255.0
    black = np.array(BLACK, dtype=np.float32)
    paper = np.array(PAPER, dtype=np.float32)
    out = black + (paper - black) * arr[..., None]
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGB")


def save_webp(img: Image.Image, name: str, quality: int = 78) -> None:
    path = OUT / name
    img = img.convert("RGB")
    img.save(path, "WEBP", quality=quality, method=6)
    kb = path.stat().st_size / 1024
    print(f"  {name:28s} {img.size[0]}x{img.size[1]:4d}  {kb:6.1f} KB")


def radial(w: int, h: int, cx: float, cy: float, radius: float) -> np.ndarray:
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    return np.clip(1 - dist / radius, 0, 1)


def make_grain_tile() -> None:
    arr = noise_array(256, 256, seed=11, sigma=1.6)
    img = Image.fromarray(arr, "L").convert("RGB")
    img = to_paper_bw(img)
    save_webp(img, "grain-tile.webp", quality=70)


def make_sr001() -> None:
    w = h = 1400
    field = np.zeros((h, w), dtype=np.float32)
    clusters = [
        (0.48, 0.52, 520, 1.0),
        (0.32, 0.38, 260, 0.72),
        (0.68, 0.42, 240, 0.64),
        (0.55, 0.70, 200, 0.5),
        (0.22, 0.62, 160, 0.4),
        (0.78, 0.64, 150, 0.38),
        (0.44, 0.28, 130, 0.35),
    ]
    for cx, cy, rad, amp in clusters:
        field += amp * radial(w, h, cx * w, cy * h, rad)
    r = rng(901)
    for _ in range(28):
        field += 0.12 * radial(
            w, h, r.uniform(0.15, 0.85) * w, r.uniform(0.18, 0.82) * h, r.uniform(30, 90)
        )
    field = np.clip(field / field.max(), 0, 1) ** 1.35
    img = Image.fromarray((field * 255).astype(np.uint8), "L")
    img = img.filter(ImageFilter.GaussianBlur(radius=6))
    img = add_grain(img.convert("RGB"), seed=902, amount=0.32)
    img = scratches(img, seed=903, count=36)
    img = vignette(img, 0.62)
    img = to_paper_bw(img)
    d = ImageDraw.Draw(img)
    m = 48
    d.rectangle([m, m, w - m, h - m], outline=(242, 240, 234), width=1)
    d.rectangle([m + 8, m + 8, w - m - 8, h - m - 8], outline=(90, 90, 88), width=1)
    save_webp(img, "art-sr001.webp", quality=80)


def make_artist() -> None:
    w, h = 1000, 1400
    canvas = Image.new("L", (w, h), 18)
    d = ImageDraw.Draw(canvas)
    r = rng(401)
    for i in range(14):
        x0 = r.randint(-40, w // 3)
        y0 = int(h * (i / 16)) + r.randint(-20, 40)
        x1 = x0 + r.randint(280, 720)
        y1 = y0 + r.randint(70, 180)
        d.rectangle([x0, y0, x1, y1], fill=r.randint(28, 92))
    d.rectangle([w * 0.46, h * 0.22, w * 0.54, h * 0.78], fill=200)
    d.rectangle([w * 0.47, h * 0.24, w * 0.53, h * 0.76], fill=160)
    for _ in range(18):
        x = r.randint(80, w - 160)
        y = r.randint(80, h - 160)
        s = r.randint(18, 54)
        d.rectangle([x, y, x + s, y + int(s * 1.3)], fill=r.randint(110, 200))
    img = canvas.filter(ImageFilter.GaussianBlur(radius=1.6))
    img = add_grain(img.convert("RGB"), seed=402, amount=0.38)
    img = scratches(img, seed=403, count=50)
    img = vignette(img, 0.5)
    img = to_paper_bw(img)
    save_webp(img, "art-artist.webp", quality=80)


def make_radio() -> None:
    w, h = 1800, 1000
    arr = np.zeros((h, w), dtype=np.float32)
    xs = np.linspace(0, 1, w)
    for i, (freq, amp, phase) in enumerate(
        [(6, 0.35, 0.2), (13, 0.22, 1.1), (27, 0.12, 2.4), (3.2, 0.4, 0.7)]
    ):
        wave = 0.5 + 0.5 * np.sin(2 * math.pi * (freq * xs + phase))
        band = amp * wave[None, :] * np.ones((h, 1))
        cy = 0.35 + 0.08 * i
        fall = np.exp(-((np.linspace(0, 1, h) - cy) ** 2) / 0.05)[:, None]
        arr += band * fall
    scan = (np.arange(h) % 3 == 0).astype(np.float32)[:, None] * 0.12
    arr = np.clip(arr + scan, 0, 1)
    arr += 0.25 * radial(w, h, w * 0.22, h * 0.5, 380)
    arr += 0.18 * radial(w, h, w * 0.78, h * 0.42, 300)
    arr = np.clip(arr / arr.max(), 0, 1) ** 0.9
    img = Image.fromarray((arr * 255).astype(np.uint8), "L")
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    img = add_grain(img.convert("RGB"), seed=501, amount=0.3)
    img = scratches(img, seed=502, count=24, tone=160)
    img = vignette(img, 0.45)
    img = to_paper_bw(img)
    save_webp(img, "art-radio.webp", quality=78)


def make_culture_launch() -> None:
    w, h = 1600, 1100
    canvas = Image.new("L", (w, h), 22)
    d = ImageDraw.Draw(canvas)
    r = rng(601)
    horizon = int(h * 0.58)
    d.rectangle([0, horizon, w, h], fill=32)
    for i in range(22):
        t = i / 22
        cx = w * (0.15 + t * 0.75)
        base = horizon - int((1 - t) * r.randint(80, 420))
        bw = int((1 - t) * r.randint(40, 140) + 18)
        d.rectangle([cx - bw, base, cx + bw, horizon + r.randint(0, 30)], fill=r.randint(40, 150))
        if r.random() > 0.4:
            d.rectangle([cx - bw * 0.3, base - r.randint(10, 40), cx + bw * 0.3, base], fill=r.randint(60, 170))
    img = canvas.filter(ImageFilter.GaussianBlur(radius=1.2))
    fog = Image.new("L", (w, h), 0)
    fd = ImageDraw.Draw(fog)
    fd.rectangle([0, horizon - 80, w, h], fill=70)
    fog = fog.filter(ImageFilter.GaussianBlur(radius=40))
    img = ImageChops.add(img, ImageEnhance.Brightness(fog).enhance(0.45))
    img = add_grain(img.convert("RGB"), seed=602, amount=0.36)
    img = scratches(img, seed=603, count=44)
    img = vignette(img, 0.48)
    img = to_paper_bw(img)
    save_webp(img, "art-culture-1.webp", quality=78)


def make_culture_signing() -> None:
    w, h = 1600, 1100
    field = np.zeros((h, w), dtype=np.float32)
    r = rng(701)
    for _ in range(46):
        field += r.uniform(0.15, 0.9) * radial(
            w, h, r.uniform(0.22, 0.78) * w, r.uniform(0.2, 0.8) * h, r.uniform(40, 220)
        )
    field = np.clip(field / field.max(), 0, 1) ** 1.2
    img = Image.fromarray((field * 255).astype(np.uint8), "L")
    img = img.filter(ImageFilter.GaussianBlur(radius=3.5))
    img = ImageOps.autocontrast(img)
    img = add_grain(img.convert("RGB"), seed=702, amount=0.34)
    img = scratches(img, seed=703, count=30)
    img = vignette(img, 0.55)
    img = to_paper_bw(img)
    save_webp(img, "art-culture-2.webp", quality=78)


def make_events() -> None:
    w, h = 1600, 1000
    canvas = Image.new("L", (w, h), 14)
    d = ImageDraw.Draw(canvas)
    r = rng(801)
    for _ in range(70):
        y = r.randint(40, h - 40)
        x1 = r.randint(-100, w // 3)
        x2 = x1 + r.randint(300, w)
        shade = r.randint(70, 230)
        width = r.choice([1, 1, 2, 3, 5])
        d.line([(x1, y), (x2, y + r.randint(-18, 18))], fill=shade, width=width)
    for _ in range(8):
        x = r.randint(100, w - 100)
        d.line([(x, 0), (x + r.randint(-8, 8), h)], fill=r.randint(40, 110), width=r.randint(6, 28))
    img = canvas.filter(ImageFilter.GaussianBlur(radius=1.8))
    img = add_grain(img.convert("RGB"), seed=802, amount=0.33)
    img = scratches(img, seed=803, count=20)
    img = vignette(img, 0.5)
    img = to_paper_bw(img)
    save_webp(img, "art-events.webp", quality=78)


def make_about() -> None:
    w, h = 1600, 1200
    arr = noise_array(w, h, seed=301, sigma=0.55)
    img = Image.fromarray(arr, "L")
    img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
    d = ImageDraw.Draw(img)
    d.rectangle([180, 160, w - 180, h - 160], fill=30)
    d.rectangle([196, 176, w - 196, h - 176], outline=200, width=1)
    img = add_grain(img.convert("RGB"), seed=302, amount=0.4)
    img = scratches(img, seed=303, count=60, tone=190)
    img = vignette(img, 0.4)
    img = to_paper_bw(img)
    save_webp(img, "art-about.webp", quality=76)


def make_og() -> None:
    w, h = 1200, 630
    field = np.zeros((h, w), dtype=np.float32)
    field += 0.9 * radial(w, h, w * 0.82, h * 0.5, 340)
    field += 0.35 * radial(w, h, w * 0.3, h * 0.7, 280)
    field = np.clip(field, 0, 1)
    base = Image.fromarray((field * 40 + 13).astype(np.uint8), "L").convert("RGB")
    base = add_grain(base, seed=110, amount=0.28)
    base = vignette(base, 0.35)
    base = to_paper_bw(base)
    font_paths = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    candidates = ("BigShoulders-Bold.ttf", "BarlowCondensed-Bold.ttf", "Oswald-Bold.ttf", "Anton-Regular.ttf")
    for root, _, files in os.walk("/usr/share/fonts"):
        for f in files:
            if f in candidates or (f.endswith(".ttf") and "Oswald" in f):
                font_paths.insert(0, os.path.join(root, f))

    def load(size: int):
        for fp in font_paths:
            if os.path.exists(fp):
                try:
                    return ImageFont.truetype(fp, size=size)
                except Exception:
                    continue
        return ImageFont.load_default()

    d = ImageDraw.Draw(base)
    title = load(64)
    small = load(22)
    d.text((72, 150), "SHARP RECORDS", font=title, fill=PAPER)
    d.text((72, 240), "NO FIXED GENRE.", font=title, fill=PAPER)
    d.text((72, 310), "NO CREATIVE LIMITS.", font=title, fill=PAPER)
    d.text((72, 380), "NO COMPROMISE.", font=title, fill=PAPER)
    d.text((72, 500), "MANCHESTER  ·  INDEPENDENT ELECTRONIC MUSIC", font=small, fill=GREY)
    d.rectangle([w - 86, 48, w - 48, 86], fill=(255, 59, 48))
    save_webp(base, "og-image.webp", quality=82)
    base.save(OUT / "og-image.png", "PNG", optimize=True)
    print(f"  {'og-image.png':28s} {w}x{h:4d}  {(OUT / 'og-image.png').stat().st_size / 1024:6.1f} KB")


def make_svgs() -> None:
    (OUT / "texture-noise.svg").write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>
""",
        encoding="utf-8",
    )
    print("  texture-noise.svg")
    (OUT / "texture-halftone.svg").write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <defs>
    <pattern id="d" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2.2" cy="2.2" r="1.15" fill="#F2F0EA"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#0D0D0D"/>
  <rect width="100%" height="100%" fill="url(#d)" opacity="0.55"/>
</svg>
""",
        encoding="utf-8",
    )
    print("  texture-halftone.svg")


def main() -> None:
    print("Generating Sharp Records imagery ->", OUT)
    make_grain_tile()
    make_sr001()
    make_artist()
    make_radio()
    make_culture_launch()
    make_culture_signing()
    make_events()
    make_about()
    make_og()
    make_svgs()
    print("Done.")


if __name__ == "__main__":
    main()
