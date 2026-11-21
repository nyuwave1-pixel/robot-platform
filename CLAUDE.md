# robot-platform

This repo holds several projects. Read the part that matches your task.

## Game development (apps/special-soldier, apps/unity-studio)

- Work branch: `claude/relaxed-ramanujan-83okpi`. Pull before you start, push when you finish.
- New PC or missing tools: `docs/game-dev/NEW_PC_SETUP.md` and `tools/dev-env/setup.ps1` (check-only by default).
- Tool versions are pinned in `tools/dev-env/versions.json`. Find Blender and Unity through `tools/dev-env/find-tools.ps1`
  (or the `BLENDER_EXE` / `UNITY_EDITOR` environment variables). Never hard-code a PC-specific path.
- Who does what across sessions and PCs: `docs/game-dev/STUDIO_HUB.md`. Claim files in its "작업 중" table before editing.
- Free assets: follow the `free-asset-pipeline` skill (license gate, ledger, test in the running game).
- Unity: `docs/game-dev/UNITY_SETUP.md`, `docs/game-dev/UNITY_CLAUDE_INTEGRATION.md`. SPECIAL SOLDIER stays on Three.js.
- Do not commit Unity `Library/`, build output, Asset Store assets, or `__pycache__/`.
