# Recorded CC0 audio layer for SPECIAL SOLDIER (v0.14).
#   python tools/assets/build_audio.py            (needs ffmpeg on PATH, numpy)
# Downloads each source once from its official CDN into tools/assets/.cache/ (git-ignored), checks the SHA-256 recorded
# below, then trims / slices / normalises into public/audio/*.mp3 and writes public/audio/manifest.json.
# Every source is CC0 1.0 (verified on its Freesound page 2026-11-19) — see docs/ASSET_LICENSES.md.
import hashlib, json, os, subprocess, sys, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, '.cache', 'freesound'); OUT = os.path.join(ROOT, 'public', 'audio')
SR = 44100

# id, file, author, title, page, sha256 of the downloaded preview (None = record on first run)
SRC = {
    'gunshot':   ('166191_2989529', 'ShawnyBoy', 'Gunshot 4.wav', 'https://freesound.org/people/ShawnyBoy/sounds/166191/'),
    'explosion': ('235968_4265427', 'tommccann', 'Explosion_01.wav', 'https://freesound.org/people/tommccann/sounds/235968/'),
    'heli':      ('413655_2531187', 'alegemaate', 'Helicopter', 'https://freesound.org/people/alegemaate/sounds/413655/'),
    'war':       ('387140_2305278', 'frankum', 'Sounds of war 01 (Explosions, shots and more)', 'https://freesound.org/people/frankum/sounds/387140/'),
    'concrete':  ('459964_6253486', 'florianreichelt', 'Footsteps on concrete', 'https://freesound.org/people/florianreichelt/sounds/459964/'),
    'gravel':    ('352870_4187409', 'PotatokingXII', 'Footsteps Dirt Gravel', 'https://freesound.org/people/PotatokingXII/sounds/352870/'),
    'm_menu':    ('155139_2098884', 'burning-mir', 'Action music loop with dark ambient drones', 'https://freesound.org/people/burning-mir/sounds/155139/'),
    'm_combat':  ('716157_10150854', 'Lumamorph', 'Loop. An intense cinematic track for an active episode of your movie', 'https://freesound.org/people/Lumamorph/sounds/716157/'),
    'm_stealth': ('730224_14716160', 'Ncone', 'Suspense Music Loop', 'https://freesound.org/people/Ncone/sounds/730224/'),
}
SHA = {}  # filled from sha256.json so a changed upstream file is noticed
SHA_FILE = os.path.join(HERE, 'audio_sha256.json')


def fetch(key):
    fid = SRC[key][0]; path = os.path.join(CACHE, f'{fid}-hq.mp3')
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        url = f'https://cdn.freesound.org/previews/{fid[:3]}/{fid}-hq.mp3'
        print('download', url); urllib.request.urlretrieve(url, path)
    h = hashlib.sha256(open(path, 'rb').read()).hexdigest()
    if key in SHA and SHA[key] != h:
        sys.exit(f'SHA-256 mismatch for {key}: {h} != {SHA[key]} (upstream file changed — re-check its license page)')
    SHA[key] = h
    return path


def pcm(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def enc(name, src, ss=0.0, t=None, fade=0.05, fadein=0.0, stereo=False, kbps=96, norm=-16):
    out = os.path.join(OUT, name + '.mp3')
    af = [f'loudnorm=I={norm}:TP=-1.5:LRA=11']
    if fadein: af.insert(0, f'afade=t=in:d={fadein}')
    if t and fade: af.append(f'afade=t=out:st={max(0, t - fade):.3f}:d={fade}')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', f'{ss:.3f}', '-i', src] + (['-t', f'{t:.3f}'] if t else []) + \
          ['-af', ','.join(af), '-ar', str(SR), '-ac', '2' if stereo else '1', '-b:a', f'{kbps}k', out]
    subprocess.run(cmd, check=True)
    return name


def steps(key, prefix, n=4):
    """Slice single footsteps: 10 ms RMS envelope → strongest onsets at least 0.28 s apart."""
    path = fetch(key); x = pcm(path); hop = SR // 100
    env = np.sqrt(np.convolve(x * x, np.ones(hop) / hop, mode='same'))[::hop]
    rise = np.maximum(0, np.diff(env, prepend=env[0])); peaks = []
    for i in np.argsort(-rise):
        if env[i] < env.max() * 0.25: continue
        if all(abs(i - p) > 28 for p in peaks): peaks.append(int(i))
        if len(peaks) >= n: break
    names = []; L = int(0.32 * SR); fade = np.linspace(1, 0, int(0.12 * SR)) ** 2
    for k, p in enumerate(sorted(peaks)):
        s = int(max(0, p / 100 - 0.02) * SR); seg = x[s:s + L].copy(); seg[-len(fade):] *= fade[:len(seg[-len(fade):])]
        seg *= 0.6 / max(1e-6, np.abs(seg).max())  # peak −4.4 dBFS: loudnorm over-boosts 0.3 s clips into clipping
        name = f'{prefix}{k + 1}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '96k', os.path.join(OUT, name + '.mp3')], input=seg.astype(np.float32).tobytes(), check=True)
        names.append(name)
    return names


def main():
    if os.path.exists(SHA_FILE): SHA.update(json.load(open(SHA_FILE)))
    os.makedirs(OUT, exist_ok=True); files = {}
    files['shot'] = enc('shot', fetch('gunshot'), 0, 1.55, fade=0.6, norm=-16)
    files['explosion'] = enc('explosion', fetch('explosion'), 0, 6.3, fade=2.0, norm=-14)
    files['heli'] = enc('heli', fetch('heli'), 0.5, 9.0, fade=0.05, fadein=0.05, norm=-18)
    files['battle'] = enc('battle', fetch('war'), 4.0, 48.0, fade=3.0, fadein=3.0, kbps=64, norm=-22)
    files['step_concrete'] = steps('concrete', 'step_concrete')
    files['step_gravel'] = steps('gravel', 'step_gravel')
    for k, name in (('m_menu', 'music_menu'), ('m_combat', 'music_combat'), ('m_stealth', 'music_stealth')):
        files[name] = enc(name, fetch(k), 0, None, fade=0, stereo=True, kbps=112, norm=-18)
    credits = [{'key': k, 'freesound_id': v[0].split('_')[0], 'author': v[1], 'title': v[2], 'url': v[3], 'license': 'CC0 1.0', 'sha256': SHA[k]} for k, v in SRC.items()]
    json.dump({'files': files, 'sources': credits}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    json.dump(SHA, open(SHA_FILE, 'w'), indent=1)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print('public/audio:', len(os.listdir(OUT)), 'files,', total // 1024, 'kB')


if __name__ == '__main__':
    main()
