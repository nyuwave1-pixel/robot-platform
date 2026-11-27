"""Korean HUD font for the SURVIVAL WORLD Unity edition (Unity's built-in font has no Hangul, so the IMGUI HUD lost its Korean text in WebGL).

Subsets Noto Sans KR Regular (SIL OFL 1.1) to printable ASCII + every non-ASCII character used in the Survival C# sources,
so the file stays small. Re-run after adding Korean text to those files:
    npm pack @expo-google-fonts/noto-sans-kr@0.4.4 && tar xzf expo-google-fonts-noto-sans-kr-0.4.4.tgz
    pip install fonttools
    python "apps/unity-studio/Tools~/gen-survival-font.py" package/400Regular/NotoSansKR_400Regular.ttf
"""
import glob, hashlib, os, sys
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'Assets')
SOURCES = glob.glob(os.path.join(ASSETS, 'Scripts', '*', 'Survival', '*.cs'))
OUT = os.path.join(ASSETS, 'Survival', 'Fonts', 'NotoSansKR-Survival.ttf')

chars = {chr(c) for c in range(0x20, 0x7F)} | set('·…→—▲▼♥●+/%:()[]')
for f in SOURCES:
    chars |= {ch for ch in open(f, encoding='utf-8').read() if ord(ch) > 0x7E}
chars = {c for c in chars if c.isprintable()}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
font = subset.load_font(sys.argv[1], opts)
s = subset.Subsetter(opts); s.populate(text=''.join(sorted(chars))); s.subset(font)
subset.save_font(font, OUT, opts)
print(f'{len(chars)} characters from {len(SOURCES)} files -> {OUT} ({os.path.getsize(OUT) // 1024} kB, sha256 {hashlib.sha256(open(OUT, "rb").read()).hexdigest()[:16]})')
