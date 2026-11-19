---
name: free-asset-pipeline
description: Find, license-check, download, convert and integrate free (CC0 first) game assets and open-source game code into a game in this repo, then prove it works in the running game. Use when a game session is asked to raise art/audio/animation quality with free assets, add models, textures, HDRIs, sounds, icons or animations, or adopt code from a GitHub game project.
---

# Free asset + open-source integration pipeline

Goal: AAA-leaning visuals, animation and sound **at zero asset cost**, applied to the real game and verified in it.
A list of links is not the deliverable; an asset that is downloaded, licensed, converted, wired in and seen working is.

Full source catalog with verification status: [`docs/game-dev/FREE_ASSET_SOURCES.md`](../../../docs/game-dev/FREE_ASSET_SOURCES.md).
How the game sessions split the work and hand off: [`docs/game-dev/STUDIO_HUB.md`](../../../docs/game-dev/STUDIO_HUB.md).

## 0. Ground rules (read first)

1. **Detect the project's engine and keep it** (UE5 `.uproject`, Unity `ProjectSettings/ProjectVersion.txt`, web `package.json`). SPECIAL SOLDIER is Three.js + Vite with a Blender 5.3 pipeline, not UE5
   (`apps/special-soldier/docs/adr/0001-web-engine.md`). The UE5 items below (Nanite, Lumen, GAS, Lyra, Fab, MetaSounds)
   apply only to a project that already has a `.uproject`. For a web game, use the web equivalents in §4.
2. **Never report unverified work as done.** If a download, login, conversion or test did not happen, say so and find an alternative.
3. **Reuse what exists.** Read the project's docs (`README.md`, `docs/ASSET_LIST.md`, `docs/BLENDER.md`) and extend its systems
   instead of building parallel ones. Keep node names the game looks up (see `BLENDER.md` "게임이 찾는 노드 이름").
4. **One art direction.** Mixed creators' assets must be normalized: scale (metres), pivot (ground centre), palette, roughness range,
   texel density, poly budget. Reject an asset that cannot be made to match rather than shipping a style clash.
5. **Budgets are measured, not guessed.** Record tris, draw calls, texture MB, bundle size and FPS before and after.

## 1. License gate (blocks every download)

| Priority | License | Commercial build |
|---|---|---|
| 1 | CC0 / public domain | yes |
| 2 | Explicit commercial-OK license (MIT, Apache-2.0, Kenney, Quaternius, Mixamo terms, Fab Standard) | yes, follow its terms |
| 3 | CC-BY 3.0/4.0 | yes, only with attribution recorded in the ledger and shown in credits |
| — | CC-BY-NC, CC-BY-ND (if modified), "free for personal use", no license, unknown origin, ripped game assets | **no** |

- Record the license **from the asset's own page at download time**, not from a site's general reputation (Sketchfab, itch.io,
  OpenGameArt, Freesound and Fab are per-asset).
- GitHub code: read `LICENSE`; a repo with no license is all-rights-reserved — read it for ideas only, do not copy code.
- Never re-host or resell raw source assets outside the game build.
- Unity Asset Store assets (Standard EULA / Unity Companion License) may be used in a game but **must not be committed to this public repo**;
  record them in the ledger and fetch them on each machine through the Package Manager.
- Unity projects: load the Unity plugin skills (`unity:unity-cli`, `unity:new-unity-project`, ...) and import shared Blender GLBs with glTFast.

## 2. Ledger files (create in the game folder, update on every asset)

`docs/ASSET_LICENSES.md`, `docs/ASSET_SOURCES.md`, `docs/THIRD_PARTY_NOTICES.md`, `docs/GITHUB_DEPENDENCIES.md`.
One row per asset: name · source URL · author · license (+ URL) · download date · file + SHA-256 · where used in the game.
SPECIAL SOLDIER already keeps `src/assets/tex/CREDITS.txt`; keep it and link it from the ledger.

## 3. Pipeline (each step leaves evidence)

1. **Inventory** — list what the game needs by priority (characters → environment → weapons/props → VFX → audio → UI),
   marking what is placeholder today (`docs/ASSET_LIST.md`).
2. **Shortlist** 30–50 candidates from the catalog; prefer sources with an API or direct file URL (Poly Haven, ambientCG) so the
   download is scripted and repeatable (`tools/assets/` script, not a manual click).
3. **Gate** — license check (§1), file format, poly count, texture size, rig/skeleton.
4. **Download** from the official source only; store SHA-256; never commit huge raw packs — commit the optimized game file.
5. **Convert** — Blender 5.3 headless (`blender --background --python ...` or `bpy==5.3.0`) for FBX/OBJ → GLB, apply transforms,
   +Y up, metres, rename nodes to the game's names, decimate/LOD, bake or resize textures (web: 512–2K JPEG/KTX2; UE5: 2K–8K).
6. **Integrate** into the game code (loader, materials, colliders, LOD distances) and keep fallbacks.
7. **Test in the running game** — the project's own tests (`npm test`, `npm run test:e2e`) plus before/after screenshots.
8. **Measure** perf and size; roll back an asset that breaks the budget.
9. **Document** — ledger rows, `docs/BLENDER.md`/changelog section, honest limits.
10. Commit on the project's branch with the ledger in the same commit as the asset.

Start with ~10 verified assets applied end to end, then widen.

## 4. Engine mapping

| Need | UE5 project | Unity 6.3 LTS project | Web game (Three.js) |
|---|---|---|---|
| Dense meshes | Nanite | LODGroup, GPU Resident Drawer | Blender decimate + `__d` LOD children, instancing |
| GI / reflections | Lumen | URP/HDRP APV light probes, reflection probes, HDRI skybox | Poly Haven HDRI → PMREM env map, baked AO (vertex colour) |
| Materials | PBR 4K–8K, virtual textures | URP Lit, 2K–4K, platform texture compression | PBR 1K–2K, KTX2/Basis compression |
| VFX | Niagara | VFX Graph / Particle System | GPU sprite/mesh particles in the existing pool |
| Audio | MetaSounds | AudioMixer (see `unity:audio-setup-mixers`) | WebAudio buffers (OGG/MP3), existing mixer |
| Characters | Skeletal mesh, retarget, Motion Matching | Humanoid Avatar + Mecanim retarget (Rokoko/Mixamo/Quaternius FBX) | Rigged GLB + `AnimationMixer`; Mixamo/Quaternius clips retargeted in Blender |
| Abilities | GAS (see GASDocumentation) | project C# systems / ScriptableObjects | existing game systems in `src/game/` |

## 5. Things that need a person or the PC

- Mixamo (Adobe login), Sketchfab/Fab/itch.io downloads (login, per-asset license click), Freesound (account for originals),
  Sonniss GDC bundle (large manual download): run these in a session on the user's PC with the Chrome extension, or ask the user.
- Unity Editor work (install, Unity ID login, licence, Editor control via Unity CLI): the PC session "Unity 설치 · 게임 개발 연동" (`docs/game-dev/UNITY_SETUP.md`).
- Blender GUI checks and Windows builds: the PC session (`C:\Program Files\Blender Foundation\Blender 5.3\blender.exe`).
- Cloud sessions reached Poly Haven and ambientCG (open APIs), OpenGameArt, game-icons.net and quaternius.com on 2026-11-19;
  kenney.nl, freesound.org, sonniss.com and github.com web pages were blocked (GitHub is reachable through `gh api search/*`).
