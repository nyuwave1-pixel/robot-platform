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
