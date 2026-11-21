"""
받은 무료 원본(tools/assets/incoming)을 게임 파일로 가공한다.
    python3 tools/assets/fetch_free_assets.py && python3 tools/assets/build_free_assets.py
- 텍스처: 512px 로 줄이고, 색이 있는 맵은 라운지 파스텔 팔레트에 맞춰 보정 → public/tex/
- HDRI: 그대로 복사 → public/tex/
- 사운드: 모노/스테레오 MP3 로 다시 인코딩, 루프는 끝과 처음을 겹쳐 이음매를 없앤다 → public/audio/
Quaternius 모델은 Blender 가 필요해서 tools/blender/import_quaternius.py 가 따로 만든다.
"""
import colorsys, os, shutil, subprocess
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IN = os.path.join(HERE, "incoming")
PUB = os.path.join(HERE, "..", "..", "public")
TEX = os.path.join(PUB, "tex")
AUD = os.path.join(PUB, "audio")
AC = os.path.join(IN, "ambientcg")


def tex(src, out, size=512, q=82, tint=None):
    im = Image.open(src).convert("RGB").resize((size, size), Image.LANCZOS)
    if tint:
        im = pastel(im, **tint)
    im.save(os.path.join(TEX, out), quality=q, optimize=True)


def pastel(im, hue=None, sat=1.0, val=1.0, lift=0.0, remap=()):
    """HSV 로 색을 옮겨 파스텔 팔레트에 맞춘다. hue 는 0..1 로 고정할 목표 색상, remap 은 [(h0, h1, 새 색상)] 구간 치환."""
    a = np.asarray(im.convert("RGBA"), dtype=np.float32) / 255
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, (g - b) / d % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    if hue is not None:
        h = np.full_like(h, hue)
    for h0, h1, nh in remap:
        h = np.where((h >= h0) & (h <= h1), nh, h)
    s = np.clip(s * sat, 0, 1)
    v = np.clip(v * val + lift * (1 - v), 0, 1)
    i = np.floor(h * 6) % 6
    f = h * 6 - np.floor(h * 6)
    p, qq, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.zeros_like(rgb)
    for k, (R, G, B) in enumerate([(v, t, p), (qq, v, p), (p, v, t), (p, qq, v), (t, p, v), (v, p, qq)]):
        m = i == k
        out[m] = np.stack([R[m], G[m], B[m]], -1)
    res = np.concatenate([out, a[..., 3:]], -1)
    return Image.fromarray((res * 255).astype(np.uint8), "RGBA").convert(im.mode)


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def loop_audio(src, out, start, length, fade=2.0, mono=True, kbps=56, peak=0.6):
    """[start, start+length+fade] 를 잘라 끝 fade 초를 처음과 겹쳐 이음매 없는 루프로 만든다."""
    sr = 44100
    ch = 1 if mono else 2
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(start), "-t", str(length + fade), "-i", src,
                          "-f", "f32le", "-ac", str(ch), "-ar", str(sr), "-"], check=True, capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
    n = int(fade * sr)
    body, tail = x[:-n], x[-n:]
    w = np.linspace(0, 1, n)[:, None]
    body[:n] = body[:n] * w + tail * (1 - w)
    body *= peak / max(1e-4, float(np.abs(body).max()))  # 원본 녹음 음량이 제각각이라 최대값을 맞춘다
    tmp = os.path.join(IN, "_loop.f32")
    body.astype(np.float32).tofile(tmp)
    ff("-f", "f32le", "-ar", str(sr), "-ac", str(ch), "-i", tmp, "-c:a", "libmp3lame", "-b:a", f"{kbps}k", os.path.join(AUD, out))
    os.remove(tmp)


def sfx(src, out, peak_db=-3.0):
    """효과음은 최대 음량을 peak_db 로 맞춘다 (팩마다 녹음 크기가 다르다)."""
    det = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    mx = float(det.split("max_volume:")[1].split("dB")[0]) if "max_volume:" in det else 0.0
    ff("-i", src, "-af", f"volume={peak_db - mx:.1f}dB,apad=pad_dur=0.15", "-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "64k", os.path.join(AUD, out))


def main():
    os.makedirs(TEX, exist_ok=True)
    os.makedirs(AUD, exist_ok=True)
    # ── 재질 · HDRI ──
    g = f"{AC}/Grass004_1K-JPG/Grass004_1K-JPG_"
    tex(g + "Color.jpg", "grass_c.jpg", tint=dict(hue=0.3, sat=0.3, val=1.0, lift=0.62))
    tex(g + "NormalGL.jpg", "grass_n.jpg")
    c = f"{AC}/Concrete034_1K-JPG/Concrete034_1K-JPG_"
    tex(c + "NormalGL.jpg", "paving_n.jpg")
    tex(c + "Roughness.jpg", "paving_r.jpg", size=256)
    tex(f"{AC}/Fabric086_1K-JPG/Fabric086_1K-JPG_NormalGL.jpg", "fabric_n.jpg")
    shutil.copy(os.path.join(IN, "polyhaven/kloofendal_43d_clear_puresky_1k.hdr"), os.path.join(TEX, "sky_plaza.hdr"))
    # ── 사운드 ──
    o = os.path.join(IN, "oga")
    ff("-i", f"{o}/apple_cider.ogg", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "80k", os.path.join(AUD, "bgm_lounge.mp3"))
    ff("-i", f"{o}/hot_spring_town_1.ogg", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "80k", os.path.join(AUD, "bgm_plaza.mp3"))
    loop_audio(f"{o}/park_ambience_birds.wav", "amb_birds.mp3", 30, 36, peak=0.5)
    loop_audio(f"{o}/sfx_100_v2/sfx100v2_loop_water_03.ogg", "amb_water.mp3", 0.3, 8.0, fade=1.0, kbps=48)
    ui = os.path.join(o, "kenney_interfaceSounds", "Audio")
    if not os.path.isdir(ui):
        ui = next(os.path.join(r, "") for r, _, fs in os.walk(os.path.join(o, "kenney_interfaceSounds")) if "click_001.ogg" in fs)
    for src, out in [("click_001", "ui_click"), ("open_001", "ui_open"), ("close_001", "ui_close"), ("confirmation_002", "reward"),
                     ("glass_001", "pickup"), ("error_004", "error"), ("maximize_008", "heart"), ("confirmation_001", "chime")]:
        sfx(os.path.join(ui, src + ".ogg"), out + ".mp3")
    for d in (TEX, AUD):
        for f in sorted(os.listdir(d)):
            if f.split("_")[0] in ("grass", "paving", "fabric", "sky") or d == AUD:
                print(f"{os.path.relpath(os.path.join(d, f), PUB):28s} {os.path.getsize(os.path.join(d, f)) / 1024:8.1f} KB")


if __name__ == "__main__":
    main()
