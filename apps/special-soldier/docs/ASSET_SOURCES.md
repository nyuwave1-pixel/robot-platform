# 에셋 출처 (Asset sources)

각 출처 페이지에서 2026-11-19에 라이선스를 직접 확인했다. Freesound 파일 URL 형식:
`https://cdn.freesound.org/previews/<id 앞 3자리>/<id>_<user id>-hq.mp3`

## 오디오 — Freesound (CC0 1.0)

| 키 (build_audio.py) | 페이지 | 제작자 | 원본 길이 | 사용 구간 |
|---|---|---|---|---|
| gunshot | https://freesound.org/people/ShawnyBoy/sounds/166191/ | ShawnyBoy | 2.67 s | 0–1.55 s |
| explosion | https://freesound.org/people/tommccann/sounds/235968/ | tommccann | 7.80 s | 0–6.3 s |
| heli | https://freesound.org/people/alegemaate/sounds/413655/ | alegemaate | 9.99 s | 0.5–9.5 s 루프 |
| war | https://freesound.org/people/frankum/sounds/387140/ | frankum | 122.2 s | 4–52 s |
| concrete | https://freesound.org/people/florianreichelt/sounds/459964/ | florianreichelt | 19.8 s | 발걸음 4개 자동 분리 |
| gravel | https://freesound.org/people/PotatokingXII/sounds/352870/ | PotatokingXII | 35.0 s | 발걸음 4개 자동 분리 |
| m_menu | https://freesound.org/people/burning-mir/sounds/155139/ | burning-mir | 29.1 s | 전체 루프 |
| m_combat | https://freesound.org/people/Lumamorph/sounds/716157/ | Lumamorph | 17.5 s | 전체 루프 |
| m_stealth | https://freesound.org/people/Ncone/sounds/730224/ | Ncone | 20.9 s | 전체 루프 |

라이선스 원문: https://creativecommons.org/publicdomain/zero/1.0/

## 텍스처 — Poly Haven (CC0 1.0)

`src/assets/tex/CREDITS.txt` 의 11종. 라이선스: https://polyhaven.com/license

## 재생성

```bash
python tools/assets/build_audio.py      # ffmpeg + numpy 필요. public/audio/ 와 manifest.json 생성
python tools/blender/textures.py        # 또는 Blender 5.3으로 실행
```
