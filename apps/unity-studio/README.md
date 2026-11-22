# SPECIAL SOLDIER — Unity Studio (pilot)

Unity 6 (6000.6.9f1, URP) pilot of the web game's core loop: a playable **Island Slice** — first-person movement, 3 weapons
(M4, shotgun, pistol) with the web game's exact balance numbers, 7 enemies (sentry, assault, heavy, sniper, elite) with the
PATROL→SUSPICIOUS→SEARCH→COMBAT↔RETREAT brain, HUD, win/lose. The web game (Three.js) stays the main product.

| Folder | What |
|---|---|
| `Assets/Scripts/Core` | Engine-free rules (no `UnityEngine`): weapons, ballistics, health, weapon state, enemy awareness |
| `Assets/Scripts/Runtime` | MonoBehaviours: player, weapon, enemy agent, director, HUD (compiles once Input System + AI Navigation exist) |
| `Assets/Editor` | Batch entry points: packages, GLB import, scene builder (`Slice/SliceBuilder.cs`) |
| `Assets/Tests/EditMode` | NUnit tests, incl. 145 parity cases against the JavaScript balance model |
| `CoreTests~` | `dotnet test` project that runs Core + EditMode tests without Unity |
| `Tools~/gen-core-data.mjs` | Regenerates the C# weapon table and the parity fixture from `apps/special-soldier/src/config/weapons.js` |

```bash
powershell -ExecutionPolicy Bypass -File apps\unity-studio\run-batch.ps1
```

```bash
dotnet test "apps/unity-studio/CoreTests~"
```

Needs an active Unity Personal licence for the first command (see `docs/game-dev/UNITY_SETUP.md`).
Learning guide: `docs/game-dev/UNITY_LEARNING_PATH.md`.
