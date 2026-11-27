# robot-platform

This repo holds several projects. Read the part that matches your task.

## Game development (apps/special-soldier, apps/unity-studio)

- Work branch: `claude/relaxed-ramanujan-83okpi`. Pull before you start, push when you finish.
- New PC or missing tools: `docs/game-dev/NEW_PC_SETUP.md` and `tools/dev-env/setup.ps1` (check-only by default).
  macOS / Linux: `apps/special-soldier/scripts/setup.sh`; no install at all: GitHub Codespaces (`.devcontainer/`).
  Rebuild the Blender assets on any OS with `npm run assets` in `apps/special-soldier` (uses `BLENDER_EXE`, then the default install, then `bpy`).
- Tool versions are pinned in `tools/dev-env/versions.json`. Find Blender and Unity through `tools/dev-env/find-tools.ps1`
  (or the `BLENDER_EXE` / `UNITY_EDITOR` environment variables). Never hard-code a PC-specific path.
- Where everything stands and how to resume on another PC: `docs/game-dev/HANDOFF.md`. Who does what across sessions and PCs: `docs/game-dev/STUDIO_HUB.md`. Claim files in its "작업 중" table before editing.
- Every game links to BIT PARK points and benefits, and sells paid items only for portal points (PP) through the portal (cosmetic or unranked only):
  `docs/game-dev/PORTAL_ECONOMY.md`.
- Free assets: follow the `free-asset-pipeline` skill (license gate, ledger, test in the running game).
- Genre Game Lab (rhythm, racing, … sub-sections): `docs/game-dev/genres/README.md`. New game: `node tools/game-lab/new-game.mjs --genre <g> --id <id>`;
  open-source code only under MIT/BSD/Zlib/Apache/CC0 (GPL is study-only) — see `docs/game-dev/genres/OPEN_SOURCE_CATALOG.md`.
- Unity: `docs/game-dev/UNITY_SETUP.md`, `docs/game-dev/UNITY_CLAUDE_INTEGRATION.md`. SPECIAL SOLDIER stays on Three.js.
- BIT PARK portal (separate repo) reads `docs/game-dev/bitpark/feed.json`; regenerate it with `node tools/portal/export-bitpark-feed.mjs` after game changes.
- The island is shared: `apps/special-soldier/src/world/{terrain,vegetation}.js` are the source; Unity's `Core/IslandTerrain.cs` /
  `IslandVegetation.cs` must match (`node "apps/unity-studio/Tools~/gen-terrain-fixture.mjs"` and `gen-vegetation-fixture.mjs` after
  changing them, then `dotnet test "apps/unity-studio/CoreTests~"`). Island → Unity coordinates go through `IslandTerrain.ToWorld` (z flip).
- Multiplayer line of sight uses `apps/special-soldier/src/net/colliders.json` (static world boxes): after changing island buildings, regenerate it with `node tests/shots.mjs colliders` (in `apps/special-soldier`, after `npm run build`).
- Do not commit Unity `Library/`, build output, Asset Store assets, or `__pycache__/`.
