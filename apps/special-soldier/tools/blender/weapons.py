# Weapon models (10) + first-person arm. Blender axes: muzzle towards -Y, up +Z, right +X.
# Origin = rear of the receiver on the bore line. Markers: muzzle, sight, gripL. Animated groups: mag, pump.
import math
from lib import Asm, mat

H = math.pi / 2


def M():
    return dict(
        steel=mat('gun_steel', (0.035, 0.037, 0.04), 0.38, 0.85), poly=mat('gun_polymer', (0.045, 0.047, 0.045), 0.72, 0.05),
        tan=mat('gun_tan', (0.36, 0.29, 0.19), 0.7, 0.05), wood=mat('gun_wood', (0.25, 0.13, 0.06), 0.55, 0.0),
        lens=mat('lens', (0.02, 0.06, 0.1), 0.05, 0.9), dot=mat('reddot', (1, 0.05, 0.02), 0.3, 0, (1, 0.05, 0.02, 6)),
        brass=mat('brass', (0.75, 0.55, 0.2), 0.3, 0.9), rubber=mat('rubber', (0.02, 0.02, 0.02), 0.9, 0))


def rail(a, g, y0, y1, z, m, w=0.021):
    a.box(g, (w, abs(y1 - y0), 0.006), (0, (y0 + y1) / 2, z), m, bevel=0.001)
    n = max(2, int(abs(y1 - y0) / 0.02))
    for i in range(n):
        a.box(g, (w + 0.002, 0.006, 0.005), (0, y0 + (y1 - y0) * (i + 0.5) / n, z + 0.005), m, bevel=0.001)


def optic(a, kind, y, z, m):
    if kind == 'dot':
        a.box('root', (0.034, 0.05, 0.014), (0, y, z + 0.007), m['steel'], bevel=0.003)
        a.cyl('root', 0.021, 0.062, (0, y, z + 0.034), m['steel'], rot=(H, 0, 0), n=20, bevel=0.002)
        a.cyl('root', 0.0175, 0.064, (0, y, z + 0.034), m['lens'], rot=(H, 0, 0), n=20)
        a.cyl('root', 0.0016, 0.066, (0, y, z + 0.034), m['dot'], rot=(H, 0, 0), n=8)
        a.cyl('root', 0.006, 0.012, (0.024, y, z + 0.034), m['steel'], rot=(0, H, 0), n=10)
        return z + 0.034
    if kind == 'holo':
        a.box('root', (0.04, 0.07, 0.022), (0, y, z + 0.011), m['steel'], bevel=0.003)
        a.box('root', (0.04, 0.008, 0.04), (0, y - 0.03, z + 0.04), m['steel'], bevel=0.003)
        a.box('root', (0.032, 0.003, 0.03), (0, y - 0.03, z + 0.04), m['lens'], bevel=0)
        a.box('root', (0.003, 0.004, 0.003), (0, y - 0.03, z + 0.04), m['dot'], bevel=0)
        return z + 0.04
    if kind == 'scope':
        zc = z + 0.042
        a.cyl('root', 0.0155, 0.3, (0, y, zc), m['steel'], rot=(H, 0, 0), n=20, bevel=0.001)
        a.cyl('root', 0.0155, 0.07, (0, y - 0.185, zc), m['steel'], rot=(H, 0, 0), r2=0.027, n=20)
        a.cyl('root', 0.027, 0.05, (0, y - 0.245, zc), m['steel'], rot=(H, 0, 0), n=20, bevel=0.002)
        a.cyl('root', 0.0235, 0.052, (0, y - 0.245, zc), m['lens'], rot=(H, 0, 0), n=20)
        a.cyl('root', 0.021, 0.06, (0, y + 0.175, zc), m['steel'], rot=(H, 0, 0), r2=0.0155, n=20)
        a.cyl('root', 0.018, 0.062, (0, y + 0.176, zc), m['lens'], rot=(H, 0, 0), n=20)
        a.cyl('root', 0.011, 0.022, (0, y, zc + 0.024), m['steel'], n=12, bevel=0.002)
        a.cyl('root', 0.011, 0.022, (0.024, y, zc), m['steel'], rot=(0, H, 0), n=12, bevel=0.002)
        for dy in (-0.07, 0.08):
            a.box('root', (0.02, 0.022, 0.03), (0, y + dy, z + 0.018), m['steel'], bevel=0.003)
            a.cyl('root', 0.019, 0.022, (0, y + dy, zc), m['steel'], rot=(H, 0, 0), n=16)
        return zc
    # iron sights
    a.box('root', (0.012, 0.012, 0.03), (0, y - 0.02, z + 0.015), m['steel'], bevel=0.002)
    a.box('root', (0.004, 0.012, 0.014), (-0.006, y - 0.02, z + 0.034), m['steel'], bevel=0.001)
    a.box('root', (0.004, 0.012, 0.014), (0.006, y - 0.02, z + 0.034), m['steel'], bevel=0.001)
    return z + 0.033


def long_gun(name, L=0.2, B=0.3, hg=0.24, body='steel', stock='m4', mag=(0.19, 0.06, 0.25), sight='dot', barrel_r=0.0085, hg_r=0.027, heavy=False, bolt=False, pump=False, drum=False, bipod=False, boxmag=False, supp=False, fore=False):
    a, m = Asm(name), M()
    b = m[body]
    # receiver group
    a.box('root', (0.046, L, 0.052), (0, -L / 2, 0), b, bevel=0.006)
    a.box('root', (0.04, L * 0.8, 0.04), (0, -L * 0.48, -0.042), b, bevel=0.006)
    a.box('root', (0.003, L * 0.3, 0.02), (0.0235, -L * 0.5, 0.004), m['steel'], bevel=0.001)  # ejection port
    a.cyl('root', 0.006, 0.02, (0.026, -L * 0.2, 0.0), m['steel'], rot=(0, H, 0), n=10)
    rail(a, 'root', 0.0, -L, 0.029, m['steel'])
    # barrel + handguard
    y_m = -L - B
    a.cyl('root', barrel_r * (1.5 if heavy else 1), B, (0, -L - B / 2, 0.002), m['steel'], rot=(H, 0, 0), n=14)
    if hg > 0:
        a.cyl('root', hg_r, hg, (0, -L - hg / 2, 0.002), m['poly'] if body == 'steel' else b, rot=(H, math.pi / 8, 0), n=8, bevel=0.003)
        rail(a, 'root', -L, -L - hg, hg_r + 0.001, m['steel'], 0.018)
        for i in range(5):
            a.box('root', (hg_r * 2 + 0.002, 0.018, 0.008), (0, -L - hg * (0.14 + i * 0.18), 0.002), m['steel'], bevel=0.002)  # vent slots
    if supp:
        a.cyl('root', 0.019, 0.17, (0, y_m - 0.075, 0.002), m['steel'], rot=(H, 0, 0), n=18, bevel=0.003); y_m -= 0.16
    else:
        a.cyl('root', barrel_r + 0.004, 0.045, (0, y_m + 0.01, 0.002), m['steel'], rot=(H, 0, 0), n=8, bevel=0.002)
    a.box('root', (0.018, 0.02, 0.022), (0, -L - min(hg, B) * 0.92, 0.012), m['steel'], bevel=0.003)  # gas block
    # grip + trigger
    a.box('root', (0.03, 0.042, 0.1), (0, -0.018, -0.1), m['poly'], rot=(0.3, 0, 0), bevel=0.008)
    a.box('root', (0.006, 0.07, 0.004), (0, -0.075, -0.088), m['steel'], bevel=0.001)
    a.box('root', (0.006, 0.004, 0.03), (0, -0.108, -0.074), m['steel'], bevel=0.001)
    a.box('root', (0.005, 0.008, 0.022), (0, -0.07, -0.072), m['steel'], rot=(0.3, 0, 0), bevel=0.001)
    # magazine
    a.pivot('mag', (0, -L * 0.6, -0.06))
    if drum:
        a.cyl('root', 0.066, 0.115, (0, -L * 0.55, -0.02), m['steel'], rot=(H, 0, 0), n=24, bevel=0.004)
        for i in range(6):
            an = i * math.pi / 3
            a.cyl('root', 0.021, 0.117, (math.cos(an) * 0.04, -L * 0.55, -0.02 + math.sin(an) * 0.04), m['poly'], rot=(H, 0, 0), n=12)
    elif boxmag:
        a.box('mag', (0.085, 0.13, 0.11), (-0.03, -L * 0.6, -0.115), m['tan'], bevel=0.008)
        a.box('mag', (0.06, 0.03, 0.02), (0.0, -L * 0.6, -0.052), m['steel'], bevel=0.002)
    elif mag:
        ml, md, curve = mag
        a.box('mag', (0.024, md, ml), (0, -L * 0.6 - curve * 0.05, -0.058 - ml / 2), m['steel'], rot=(-curve * 0.9, 0, 0), bevel=0.004, shear=-curve * 0.12)
        a.box('mag', (0.027, md + 0.004, 0.012), (0, -L * 0.6 - curve * 0.11, -0.058 - ml), m['poly'], rot=(-curve * 0.9, 0, 0), bevel=0.003)
    # stock
    if stock == 'm4':
        a.cyl('root', 0.0145, 0.19, (0, 0.095, 0.004), m['steel'], rot=(H, 0, 0), n=14)
        a.box('root', (0.036, 0.15, 0.05), (0, 0.15, -0.005), m['poly'], bevel=0.008)
        a.box('root', (0.036, 0.05, 0.12), (0, 0.215, -0.035), m['poly'], bevel=0.01, taper=(1, 0.8))
        a.box('root', (0.038, 0.012, 0.125), (0, 0.243, -0.035), m['rubber'], bevel=0.004)
    elif stock == 'fixed':
        a.box('root', (0.04, 0.24, 0.07), (0, 0.12, -0.02), b, bevel=0.012, taper=(1, 1), shear=0)
        a.box('root', (0.04, 0.08, 0.13), (0, 0.22, -0.045), b, bevel=0.012)
        a.box('root', (0.042, 0.014, 0.135), (0, 0.262, -0.045), m['rubber'], bevel=0.004)
        if sight == 'scope':
            a.box('root', (0.034, 0.12, 0.022), (0, 0.13, 0.026), m['poly'], bevel=0.006)  # cheek riser
    elif stock == 'fold':
        for sx in (-0.014, 0.014):
            a.tube('root', [(sx, 0.0, 0.01), (sx, 0.2, 0.01), (sx, 0.21, -0.03)], 0.004, m['steel'])
        a.box('root', (0.04, 0.014, 0.1), (0, 0.213, -0.03), m['rubber'], bevel=0.004)
    # extras
    if bolt:
        a.cyl('root', 0.005, 0.045, (0.04, -0.03, 0.006), m['steel'], rot=(0, H * 1.25, 0), n=10)
        a.sphere('root', 0.011, (0.06, -0.03, -0.006), m['steel'], seg=12)
    if pump:
        a.pivot('pump', (0, -L - 0.16, -0.028))
        a.cyl('root', 0.0125, B * 0.92, (0, -L - B * 0.46, -0.026), m['steel'], rot=(H, 0, 0), n=14)
        a.cyl('pump', 0.024, 0.15, (0, -L - 0.16, -0.028), m['poly'], rot=(H, 0, 0), n=12, bevel=0.004)
        for i in range(6):
            a.cyl('pump', 0.0255, 0.008, (0, -L - 0.105 - i * 0.022, -0.028), m['poly'], rot=(H, 0, 0), n=12)
    if bipod:
        for sx in (-1, 1):
            a.limb('root', (sx * 0.012, -L - hg * 0.9, -0.02), (sx * 0.05, -L - hg * 0.55, -0.2), 0.006, 0.005, m['steel'], n=8)
            a.box('root', (0.02, 0.03, 0.008), (sx * 0.05, -L - hg * 0.55, -0.203), m['rubber'], bevel=0.002)
        a.tube('root', [(0, -L * 0.2, 0.04), (0, -L * 0.3, 0.085), (0, -L * 0.8, 0.085), (0, -L * 0.9, 0.04)], 0.006, m['steel'])  # carry handle
    if fore:
        a.box('root', (0.028, 0.034, 0.09), (0, -L - hg * 0.45, -0.07), m['poly'], bevel=0.008, taper=(0.85, 0.85))
    zs = optic(a, sight, -L * 0.5 if sight != 'scope' else -L * 0.45, 0.034, m)
    if sight == 'iron':
        a.box('root', (0.006, 0.01, 0.028), (0, -L - min(hg, B) * 0.92, 0.035), m['steel'], bevel=0.001)
    a.marker('muzzle', (0, y_m - 0.02, 0.002)); a.marker('sight', (0, 0.0, zs)); a.marker('gripL', (0, -L - max(hg, 0.12) * 0.55, -0.035 if not pump else -0.05))
    return a


def pistol():
    a, m = Asm('W_pistol'), M()
    a.box('root', (0.028, 0.19, 0.03), (0, -0.095, 0.012), m['steel'], bevel=0.004)  # slide
    for i in range(6):
        a.box('root', (0.0295, 0.004, 0.02), (0, -0.012 - i * 0.008, 0.012), m['steel'], bevel=0.001)
    a.box('root', (0.027, 0.15, 0.022), (0, -0.085, -0.012), m['poly'], bevel=0.004)
    a.box('root', (0.029, 0.05, 0.115), (0, -0.012, -0.072), m['poly'], rot=(0.24, 0, 0), bevel=0.008)
    a.box('root', (0.006, 0.055, 0.004), (0, -0.08, -0.048), m['poly'], bevel=0.001); a.box('root', (0.006, 0.004, 0.026), (0, -0.108, -0.036), m['poly'], bevel=0.001)
    a.box('root', (0.005, 0.007, 0.018), (0, -0.075, -0.033), m['steel'], rot=(0.3, 0, 0), bevel=0.001)
    a.cyl('root', 0.0165, 0.16, (0, -0.27, 0.012), m['steel'], rot=(H, 0, 0), n=18, bevel=0.003)  # suppressor
    a.cyl('root', 0.007, 0.03, (0, -0.195, 0.012), m['steel'], rot=(H, 0, 0), n=10)
    a.box('root', (0.004, 0.006, 0.012), (0, -0.18, 0.032), m['steel'], bevel=0.001)
    a.box('root', (0.016, 0.006, 0.01), (0, -0.01, 0.03), m['steel'], bevel=0.001)
    a.pivot('mag', (0, -0.01, -0.1)); a.box('mag', (0.03, 0.052, 0.012), (0, 0.004, -0.133), m['poly'], rot=(0.24, 0, 0), bevel=0.003)
    a.marker('muzzle', (0, -0.36, 0.012)); a.marker('sight', (0, 0, 0.038)); a.marker('gripL', (0, -0.02, -0.08))
    return a


def arm():
    """First-person forearm: hand at the origin, elbow towards +Y (so it points at the camera after export)."""
    a = Asm('Arm'); sl = mat('sleeve_camo', (0.16, 0.2, 0.12), 0.9); gl = mat('glove', (0.03, 0.03, 0.032), 0.8); st = mat('strap', (0.02, 0.02, 0.02), 0.6, 0.3)
    a.limb('root', (0, 0.05, 0), (0, 0.5, 0), 0.038, 0.058, sl, n=14)
    a.cyl('root', 0.041, 0.03, (0, 0.065, 0), sl, rot=(H, 0, 0), n=14, bevel=0.004)
    a.box('root', (0.075, 0.09, 0.045), (0, 0.0, 0), gl, bevel=0.014)
    a.box('root', (0.07, 0.05, 0.04), (0, -0.06, -0.008), gl, rot=(-0.5, 0, 0), bevel=0.012)
    a.box('root', (0.025, 0.05, 0.028), (0.045, -0.015, -0.005), gl, rot=(0, 0, 0.5), bevel=0.01)
    a.box('root', (0.082, 0.022, 0.05), (0, 0.035, 0), st, bevel=0.004)
    a.box('root', (0.03, 0.03, 0.008), (0, 0.1, 0.04), st, bevel=0.003)  # watch
    return a


def all_weapons():
    return [
        long_gun('W_m4', L=0.2, B=0.3, hg=0.24, sight='dot'),
        long_gun('W_arx', L=0.22, B=0.33, hg=0.27, body='tan', sight='holo', mag=(0.18, 0.062, 0.2), fore=True),
        long_gun('W_kr5', L=0.2, B=0.24, hg=0.19, body='poly', sight='iron', mag=(0.23, 0.058, 0.32), stock='fold'),
        long_gun('W_smg', L=0.17, B=0.13, hg=0.1, sight='iron', mag=(0.21, 0.04, 0.0), stock='fold', hg_r=0.023, barrel_r=0.0075),
        long_gun('W_shotgun', L=0.2, B=0.44, hg=0.0, body='poly', sight='iron', mag=None, stock='fixed', pump=True, barrel_r=0.0115),
        long_gun('W_lmg', L=0.27, B=0.42, hg=0.26, sight='dot', mag=None, boxmag=True, stock='fixed', heavy=True, bipod=True, hg_r=0.03),
        long_gun('W_bolt', L=0.22, B=0.56, hg=0.3, body='tan', sight='scope', mag=(0.06, 0.07, 0.0), stock='fixed', bolt=True, heavy=True, hg_r=0.025),
        long_gun('W_dmr', L=0.22, B=0.46, hg=0.32, sight='scope', mag=(0.13, 0.066, 0.1), stock='fixed', supp=False),
        pistol(),
        long_gun('W_gl', L=0.22, B=0.2, hg=0.0, body='poly', sight='holo', mag=None, drum=True, stock='m4', barrel_r=0.026, fore=True),
        arm(),
    ]
