#!/usr/bin/env python3
"""
Rebuilds the two brand films that carried an unverified "13.5%" claim:

  * ampoule-{16x9,9x16}.mp4     rebuilt from scratch, same story beats:
        serum drop -> product card -> turning lemon -> end card
  * collection-{16x9,9x16}.mp4  only the drop chapter (~17-20.5 s) is replaced;
        everything else, and the soundtrack, is kept

On-screen copy uses only label-verified facts (pure vitamin C / ascorbic acid,
glutathione, hyaluronic acid, panthenol, 1.06 oz (30 g), one to two pumps).
The product is always the official photo (public/products), never a rendered
package.

Usage (from unincore-promotion/):
    python3 scripts/films/build_ampoule_films.py \
        --sources <dir with the Flow clips> --fonts <dir with Cormorant Garamond .woff> \
        --work <scratch dir>

Needs ffmpeg, Pillow and numpy. Inter is read from the system font directory.
"""
import argparse
import glob
import os
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FILMS = os.path.join(ROOT, "public", "videos", "vitac", "films")
PRODUCT = os.path.join(ROOT, "public", "products", "ampoule-hero.webp")
INTER = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
FPS = 24

GOLD_TOP, GOLD_MID, GOLD_LOW = (255, 243, 207), (233, 185, 77), (165, 121, 58)
IVORY = (244, 239, 231)


def run(cmd):
    print("+", " ".join(cmd[:6]), "...")
    subprocess.run(cmd, check=True)


def src(sources, key):
    hits = glob.glob(os.path.join(sources, f"*{key}*.mp4"))
    if not hits:
        raise SystemExit(f"missing source clip: {key}")
    return hits[0]


# ---------------------------------------------------------------- typography

def gold_text(text, font, tracking=0):
    """Text filled with a vertical gold gradient, with a soft glow, on transparency."""
    widths = [font.getbbox(ch)[2] - font.getbbox(ch)[0] if ch != " " else font.getbbox("n")[2] for ch in text]
    asc, desc = font.getmetrics()
    w = int(sum(widths) + tracking * (len(text) - 1)) + 40
    h = asc + desc + 40
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    x = 20
    for ch, cw in zip(text, widths):
        d.text((x, 20), ch, font=font, fill=255)
        x += cw + tracking
    grad = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        a, b, tt = (GOLD_TOP, GOLD_MID, t / 0.5) if t < 0.5 else (GOLD_MID, GOLD_LOW, (t - 0.5) / 0.5)
        grad.putpixel((0, y), tuple(int(a[i] + (b[i] - a[i]) * tt) for i in range(3)))
    grad = grad.resize((w, h))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow = Image.new("RGBA", (w, h), GOLD_MID + (0,))
    glow.putalpha(mask.filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * 0.35)))
    out.alpha_composite(glow)
    fill = grad.convert("RGBA")
    fill.putalpha(mask)
    out.alpha_composite(fill)
    return out.crop(out.getbbox())


def plain_text(text, font, color, tracking=0):
    widths = [font.getbbox(ch)[2] - font.getbbox(ch)[0] if ch != " " else font.getbbox("n")[2] for ch in text]
    asc, desc = font.getmetrics()
    w = int(sum(widths) + tracking * (len(text) - 1)) + 10
    img = Image.new("RGBA", (w, asc + desc + 10), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 5
    for ch, cw in zip(text, widths):
        d.text((x, 5), ch, font=font, fill=color)
        x += cw + tracking
    return img.crop(img.getbbox())


def stack(items, gap, align="left"):
    w = max(i.width for i in items)
    h = sum(i.height for i in items) + gap * (len(items) - 1)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    y = 0
    for i in items:
        x = 0 if align == "left" else (w - i.width) // 2
        out.alpha_composite(i, (x, y))
        y += i.height + gap
    return out


def card(height):
    """Official product photo as a rounded card with a soft shadow (like the other films)."""
    photo = Image.open(PRODUCT).convert("RGB")
    w = int(height * photo.width / photo.height)
    photo = photo.resize((w, height), Image.LANCZOS)
    r = int(w * 0.07)
    m = Image.new("L", (w, height), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, height - 1), r, fill=255)
    pad = 60
    out = Image.new("RGBA", (w + pad * 2, height + pad * 2), (0, 0, 0, 0))
    sh = Image.new("L", out.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 24, pad + w, pad + height + 24), r, fill=150)
    shadow = Image.new("RGBA", out.size, (0, 0, 0, 255))
    shadow.putalpha(sh.filter(ImageFilter.GaussianBlur(28)))
    out.alpha_composite(shadow)
    ph = photo.convert("RGBA")
    ph.putalpha(m)
    out.alpha_composite(ph, (pad, pad))
    return out


def fonts(fdir):
    cg = lambda wgt, size: ImageFont.truetype(os.path.join(fdir, f"cormorant-garamond-latin-{wgt}-normal.woff"), size)
    inter = lambda size: ImageFont.truetype(INTER, size)
    return cg, inter


def scrim(img, strength=170):
    """Puts a soft, feathered dark pool behind a text block so it reads over any footage."""
    pad = max(60, int(img.height * 0.8))
    out = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    m = Image.new("L", out.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((pad * 0.75, pad * 0.75, out.width - pad * 0.75, out.height - pad * 0.75), radius=pad, fill=strength)
    m = m.filter(ImageFilter.GaussianBlur(pad * 0.6))
    shade = Image.new("RGBA", out.size, (0, 0, 0, 255))
    shade.putalpha(m)
    out.alpha_composite(shade)
    out.alpha_composite(img, (pad, pad))
    return out, pad


def layers(work, cg, inter, W, H):
    """Renders every text/card layer for one aspect ratio. Returns {name: (path, x, y)}.

    Copy is kept off the subject: on 16:9 it sits in the left third (the drop and
    lemon are centred), on 9:16 it sits in the lower band. Every block gets a scrim.
    """
    v = H > W
    s = W / 1920 if not v else 0.66
    px = lambda n, lo=0: max(lo, int(n * s))
    small = 17 if v else 0  # floor for small caps on the vertical cut
    L = {}

    def save(name, img, x, y, shade=None):
        if shade:
            img, pad = scrim(img, shade)
            x, y = x - pad, y - pad
        p = os.path.join(work, f"{name}_{W}x{H}.png")
        img.save(p)
        L[name] = (p, int(x), int(y))

    # Beat 1: drop -> "Vitamin C."
    eyebrow = plain_text("STEP 03 — BRIGHTEN", inter(px(22, small)), IVORY + (210,), tracking=px(7, 4))
    big = gold_text("Vitamin C.", cg(500, px(96 if not v else 120)), tracking=px(2))
    sub = plain_text("PURE VITAMIN C · ASCORBIC ACID", inter(px(20, small)), GOLD_MID + (240,), tracking=px(8, 4))
    b1 = stack([eyebrow, big, sub], px(18), "left" if not v else "center")
    if not v:
        save("b1", b1, W * 0.06, H * 0.09, 150)  # top-left: clear of drop and splash crown
    else:
        save("b1", b1, (W - b1.width) / 2, H * 0.90 - b1.height, 190)

    # Beat 2: product card + line
    c = card(int(H * (0.52 if not v else 0.40)))
    save("card", c, (W - c.width) / 2, H * (0.08 if not v else 0.12))
    line = gold_text("PURE VITAMIN C.", cg(500, px(56 if not v else 64)), tracking=px(9))
    ing = plain_text("+ GLUTATHIONE  ·  HYALURONIC ACID  ·  PANTHENOL", inter(px(17, small - 2 if v else 0)), IVORY + (200,), tracking=px(5, 2))
    b2 = stack([line, ing], px(16), "center")
    save("b2", b2, (W - b2.width) / 2, H * (0.79 if not v else 0.66), 140)

    # Beat 3: lemon -> line
    l1 = gold_text("THE FINISHING STEP", cg(500, px(60 if not v else 58)), tracking=px(10, 5))
    l2 = gold_text("TO YOUR GLOW.", cg(500, px(60 if not v else 58)), tracking=px(10, 5))
    b3 = stack([l1, l2], px(10), "left" if not v else "center")
    if not v:
        save("b3", b3, W * 0.06, H * 0.09, 170)  # lemon is centred
    else:
        save("b3", b3, (W - b3.width) / 2, H * 0.90 - b3.height, 200)

    # Beat 4: end card
    ce = card(int(H * (0.5 if not v else 0.40)))
    name = gold_text("VITA C 13.5 SUPER BRIGHTENING AMPOULE", cg(500, px(40 if not v else 34)), tracking=px(5, 2))
    facts = plain_text("1.06 OZ (30 G)  ·  1–2 PUMPS", inter(px(18, small)), IVORY + (215,), tracking=px(6, 3))
    amz = plain_text("NOW ON AMAZON", inter(px(18, small)), GOLD_MID + (245,), tracking=px(8, 4))
    brand = plain_text("UNI&CORE", inter(px(15, small - 3 if v else 0)), IVORY + (170,), tracking=px(10, 5))
    txt = stack([name, facts, amz, brand], px(18), "left" if not v else "center")
    if not v:
        gap = px(56)
        total = ce.width + gap + txt.width
        x0 = (W - total) / 2
        save("endcard", ce, x0, (H - ce.height) / 2)
        save("endtxt", txt, x0 + ce.width + gap, (H - txt.height) / 2, 170)
    else:
        save("endcard", ce, (W - ce.width) / 2, H * 0.10)
        save("endtxt", txt, (W - txt.width) / 2, H * 0.62, 180)

    # Collection drop chapter
    ce2 = plain_text("STEP 03 — BRIGHTEN", inter(px(18, small)), IVORY + (200,), tracking=px(8, 4))
    cl = gold_text("PURE VITAMIN C.", cg(500, px(58 if not v else 66)), tracking=px(10, 5))
    cb = stack([ce2, cl], px(14), "left" if not v else "center")
    if not v:
        save("coldrop", cb, W * 0.06, H * 0.09, 150)
    else:
        save("coldrop", cb, (W - cb.width) / 2, H * 0.90 - cb.height, 190)
    return L


# ------------------------------------------------------------------- video

def base(path, start, dur, W, H, extra=""):
    """Trim a 16:9 source clip, fit it to W x H (cover) and grade it toward the films' look."""
    fit = f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}"
    grade = "eq=contrast=1.06:saturation=1.08:gamma=0.97,unsharp=5:5:0.4"
    return f"trim=start={start}:duration={dur},setpts=PTS-STARTPTS,fps={FPS},{fit},{grade}{extra},format=yuv420p"


def overlay_chain(label_in, L, items, label_out):
    """items: [(layer_name, t_in, t_out, fade)] -> filtergraph fragments."""
    parts, cur = [], label_in
    for k, (name, t0, t1, fd) in enumerate(items):
        p, x, y = L[name]
        parts.append(
            f"movie={p},format=rgba,loop=loop=-1:size=1:start=0,trim=duration={t1 + fd},setpts=PTS-STARTPTS,"
            f"fade=t=in:st={t0}:d={fd}:alpha=1,fade=t=out:st={t1 - fd}:d={fd}:alpha=1[ov{k}];"
            f"[{cur}][ov{k}]overlay={x}:{y}:enable='between(t,{t0},{t1})':eof_action=pass[o{k}]"
        )
        cur = f"o{k}"
    parts[-1] = parts[-1][: parts[-1].rfind("[")] + f"[{label_out}]"
    return ";".join(parts)


def build_ampoule(sources, L, W, H, out, audio_from):
    drop, lemon, pump = src(sources, "Serum_drop"), src(sources, "Rotating_translucent_lemon"), src(sources, "Pump_bottle")
    # Beats (seconds): drop 0-4.2, card 3.7-8.7, lemon 8.2-11.4, end 10.9-14.625 (0.5 s crossfades)
    g = []
    g.append(f"[0:v]{base(drop, 0.5, 4.2, W, H)}[a]")
    # Card beat sits on the pump-bottle clip blurred far past legibility (its label render is inaccurate).
    g.append(f"[1:v]{base(pump, 1.5, 5.0, W, H, ',gblur=sigma=26,eq=brightness=-0.12')}[b]")
    g.append(f"[2:v]{base(lemon, 0.0, 3.7, W, H)}[c]")
    g.append(f"[3:v]{base(lemon, 3.7, 4.225, W, H, ',gblur=sigma=22,eq=brightness=-0.26')}[d]")
    g.append("[a][b]xfade=transition=fade:duration=0.5:offset=3.7[ab]")
    g.append("[ab][c]xfade=transition=fade:duration=0.5:offset=8.2[abc]")
    g.append("[abc][d]xfade=transition=fade:duration=0.5:offset=11.4[bg]")
    items = [("b1", 0.6, 3.9, 0.45), ("card", 4.0, 8.5, 0.5), ("b2", 4.6, 8.4, 0.45), ("b3", 8.7, 11.3, 0.45), ("endcard", 11.6, 14.62, 0.5), ("endtxt", 12.0, 14.62, 0.5)]
    g.append(overlay_chain("bg", L, items, "v"))
    run(["ffmpeg", "-v", "error", "-y", "-i", drop, "-i", pump, "-i", lemon, "-i", lemon, "-i", audio_from,
         "-filter_complex", ";".join(g), "-map", "[v]", "-map", "4:a?", "-t", "14.625",
         "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(FPS),
         "-c:a", "copy", "-movflags", "+faststart", out])


def build_collection(sources, L, W, H, original, out):
    drop = src(sources, "Serum_drop")
    # Keep 0-17.0 and 20.5-end; insert a 4.2 s drop chapter with 0.35 s crossfades (total length unchanged).
    g = [
        f"[0:v]trim=0:17.0,setpts=PTS-STARTPTS,fps={FPS},format=yuv420p[a]",
        f"[1:v]{base(drop, 0.2, 4.2, W, H)}[n0]",
        f"[0:v]trim=start=20.5,setpts=PTS-STARTPTS,fps={FPS},format=yuv420p[c]",
    ]
    g.append(overlay_chain("n0", L, [("coldrop", 0.5, 3.9, 0.45)], "n"))
    g.append("[a][n]xfade=transition=fade:duration=0.35:offset=16.65[an]")
    g.append("[an][c]xfade=transition=fade:duration=0.35:offset=20.5[v]")
    run(["ffmpeg", "-v", "error", "-y", "-i", original, "-i", drop, "-filter_complex", ";".join(g),
         "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
         "-r", str(FPS), "-c:a", "copy", "-movflags", "+faststart", out])


def poster(video, t, out):
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video, "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", out])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sources", required=True)
    ap.add_argument("--fonts", required=True)
    ap.add_argument("--work", required=True)
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    cg, inter = fonts(a.fonts)
    for W, H, tag in [(1920, 1080, "16x9"), (720, 1280, "9x16")]:
        L = layers(a.work, cg, inter, W, H)
        orig_amp = os.path.join(a.work, f"ampoule-{tag}.orig.mp4")
        orig_col = os.path.join(a.work, f"collection-{tag}.orig.mp4")
        for name, keep in [(f"ampoule-{tag}.mp4", orig_amp), (f"collection-{tag}.mp4", orig_col)]:
            if not os.path.exists(keep):
                run(["cp", os.path.join(FILMS, name), keep])
        build_ampoule(a.sources, L, W, H, os.path.join(FILMS, f"ampoule-{tag}.mp4"), orig_amp)
        build_collection(a.sources, L, W, H, orig_col, os.path.join(FILMS, f"collection-{tag}.mp4"))
        poster(os.path.join(FILMS, f"ampoule-{tag}.mp4"), 6.0, os.path.join(FILMS, f"ampoule-{tag}-poster.webp"))


if __name__ == "__main__":
    main()
