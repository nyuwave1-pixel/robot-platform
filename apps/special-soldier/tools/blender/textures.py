# Fetches CC0 PBR textures from Poly Haven (https://polyhaven.com, licence CC0 — free, no account, no API key)
# and prepares them for the game with Blender's image pipeline: 512 px JPEG albedo + OpenGL normal map,
# plus tint-normalised albedo (mean = 1/1.6) for the terrain splat, where vertex colours provide the hue.
#   python3 tools/blender/textures.py        (pip install bpy==5.3.0)   → src/assets/tex/*.jpg
import os, sys, json, urllib.request
import numpy as np
import bpy

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'src', 'assets', 'tex'); CACHE = os.environ.get('TEX_CACHE', os.path.join(HERE, '.cache'))
SETS = {  # game name → (Poly Haven asset id, also write a tint-normalised copy)
    'sand': ('coast_sand_01', True), 'grass': ('forrest_ground_01', True), 'rock': ('rock_face', True),
    'concrete': ('concrete_floor_02', True), 'rust': ('rusty_metal_02', True), 'wood': ('brown_planks_03', True), 'metal': ('corrugated_iron', False),
    # model surfaces (v0.9): cloth weave, gun steel, painted equipment, tree bark
    'fabric': ('denim_fabric', True), 'gun': ('metal_plate', True), 'paint': ('rusty_painted_metal', True), 'bark': ('bark_brown_02', True),
}
SIZE = int(os.environ.get('TEX_SIZE', 512))


def fetch(url, path):
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={'User-Agent': 'asset-pipeline/1.0'})
        with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
            f.write(r.read())
    return path


def save(px, path, quality=84):
    img = bpy.data.images.new('out', SIZE, SIZE, alpha=False); img.pixels.foreach_set(px.astype(np.float32).ravel())
    s = bpy.context.scene; s.view_settings.view_transform = 'Standard'; s.render.image_settings.file_format = 'JPEG'; s.render.image_settings.quality = quality; s.render.image_settings.color_mode = 'RGB'
    img.save_render(path, scene=s); bpy.data.images.remove(img)


def load(path, data=False):
    img = bpy.data.images.load(path); img.colorspace_settings.name = 'Non-Color' if data else 'sRGB'; img.scale(SIZE, SIZE)
    px = np.empty(SIZE * SIZE * 4, dtype=np.float32); img.pixels.foreach_get(px); bpy.data.images.remove(img); return px.reshape(SIZE, SIZE, 4)


os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True); credits = []
for name, (pid, tint) in SETS.items():
    files = json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{pid}', headers={'User-Agent': 'asset-pipeline/1.0'}), timeout=60))
    d = load(fetch(files['Diffuse']['1k']['jpg']['url'], os.path.join(CACHE, pid + '_d.jpg')))
    n = load(fetch(files['nor_gl']['1k']['jpg']['url'], os.path.join(CACHE, pid + '_n.jpg')), data=True)
    save(d, os.path.join(OUT, name + '_d.jpg')); save(n, os.path.join(OUT, name + '_n.jpg'), 88)
    if tint:  # linear albedo / mean colour → neutral detail that keeps the photo's structure; stored / 1.6
        t = d.copy(); mean = t[:, :, :3].reshape(-1, 3).mean(axis=0); t[:, :, :3] = np.clip(t[:, :, :3] / mean / 1.6, 0, 1); save(t, os.path.join(OUT, name + '_t.jpg'))
    credits.append(f'{name}: https://polyhaven.com/a/{pid} (CC0)'); print('TEX', name, pid)
open(os.path.join(OUT, 'CREDITS.txt'), 'w').write('Textures from Poly Haven, licence CC0 1.0 (public domain). Processed with Blender (tools/blender/textures.py).\n' + '\n'.join(credits) + '\n')
