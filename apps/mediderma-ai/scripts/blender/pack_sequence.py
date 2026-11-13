"""Blender 가 렌더링한 프레임(PNG, 투명 배경)을 스프라이트 시트 WebP 한 장으로 묶는다.
  python3 scripts/blender/pack_sequence.py [.blender-out] [public/3d/face-sequence.webp] [cols]
"""
import glob, json, os, sys
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else ".blender-out"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/3d/face-sequence.webp"
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
frames = sorted(glob.glob(os.path.join(src, "frame_*.png")))
assert frames, "no frames"
first = Image.open(frames[0])
w, h = first.size
rows = -(-len(frames) // cols)
sheet = Image.new("RGBA", (w * cols, h * rows), (0, 0, 0, 0))
for i, f in enumerate(frames):
    sheet.paste(Image.open(f).convert("RGBA"), ((i % cols) * w, (i // cols) * h))
sheet.save(dst, "WEBP", quality=82, method=6)
meta = {"frames": len(frames), "cols": cols, "rows": rows, "cell": w}
json.dump(meta, open(os.path.splitext(dst)[0] + ".json", "w"))
print(dst, os.path.getsize(dst), meta)
