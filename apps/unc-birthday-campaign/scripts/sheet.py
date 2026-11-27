"""python3 scripts/sheet.py out.jpg W file1 file2 ... — rows of images scaled to height H fitting width W"""
import sys
from PIL import Image
out, W = sys.argv[1], int(sys.argv[2]); files = sys.argv[3:]
ims = [Image.open(f).convert('RGB') for f in files]
rows, row, rw = [], [], 0
import os
H = int(os.environ.get("H", 420))
for im in ims:
    w = int(im.width * H / im.height)
    if row and rw + w > W: rows.append(row); row, rw = [], 0
    row.append(im.resize((w, H))); rw += w + 8
if row: rows.append(row)
sheet = Image.new('RGB', (W, len(rows) * (H + 8)), (255, 255, 255))
for i, r in enumerate(rows):
    x = 0
    for im in r: sheet.paste(im, (x, i * (H + 8))); x += im.width + 8
sheet.save(out, quality=86)
