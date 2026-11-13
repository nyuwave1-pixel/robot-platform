# Google Flow (Veo) 프롬프트 팩 — 시네마틱 영상

이 세션에서는 Google Flow를 직접 조작할 수 없고, Gemini API도 키가 없어 호출하지 못했습니다.
그래서 **Flow에서 만든 영상을 파일만 넣으면 게임이 재생하도록** 연결부를 만들고, 아래 프롬프트를 준비했습니다.

## 게임에 넣는 방법

1. Flow에서 아래 프롬프트로 클립을 만들고 이어 붙여 미션별 한 편으로 내보냅니다(16:9, 1080p 권장, 20–40초).
2. 파일 이름을 맞춰 `apps/special-soldier/public/video/` 에 넣습니다.

   | 파일 | 대체되는 장면 |
   |---|---|
   | `m1-intro.mp4` | 미션 01 보트 침투 시네마틱 |
   | `m2-intro.mp4` | 미션 02 정글 인트로 |
   | `m3-intro.mp4` | 미션 03 기지 인트로 |
   | `m4-intro.mp4` | 미션 04 지하 시설 인트로 |
   | `m5-intro.mp4` | 미션 05 비행장 / 보스 등장 |

3. `npm run build` (데스크톱은 `npm run build:win`). 파일이 있으면 그 영상이, 없으면 기존 실시간 시네마틱이 나옵니다. Enter / Space / 클릭으로 스킵.

검증: 합성 테스트 클립(.webm)으로 "영상 재생 → 종료 후 플레이 시작"과 "파일 없음 → 실시간 시네마틱"을 확인했습니다.
실제 Flow 영상(.mp4, H.264)으로는 테스트하지 못했습니다 — 일반 Chrome/Electron에서는 재생되는 형식입니다.

## 공통 스타일 (모든 프롬프트 앞에 붙이기)

> Photorealistic cinematic military film, anamorphic 2.39:1 look, 35mm lens, shallow depth of field, natural film grain, muted teal-and-amber grade, volumetric haze, no text, no logos, no subtitles. Fictional special operations unit "SQUAD 07": six operators in dark olive combat uniforms, plate carriers, ballistic helmets with four-tube night-vision goggles, suppressed carbines. Year 2029, remote Pacific island.

## M1 — 보트 침투 (`m1-intro.mp4`)

1. **Wide establishing, 6 s** — *Aerial wide shot at 04:30 before dawn, a black rigid inflatable assault boat with six operators cutting across a dark open ocean, long white wake, moonlight glittering on the swell, a low fog bank on the horizon, a distant island silhouette with two faint searchlights sweeping. Slow push-in.*
2. **Front, 5 s** — *Low angle from just above the water in front of the bow, the boat charging toward camera, spray bursting over the inflatable collar, operators crouched low, night-vision goggles glowing faint green, twin outboards roaring. Handheld, slight shake.*
3. **Side tracking, 5 s** — *Tracking shot alongside the boat at speed, profile of the operators gripping the grab handles, wet gear, rifles across chests, water droplets on lenses, the island growing in the background.*
4. **Over the stern, 6 s** — *From behind the helmsman looking forward over the operators' helmets toward the island: a sandy beach, palm line, a wooden watchtower with a searchlight, a coastal radar dish, lamps of a sandbagged post. Fog drifting low over the water.*
5. **Close-up, 4 s** — *Extreme close-up of one operator flipping down four-tube night-vision goggles, green glow reflecting on wet skin and balaclava, rain beads on the helmet.*
6. **Beach landing, 6 s** — *The boat slows and grounds in the shallows, operators roll over the collar into knee-deep water, boots splashing, rifles up, moving toward the dark beach. End on a first-person view wading forward with a suppressed carbine.*

## M2 — 깊은 정글 (`m2-intro.mp4`)

1. *Dawn, light rain and heavy fog in dense tropical jungle, shafts of pale orange light through the canopy, a squad moving silently along a muddy trail, water dripping from broad leaves. Slow dolly forward.* (6 s)
2. *Reveal through the foliage: a clearing with a tall lattice communications mast with dishes and a blinking red beacon, a concrete relay hut, sandbag positions, armed sentries in grey uniforms.* (6 s)

## M3 — BLACK COBRA 기지 (`m3-intro.mp4`)

1. *Daytime thunderstorm, sheets of rain, a walled military compound seen from a ridge: concrete perimeter wall, corner watchtowers, olive barracks, parked trucks, an eight-wheeled armoured personnel carrier, a black flag whipping on a pole. Lightning flash.* (6 s)
2. *Push in toward the headquarters building: lit windows, a heavy gunner at the door, rain hammering the concrete yard.* (5 s)

## M4 — 지하 시설 (`m4-intro.mp4`)

1. *A freight elevator descends into a sterile underground research facility on emergency power: white corridor, red rotating warning lights, a ceiling security camera panning, a heavy rust-coloured blast door at the end. Slow, tense push down the corridor.* (7 s)

## M5 — 최후의 탈출 (`m5-intro.mp4`)

1. *Dusk under a storm front, deep orange horizon, a wet military airfield: runway lights, a hangar, shipping containers, an armoured vehicle. Wind and rain.* (5 s)
2. *The enemy commander revealed: a tall man in dark crimson-trimmed body armour and a red beret with an amber visor, a light machine gun slung, flanked by black-armoured elite guards with glowing red visors. Low angle, slow push-in.* (6 s)

## 엔딩(선택) — 헬기 탈출

*A grey military helicopter lifts off from a helipad marked with green smoke, operators aboard, door open, the island shrinking behind under a burning dusk sky, fires on the runway below.* (8 s) — 현재 게임은 엔딩을 실시간으로만 재생합니다(영상 슬롯 없음).

## Gemini로 하려던 작업(보류)

실사풍 타일링 PBR 텍스처(위장 직물, 총기 금속, 콘크리트, 모래, 나무껍질, 녹슨 컨테이너) 생성 → 게임 머티리얼에 적용.
환경 설정에서 `generativelanguage.googleapis.com` 용 Gemini API 키를 추가해 주시면 이어서 진행할 수 있습니다.
