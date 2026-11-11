# Characters, vehicles, vegetation and props. Blender axes: front -Y, up +Z, right +X (glTF export → front +Z, up +Y).
import math
import random
from lib import Asm, mat

H = math.pi / 2


def soldier():
    a = Asm('Soldier')
    cloth = mat('cloth', (0.17, 0.21, 0.14), 0.92); vest = mat('vest', (0.09, 0.1, 0.075), 0.85); skin = mat('skin', (0.52, 0.36, 0.27), 0.6)
    helm = mat('helmet', (0.1, 0.12, 0.085), 0.6, 0.1); boots = mat('boots', (0.03, 0.028, 0.025), 0.75); gear = mat('gear', (0.035, 0.037, 0.04), 0.6, 0.3)
    visor = mat('visor', (0.02, 0.02, 0.02), 0.2, 0.5, (1, 0.15, 0.05, 5)); accent = mat('accent', (0.45, 0.04, 0.04), 0.8)
    a.pivot('body', (0, 0, 0)); a.pivot('legL', (0.105, 0, 0.93), 'body'); a.pivot('legR', (-0.105, 0, 0.93), 'body'); a.pivot('upper', (0, 0, 0.93), 'body')
    a.pivot('head', (0, 0, 1.6), 'upper'); a.pivot('arms', (0, -0.02, 1.43), 'upper'); a.pivot('gun', (0.075, -0.22, 1.31), 'arms')
    for g, sx in (('legL', 1), ('legR', -1)):
        x = sx * 0.105
        a.limb(g, (x, 0, 0.95), (x * 1.02, -0.01, 0.52), 0.098, 0.074, cloth, n=14)
        a.limb(g, (x * 1.02, -0.01, 0.52), (x * 1.02, 0.01, 0.13), 0.07, 0.055, cloth, n=14)
        a.box(g, (0.12, 0.05, 0.13), (x * 1.02, -0.065, 0.52), gear, bevel=0.02)  # knee pad
        a.box(g, (0.115, 0.27, 0.11), (x * 1.02, -0.045, 0.055), boots, bevel=0.03)
        a.box(g, (0.11, 0.16, 0.12), (x * 1.02, 0.0, 0.15), boots, bevel=0.03)
        a.box(g, (0.12, 0.275, 0.02), (x * 1.02, -0.045, 0.01), gear, bevel=0.006)
        a.box(g, (0.035, 0.11, 0.16), (x * 1.9 if sx > 0 else x * 1.9, 0.0, 0.72), gear, bevel=0.012)  # thigh rig / holster
        a.cyl(g, 0.103, 0.03, (x, 0, 0.74), gear, n=14)
    # torso
    a.box('upper', (0.34, 0.2, 0.2), (0, 0, 0.99), cloth, bevel=0.05)
    a.box('upper', (0.37, 0.21, 0.05), (0, 0, 1.02), gear, bevel=0.012)  # belt
    a.box('upper', (0.33, 0.2, 0.46), (0, 0, 1.25), cloth, bevel=0.07, taper=(1.22, 1.08))
    a.box('upper', (0.34, 0.06, 0.36), (0, -0.115, 1.27), vest, bevel=0.025, taper=(1.05, 1))  # front plate
    a.box('upper', (0.34, 0.06, 0.38), (0, 0.115, 1.27), vest, bevel=0.025, taper=(1.05, 1))
    for sx in (-1, 1):
        a.box('upper', (0.07, 0.25, 0.04), (sx * 0.12, 0, 1.475), vest, bevel=0.012)  # shoulder straps
        a.box('upper', (0.05, 0.2, 0.3), (sx * 0.185, 0, 1.24), vest, bevel=0.015)  # cummerbund
    for i in range(3):
        a.box('upper', (0.085, 0.055, 0.14), (-0.105 + i * 0.105, -0.165, 1.16), vest, bevel=0.012)  # mag pouches
        a.box('upper', (0.07, 0.02, 0.05), (-0.105 + i * 0.105, -0.19, 1.24), gear, bevel=0.006)
    a.box('upper', (0.1, 0.05, 0.08), (0.1, -0.155, 1.36), gear, bevel=0.012)  # radio
    a.cyl('upper', 0.004, 0.2, (0.14, -0.15, 1.5), gear, n=6)
    a.box('upper', (0.3, 0.15, 0.38), (0, 0.21, 1.25), vest, bevel=0.04)  # pack
    a.box('upper', (0.22, 0.06, 0.2), (0, 0.3, 1.2), vest, bevel=0.025)
    a.cyl('upper', 0.06, 0.08, (0, 0, 1.52), cloth, n=14)  # neck
    a.cyl('upper', 0.085, 0.05, (0, 0, 1.495), cloth, n=14, r2=0.065)  # collar
    for sx in (-1, 1):
        a.sphere('upper', 0.085, (sx * 0.215, 0, 1.44), cloth, scale=(1, 1, 0.95), seg=14)
    # head + headgear variants (the game shows one set per soldier type)
    a.sphere('head', 0.1, (0, -0.005, 1.7), skin, scale=(0.92, 1.02, 1.12), seg=18)
    a.box('head', (0.03, 0.03, 0.045), (0, -0.105, 1.69), skin, bevel=0.012)  # nose
    a.box('head', (0.15, 0.02, 0.028), (0, -0.092, 1.715), gear, bevel=0.008)  # brow shadow / eyes
    a.box('head', (0.175, 0.15, 0.13), (0, -0.02, 1.625), cloth, bevel=0.045)  # balaclava / chin wrap
    a.pivot('acc_helmet', (0, 0, 1.6), 'head')
    a.sphere('acc_helmet', 0.128, (0, 0.005, 1.725), helm, scale=(1, 1.1, 0.95), seg=20, cut_below=-0.02)
    a.box('acc_helmet', (0.262, 0.03, 0.03), (0, -0.115, 1.722), helm, bevel=0.01)
    for sx in (-1, 1):
        a.box('acc_helmet', (0.03, 0.1, 0.1), (sx * 0.125, 0.01, 1.68), gear, bevel=0.02)  # ear pro
        a.box('acc_helmet', (0.012, 0.09, 0.02), (sx * 0.13, 0.0, 1.755), gear, bevel=0.004)  # rails
    a.box('acc_helmet', (0.05, 0.02, 0.05), (0, -0.14, 1.76), gear, bevel=0.008)  # NVG shroud
    a.pivot('acc_nvg', (0, 0, 1.6), 'head')
    for sx in (-1, 1):
        a.cyl('acc_nvg', 0.022, 0.09, (sx * 0.036, -0.175, 1.725), gear, rot=(H, 0, 0), n=12, bevel=0.003)
        a.cyl('acc_nvg', 0.017, 0.092, (sx * 0.036, -0.176, 1.725), mat('nvg_lens', (0.05, 0.3, 0.1), 0.1, 0.6, (0.1, 1, 0.3, 1.5)), rot=(H, 0, 0), n=12)
    a.box('acc_nvg', (0.09, 0.05, 0.03), (0, -0.15, 1.755), gear, bevel=0.008)
    a.pivot('acc_cap', (0, 0, 1.6), 'head')
    a.sphere('acc_cap', 0.108, (0, 0, 1.745), helm, scale=(1, 1.08, 0.7), seg=16, cut_below=-0.01)
    a.box('acc_cap', (0.17, 0.11, 0.015), (0, -0.14, 1.745), helm, bevel=0.006, rot=(0.12, 0, 0))
    a.pivot('acc_beret', (0, 0, 1.6), 'head')
    a.sphere('acc_beret', 0.125, (0.025, 0.0, 1.775), accent, scale=(1.1, 1.05, 0.38), seg=16, rot=(0, 0.25, 0))
    a.cyl('acc_beret', 0.103, 0.025, (0, 0, 1.752), gear, n=16)
    a.pivot('acc_hood', (0, 0, 1.6), 'head')
    a.sphere('acc_hood', 0.135, (0, 0.03, 1.7), cloth, scale=(1.05, 1.1, 1.12), seg=16, cut_y=None)
    for i in range(7):
        an = i * 0.9
        a.box('acc_hood', (0.03, 0.01, 0.16), (math.cos(an) * 0.13, 0.03 + math.sin(an) * 0.13, 1.62), cloth, rot=(math.sin(an) * 0.5, math.cos(an) * 0.5, 0), bevel=0.003)  # ghillie strips
    a.pivot('acc_visor', (0, 0, 1.6), 'head')
    a.box('acc_visor', (0.165, 0.025, 0.045), (0, -0.1, 1.712), visor, bevel=0.01)
    a.pivot('acc_heavy', (0, 0, 0.93), 'upper')
    a.box('acc_heavy', (0.42, 0.09, 0.2), (0, -0.14, 1.14), vest, bevel=0.03)  # blast apron
    for sx in (-1, 1):
        a.box('acc_heavy', (0.13, 0.2, 0.13), (sx * 0.25, 0, 1.47), vest, bevel=0.035)  # pauldrons
    a.box('acc_heavy', (0.22, 0.1, 0.1), (0, -0.06, 1.56), vest, bevel=0.03)  # throat guard
    # arms in a ready-rifle pose
    sR, eR, hR = (0.215, 0.0, 1.44), (0.25, -0.1, 1.2), (0.1, -0.3, 1.235)
    sL, eL, hL = (-0.215, 0.0, 1.44), (-0.23, -0.25, 1.23), (-0.02, -0.56, 1.3)
    for s, e, h in ((sR, eR, hR), (sL, eL, hL)):
        a.limb('arms', s, e, 0.062, 0.05, cloth, n=12); a.limb('arms', e, h, 0.05, 0.04, cloth, n=12)
        a.sphere('arms', 0.054, e, gear, seg=10)
        a.box('arms', (0.06, 0.075, 0.06), h, boots, bevel=0.02)
    a.marker('eye', (0, -0.1, 1.71), 'head')
    return a


def boat():
    a = Asm('Boat')
    hull = mat('boat_hull', (0.04, 0.045, 0.05), 0.55, 0.1); tube = mat('boat_tube', (0.07, 0.075, 0.08), 0.85); metal = mat('boat_metal', (0.1, 0.105, 0.11), 0.45, 0.7)
    glass = mat('boat_glass', (0.1, 0.16, 0.2), 0.08, 0.5, alpha=0.5); deck = mat('boat_deck', (0.12, 0.12, 0.11), 0.95); red = mat('boat_red', (0.5, 0.05, 0.03), 0.6)
    # V hull: lofted sections (bow at -Y)
    secs = [(-4.6, 0.05, 0.75), (-3.9, 0.55, 0.45), (-2.6, 0.98, 0.2), (0.0, 1.08, 0.12), (3.4, 1.05, 0.12)]
    verts, faces = [], []
    for y, w, keel in secs:
        verts += [(-w, y, 0.62), (-w * 0.72, y, keel + 0.12), (0, y, keel - 0.12), (w * 0.72, y, keel + 0.12), (w, y, 0.62)]
    for i in range(len(secs) - 1):
        for j in range(4):
            p = i * 5 + j
            faces.append((p, p + 1, p + 6, p + 5))
    n = len(secs) * 5
    faces.append((n - 5, n - 4, n - 3, n - 2, n - 1)); faces.append((0, 1, 2, 3, 4))
    a.mesh('root', verts, faces, hull, smooth=0.9, subsurf=1)
    a.box('root', (1.9, 7.2, 0.06), (0, -0.2, 0.56), deck, bevel=0.01, taper=(1, 1))
    # inflatable collar: one continuous tube around the gunwale
    pts = [(1.1, 3.4, 0.72), (1.14, 0.5, 0.72), (1.08, -2.4, 0.74), (0.7, -3.9, 0.82), (0.0, -4.75, 0.9), (-0.7, -3.9, 0.82), (-1.08, -2.4, 0.74), (-1.14, 0.5, 0.72), (-1.1, 3.4, 0.72)]
    a.tube('root', pts, 0.3, tube, res=6, bevel_res=5)
    for y in (-2.6, -0.9, 0.9, 2.6):
        for sx in (-1, 1):
            a.box('root', (0.05, 0.3, 0.05), (sx * 1.13, y, 1.02), metal, bevel=0.012)  # grab handles
    # console, seats, frame
    a.box('root', (0.95, 0.75, 0.85), (0, 0.9, 1.0), metal, bevel=0.05, taper=(0.85, 0.8))
    a.box('root', (0.9, 0.04, 0.42), (0, 0.55, 1.6), glass, rot=(-0.35, 0, 0), bevel=0.01)
    a.cyl('root', 0.16, 0.03, (-0.2, 1.3, 1.36), hull, rot=(1.1, 0, 0), n=16)
    a.box('root', (0.3, 0.1, 0.2), (0.22, 1.25, 1.42), hull, bevel=0.02)
    for y in (-2.4, -1.2, 0.0):
        a.box('root', (0.5, 0.42, 0.42), (0, y - 0.3, 0.8), hull, bevel=0.06)  # jockey seats
        a.box('root', (0.42, 0.08, 0.3), (0, y - 0.08, 1.12), hull, bevel=0.03)
    a.tube('root', [(-0.85, 2.5, 0.9), (-0.85, 2.55, 2.1), (0, 2.6, 2.25), (0.85, 2.55, 2.1), (0.85, 2.5, 0.9)], 0.035, metal, res=5)  # radar arch
    a.cyl('root', 0.2, 0.08, (0, 2.6, 2.35), metal, n=16, bevel=0.01); a.cyl('root', 0.012, 1.3, (0.6, 2.58, 2.8), metal, n=6)
    for sx in (-0.5, 0.5):  # twin outboards
        a.box('root', (0.42, 0.62, 0.68), (sx, 3.75, 1.2), hull, bevel=0.09, taper=(0.85, 0.9))
        a.box('root', (0.44, 0.64, 0.05), (sx, 3.75, 0.98), red, bevel=0.01)
        a.box('root', (0.16, 0.3, 0.95), (sx, 3.82, 0.45), metal, bevel=0.03)
        a.cyl('root', 0.13, 0.3, (sx, 3.95, 0.02), metal, rot=(H, 0, 0), r2=0.04, n=12)
    a.box('root', (0.5, 0.36, 0.3), (-0.55, 2.2, 0.75), mat('boat_crate', (0.14, 0.16, 0.1), 0.8), bevel=0.02)
    return a


def heli():
    a = Asm('Heli')
    body = mat('heli_body', (0.085, 0.1, 0.085), 0.55, 0.3); dark = mat('heli_dark', (0.03, 0.032, 0.035), 0.45, 0.6); glass = mat('heli_glass', (0.06, 0.1, 0.13), 0.06, 0.7)
    red = mat('heli_light', (1, 0.1, 0.05), 0.3, 0, (1, 0.1, 0.05, 8))
    a.sphere('root', 1.0, (0, -0.4, 2.2), body, scale=(1.25, 3.4, 1.25), seg=24)  # fuselage
    a.sphere('root', 1.0, (0, -3.0, 2.15), glass, scale=(1.08, 1.5, 1.0), seg=20, cut_y=-0.3)  # nose glazing
    a.limb('root', (0, 2.2, 2.6), (0, 8.6, 3.0), 0.62, 0.2, body, n=16)  # tail boom
    a.box('root', (0.14, 1.3, 2.3), (0, 8.7, 3.9), body, bevel=0.05, taper=(1, 0.5), shear=0.9)
    a.box('root', (2.8, 0.7, 0.08), (0, 8.2, 3.1), body, bevel=0.03)
    a.box('root', (1.7, 3.2, 0.75), (0, 0.2, 3.5), body, bevel=0.25)  # engine cowling
    for sx in (-1, 1):
        a.cyl('root', 0.28, 1.2, (sx * 0.62, 1.6, 3.5), dark, rot=(H, 0, 0), n=14)  # exhausts
        a.box('root', (0.08, 1.9, 1.3), (sx * 1.22, 0.0, 2.1), dark, bevel=0.03)  # sliding doors
        a.box('root', (0.09, 0.9, 0.5), (sx * 1.2, 0.0, 2.45), glass, bevel=0.03)
        a.box('root', (0.9, 2.2, 0.5), (sx * 1.5, 0.3, 1.25), body, bevel=0.2)  # sponsons
        a.cyl('root', 0.36, 0.26, (sx * 1.75, 0.9, 0.42), dark, rot=(0, H, 0), n=16, bevel=0.05)
        a.limb('root', (sx * 1.6, 0.9, 1.15), (sx * 1.75, 0.9, 0.5), 0.07, 0.06, dark, n=8)
    a.cyl('root', 0.3, 0.22, (0, -2.6, 0.36), dark, rot=(0, H, 0), n=16, bevel=0.05); a.limb('root', (0, -2.6, 1.2), (0, -2.6, 0.4), 0.07, 0.06, dark, n=8)
    a.cyl('root', 0.16, 0.7, (0, 0.1, 4.1), dark, n=12)
    a.pivot('rotor', (0, 0.1, 4.45)); a.cyl('rotor', 0.3, 0.14, (0, 0.1, 4.45), dark, n=12, bevel=0.02)
    for i in range(4):
        an = i * H
        a.box('rotor', (0.42, 7.4, 0.05), (math.sin(an) * 3.9, 0.1 + math.cos(an) * 3.9, 4.47), dark, rot=(0, 0.06, -an), bevel=0.015)
    a.pivot('tail', (0.22, 8.9, 4.5))
    a.cyl('tail', 0.12, 0.1, (0.22, 8.9, 4.5), dark, rot=(0, H, 0), n=10)
    for i in range(4):
        an = i * H
        a.box('tail', (0.03, 0.2, 1.25), (0.24, 8.9 + math.sin(an) * 0.65, 4.5 + math.cos(an) * 0.65), dark, rot=(an, 0, 0), bevel=0.01)
    a.pivot('light', (0, 0, 0.95)); a.sphere('light', 0.1, (0, 0, 0.95), red, seg=10)
    a.cyl('root', 0.05, 1.6, (0.5, -3.9, 1.5), dark, rot=(H, 0, 0), n=8)  # nose gun / probe
    return a


def apc():
    a = Asm('APC')
    ol = mat('apc_olive', (0.15, 0.17, 0.11), 0.8, 0.15); dk = mat('apc_dark', (0.03, 0.032, 0.035), 0.85); st = mat('apc_steel', (0.06, 0.065, 0.07), 0.45, 0.8); lamp = mat('apc_lamp', (1, 0.9, 0.6), 0.3, 0, (1, 0.9, 0.6, 3))
    # hull: lower tub + sloped upper (front at -Y)
    a.box('root', (2.7, 6.2, 0.9), (0, 0, 1.05), ol, bevel=0.08, taper=(1.08, 1.03))
    a.box('root', (2.9, 5.0, 0.85), (0, 0.5, 1.9), ol, bevel=0.1, taper=(0.72, 0.9))
    a.box('root', (2.75, 1.5, 0.75), (0, -2.75, 1.55), ol, rot=(0.62, 0, 0), bevel=0.06)  # glacis
    a.box('root', (2.4, 0.5, 0.3), (0, -3.3, 0.9), ol, rot=(-0.5, 0, 0), bevel=0.05)
    for sx in (-1, 1):
        for y in (-2.3, -0.85, 0.85, 2.3):
            a.cyl('root', 0.62, 0.42, (sx * 1.38, y, 0.62), dk, rot=(0, H, 0), n=20, bevel=0.07)
            a.cyl('root', 0.3, 0.46, (sx * 1.38, y, 0.62), st, rot=(0, H, 0), n=10, bevel=0.03)
        a.box('root', (0.5, 6.0, 0.12), (sx * 1.42, 0, 1.36), ol, bevel=0.03)  # mud guards
        a.box('root', (0.28, 0.1, 0.2), (sx * 1.0, -3.42, 1.35), lamp, bevel=0.03)
        a.box('root', (0.1, 1.4, 0.5), (sx * 1.3, 1.2, 1.9), ol, bevel=0.03)  # stowage
        a.cyl('root', 0.04, 1.3, (sx * 1.2, 2.6, 2.9), st, n=6)
    for y in (-1.4, 1.7):
        a.cyl('root', 0.36, 0.08, (0.6 if y < 0 else -0.5, y, 2.36), ol, n=14, bevel=0.02)  # hatches
    a.box('root', (1.3, 0.08, 1.2), (0, 3.12, 1.5), ol, bevel=0.03)  # rear door
    a.pivot('turret', (0, -0.2, 2.34))
    a.cyl('turret', 0.85, 0.55, (0, -0.2, 2.62), ol, n=10, r2=0.62, bevel=0.04)
    a.box('turret', (0.5, 0.7, 0.4), (0, -0.95, 2.62), ol, bevel=0.06)
    a.cyl('turret', 0.055, 2.4, (0, -2.3, 2.66), st, rot=(H, 0, 0), n=12)
    a.cyl('turret', 0.085, 0.3, (0, -3.4, 2.66), st, rot=(H, 0, 0), n=10, bevel=0.01)
    a.cyl('turret', 0.03, 1.0, (0.24, -1.5, 2.72), st, rot=(H, 0, 0), n=8)
    a.box('turret', (0.3, 0.3, 0.22), (-0.38, -0.3, 3.0), dk, bevel=0.04)  # optic
    a.cyl('turret', 0.012, 1.5, (0.5, 0.3, 3.6), st, n=6)
    a.marker('muzzle', (0, -3.6, 2.66), 'turret')
    return a


def tree():
    """Jungle tree. Two meshes (trunk, canopy) so the game can instance them with different materials."""
    a = Asm('Tree'); random.seed(7)
    bark = mat('bark', (0.2, 0.15, 0.1), 0.95); leaf = mat('leaf', (0.07, 0.24, 0.07), 0.85)
    a.pivot('trunk', (0, 0, 0)); a.pivot('canopy', (0, 0, 0))
    a.tube('trunk', [(0, 0, -0.4), (0.05, 0.02, 2.5), (-0.12, 0.08, 5.2), (0.1, -0.05, 8.0), (0.0, 0, 9.4)], 0.34, bark, res=2, bevel_res=1, taper=[1.5, 1.0, 0.85, 0.65, 0.4])
    for an, r in ((0.3, 0.9), (2.4, 0.8), (4.5, 1.0)):  # buttress roots
        a.limb('trunk', (math.cos(an) * r, math.sin(an) * r, -0.2), (math.cos(an) * 0.1, math.sin(an) * 0.1, 1.5), 0.1, 0.22, bark, n=6)
    for an, z, ln in ((0.5, 6.6, 3.2), (2.6, 7.4, 2.8), (4.4, 6.9, 3.0), (1.5, 8.2, 2.2)):
        a.limb('trunk', (0, 0, z), (math.cos(an) * ln, math.sin(an) * ln, z + 1.6), 0.14, 0.05, bark, n=6)
    for (x, y, z, r, sz) in ((0, 0, 10.2, 3.1, 0.62), (2.4, 1.2, 8.9, 2.4, 0.6), (-2.2, 1.6, 9.3, 2.5, 0.58), (-1.0, -2.4, 9.0, 2.3, 0.6), (1.6, -1.9, 10.0, 2.0, 0.6), (0.2, 0.6, 11.6, 1.9, 0.6)):
        a.ico('canopy', r, (x, y, z), leaf, scale=(1, 1, sz), sub=1, displace=(0.9, 1.3), smooth=0)
    return a


def palm():
    a = Asm('Palm'); random.seed(3)
    bark = mat('palm_bark', (0.3, 0.24, 0.16), 0.95); leaf = mat('palm_leaf', (0.12, 0.34, 0.1), 0.8); nut = mat('coconut', (0.22, 0.14, 0.06), 0.8)
    a.pivot('trunk', (0, 0, 0)); a.pivot('canopy', (0, 0, 0))
    top = (0.9, 0.2, 8.4)
    a.tube('trunk', [(0, 0, -0.4), (0.1, 0, 2.0), (0.45, 0.08, 5.0), (0.8, 0.18, 7.4), top], 0.2, bark, res=3, bevel_res=1, taper=[1.5, 1.05, 0.9, 0.8, 0.75])
    for i in range(4):
        k = i / 4
        a.cyl('trunk', 0.2 * (1.08 - k * 0.3), 0.07, (0.02 + k * k * 0.85, k * 0.18, 0.5 + k * 7.4), bark, n=8)
    for i in range(3):
        a.sphere('trunk', 0.14, (top[0] + math.cos(i * 2.1) * 0.2, top[1] + math.sin(i * 2.1) * 0.2, top[2] - 0.2), nut, seg=8)
    for i in range(9):  # fronds: arched rib with leaflets
        an = i * 2 * math.pi / 9 + random.uniform(-0.15, 0.15); droop = random.uniform(0.75, 1.25); ln = random.uniform(3.6, 4.6)
        verts, faces = [], []
        for s in range(6):
            t = s / 5; r = t * ln; z = math.sin(t * 2.2) * 1.5 - t * t * 2.6 * droop; w = math.sin(min(1, t * 1.15) * math.pi) * 0.75 + 0.06
            cx, cy = math.cos(an) * r, math.sin(an) * r; px, py = -math.sin(an), math.cos(an)
            verts += [(top[0] + cx - px * w, top[1] + cy - py * w, top[2] + z - w * 0.45), (top[0] + cx, top[1] + cy, top[2] + z), (top[0] + cx + px * w, top[1] + cy + py * w, top[2] + z - w * 0.45)]
        for s in range(5):
            p = s * 3
            faces += [(p, p + 1, p + 4, p + 3), (p + 1, p + 2, p + 5, p + 4)]
        a.mesh('canopy', verts, faces, leaf, smooth=0)
    return a


def rock():
    a = Asm('Rock'); st = mat('rock', (0.3, 0.29, 0.27), 0.95)
    a.ico('root', 1.0, (0, 0, 0.35), st, scale=(1.15, 0.95, 0.7), sub=3, displace=(0.55, 0.7), decimate=0.35, smooth=0.5)
    return a


def unit_props():
    """Props modelled inside a unit cube (±0.5). The game scales them to the collider size, so collision stays exact."""
    out = []
    wood = mat('p_wood', (0.42, 0.3, 0.17), 0.85); dk = mat('p_wood_dark', (0.25, 0.17, 0.09), 0.9); metal = mat('p_metal', (0.3, 0.32, 0.31), 0.5, 0.6)
    a = Asm('P_crate')
    a.box('root', (0.9, 0.9, 0.9), (0, 0, 0), wood, bevel=0.01, seg=1)
    for ax in range(3):
        for s1 in (-1, 1):
            for s2 in (-1, 1):
                size, loc = [0.1, 0.1, 0.1], [0, 0, 0]
                size[ax] = 1.0; loc[(ax + 1) % 3] = s1 * 0.45; loc[(ax + 2) % 3] = s2 * 0.45
                a.box('root', tuple(size), tuple(loc), dk, bevel=0.012, seg=1)
    for sy in (-1, 1):
        a.box('root', (0.08, 0.04, 1.15), (0, sy * 0.47, 0), dk, rot=(0, 0.785, 0), bevel=0.008, seg=1)
        a.box('root', (0.04, 0.08, 1.15), (sy * 0.47, 0, 0), dk, rot=(0.785, 0, 0), bevel=0.008, seg=1)
    out.append(a)
    a = Asm('P_barrel'); red = mat('p_barrel', (0.5, 0.08, 0.05), 0.55, 0.4)
    a.cyl('root', 0.47, 1.0, (0, 0, 0), red, n=20, bevel=0.02, seg=1)
    for z in (-0.3, 0.0, 0.3):
        a.cyl('root', 0.5, 0.05, (0, 0, z), red, n=20, bevel=0.015, seg=1)
    a.cyl('root', 0.44, 0.02, (0, 0, 0.5), metal, n=20); a.cyl('root', 0.07, 0.04, (0.25, 0, 0.5), metal, n=10)
    a.box('root', (0.02, 0.5, 0.25), (0.475, 0, 0.12), mat('p_hazard', (0.9, 0.7, 0.1), 0.6), bevel=0.004, seg=1)
    out.append(a)
    a = Asm('P_sandbags'); sand = mat('p_sand', (0.55, 0.48, 0.33), 0.95); random.seed(5)
    rows, cols = 4, 6
    for r in range(rows):
        for c in range(cols + (r % 2)):
            x = -0.5 + (c + 0.5 - (r % 2) * 0.5) / cols
            if abs(x) > 0.5:
                continue
            a.box('root', (1 / cols * 1.04, 0.92, 1 / rows * 1.02), (max(-0.42, min(0.42, x)), random.uniform(-0.03, 0.03), -0.5 + (r + 0.5) / rows), sand, bevel=0.06, seg=1, rot=(0, 0, random.uniform(-0.04, 0.04)))
    out.append(a)
    a = Asm('P_container'); cm = mat('p_container', (0.35, 0.36, 0.36), 0.6, 0.4)
    a.box('root', (0.97, 0.97, 0.97), (0, 0, 0), cm, bevel=0.004, seg=1)
    for i in range(24):
        x = -0.48 + (i + 0.5) * 0.04
        a.box('root', (0.02, 1.0, 0.94), (x, 0, 0), cm, bevel=0.004, seg=1)  # corrugation (long sides)
    for sx in (-1, 1):
        for sy in (-1, 1):
            a.box('root', (0.03, 0.05, 1.0), (sx * 0.485, sy * 0.475, 0), cm, bevel=0.004, seg=1)
    for sz in (-1, 1):
        a.box('root', (1.0, 1.0, 0.04), (0, 0, sz * 0.48), cm, bevel=0.004, seg=1)
    out.append(a)
    return out


# ---------------------------------------------------------------- structures & vehicles (v0.4)
def truck():
    """6x6 cargo truck, 6.4 m long (front -Y), 2.5 m wide, 3.1 m high. Origin: ground centre."""
    a = Asm('Truck')
    ol = mat('truck_olive', (0.16, 0.18, 0.11), 0.8, 0.1); dk = mat('truck_dark', (0.03, 0.032, 0.035), 0.85); st = mat('truck_steel', (0.07, 0.075, 0.08), 0.5, 0.7)
    canvas = mat('truck_canvas', (0.2, 0.21, 0.14), 0.95); glass = mat('truck_glass', (0.05, 0.08, 0.1), 0.1, 0.6); lamp = mat('truck_lamp', (0.9, 0.85, 0.6), 0.3)
    a.box('root', (0.9, 6.0, 0.22), (0, 0.1, 0.92), st, bevel=0.03)  # chassis rails
    # cab
    a.box('root', (2.3, 1.7, 1.25), (0, -2.2, 1.7), ol, bevel=0.12)
    a.box('root', (2.25, 1.4, 0.75), (0, -2.05, 2.6), ol, bevel=0.14, taper=(0.9, 0.8))
    a.box('root', (2.0, 0.05, 0.6), (0, -2.74, 2.58), glass, rot=(0.22, 0, 0), bevel=0.01)
    for sx in (-1, 1):
        a.box('root', (0.05, 0.8, 0.5), (sx * 1.13, -2.05, 2.6), glass, bevel=0.01)
        a.box('root', (0.5, 0.5, 0.35), (sx * 0.85, -3.1, 1.55), ol, bevel=0.08)  # fenders
        a.cyl('root', 0.11, 0.06, (sx * 0.8, -3.18, 1.7), lamp, rot=(H, 0, 0), n=12)
        a.box('root', (0.06, 0.06, 0.5), (sx * 1.3, -2.7, 2.4), st, bevel=0.01); a.box('root', (0.05, 0.2, 0.3), (sx * 1.36, -2.72, 2.6), dk, bevel=0.02)  # mirrors
    a.box('root', (1.6, 0.9, 0.85), (0, -3.25, 1.55), ol, bevel=0.1)  # hood
    for i in range(6):
        a.box('root', (1.3, 0.04, 0.06), (0, -3.72, 1.3 + i * 0.1), dk, bevel=0.01)  # grille
    a.box('root', (2.4, 0.18, 0.28), (0, -3.72, 0.95), st, bevel=0.04)  # bumper
    # cargo bed + canvas tilt with bows
    a.box('root', (2.45, 3.9, 0.16), (0, 1.15, 1.3), st, bevel=0.02)
    for sx in (-1, 1):
        a.box('root', (0.08, 3.9, 0.7), (sx * 1.19, 1.15, 1.7), ol, bevel=0.02)
    a.box('root', (2.45, 0.08, 0.7), (0, 3.08, 1.7), ol, bevel=0.02); a.box('root', (2.45, 0.08, 0.7), (0, -0.78, 1.7), ol, bevel=0.02)
    verts, faces = [], []
    for i, y in enumerate((-0.8, 0.2, 1.15, 2.1, 3.1)):
        sag = 0.05 if i % 2 else 0.0
        verts += [(-1.22, y, 2.05), (-1.2, y, 2.7 - sag), (-0.7, y, 3.08 - sag), (0.7, y, 3.08 - sag), (1.2, y, 2.7 - sag), (1.22, y, 2.05)]
    for i in range(4):
        for j in range(5):
            p = i * 6 + j; faces.append((p, p + 1, p + 7, p + 6))
    faces.append((0, 1, 2, 3, 4, 5)); faces.append((24, 25, 26, 27, 28, 29))
    a.mesh('root', verts, faces, canvas, smooth=0.5, subsurf=1)
    for wy in (-2.6, 0.9, 2.3):
        for sx in (-1, 1):
            a.cyl('root', 0.54, 0.38, (sx * 1.02, wy, 0.54), dk, rot=(0, H, 0), n=18, bevel=0.07)
            a.cyl('root', 0.24, 0.42, (sx * 1.02, wy, 0.54), st, rot=(0, H, 0), n=10, bevel=0.02)
        a.cyl('root', 0.07, 2.0, (0, wy, 0.54), st, rot=(0, H, 0), n=8)
    a.cyl('root', 0.3, 0.9, (1.0, -0.9, 1.0), st, rot=(H, 0, 0), n=14, bevel=0.03)  # fuel tank
    a.box('root', (0.5, 0.7, 0.5), (-1.0, -0.9, 1.0), dk, bevel=0.05)  # battery box / spare
    return a


def watchtower():
    """Timber watchtower: deck top at z=6.5 (3.6 m square), roof above. Origin: ground centre."""
    a = Asm('Watchtower')
    wood = mat('tower_wood', (0.33, 0.24, 0.14), 0.9); dark = mat('tower_wood_dark', (0.2, 0.14, 0.08), 0.92); tin = mat('tower_tin', (0.3, 0.19, 0.14), 0.6, 0.4); st = mat('tower_steel', (0.1, 0.1, 0.11), 0.5, 0.6)
    legs = [(-1.5, -1.5), (1.5, -1.5), (-1.5, 1.5), (1.5, 1.5)]
    for x, y in legs:
        a.limb('root', (x * 1.12, y * 1.12, -0.3), (x, y, 6.5), 0.13, 0.11, wood, n=8)
        a.box('root', (0.45, 0.45, 0.25), (x * 1.12, y * 1.12, 0.05), mat('tower_conc', (0.4, 0.4, 0.38), 0.9), bevel=0.04)
    for z0, z1 in ((0.4, 2.4), (2.4, 4.4), (4.4, 6.3)):  # cross bracing on all four sides
        for (x0, y0), (x1, y1) in ((legs[0], legs[1]), (legs[1], legs[3]), (legs[3], legs[2]), (legs[2], legs[0])):
            a.limb('root', (x0, y0, z0), (x1, y1, z1), 0.045, 0.045, dark, n=6); a.limb('root', (x1, y1, z0), (x0, y0, z1), 0.045, 0.045, dark, n=6)
            a.limb('root', (x0, y0, z1), (x1, y1, z1), 0.05, 0.05, dark, n=6)
    for i in range(9):  # deck planks
        a.box('root', (0.38, 3.6, 0.1), (-1.6 + i * 0.4, 0, 6.45), wood, bevel=0.012, seg=1)
    a.box('root', (3.7, 3.7, 0.12), (0, 0, 6.33), dark, bevel=0.02, seg=1)
    for sx, sy, sz in ((3.6, 0.1, 0.0), (0.1, 3.6, 0.0)):  # rails (0.7 m, matches the collider)
        for s in (-1, 1):
            cx, cy = (0, s * 1.75) if sx > 1 else (s * 1.75, 0)
            a.box('root', (sx, sy, 0.1), (cx, cy, 7.15), wood, bevel=0.012, seg=1); a.box('root', (sx, sy, 0.08), (cx, cy, 6.85), wood, bevel=0.012, seg=1)
            for k in range(5):
                off = -1.6 + k * 0.8
                a.box('root', (0.07, 0.07, 0.7), ((off, s * 1.75) if sx > 1 else (s * 1.75, off)) + (6.85,), dark, bevel=0.01, seg=1)
    for x, y in legs:
        a.limb('root', (x * 1.13, y * 1.13, 6.5), (x * 1.13, y * 1.13, 8.9), 0.07, 0.06, wood, n=6)
    for s in (-1, 1):  # corrugated gable roof
        a.box('root', (4.3, 2.3, 0.06), (0, s * 1.05, 9.25), tin, rot=(s * 0.38, 0, 0), bevel=0.01, seg=1)
        for k in range(10):
            a.box('root', (0.08, 2.3, 0.05), (-1.9 + k * 0.42, s * 1.05, 9.3), tin, rot=(s * 0.38, 0, 0), bevel=0.01, seg=1)
    a.box('root', (4.3, 0.12, 0.12), (0, 0, 9.68), dark, bevel=0.02, seg=1)
    for k in range(14):  # ladder
        a.limb('root', (-0.3, -1.95 - k * 0.012, 0.3 + k * 0.45), (0.3, -1.95 - k * 0.012, 0.3 + k * 0.45), 0.025, 0.025, dark, n=6)
    for sx in (-0.3, 0.3):
        a.limb('root', (sx, -1.95, 0.0), (sx, -2.12, 6.6), 0.035, 0.035, wood, n=6)
    a.cyl('root', 0.3, 0.42, (1.2, -1.2, 7.55), st, rot=(H * 0.85, 0, 0.6), n=14, bevel=0.03)  # searchlight housing
    a.limb('root', (1.2, -1.2, 6.5), (1.2, -1.2, 7.4), 0.04, 0.04, st, n=6)
    for k in range(3):  # sandbags on the deck edge
        a.box('root', (0.7, 0.32, 0.2), (-0.9 + k * 0.72, -1.5, 6.62), mat('p_sand', (0.55, 0.48, 0.33), 0.95), bevel=0.06, seg=1)
    return a


def comms_tower():
    """34 m lattice relay mast with dishes and whip antennas. Origin: base centre."""
    a = Asm('CommsTower')
    st = mat('mast_steel', (0.42, 0.44, 0.45), 0.5, 0.7); red = mat('mast_red', (0.55, 0.1, 0.07), 0.6, 0.4); wh = mat('mast_white', (0.75, 0.76, 0.75), 0.5, 0.1); dk = mat('mast_dark', (0.05, 0.05, 0.06), 0.7)
    H0, top = 34.0, 0.32
    def corner(i, z):
        w = 1.25 + (top - 1.25) * (z / H0); return ((w if i in (1, 2) else -w), (w if i in (2, 3) else -w), z)
    for i in range(4):
        for s in range(8):
            z0, z1 = s * H0 / 8, (s + 1) * H0 / 8
            a.limb('root', corner(i, z0), corner(i, z1), 0.07, 0.065, red if s % 2 else st, n=6)
    for s in range(16):
        z0, z1 = s * H0 / 16, (s + 1) * H0 / 16
        for i in range(4):
            j = (i + 1) % 4
            a.limb('root', corner(i, z1), corner(j, z1), 0.028, 0.028, st, n=4)
            a.limb('root', corner(i, z0), corner(j, z1), 0.022, 0.022, st, n=4) if s % 2 == 0 else a.limb('root', corner(j, z0), corner(i, z1), 0.022, 0.022, st, n=4)
    a.box('root', (3.4, 3.4, 0.4), (0, 0, 0.1), mat('mast_conc', (0.42, 0.42, 0.4), 0.9), bevel=0.05, seg=1)
    for an, z, r in ((0.5, 24.0, 1.1), (2.6, 27.0, 0.9), (4.4, 29.5, 1.0), (1.4, 21.0, 0.7)):  # microwave dishes
        w = 1.25 + (top - 1.25) * (z / H0) + 0.25; cx, cy = math.cos(an) * w, math.sin(an) * w
        a.cyl('root', r, 0.35, (cx + math.cos(an) * 0.25, cy + math.sin(an) * 0.25, z), wh, rot=(0, H, an), r2=r * 0.35, n=18, bevel=0.02)
        a.limb('root', (cx * 0.6, cy * 0.6, z), (cx, cy, z), 0.05, 0.05, st, n=6)
    for k, (x, y) in enumerate(((0.25, 0.25), (-0.25, 0.25), (0.0, -0.3))):
        a.cyl('root', 0.02, 4.0 + k, (x, y, H0 + 2.0 + k * 0.5), dk, n=6)  # whips
    for z in (11.0, 22.0):  # panel antennas
        for an in (0, 2.09, 4.19):
            w = 1.25 + (top - 1.25) * (z / H0) + 0.2
            a.box('root', (0.28, 0.12, 2.0), (math.cos(an) * w, math.sin(an) * w, z), wh, rot=(0, 0, an + H), bevel=0.03, seg=1)
    a.box('root', (0.8, 0.5, 1.4), (1.5, -0.2, 1.0), mat('mast_cabinet', (0.3, 0.33, 0.3), 0.6, 0.4), bevel=0.04, seg=1)
    for k in range(40):  # ladder up one face
        z = 0.6 + k * 0.82
        if z > H0 - 1:
            break
        w = 1.25 + (top - 1.25) * (z / H0)
        a.limb('root', (-0.2, -w - 0.03, z), (0.2, -w - 0.03, z), 0.018, 0.018, dk, n=4)
    return a


def radar():
    """Coastal radar: 7 m concrete pedestal ('base') and a rotating reflector ('dish', pivot at z=8.6)."""
    a = Asm('Radar')
    conc = mat('radar_conc', (0.42, 0.42, 0.4), 0.9); wh = mat('radar_white', (0.72, 0.74, 0.73), 0.5, 0.1); st = mat('radar_steel', (0.2, 0.21, 0.22), 0.5, 0.7)
    a.pivot('base', (0, 0, 0)); a.pivot('dish', (0, 0, 8.6))
    a.box('base', (2.4, 2.4, 6.6), (0, 0, 3.3), conc, bevel=0.08, taper=(0.86, 0.86), seg=1)
    a.box('base', (3.0, 3.0, 0.4), (0, 0, 6.8), conc, bevel=0.06, seg=1)
    for k in range(4):
        an = k * H
        a.limb('base', (math.cos(an) * 1.45, math.sin(an) * 1.45, 7.0), (math.cos(an) * 1.45, math.sin(an) * 1.45, 7.9), 0.03, 0.03, st, n=6)
        a.limb('base', (math.cos(an) * 1.45, math.sin(an) * 1.45, 7.9), (math.cos(an + H) * 1.45, math.sin(an + H) * 1.45, 7.9), 0.03, 0.03, st, n=6)
    a.box('base', (0.9, 0.08, 1.9), (0, -1.22, 1.0), st, bevel=0.02, seg=1)  # door
    a.cyl('base', 0.45, 1.3, (0, 0, 7.6), st, n=12, bevel=0.03)
    # reflector: parabolic-ish mesh panel, feed horn and back frame
    verts, faces, NX, NZ = [], [], 9, 5
    for j in range(NZ):
        for i in range(NX):
            x = (i / (NX - 1) - 0.5) * 5.2; z = (j / (NZ - 1) - 0.5) * 2.4
            verts.append((x, 0.55 - (x * x) * 0.11 - (z * z) * 0.1, 8.6 + 1.5 + z))
    for j in range(NZ - 1):
        for i in range(NX - 1):
            p = j * NX + i; faces.append((p, p + 1, p + NX + 1, p + NX))
    a.mesh('dish', verts, faces, wh, smooth=1.0, solidify=0.06)
    a.limb('dish', (0, 0.3, 8.6), (0, 0.3, 9.6), 0.12, 0.1, st, n=8)
    a.limb('dish', (0, 0.35, 9.2), (0, -1.5, 10.1), 0.04, 0.04, st, n=6); a.box('dish', (0.3, 0.3, 0.3), (0, -1.6, 10.1), st, bevel=0.04, seg=1)
    for sx in (-1, 1):
        a.limb('dish', (0, 0.4, 9.3), (sx * 2.2, 0.15, 10.1), 0.035, 0.035, st, n=6)
    return a


def lamp_post():
    """6 m steel lamp post with an arm and hooded head (the glowing bulb is added by the game)."""
    a = Asm('LampPost'); st = mat('lamp_steel', (0.12, 0.125, 0.13), 0.5, 0.7)
    a.limb('root', (0, 0, 0), (0, 0, 5.75), 0.09, 0.055, st, n=10)
    a.cyl('root', 0.16, 0.5, (0, 0, 0.25), st, n=10, bevel=0.02)
    a.tube('root', [(0, 0, 5.6), (0, -0.1, 5.95), (0, -0.5, 6.05), (0, -0.9, 6.0)], 0.04, st, res=4, bevel_res=2)
    a.box('root', (0.3, 0.55, 0.12), (0, -0.95, 5.98), st, bevel=0.04, seg=1)
    return a


def wall_panels():
    """Wall / roof panels modelled in a unit cube; the game tiles them along a wall (one panel ≈ 4 m)."""
    out = []
    a = Asm('P_wall_concrete'); c = mat('w_conc', (0.44, 0.44, 0.42), 0.92); c2 = mat('w_conc_dark', (0.33, 0.33, 0.32), 0.92)
    a.box('root', (1.0, 0.86, 1.0), (0, 0, 0), c, bevel=0.004, seg=1)
    for sx in (-0.5, 0.5):
        a.box('root', (0.07, 1.0, 1.0), (sx * 0.93, 0, 0), c2, bevel=0.01, seg=1)  # pilasters
    a.box('root', (1.0, 1.0, 0.07), (0, 0, 0.465), c2, bevel=0.01, seg=1); a.box('root', (1.0, 1.0, 0.1), (0, 0, -0.45), c2, bevel=0.01, seg=1)
    for z in (-0.12, 0.2):
        a.box('root', (0.86, 0.9, 0.012), (0, 0, z), c2, bevel=0.0, seg=1)  # formwork lines
    out.append(a)
    a = Asm('P_wall_metal'); m = mat('w_metal', (0.3, 0.33, 0.32), 0.55, 0.6); m2 = mat('w_metal_dark', (0.16, 0.17, 0.17), 0.6, 0.6)
    a.box('root', (1.0, 0.7, 1.0), (0, 0, 0), m, bevel=0.003, seg=1)
    for k in range(12):
        a.box('root', (0.045, 1.0, 0.96), (-0.458 + k * 0.0833, 0, 0), m, bevel=0.012, seg=1)  # corrugation
    for z in (-0.47, 0.47):
        a.box('root', (1.0, 1.0, 0.06), (0, 0, z), m2, bevel=0.008, seg=1)
    out.append(a)
    a = Asm('P_wall_wood'); w = mat('w_wood', (0.4, 0.29, 0.17), 0.9); w2 = mat('w_wood_dark', (0.24, 0.17, 0.1), 0.92); random.seed(11)
    for k in range(8):
        a.box('root', (0.118, random.uniform(0.82, 0.96), 1.0), (-0.44 + k * 0.125, 0, 0), w if k % 3 else w2, bevel=0.008, seg=1)
    for z in (-0.3, 0.32):
        a.box('root', (1.0, 1.0, 0.09), (0, 0, z), w2, bevel=0.01, seg=1)
    out.append(a)
    a = Asm('P_roof'); r = mat('w_roof', (0.2, 0.21, 0.21), 0.6, 0.5)
    a.box('root', (1.0, 1.0, 0.6), (0, 0, -0.2), r, bevel=0.01, seg=1)
    for k in range(10):
        a.box('root', (0.05, 1.0, 0.4), (-0.45 + k * 0.1, 0, 0.3), r, bevel=0.01, seg=1)
    out.append(a)
    return out
