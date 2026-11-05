#!/usr/bin/env python3
"""
Label-accurate product loops built from the official product photos.

Nothing here is AI-generated: every frame is the real photo, moved by a virtual
camera (slow push-in + drift), with a light sweep and soft gold bokeh composited
on top. The packaging pixels are only scaled/shifted, never redrawn, so the
label text stays exactly as printed.

Output per product (public/films/):
  <key>-loop.mp4   H.264, 4:5, 8 s seamless loop, no audio
  <key>-loop.webm  VP9 version
  <key>-loop.webp  poster (frame 0)

Usage (from unincore-promotion/):
  python3 scripts/films/build_product_loops.py
"""
import math
import os
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "public", "products")
OUT = os.path.join(ROOT, "public", "films")

W, H = 720, 900
FPS, SECONDS = 24, 8
N = FPS * SECONDS
GOLD = np.array([255, 214, 130], dtype=np.float32) / 255.0


def ease(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, x)))


def camera(img, t):
    """Seamless push-in/out + gentle drift. t in [0,1)."""
    s = 1.02 + 0.045 * math.sin(math.pi * t) ** 2
    dx = 7 * math.sin(2 * math.pi * t)
    dy = -5 * math.sin(2 * math.pi * t + 0.6)
    bw, bh = img.size
    cw, ch = bw / s, bh / s
    cx, cy = bw / 2 + dx, bh / 2 + dy
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.resize((W, H), Image.LANCZOS, box=box)


def sweep(t):
    """Diagonal light band, crossing once per loop (between 15% and 60%)."""
    p = ease((t - 0.15) / 0.45)
    if p <= 0 or p >= 1:
        return None
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    ang = math.radians(22)
    d = xx * math.cos(ang) + yy * math.sin(ang)
    span = W * math.cos(ang) + H * math.sin(ang)
    c = -0.25 * span + p * 1.5 * span
    band = np.exp(-(((d - c) / (0.12 * span)) ** 2))
    return (band * 0.42 * math.sin(math.pi * p)).astype(np.float32)


class Bokeh:
    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        self.n = 34
        self.x = rng.uniform(0, W, self.n)
        self.y0 = rng.uniform(0, H, self.n)
        self.r = rng.uniform(4, 17, self.n)
        self.a = rng.uniform(0.5, 1.0, self.n)
        self.k = rng.integers(1, 3, self.n)  # full rises per loop → seamless
        self.ph = rng.uniform(0, 2 * math.pi, self.n)
        # keep the centre (the product) mostly clear
        edge = np.minimum(np.abs(self.x - W / 2) / (W / 2), 1.0)
        self.a *= 0.08 + 0.92 * edge ** 1.6

    def layer(self, t):
        im = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(im)
        for i in range(self.n):
            y = (self.y0[i] - t * self.k[i] * (H + 60)) % (H + 60) - 30
            x = self.x[i] + 14 * math.sin(2 * math.pi * t + self.ph[i])
            flick = 0.75 + 0.25 * math.sin(2 * math.pi * 2 * t + self.ph[i])
            v = int(255 * self.a[i] * flick)
            r = self.r[i]
            d.ellipse((x - r, y - r, x + r, y + r), fill=v)
        im = im.filter(ImageFilter.GaussianBlur(3.0))
        # a few large, slow out-of-focus orbs for depth
        orbs = Image.new("L", (W, H), 0)
        od = ImageDraw.Draw(orbs)
        for j, (ox, oy, rr) in enumerate(((0.12, 0.25, 70), (0.88, 0.62, 90), (0.2, 0.85, 60))):
            y = (oy * H - t * (H + 200)) % (H + 200) - 100
            x = ox * W + 20 * math.sin(2 * math.pi * t + j)
            od.ellipse((x - rr, y - rr, x + rr, y + rr), fill=70)
        orbs = orbs.filter(ImageFilter.GaussianBlur(28))
        return np.clip((np.asarray(im, dtype=np.float32) + np.asarray(orbs, dtype=np.float32)) / 255.0, 0, 1)


def vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    return (1 - 0.18 * np.clip(r - 0.55, 0, 1) ** 1.5)[..., None]


def render(key, seed):
    src = Image.open(os.path.join(SRC, f"{key}-hero.webp")).convert("RGB")
    bokeh = Bokeh(seed)
    vig = vignette()
    with tempfile.TemporaryDirectory() as tmp:
        for f in range(N):
            t = f / N
            fr = np.asarray(camera(src, t), dtype=np.float32) / 255.0
            sw = sweep(t)
            if sw is not None:
                fr = 1 - (1 - fr) * (1 - sw[..., None])  # screen
            b = bokeh.layer(t)[..., None]
            fr = np.clip(fr * (1 - 0.35 * b) + b * GOLD * 1.05, 0, 1)  # warm glow that still reads on light backgrounds
            fr = np.clip(fr * vig, 0, 1)
            Image.fromarray((fr * 255).astype(np.uint8)).save(os.path.join(tmp, f"{f:04d}.png"))
        frames = os.path.join(tmp, "%04d.png")
        base = os.path.join(OUT, f"{key}-loop")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", frames,
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21", "-preset", "slow",
                        "-movflags", "+faststart", "-an", base + ".mp4"], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", frames,
                        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "34", "-row-mt", "1", "-an", base + ".webm"], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "0000.png"),
                        "-c:v", "libwebp", "-quality", "82", base + ".webp"], check=True)
    print(key, "done")


if __name__ == "__main__":
    for i, k in enumerate(["wash", "mask", "ampoule"]):
        render(k, 11 + i)
