# HDRI tools for the slice skies (needs numpy + Pillow).
#   Preview:  python3 "apps/unity-studio/Tools~/hdri-preview.py" out.jpg "path.hdr|label|exposure" ...
#   Stats:    python3 "apps/unity-studio/Tools~/hdri-preview.py" --stats path.hdr ...   -> median sky luminance per file,
#             the HdriMedian values in Core/SkyPresets.cs (exposure = web sky-gradient luminance / median).
# Reads Radiance .hdr (RLE RGBE) files, ACES-tonemaps them and builds one labelled contact sheet.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
def read_hdr(path):
    data = open(path, 'rb').read(); i = data.index(b'\n\n') + 2; j = data.index(b'\n', i)
    dims = data[i:j].split(); h, w = int(dims[1]), int(dims[3]); p = j + 1
    img = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        assert data[p] == 2 and data[p + 1] == 2, 'only new-style RLE supported'
        p += 4
        for c in range(4):
            x = 0
            while x < w:
                n = data[p]; p += 1
                if n > 128:
                    n -= 128; img[y, x:x + n, c] = data[p]; p += 1
                else:
                    img[y, x:x + n, c] = np.frombuffer(data[p:p + n], np.uint8); p += n
                x += n
    e = img[..., 3].astype(np.int32)
    f = np.where(e > 0, np.ldexp(1.0, e - 136), 0.0)
    return img[..., :3].astype(np.float64) * f[..., None]
def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    y = np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)
    return (np.power(y, 1 / 2.2) * 255).astype(np.uint8)
if sys.argv[1] == '--stats':
    for p in sys.argv[2:]:
        rgb = read_hdr(p); sky = rgb[: rgb.shape[0] // 2]
        L = 0.2126 * sky[..., 0] + 0.7152 * sky[..., 1] + 0.0722 * sky[..., 2]
        print('%-20s median %.3f  mean %.3f' % (p.replace('\\', '/').split('/')[-1], np.median(L), L.mean()))
    sys.exit(0)
out, items = sys.argv[1], sys.argv[2:]
tiles = []
for it in items:
    path, label, exposure = it.split('|')
    rgb = read_hdr(path)
    # show the upper half (the sky) like a horizon view
    sky = rgb[: rgb.shape[0] // 2]
    im = Image.fromarray(aces(sky * float(exposure))).resize((640, 160))
    ImageDraw.Draw(im).text((10, 8), label, fill=(255, 255, 255))
    tiles.append(im)
sheet = Image.new('RGB', (640, 160 * len(tiles)))
for k, t in enumerate(tiles): sheet.paste(t, (0, 160 * k))
sheet.save(out, quality=88); print('saved', out, sheet.size)
