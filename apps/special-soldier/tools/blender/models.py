# Characters, vehicles, vegetation and props. Blender axes: front -Y, up +Z, right +X (glTF export → front +Z, up +Y).
import math
import random
from lib import Asm, mat

H = math.pi / 2


def soldier():
    a = Asm('Soldier')
    cloth = mat('cloth', (0.17, 0.21, 0.14), 0.92); vest = mat('vest', (0.09, 0.1, 0.075), 0.85); skin = mat('skin', (0.52, 0.36, 0.27), 0.6)
    web = mat('webbing', (0.12, 0.115, 0.09), 0.92); glove = mat('glove', (0.05, 0.05, 0.045), 0.8); pmag = mat('pmag', (0.04, 0.04, 0.038), 0.6, 0.1); patch = mat('patch', (0.3, 0.29, 0.22), 0.9); gog = mat('goggle', (0.03, 0.05, 0.06), 0.1, 0.6)
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
        a.detail(True)
        # cargo pocket with flap and button tab
        a.box(g, (0.03, 0.13, 0.16), (x + sx * 0.088, 0.005, 0.66), cloth, bevel=0.012); a.box(g, (0.034, 0.135, 0.045), (x + sx * 0.089, 0.005, 0.735), cloth, bevel=0.008)
        a.box(g, (0.036, 0.03, 0.02), (x + sx * 0.09, 0.005, 0.715), web, bevel=0.003)
        # knee pad: hard cap + two elastic straps
        a.sphere(g, 0.052, (x * 1.02, -0.072, 0.52), gear, scale=(1.0, 0.55, 1.15), seg=10)
        for z in (0.565, 0.475):
            a.cyl(g, 0.08 if z > 0.5 else 0.074, 0.02, (x * 1.02, -0.008, z), web, n=14)
        # bloused trouser cuff, boot collar, laces, toe cap, heel
        a.cyl(g, 0.07, 0.06, (x * 1.02, 0.008, 0.235), cloth, n=14, bevel=0.012)
        a.cyl(g, 0.064, 0.03, (x * 1.02, 0.008, 0.205), boots, n=14, bevel=0.006)
        for k in range(5):
            a.box(g, (0.06, 0.008, 0.007), (x * 1.02, -0.082, 0.195 - k * 0.02), web, bevel=0.002)
        a.sphere(g, 0.058, (x * 1.02, -0.14, 0.05), boots, scale=(1.0, 1.0, 0.8), seg=10)
        a.box(g, (0.118, 0.085, 0.022), (x * 1.02, 0.05, 0.004), gear, bevel=0.005)
        for k in range(4):
            a.box(g, (0.122, 0.02, 0.012), (x * 1.02, -0.15 + k * 0.045, 0.004), gear, bevel=0.002)  # sole lugs
        if sx > 0:  # drop-leg holster on the trigger-hand side: platform, straps, pistol grip
            a.box(g, (0.03, 0.12, 0.17), (x + sx * 0.118, -0.005, 0.7), gear, bevel=0.012)
            a.box(g, (0.034, 0.075, 0.2), (x + sx * 0.14, -0.015, 0.69), gear, bevel=0.012, taper=(1, 0.8))
            a.box(g, (0.028, 0.045, 0.085), (x + sx * 0.14, 0.03, 0.825), boots, rot=(0.25, 0, 0), bevel=0.008)
            a.box(g, (0.03, 0.09, 0.03), (x + sx * 0.14, -0.005, 0.795), gear, bevel=0.005)
            for z in (0.74, 0.63):
                a.cyl(g, 0.101 if z > 0.7 else 0.093, 0.028, (x, 0, z), web, n=14)
            a.box(g, (0.02, 0.04, 0.2), (x + sx * 0.1, 0, 0.88), web, bevel=0.004)
        else:  # dump pouch + tourniquet on the support side
            a.box(g, (0.05, 0.13, 0.15), (x + sx * 0.12, 0.03, 0.86), vest, bevel=0.02)
            a.cyl(g, 0.016, 0.1, (x + sx * 0.1, -0.09, 0.9), gear, n=8); a.cyl(g, 0.018, 0.02, (x + sx * 0.1, -0.09, 0.9), accent, n=8)
        a.detail(False)
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
    a.detail(True)
    a.box('upper', (0.075, 0.05, 0.13), (0.115, -0.158, 1.375), gear, bevel=0.012)  # radio in its pouch
    a.box('upper', (0.085, 0.03, 0.07), (0.115, -0.165, 1.335), vest, bevel=0.01); a.cyl('upper', 0.008, 0.02, (0.135, -0.16, 1.45), gear, n=8)
    a.tube('upper', [(0.1, -0.17, 1.44), (0.06, -0.15, 1.5), (0.07, -0.06, 1.53), (0.09, 0.0, 1.56)], 0.004, gear)  # headset lead
    for sx_, z in ((-1, 1.45),):
        a.box('upper', (0.04, 0.03, 0.05), (sx_ * 0.12, -0.14, z), gear, bevel=0.008)  # push-to-talk
    for z in (1.33, 1.375, 1.42):
        a.box('upper', (0.3, 0.008, 0.022), (0, -0.148, z), web, bevel=0.002)  # MOLLE rows
    a.box('upper', (0.15, 0.03, 0.085), (-0.065, -0.158, 1.385), vest, bevel=0.012)  # admin pouch
    a.box('upper', (0.075, 0.005, 0.045), (-0.065, -0.175, 1.39), patch, bevel=0.002); a.box('upper', (0.03, 0.006, 0.02), (-0.085, -0.176, 1.395), accent, bevel=0)
    for i in range(3):  # magazines seated in the pouches, with bungee retainers
        xm = -0.105 + i * 0.105
        a.box('upper', (0.062, 0.026, 0.07), (xm, -0.163, 1.25), pmag, bevel=0.006, shear=0.0)
        a.box('upper', (0.012, 0.062, 0.012), (xm, -0.165, 1.288), web, bevel=0.003)
    a.box('upper', (0.055, 0.016, 0.042), (0, -0.108, 1.02), gear, bevel=0.006)  # belt buckle
    for sx in (-1, 1):
        a.box('upper', (0.075, 0.055, 0.1), (sx * 0.14, -0.115, 1.035), vest, bevel=0.014)  # belt pouches
        a.box('upper', (0.078, 0.058, 0.03), (sx * 0.14, -0.117, 1.075), vest, bevel=0.008)
        a.box('upper', (0.055, 0.13, 0.17), (sx * 0.215, 0.01, 1.2), vest, bevel=0.018)  # cummerbund side pouch
        for z in (1.14, 1.19, 1.24, 1.29):
            a.box('upper', (0.008, 0.18, 0.02), (sx * 0.2, 0.0, z + 0.06), web, bevel=0.002)
        a.box('upper', (0.085, 0.2, 0.025), (sx * 0.12, 0, 1.497), web, bevel=0.01)  # padded shoulder strap covers
    a.cyl('upper', 0.032, 0.07, (-0.19, -0.1, 1.07), mat('frag', (0.13, 0.17, 0.1), 0.6, 0.2), n=10, bevel=0.012); a.cyl('upper', 0.012, 0.03, (-0.19, -0.1, 1.115), gear, n=8)  # frag grenade
    a.box('upper', (0.17, 0.075, 0.11), (0, 0.13, 1.03), vest, bevel=0.02); a.box('upper', (0.05, 0.006, 0.05), (0, 0.169, 1.035), accent, bevel=0.002)  # IFAK
    a.detail(False)
    a.cyl('upper', 0.004, 0.2, (0.14, -0.15, 1.5), gear, n=6)
    a.pivot('acc_pack', (0, 0, 0.93), 'upper')
    a.box('acc_pack', (0.3, 0.15, 0.38), (0, 0.21, 1.25), vest, bevel=0.04)  # pack
    a.box('acc_pack', (0.22, 0.06, 0.2), (0, 0.3, 1.2), vest, bevel=0.025)
    a.box('acc_pack', (0.3, 0.16, 0.06), (0, 0.212, 1.435), vest, bevel=0.025)  # pack lid
    a.detail(True)
    for z in (1.33, 1.375):
        a.box('acc_pack', (0.26, 0.008, 0.022), (0, 0.288, z), web, bevel=0.002)
    for sx in (-1, 1):
        a.box('acc_pack', (0.012, 0.155, 0.02), (sx * 0.153, 0.21, 1.3), web, bevel=0.003); a.box('acc_pack', (0.012, 0.155, 0.02), (sx * 0.153, 0.21, 1.15), web, bevel=0.003)  # compression straps
    a.cyl('acc_pack', 0.045, 0.28, (0, 0.24, 1.055), cloth, rot=(0, H, 0), n=10, bevel=0.01)  # rolled poncho
    a.tube('acc_pack', [(-0.04, 0.14, 1.47), (-0.04, 0.16, 1.52), (0.04, 0.16, 1.52), (0.04, 0.14, 1.47)], 0.007, web)  # drag handle
    a.limb('acc_pack', (-0.12, 0.23, 1.44), (-0.15, 0.27, 1.98), 0.006, 0.0025, gear, n=5)  # whip antenna
    a.tube('acc_pack', [(0.1, 0.2, 1.46), (0.12, 0.08, 1.52), (0.13, -0.06, 1.5), (0.12, -0.12, 1.44)], 0.006, gear)  # hydration tube
    a.detail(False)
    a.cyl('upper', 0.06, 0.08, (0, 0, 1.52), cloth, n=14)  # neck
    a.cyl('upper', 0.085, 0.05, (0, 0, 1.495), cloth, n=14, r2=0.065)  # collar
    for sx in (-1, 1):
        a.sphere('upper', 0.085, (sx * 0.215, 0, 1.44), cloth, scale=(1, 1, 0.95), seg=14)
    # head + headgear variants (the game shows one set per soldier type)
    a.sphere('head', 0.1, (0, -0.005, 1.7), skin, scale=(0.92, 1.02, 1.12), seg=18)
    a.box('head', (0.03, 0.03, 0.045), (0, -0.105, 1.69), skin, bevel=0.012)  # nose
    a.box('head', (0.15, 0.02, 0.028), (0, -0.092, 1.715), gear, bevel=0.008)  # brow shadow / eyes
    a.box('head', (0.175, 0.15, 0.13), (0, -0.02, 1.625), cloth, bevel=0.045)  # balaclava / chin wrap
    a.detail(True)
    for sx in (-1, 1):
        a.box('head', (0.02, 0.035, 0.05), (sx * 0.094, 0.0, 1.695), skin, bevel=0.008)  # ears
    a.detail(False)
    a.cyl('head', 0.078, 0.07, (0, 0.0, 1.565), cloth, n=14, bevel=0.012)  # neck gaiter
    a.pivot('acc_helmet', (0, 0, 1.6), 'head')
    a.detail(True)
    a.cyl('acc_helmet', 0.125, 0.012, (0, 0.005, 1.765), web, n=18, scale=(1, 1.1, 1))  # cover band
    a.box('acc_helmet', (0.09, 0.03, 0.065), (0, 0.142, 1.695), gear, bevel=0.01)  # battery / counterweight pouch
    a.box('acc_helmet', (0.075, 0.008, 0.045), (0, 0.139, 1.765), patch, rot=(-0.35, 0, 0), bevel=0.002)
    a.box('acc_helmet', (0.03, 0.04, 0.022), (0.045, 0.06, 1.842), gear, bevel=0.005)  # strobe
    a.box('acc_helmet', (0.155, 0.022, 0.05), (0, -0.118, 1.795), gog, rot=(0.45, 0, 0), bevel=0.012)  # goggles parked on the brim
    a.box('acc_helmet', (0.17, 0.03, 0.06), (0, -0.112, 1.793), gear, rot=(0.45, 0, 0), bevel=0.014)
    for sx in (-1, 1):
        a.limb('acc_helmet', (sx * 0.112, 0.02, 1.7), (sx * 0.045, -0.07, 1.592), 0.006, 0.006, web, n=5)  # chin strap
        a.limb('acc_helmet', (sx * 0.112, -0.03, 1.72), (sx * 0.045, -0.07, 1.592), 0.005, 0.005, web, n=5)
    a.box('acc_helmet', (0.07, 0.03, 0.022), (0, -0.085, 1.588), web, bevel=0.008)
    a.limb('acc_helmet', (0.127, -0.02, 1.665), (0.05, -0.118, 1.64), 0.004, 0.004, gear, n=5); a.sphere('acc_helmet', 0.011, (0.045, -0.12, 1.64), gear, seg=8)  # boom mic
    a.detail(False)
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
        d = [e[i] - h[i] for i in range(3)]; L_ = math.sqrt(sum(c * c for c in d)); d = [c / L_ for c in d]
        a.box('arms', (0.062, 0.078, 0.062), h, glove, bevel=0.02)
        a.detail(True)
        a.box('arms', (0.064, 0.03, 0.022), (h[0], h[1] - 0.02, h[2] + 0.032), gear, bevel=0.006)  # knuckle guard
        a.box('arms', (0.058, 0.035, 0.04), (h[0], h[1] - 0.045, h[2] - 0.012), glove, bevel=0.012)  # curled fingers
        a.limb('arms', tuple(h[i] + d[i] * 0.04 for i in range(3)), tuple(h[i] + d[i] * 0.075 for i in range(3)), 0.047, 0.047, web, n=10)  # glove cuff
        a.limb('arms', tuple(h[i] + d[i] * 0.085 for i in range(3)), tuple(h[i] + d[i] * 0.11 for i in range(3)), 0.05, 0.051, cloth, n=10)  # sleeve cuff
        sgn = 1 if s[0] > 0 else -1; mid = [(s[i] + e[i]) / 2 for i in range(3)]; ang = -math.atan2(s[1] - e[1], s[2] - e[2])
        a.box('arms', (0.016, 0.085, 0.11), (mid[0] + sgn * 0.052, mid[1], mid[2]), cloth, rot=(ang, 0, 0), bevel=0.006)  # sleeve pocket
        a.box('arms', (0.006, 0.07, 0.05), (mid[0] + sgn * 0.062, mid[1], mid[2] + 0.015), patch, rot=(ang, 0, 0), bevel=0.002)
        a.box('arms', (0.007, 0.03, 0.02), (mid[0] + sgn * 0.063, mid[1], mid[2] - 0.03), accent if sgn > 0 else gear, rot=(ang, 0, 0), bevel=0)
        a.detail(False)
    a.detail(True)
    a.box('arms', (0.03, 0.035, 0.012), (hL[0] - 0.03, hL[1] + 0.07, hL[2] + 0.03), gear, bevel=0.004)  # wrist GPS
    a.detail(False)
    soldier_variants(a, dict(cloth=cloth, vest=vest, skin=skin, helm=helm, boots=boots, gear=gear, accent=accent, web=web, gog=gog, patch=patch))
    a.marker('eye', (0, -0.1, 1.71), 'head')
    return a


def soldier_variants(a, M):
    """Per-type character kit (the game shows the sets listed in KIT for each soldier type)."""
    cloth, vest, gear, web, gog, accent = M['cloth'], M['vest'], M['gear'], M['web'], M['gog'], M['accent']
    mask = mat('mask', (0.025, 0.027, 0.03), 0.8); gold = mat('gold', (0.8, 0.58, 0.14), 0.3, 0.9); steel = mat('kit_steel', (0.16, 0.17, 0.18), 0.4, 0.8)
    random.seed(7)
    # --- SENTRY: shemagh, sunglasses, shoulder radio, baton and torch on the belt
    a.pivot('acc_guard', (0, 0, 0.93), 'upper'); scarf = mat('scarf', (0.42, 0.35, 0.22), 0.95)
    a.cyl('acc_guard', 0.096, 0.075, (0, 0.0, 1.545), scarf, n=14, bevel=0.02, r2=0.082)
    a.box('acc_guard', (0.15, 0.05, 0.11), (0.02, -0.105, 1.5), scarf, rot=(0.25, 0, 0.15), bevel=0.02)
    a.box('acc_guard', (0.04, 0.035, 0.09), (-0.12, -0.135, 1.44), gear, bevel=0.008); a.limb('acc_guard', (-0.13, -0.13, 1.48), (-0.135, -0.12, 1.6), 0.004, 0.003, gear, n=4)
    a.limb('acc_guard', (-0.215, 0.0, 1.03), (-0.23, 0.04, 0.68), 0.016, 0.014, gear, n=8); a.cyl('acc_guard', 0.022, 0.03, (-0.215, 0.0, 1.03), steel, n=8)
    a.cyl('acc_guard', 0.02, 0.13, (0.2, 0.06, 0.98), steel, n=10, bevel=0.004); a.cyl('acc_guard', 0.027, 0.035, (0.2, 0.06, 0.91), steel, n=10, bevel=0.004)
    a.pivot('acc_shades', (0, 0, 1.6), 'head')
    a.box('acc_shades', (0.155, 0.02, 0.036), (0, -0.1, 1.713), gog, bevel=0.008)
    for sx in (-1, 1):
        a.box('acc_shades', (0.008, 0.09, 0.01), (sx * 0.085, -0.055, 1.715), gear, bevel=0)
    # --- ASSAULT: balaclava, sealed goggles, chest knife, flashbangs
    a.pivot('acc_mask', (0, 0, 1.6), 'head')
    a.box('acc_mask', (0.165, 0.07, 0.1), (0, -0.075, 1.652), mask, bevel=0.03)
    a.box('acc_mask', (0.165, 0.028, 0.055), (0, -0.102, 1.716), gog, bevel=0.014); a.cyl('acc_mask', 0.111, 0.03, (0, 0.0, 1.716), web, n=16, scale=(1, 1.08, 1))
    a.pivot('acc_assault', (0, 0, 0.93), 'upper')
    a.box('acc_assault', (0.03, 0.022, 0.15), (0.045, -0.185, 1.4), gear, rot=(0, 0.35, 0), bevel=0.006); a.box('acc_assault', (0.026, 0.024, 0.06), (0.068, -0.186, 1.47), steel, rot=(0, 0.35, 0), bevel=0.006)
    for sx in (-1, 1):
        a.cyl('acc_assault', 0.028, 0.1, (sx * 0.215, -0.07, 1.05), steel, n=8, bevel=0.006); a.cyl('acc_assault', 0.012, 0.03, (sx * 0.215, -0.07, 1.115), gear, n=6)
    a.tube('acc_assault', [(-0.2, 0.1, 1.05), (-0.24, 0.02, 0.98), (-0.2, -0.06, 0.96), (-0.24, 0.04, 0.9), (-0.2, 0.1, 0.95)], 0.012, web, cyclic=True)  # rope coil
    # --- SNIPER: ghillie strips over shoulders / back, drag bag, rangefinder
    a.pivot('acc_ghillie', (0, 0, 0.93), 'upper'); gb = mat('ghillie_brown', (0.2, 0.15, 0.08), 0.98); gg = mat('ghillie_green', (0.12, 0.19, 0.07), 0.98)
    for k in range(70):
        an = random.uniform(0.35, 2.8) if k % 3 else random.uniform(-0.6, 3.75); z = random.uniform(1.12, 1.52)
        rx, ry = 0.215 + (0.03 if z > 1.38 else 0), 0.155
        a.box('acc_ghillie', (random.uniform(0.02, 0.04), 0.006, random.uniform(0.09, 0.2)), (math.cos(an) * rx, math.sin(an) * ry + 0.02, z - 0.05), (cloth, gb, gg)[k % 3],
              rot=(random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), an + H), bevel=0)
    a.box('acc_ghillie', (0.15, 0.1, 0.78), (0.06, 0.21, 1.22), cloth, rot=(0, 0.12, 0), bevel=0.03); a.cyl('acc_ghillie', 0.045, 0.3, (-0.08, 0.2, 1.08), gb, rot=(0, H, 0), n=8, bevel=0.01)
    a.box('acc_ghillie', (0.09, 0.05, 0.07), (-0.1, -0.165, 1.38), gear, bevel=0.012)
    # --- HEAVY: blast face shield, neck collar, groin plate, ammunition backpack with feed chute
    a.pivot('acc_shield', (0, 0, 1.6), 'head'); sh = mat('shield', (0.02, 0.025, 0.03), 0.15, 0.6)
    a.box('acc_shield', (0.2, 0.03, 0.17), (0, -0.128, 1.69), sh, bevel=0.012); a.box('acc_shield', (0.22, 0.05, 0.03), (0, -0.12, 1.78), vest, bevel=0.01)
    for sx in (-1, 1):
        a.box('acc_shield', (0.03, 0.12, 0.15), (sx * 0.118, -0.06, 1.675), vest, bevel=0.012)
    a.pivot('acc_jugg', (0, 0, 0.93), 'upper'); can = mat('ammo_can', (0.12, 0.13, 0.085), 0.7, 0.3)
    a.cyl('acc_jugg', 0.135, 0.11, (0, 0.005, 1.56), vest, n=14, bevel=0.02, r2=0.115)
    a.box('acc_jugg', (0.2, 0.06, 0.2), (0, -0.115, 0.9), vest, bevel=0.025, taper=(1.3, 1))
    a.box('acc_jugg', (0.34, 0.19, 0.44), (0, 0.245, 1.26), can, bevel=0.03); a.box('acc_jugg', (0.36, 0.2, 0.03), (0, 0.245, 1.4), steel, bevel=0.006); a.box('acc_jugg', (0.36, 0.2, 0.03), (0, 0.245, 1.12), steel, bevel=0.006)
    a.tube('acc_jugg', [(0.15, 0.25, 1.08), (0.3, 0.12, 0.98), (0.31, -0.12, 1.06), (0.14, -0.27, 1.22)], 0.024, steel, bevel_res=2)
    for sx in (-1, 1):
        a.box('acc_jugg', (0.1, 0.16, 0.2), (sx * 0.27, 0.0, 1.3), vest, bevel=0.03)  # upper-arm plates
    # --- ELITE: gas mask with twin filters, slim radio pack with dual antennas, shoulder armour, status LED
    a.pivot('acc_gasmask', (0, 0, 1.6), 'head')
    a.box('acc_gasmask', (0.14, 0.075, 0.11), (0, -0.08, 1.648), mask, bevel=0.03)
    for sx in (-1, 1):
        a.cyl('acc_gasmask', 0.032, 0.05, (sx * 0.065, -0.115, 1.63), steel, rot=(H, 0, sx * 0.5), n=10, bevel=0.004)
    a.cyl('acc_gasmask', 0.018, 0.03, (0, -0.125, 1.64), gear, rot=(H, 0, 0), n=8)
    a.pivot('acc_elite', (0, 0, 0.93), 'upper'); led = mat('elite_led', (0.1, 0.01, 0.01), 0.4, 0, (1, 0.1, 0.05, 4))
    a.box('acc_elite', (0.24, 0.09, 0.32), (0, 0.2, 1.3), gear, bevel=0.025)
    for sx in (-1, 1):
        a.limb('acc_elite', (sx * 0.09, 0.2, 1.46), (sx * 0.11, 0.24, 1.98), 0.006, 0.0025, gear, n=5)
        a.sphere('acc_elite', 0.1, (sx * 0.235, 0, 1.47), gear, scale=(1, 1.1, 0.75), seg=10)
        a.box('acc_elite', (0.07, 0.11, 0.1), (sx * 0.268, 0, 1.36), gear, bevel=0.02)
    a.box('acc_elite', (0.03, 0.008, 0.012), (0.15, -0.146, 1.46), led, bevel=0)
    a.box('acc_elite', (0.11, 0.02, 0.07), (-0.065, -0.2, 1.3), gear, rot=(0.3, 0, 0), bevel=0.008)  # chest-mounted data pad
    # --- COMMANDER: greatcoat skirts and high collar, gold epaulettes, aiguillette, medal bars, cigar
    a.pivot('acc_boss', (0, 0, 0.93), 'upper')
    a.box('acc_boss', (0.38, 0.03, 0.52), (0, 0.135, 0.7), cloth, bevel=0.012, taper=(0.9, 1))
    for sx in (-1, 1):
        a.box('acc_boss', (0.03, 0.22, 0.5), (sx * 0.205, 0.03, 0.71), cloth, bevel=0.012); a.box('acc_boss', (0.13, 0.025, 0.47), (sx * 0.14, -0.118, 0.72), cloth, bevel=0.01)
        a.box('acc_boss', (0.12, 0.15, 0.025), (sx * 0.2, 0, 1.512), gold, bevel=0.008); a.cyl('acc_boss', 0.062, 0.03, (sx * 0.25, 0, 1.495), gold, n=10)
        a.box('acc_boss', (0.02, 0.026, 0.5), (sx * 0.075, -0.132, 0.72), gold, bevel=0)
    a.cyl('acc_boss', 0.1, 0.1, (0, 0.01, 1.56), cloth, n=14, r2=0.125, bevel=0.01)
    a.tube('acc_boss', [(0.19, -0.04, 1.49), (0.17, -0.15, 1.4), (0.1, -0.17, 1.36), (0.04, -0.16, 1.44)], 0.007, gold)
    for r in range(2):
        for c in range(4):
            a.box('acc_boss', (0.022, 0.006, 0.012), (-0.105 + c * 0.026, -0.178, 1.452 + r * 0.016), (gold, accent, steel, accent)[(r + c) % 4], bevel=0)
    a.pivot('acc_cigar', (0, 0, 1.6), 'head')
    a.cyl('acc_cigar', 0.008, 0.075, (0.03, -0.145, 1.642), mat('cigar', (0.2, 0.11, 0.05), 0.9), rot=(H + 0.15, 0, 0.3), n=6)
    a.sphere('acc_cigar', 0.009, (0.041, -0.181, 1.647), mat('ember', (0.3, 0.05, 0.01), 0.5, 0, (1, 0.3, 0.05, 3)), seg=6)


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


# ---------------------------------------------------------------- interiors, port and beach (v0.5)
def interior_props():
    """Furniture / equipment modelled in a unit cube (the game scales each to its collider)."""
    out = []
    st = mat('i_steel', (0.22, 0.23, 0.24), 0.5, 0.7); dk = mat('i_dark', (0.06, 0.065, 0.07), 0.6, 0.4); wh = mat('i_white', (0.7, 0.72, 0.72), 0.5, 0.1)
    grn = mat('i_led_green', (0.2, 1.6, 0.5), 0.4); amb = mat('i_led_amber', (1.8, 1.1, 0.2), 0.4); scr = mat('i_screen', (0.15, 0.9, 0.5), 0.3); ol = mat('i_olive', (0.2, 0.23, 0.14), 0.8, 0.2)
    # desk / lab bench: top, legs, drawer unit, monitor, keyboard
    a = Asm('P_desk')
    a.box('root', (1.0, 1.0, 0.08), (0, 0, 0.46), wh, bevel=0.01, seg=1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            a.box('root', (0.04, 0.08, 0.92), (sx * 0.47, sy * 0.44, -0.04), st, bevel=0.004, seg=1)
    a.box('root', (0.94, 0.06, 0.06), (0, 0.44, -0.3), st, bevel=0.004, seg=1); a.box('root', (0.94, 0.9, 0.04), (0, 0, -0.38), st, bevel=0.004, seg=1)
    a.box('root', (0.22, 0.8, 0.6), (0.33, 0, 0.12), dk, bevel=0.01, seg=1)
    for k in range(3):
        a.box('root', (0.2, 0.82, 0.02), (0.33, 0, -0.05 + k * 0.17), st, bevel=0.002, seg=1)
    out.append(a)
    # server rack: frame, vented door, blade rows with status LEDs
    a = Asm('P_rack')
    a.box('root', (1.0, 0.98, 1.0), (0, 0, 0), dk, bevel=0.006, seg=1)
    for k in range(12):
        z = -0.42 + k * 0.076
        a.box('root', (0.86, 1.0, 0.055), (0, 0, z), st, bevel=0.003, seg=1)
        for sy in (-1, 1):
            a.box('root', (0.05, 0.004, 0.02), (-0.33, sy * 0.502, z), grn if (k * 7 + sy) % 5 else amb, bevel=0, seg=1)
            a.box('root', (0.05, 0.004, 0.02), (-0.24, sy * 0.502, z), grn, bevel=0, seg=1)
    for sx in (-1, 1):
        a.box('root', (0.05, 1.01, 1.0), (sx * 0.475, 0, 0), dk, bevel=0.004, seg=1)
    a.box('root', (1.0, 1.0, 0.04), (0, 0, 0.48), st, bevel=0.004, seg=1)
    out.append(a)
    # tall cabinet / gas-cylinder locker
    a = Asm('P_cabinet'); bl = mat('i_blue', (0.12, 0.2, 0.34), 0.6, 0.3)
    a.box('root', (1.0, 1.0, 1.0), (0, 0, 0), bl, bevel=0.01, seg=1)
    for sx in (-0.25, 0.25):
        a.box('root', (0.46, 0.03, 0.92), (sx, -0.5, 0), bl, bevel=0.006, seg=1); a.box('root', (0.03, 0.05, 0.12), (sx * 0.2, -0.53, 0), st, bevel=0.004, seg=1)
    for k in range(4):
        a.box('root', (0.7, 0.01, 0.02), (0, -0.52, 0.3 + k * 0.04), dk, bevel=0, seg=1)
    a.box('root', (0.3, 0.012, 0.16), (0, -0.52, 0.1), mat('i_hazard', (0.9, 0.7, 0.1), 0.6), bevel=0, seg=1)
    out.append(a)
    # generator: skid, engine housing with louvres, exhaust, control panel
    a = Asm('P_generator')
    a.box('root', (1.0, 0.94, 0.16), (0, 0, -0.42), st, bevel=0.01, seg=1)
    a.box('root', (0.94, 0.9, 0.72), (0, 0, 0.04), ol, bevel=0.03, seg=1)
    for k in range(8):
        a.box('root', (0.36, 0.92, 0.035), (-0.22, 0, -0.2 + k * 0.07), dk, bevel=0.004, seg=1)
    a.box('root', (0.22, 0.02, 0.3), (0.3, -0.46, 0.1), dk, bevel=0.004, seg=1); a.box('root', (0.06, 0.03, 0.04), (0.3, -0.47, 0.18), amb, bevel=0, seg=1)
    a.cyl('root', 0.05, 0.3, (0.3, 0.2, 0.5), st, n=10); a.cyl('root', 0.07, 0.08, (0.3, 0.2, 0.46), st, n=10)
    a.cyl('root', 0.16, 0.5, (-0.1, 0, 0.44), st, rot=(0, H, 0), n=12, bevel=0.01)
    out.append(a)
    # fuel tank: horizontal cylinder on saddles with ladder and hatch
    a = Asm('P_tank'); tw = mat('i_tank', (0.75, 0.76, 0.74), 0.5, 0.2)
    a.cyl('root', 0.42, 0.9, (0, 0, 0.05), tw, rot=(H, 0, 0), n=20, bevel=0.03)
    for sy in (-0.45, 0.45):
        a.sphere('root', 0.42, (0, sy, 0.05), tw, scale=(1, 0.25, 1), seg=16)
    for sy in (-0.28, 0.28):
        a.box('root', (0.7, 0.1, 0.4), (0, sy, -0.3), st, bevel=0.01, seg=1)
    a.cyl('root', 0.1, 0.08, (0, 0, 0.5), st, n=12)
    for k in range(6):
        a.limb('root', (0.4, -0.05, -0.45 + k * 0.17), (0.4, 0.07, -0.45 + k * 0.17), 0.01, 0.01, st, n=4)
    a.box('root', (0.02, 0.5, 0.2), (0.43, 0, 0.1), mat('i_hazard', (0.9, 0.7, 0.1), 0.6), bevel=0, seg=1)
    out.append(a)
    # operator console: sloped desk with screens and keys
    a = Asm('P_console')
    a.box('root', (1.0, 0.9, 0.6), (0, 0.05, -0.2), st, bevel=0.01, seg=1)
    a.box('root', (0.96, 0.5, 0.06), (0, -0.2, 0.14), dk, rot=(0.35, 0, 0), bevel=0.006, seg=1)
    a.box('root', (0.96, 0.1, 0.4), (0, 0.38, 0.3), dk, bevel=0.01, seg=1)
    for sx in (-0.3, 0.02, 0.33):
        a.box('root', (0.28, 0.012, 0.28), (sx, 0.325, 0.3), scr, bevel=0, seg=1)
    for k in range(10):
        a.box('root', (0.05, 0.03, 0.012), (-0.4 + k * 0.088, -0.25, 0.165), wh if k % 3 else amb, rot=(0.35, 0, 0), bevel=0, seg=1)
    out.append(a)
    # bunk bed
    a = Asm('P_bunk'); blanket = mat('i_blanket', (0.2, 0.24, 0.16), 0.95)
    for sx in (-1, 1):
        for sy in (-1, 1):
            a.box('root', (0.03, 0.06, 1.0), (sx * 0.48, sy * 0.46, 0), st, bevel=0.003, seg=1)
    for z in (-0.25, 0.3):
        a.box('root', (0.96, 0.94, 0.05), (0, 0, z), st, bevel=0.004, seg=1); a.box('root', (0.92, 0.88, 0.16), (0, 0, z + 0.1), blanket, bevel=0.03, seg=1)
        a.box('root', (0.18, 0.7, 0.1), (-0.36, 0, z + 0.2), wh, bevel=0.03, seg=1)
    out.append(a)
    # ammo crate with handles and latches
    a = Asm('P_ammo')
    a.box('root', (1.0, 1.0, 0.8), (0, 0, -0.1), ol, bevel=0.02, seg=1); a.box('root', (1.02, 1.02, 0.2), (0, 0, 0.4), ol, bevel=0.02, seg=1)
    for sx in (-0.3, 0.3):
        a.box('root', (0.06, 0.03, 0.2), (sx, -0.51, 0.22), st, bevel=0.004, seg=1)
    for sx in (-1, 1):
        a.box('root', (0.03, 0.4, 0.06), (sx * 0.52, 0, 0.1), dk, bevel=0.006, seg=1)
    a.box('root', (0.5, 0.012, 0.16), (0, -0.505, -0.1), mat('i_stencil', (0.75, 0.72, 0.4), 0.7), bevel=0, seg=1)
    out.append(a)
    # concrete jersey barrier
    a = Asm('P_barrier'); cc = mat('i_conc', (0.5, 0.5, 0.47), 0.92)
    a.box('root', (1.0, 1.0, 0.25), (0, 0, -0.375), cc, bevel=0.02, seg=1)
    a.box('root', (1.0, 0.7, 0.75), (0, 0, 0.125), cc, bevel=0.03, taper=(1, 0.35), seg=1)
    for sx in (-0.3, 0.3):
        a.box('root', (0.22, 0.72, 0.1), (sx, 0, -0.1), mat('i_hazred', (0.6, 0.08, 0.05), 0.7), rot=(0, 0.6, 0), bevel=0, seg=1)
    out.append(a)
    return out


def hedgehog():
    """Czech hedgehog anti-landing obstacle (three crossed I-beams), ~1.6 m."""
    a = Asm('Hedgehog'); r = mat('hedgehog_rust', (0.3, 0.16, 0.1), 0.85, 0.3)
    for rot in ((0.62, 0, 0.0), (0.62, 0, 2.09), (0.62, 0, 4.19)):
        a.box('root', (0.14, 0.14, 2.0), (0, 0, 0.72), r, rot=rot, bevel=0.01, seg=1)
        a.box('root', (0.22, 0.03, 2.0), (0, 0, 0.72), r, rot=rot, bevel=0.004, seg=1)
    a.cyl('root', 0.2, 0.12, (0, 0, 0.72), r, n=8)
    return a


def crane():
    """Port tower crane: 18 m lattice mast, 26 m jib towards +Y (the water side in game), counter-jib, cab, hook."""
    a = Asm('Crane')
    yl = mat('crane_yellow', (0.75, 0.52, 0.08), 0.6, 0.3); st = mat('crane_steel', (0.12, 0.125, 0.13), 0.5, 0.7); gl = mat('crane_glass', (0.06, 0.1, 0.13), 0.1, 0.6); cw = mat('crane_cw', (0.4, 0.4, 0.38), 0.9)
    w = 0.6
    cs = [(-w, -w), (w, -w), (w, w), (-w, w)]
    for x, y in cs:
        a.limb('root', (x, y, 0), (x, y, 18.0), 0.07, 0.07, yl, n=6)
    for s in range(9):
        z0, z1 = s * 2.0, s * 2.0 + 2.0
        for i in range(4):
            (x0, y0), (x1, y1) = cs[i], cs[(i + 1) % 4]
            a.limb('root', (x0, y0, z1), (x1, y1, z1), 0.03, 0.03, yl, n=4)
            a.limb('root', (x0, y0, z0), (x1, y1, z1), 0.025, 0.025, yl, n=4)
    a.box('root', (2.4, 2.4, 0.5), (0, 0, 0.25), cw, bevel=0.04, seg=1)
    a.cyl('root', 0.9, 0.5, (0, 0, 18.25), st, n=16, bevel=0.03)
    a.box('root', (1.3, 1.5, 1.5), (1.0, 0.3, 17.6), yl, bevel=0.06, seg=1); a.box('root', (1.32, 1.0, 0.8), (1.0, 0.75, 17.8), gl, bevel=0.03, seg=1)  # cab
    # jib (triangular truss) from y=-5 to y=21
    for (x, z) in ((-0.5, 18.6), (0.5, 18.6), (0.0, 19.6)):
        a.limb('root', (x, -5.0, z), (x, 21.0, z), 0.05, 0.05, yl, n=6)
    for k in range(13):
        y0, y1 = -5.0 + k * 2.0, -3.0 + k * 2.0
        a.limb('root', (-0.5, y0, 18.6), (0.0, y1, 19.6), 0.022, 0.022, yl, n=4); a.limb('root', (0.5, y0, 18.6), (0.0, y1, 19.6), 0.022, 0.022, yl, n=4)
        a.limb('root', (-0.5, y1, 18.6), (0.5, y1, 18.6), 0.022, 0.022, yl, n=4)
    a.limb('root', (0, 0, 18.5), (0, 0, 23.0), 0.09, 0.07, yl, n=6)  # tower head
    a.limb('root', (0, 0, 23.0), (0, 14.0, 19.6), 0.02, 0.02, st, n=4); a.limb('root', (0, 0, 23.0), (0, -4.5, 19.6), 0.02, 0.02, st, n=4)  # pendants
    a.box('root', (1.4, 1.6, 1.3), (0, -4.2, 18.0), cw, bevel=0.04, seg=1)  # counterweight
    a.box('root', (0.8, 0.9, 0.35), (0, 15.0, 18.4), st, bevel=0.03, seg=1)  # trolley
    a.limb('root', (0, 15.0, 18.3), (0, 15.0, 9.0), 0.012, 0.012, st, n=4); a.box('root', (0.3, 0.3, 0.5), (0, 15.0, 8.8), st, bevel=0.04, seg=1)
    return a


def cargo_ship():
    """96 m coastal freighter. Bow at -Y, superstructure aft (+Y). Origin: keel centre; deck at z=9."""
    a = Asm('CargoShip')
    hull = mat('ship_hull', (0.06, 0.07, 0.09), 0.6, 0.3); red = mat('ship_red', (0.4, 0.07, 0.05), 0.7, 0.2); deck = mat('ship_deck', (0.2, 0.25, 0.2), 0.85); wh = mat('ship_white', (0.72, 0.74, 0.73), 0.55, 0.1)
    gl = mat('ship_glass', (0.04, 0.07, 0.09), 0.1, 0.6); st = mat('ship_steel', (0.2, 0.21, 0.22), 0.5, 0.6)
    secs = [(-48.0, 0.3, 4.5), (-43.0, 4.5, 1.5), (-36.0, 8.6, 0.3), (-20.0, 10.0, 0.0), (36.0, 10.0, 0.0), (46.0, 8.8, 0.8), (48.0, 7.0, 2.5)]
    for z0, z1, m, wk in ((0.0, 3.2, red, 0.86), (3.2, 9.0, hull, 1.0)):  # boot-topping band + topsides
        verts, faces = [], []
        for y, hw, rise in secs:
            lo = max(z0, rise) if z0 == 0.0 else z0
            verts += [(-hw * (wk if z0 == 0 else 1), y, z1 if z0 else 3.2), (-hw * wk * (0.55 if z0 == 0 else 1.0), y, lo), (hw * wk * (0.55 if z0 == 0 else 1.0), y, lo), (hw * (wk if z0 == 0 else 1), y, z1 if z0 else 3.2)]
        for i in range(len(secs) - 1):
            for j in range(3):
                p = i * 4 + j; faces.append((p, p + 1, p + 5, p + 4))
        faces.append((0, 1, 2, 3)); n = len(secs) * 4; faces.append((n - 4, n - 3, n - 2, n - 1))
        a.mesh('root', verts, faces, m, smooth=0.6)
    dv = [(-hw, y, 9.0) for y, hw, _ in secs] + [(hw, y, 9.0) for y, hw, _ in reversed(secs)]
    a.mesh('root', dv, [tuple(range(len(dv)))], deck, smooth=0.3)
    for sx in (-1, 1):  # bulwarks
        a.tube('root', [(sx * hw * 0.99, y, 9.6) for y, hw, _ in secs], 0.12, hull, res=2, bevel_res=1)
    for k in range(4):  # hatch coamings forward of the house
        a.box('root', (13.0, 12.0, 1.2), (0, -34.0 + k * 14.5, 9.6), st, bevel=0.08, seg=1)
    # superstructure aft
    a.box('root', (16.0, 16.0, 3.4), (0, 33.0, 10.7), wh, bevel=0.1, seg=1); a.box('root', (15.0, 13.0, 3.2), (0, 33.5, 14.0), wh, bevel=0.1, seg=1); a.box('root', (17.5, 8.0, 3.0), (0, 31.5, 17.1), wh, bevel=0.1, seg=1)
    a.box('root', (17.6, 0.1, 1.3), (0, 27.46, 17.5), gl, bevel=0.0, seg=1)  # bridge windows
    for z in (11.2, 14.4):
        for k in range(7):
            a.box('root', (0.9, 0.08, 0.7), (-6.0 + k * 2.0, 25.0 if z < 12 else 26.96, z), gl, bevel=0.0, seg=1)
    a.cyl('root', 1.6, 5.0, (0, 37.5, 21.0), red, n=16, bevel=0.1, scale=(1, 1.5, 1)); a.cyl('root', 1.65, 0.8, (0, 37.5, 22.6), hull, n=16, scale=(1, 1.5, 1))  # funnel
    a.limb('root', (0, 31.0, 18.6), (0, 31.0, 25.0), 0.15, 0.08, wh, n=8); a.box('root', (5.0, 0.15, 0.15), (0, 31.0, 23.5), wh, bevel=0.02, seg=1)  # mast + yard
    a.cyl('root', 0.6, 0.25, (0, 31.0, 22.0), wh, n=12)
    for y in (-27.0, 2.0):  # deck cranes
        a.limb('root', (0, y, 9.0), (0, y, 19.0), 0.6, 0.45, wh, n=10); a.limb('root', (0, y, 18.0), (0, y - 12.0, 22.0), 0.3, 0.15, wh, n=8); a.box('root', (1.6, 1.6, 1.4), (0, y, 19.5), wh, bevel=0.08, seg=1)
    for sx in (-1, 1):  # lifeboats, anchors
        a.sphere('root', 1.0, (sx * 8.6, 36.0, 15.2), mat('ship_orange', (0.85, 0.3, 0.05), 0.6), scale=(0.8, 2.6, 0.9), seg=12)
        a.box('root', (0.2, 1.4, 1.8), (sx * 5.2, -44.5, 6.4), st, bevel=0.03, seg=1)
    a.limb('root', (0, -46.5, 9.0), (0, -46.5, 13.0), 0.12, 0.08, wh, n=6)  # jackstaff
    return a


# ---------------------------------------------------------------- structures (v0.6)
def structure_props():
    """Unit-cube structure pieces: cliff rock, chain-link fence panel, blast door, window frame, sample pedestal."""
    out = []
    st = mat('s_steel', (0.2, 0.21, 0.22), 0.5, 0.7); dk = mat('s_dark', (0.07, 0.075, 0.08), 0.6, 0.5); hz = mat('s_hazard', (0.9, 0.68, 0.08), 0.6); gal = mat('s_galv', (0.42, 0.44, 0.45), 0.45, 0.8)
    # cliff / boulder block: fills most of the cube so the box collider still matches
    a = Asm('P_cliff'); rk = mat('s_rock', (0.27, 0.26, 0.24), 0.96); rk2 = mat('s_rock_dark', (0.2, 0.2, 0.19), 0.96)
    a.box('root', (0.84, 0.84, 0.94), (0, 0, -0.02), rk, bevel=0.06, seg=1, taper=(0.9, 0.9))
    a.ico('root', 1.0, (0, 0, 0.0), rk, scale=(0.64, 0.64, 0.6), sub=3, displace=(0.3, 0.4), decimate=0.5, smooth=0.3)
    for (x, y, z, r) in ((0.3, 0.3, 0.2, 0.3), (-0.3, -0.28, 0.25, 0.28), (-0.32, 0.3, -0.05, 0.3), (0.3, -0.3, 0.0, 0.3), (0, 0, 0.36, 0.34)):
        a.ico('root', 1.0, (x, y, z), rk2 if z < 0.1 else rk, scale=(r, r, r * 0.8), sub=2, displace=(0.3, 0.5), decimate=0.5, smooth=0.3)
    a.ico('root', 1.0, (0.2, -0.18, -0.22), rk2, scale=(0.36, 0.36, 0.3), sub=2, displace=(0.25, 0.5), decimate=0.5, smooth=0.4)
    a.ico('root', 1.0, (-0.22, 0.2, -0.3), rk2, scale=(0.32, 0.34, 0.22), sub=2, displace=(0.25, 0.5), decimate=0.5, smooth=0.4)
    out.append(a)
    # chain-link fence panel (long axis X): posts, rails, diagonal mesh, barbed-wire outriggers
    a = Asm('P_fence')
    for sx in (-1, 1):
        a.box('root', (0.028, 0.6, 0.9), (sx * 0.486, 0, -0.05), gal, bevel=0.003, seg=1)
        a.box('root', (0.022, 0.5, 0.14), (sx * 0.486, -0.35, 0.43), gal, rot=(0.6, 0, 0), bevel=0.002, seg=1)
    for z in (-0.47, 0.38):
        a.box('root', (1.0, 0.4, 0.018), (0, 0, z), gal, bevel=0.002, seg=1)
    n = 14
    for k in range(-n, n + 1):
        x0 = k / n
        for d in (-1, 1):
            p0 = [x0, 0, -0.47]; p1 = [x0 + d * 0.85, 0, 0.38]
            for p, q in ((p0, p1), (p1, p0)):  # clip the segment to the panel
                if p[0] < -0.5: t = (-0.5 - p[0]) / (q[0] - p[0]); p[2] += t * (q[2] - p[2]); p[0] = -0.5
                if p[0] > 0.5: t = (0.5 - p[0]) / (q[0] - p[0]); p[2] += t * (q[2] - p[2]); p[0] = 0.5
            if abs(p0[0] - p1[0]) > 0.02:
                a.limb('root', tuple(p0), tuple(p1), 0.0035, 0.0035, gal, n=3)
    for k in range(3):
        a.limb('root', (-0.5, -0.2 - k * 0.14, 0.4 + k * 0.035), (0.5, -0.2 - k * 0.14, 0.4 + k * 0.035), 0.004, 0.004, dk, n=3)
    out.append(a)
    # blast door (long axis X, thin Y): two leaves, hazard band, wheel lock on both faces
    a = Asm('P_door'); rd = mat('s_door', (0.3, 0.17, 0.11), 0.7, 0.5)
    a.box('root', (1.0, 0.7, 1.0), (0, 0, 0), rd, bevel=0.006, seg=1)
    a.box('root', (0.012, 0.76, 1.0), (0, 0, 0), dk, bevel=0, seg=1)
    for sx in (-1, 1):
        a.box('root', (0.05, 1.0, 1.0), (sx * 0.475, 0, 0), st, bevel=0.004, seg=1)
        for z in (-0.3, 0.32):
            a.box('root', (0.4, 0.9, 0.05), (sx * 0.24, 0, z), st, bevel=0.004, seg=1)
    for z in (-0.47, 0.47):
        a.box('root', (1.0, 1.0, 0.06), (0, 0, z), st, bevel=0.004, seg=1)
    for k in range(10):
        a.box('root', (0.05, 0.8, 0.09), (-0.45 + k * 0.1, 0, -0.06), hz if k % 2 else dk, bevel=0, seg=1, shear=0.0)
    for sy in (-1, 1):
        a.cyl('root', 0.07, 0.12, (0.12, sy * 0.5, 0.1), st, rot=(H, 0, 0), n=14, scale=(1, 1, 1))
        a.cyl('root', 0.025, 0.2, (0.12, sy * 0.5, 0.1), dk, rot=(H, 0, 0), n=8)
        a.box('root', (0.1, 0.06, 0.07), (-0.2, sy * 0.5, 0.1), mat('s_led_red', (1.8, 0.15, 0.1), 0.4), bevel=0, seg=1)
    out.append(a)
    # window frame (the breakable glass pane stays a separate game object)
    a = Asm('P_window'); fr = mat('s_frame', (0.12, 0.125, 0.13), 0.5, 0.6)
    for sx in (-1, 1):
        a.box('root', (0.03, 1.0, 1.0), (sx * 0.485, 0, 0), fr, bevel=0.003, seg=1)
    for z in (-0.48, 0.48):
        a.box('root', (1.0, 1.0, 0.04), (0, 0, z), fr, bevel=0.003, seg=1)
    a.box('root', (0.016, 0.9, 0.92), (0, 0, 0), fr, bevel=0.002, seg=1)
    a.box('root', (1.0, 1.4, 0.025), (0, 0, -0.5 + 0.0125), fr, bevel=0.002, seg=1)  # sill
    out.append(a)
    # bio-sample containment pedestal
    a = Asm('P_pedestal'); wh = mat('s_white', (0.72, 0.74, 0.74), 0.4, 0.2)
    a.box('root', (1.0, 1.0, 0.18), (0, 0, -0.41), st, bevel=0.02, seg=1)
    a.cyl('root', 0.36, 0.56, (0, 0, -0.04), wh, n=20, bevel=0.02)
    a.cyl('root', 0.44, 0.1, (0, 0, 0.29), st, n=20, bevel=0.015)
    a.cyl('root', 0.3, 0.16, (0, 0, 0.42), dk, n=20, bevel=0.01)
    for k in range(8):
        an = k * math.pi / 4
        a.box('root', (0.07, 0.02, 0.3), (math.cos(an) * 0.37, math.sin(an) * 0.37, -0.05), hz if k % 2 else dk, rot=(0, 0, an + H), bevel=0, seg=1)
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        a.cyl('root', 0.05, 0.3, (sx * 0.42, sy * 0.42, -0.2), st, n=8)
    a.box('root', (0.2, 0.02, 0.1), (0, -0.5, -0.41), mat('s_led_green', (0.2, 1.6, 0.5), 0.4), bevel=0, seg=1)
    out.append(a)
    return out


def flagpole():
    """11 m flagpole on a stepped concrete plinth with a hanging flag."""
    a = Asm('Flagpole'); c = mat('f_conc', (0.44, 0.44, 0.42), 0.92); al = mat('f_alu', (0.6, 0.62, 0.63), 0.35, 0.85); fl = mat('f_flag', (0.5, 0.06, 0.05), 0.9); fl2 = mat('f_flag_dark', (0.05, 0.05, 0.05), 0.9)
    a.box('root', (3.0, 3.0, 0.2), (0, 0, 0.1), c, bevel=0.03, seg=1); a.box('root', (1.4, 1.4, 0.3), (0, 0, 0.35), c, bevel=0.03, seg=1)
    a.cyl('root', 0.2, 0.25, (0, 0, 0.62), al, n=12, bevel=0.02)
    a.limb('root', (0, 0, 0.5), (0, 0, 11.0), 0.11, 0.06, al, n=12)
    a.sphere('root', 0.13, (0, 0, 11.08), mat('f_gold', (0.8, 0.6, 0.15), 0.3, 0.9), seg=10)
    a.limb('root', (0.1, 0, 1.2), (0.1, 0, 10.8), 0.008, 0.008, fl2, n=4)
    nx, w, h = 9, 2.6, 1.6; verts = []; faces = []
    for i in range(nx + 1):
        u = i / nx; sag = 0.35 * u * u; wave = 0.12 * math.sin(u * 7.0) * u
        for z in (0.0, 0.5, 1.0):
            verts.append((0.12 + u * w * 0.85, wave + 0.04 * math.sin(z * 3 + u * 5) * u, 10.7 - sag - z * h * (1 - 0.06 * u)))
    for i in range(nx):
        for j in range(2):
            p = i * 3 + j; faces.append((p, p + 3, p + 4, p + 1))
    a.mesh('root', verts, faces, fl, smooth=1.0, solidify=0.015)
    a.box('root', (0.02, 0.05, 0.06), (0.08, 0, 10.68), al, bevel=0, seg=1); a.box('root', (0.02, 0.05, 0.06), (0.08, 0, 9.12), al, bevel=0, seg=1)
    return a


def tower_cab():
    """Control-tower cab dressing (origin = cab floor centre): sill, mullions, catwalk with railing, roof, antennas, beacon.
    The glass itself is a transparent box in the game."""
    a = Asm('TowerCab'); fr = mat('t_frame', (0.1, 0.105, 0.11), 0.5, 0.6); wh = mat('t_white', (0.68, 0.69, 0.68), 0.6, 0.1); rf = mat('t_roof', (0.16, 0.17, 0.17), 0.6, 0.4); bc = mat('t_beacon', (2.2, 0.15, 0.1), 0.3)
    a.box('root', (10.8, 10.8, 0.22), (0, 0, -0.11), rf, bevel=0.03, seg=1)  # catwalk slab
    a.box('root', (9.16, 9.16, 0.7), (0, 0, 0.35), wh, bevel=0.03, seg=1)  # sill band
    for i in range(4):
        an = i * H; c, s = math.cos(an), math.sin(an)
        for k in range(7):
            t = -4.5 + k * 1.5
            a.box('root', (0.14, 0.14, 2.4), (c * 4.55 - s * t, s * 4.55 + c * t, 1.85), fr, rot=(0, 0, an), bevel=0.01, seg=1)
        a.box('root', (0.12, 9.2, 0.12), (c * 4.55, s * 4.55, 2.95), fr, rot=(0, 0, an), bevel=0.01, seg=1)
        # railing
        a.limb('root', (c * 5.3 - s * -5.3, s * 5.3 + c * -5.3, 1.05), (c * 5.3 - s * 5.3, s * 5.3 + c * 5.3, 1.05), 0.03, 0.03, fr, n=6)
        a.limb('root', (c * 5.3 - s * -5.3, s * 5.3 + c * -5.3, 0.55), (c * 5.3 - s * 5.3, s * 5.3 + c * 5.3, 0.55), 0.02, 0.02, fr, n=5)
        for k in range(8):
            t = -5.3 + k * 1.514
            a.limb('root', (c * 5.3 - s * t, s * 5.3 + c * t, 0.0), (c * 5.3 - s * t, s * 5.3 + c * t, 1.05), 0.025, 0.025, fr, n=5)
    a.box('root', (10.4, 10.4, 0.35), (0, 0, 3.2), rf, bevel=0.05, seg=1); a.box('root', (9.0, 9.0, 0.2), (0, 0, 3.45), wh, bevel=0.04, seg=1)
    a.limb('root', (2.5, 2.5, 3.5), (2.5, 2.5, 8.0), 0.05, 0.02, fr, n=6); a.limb('root', (-3, 2, 3.5), (-3, 2, 6.2), 0.035, 0.015, fr, n=6); a.limb('root', (-2.6, -3, 3.5), (-2.6, -3, 5.4), 0.03, 0.015, fr, n=6)
    a.cyl('root', 0.18, 0.35, (2.5, 2.5, 8.1), bc, n=10)
    a.cyl('root', 0.5, 0.5, (0, 0, 3.8), wh, n=14, bevel=0.03); a.box('root', (3.2, 0.25, 0.5), (0, 0, 4.4), wh, bevel=0.05, seg=1)  # surveillance radar bar
    a.box('root', (1.6, 1.2, 0.9), (-2.5, -1.5, 4.0), wh, bevel=0.05, seg=1)  # HVAC unit
    for k in range(5):
        a.box('root', (1.3, 0.02, 0.06), (-2.5, -2.11, 3.75 + k * 0.14), fr, bevel=0, seg=1)
    return a


def pier():
    """Concrete cargo pier 60 x 22 m (origin = deck underside centre): deck, kerbs, piles, cross-beams, bollards, tyre fenders."""
    a = Asm('Pier'); c = mat('p_conc', (0.4, 0.4, 0.38), 0.93); c2 = mat('p_conc_dark', (0.27, 0.27, 0.26), 0.95); ir = mat('p_iron', (0.08, 0.08, 0.085), 0.6, 0.6); yl = mat('p_yellow', (0.8, 0.6, 0.08), 0.7); rb = mat('p_rubber', (0.03, 0.03, 0.03), 0.95)
    a.box('root', (60.0, 22.0, 0.6), (0, 0, 0.3), c, bevel=0.04, seg=1)
    for k in range(12):
        a.box('root', (0.05, 21.6, 0.02), (-27.5 + k * 5.0, 0, 0.6), c2, bevel=0, seg=1)  # expansion joints
    for sy in (-1, 1):
        a.box('root', (60.0, 0.4, 0.25), (0, sy * 10.8, 0.72), c2, bevel=0.03, seg=1)  # kerb
        a.box('root', (60.0, 0.25, 0.012), (0, sy * 10.2, 0.605), yl, bevel=0, seg=1)
        for k in range(7):
            x = -27 + k * 9.0
            a.cyl('root', 0.22, 0.5, (x, sy * 9.6, 0.85), ir, n=10, bevel=0.02); a.cyl('root', 0.32, 0.12, (x, sy * 9.6, 1.14), ir, n=10, bevel=0.02)  # bollards
            a.cyl('root', 0.55, 0.3, (x + 4.5, sy * 11.1, -0.2), rb, rot=(H, 0, 0), n=14, bevel=0.05)  # tyre fenders
            a.limb('root', (x + 4.5, sy * 10.9, 0.6), (x + 4.5, sy * 11.1, 0.3), 0.02, 0.02, ir, n=4)
    for sx in (-1, 1):
        a.box('root', (0.4, 22.0, 0.25), (sx * 29.8, 0, 0.72), c2, bevel=0.03, seg=1)
    for k in range(9):
        x = -28 + k * 7.0
        a.box('root', (0.9, 21.0, 0.7), (x, 0, -0.35), c2, bevel=0.03, seg=1)  # cross-beam
        for y in (-9.0, 0.0, 9.0):
            a.cyl('root', 0.45, 8.0, (x, y, -4.6), c2, n=10)  # piles
    return a
