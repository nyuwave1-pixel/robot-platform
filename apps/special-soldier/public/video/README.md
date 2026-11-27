Drop pre-rendered mission intros here (optional): `m1-intro.mp4` … `m5-intro.mp4` (or `.webm`).
If a file exists it plays instead of that mission's real-time cinematic (Enter / Space / click skips).
See docs/FLOW_PROMPTS.md for ready-made Google Flow (Veo) prompts.

`m5-intro.mp4` / `.webm` (6 s, 960×540, no audio) is rendered with Blender Cycles from the game assets by `tools/blender/video.py` — not an AI-generated clip. Replace it with a Flow/Veo export of the same name at any time.
The single-file HTML build does not carry videos; it falls back to the real-time cinematic.
