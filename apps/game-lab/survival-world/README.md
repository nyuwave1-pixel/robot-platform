# SURVIVAL WORLD — 기술 프로토타입

NEXT-GEN INDIE STUDIO 두 번째 게임(우선순위 2위, 생존 제작)의 **기술 검증용 첫 빌드**입니다 (2026-11-27). 기획: [`docs/indie-studio/GAME_DESIGN_DOCUMENTS/SURVIVAL_WORLD.md`](../../../docs/indie-studio/GAME_DESIGN_DOCUMENTS/SURVIVAL_WORLD.md)

## 실행
```bash
cd apps/game-lab/survival-world
python3 -m http.server 5180          # http://localhost:5180  (?seed=123 으로 섬 고르기)
node --test tests/*.test.mjs         # 규칙 테스트 (설치 없음)
```
조작: 화면 클릭(둘러보기) · WASD · Shift 달리기 · E 채집 · 클릭 공격/채집 · F 물 마시기(물가) · Q 먹기 · C 제작 · B 짓기(R 회전, 클릭 설치, Esc 그만).

## 구조
| 경로 | 내용 |
|---|---|
| `src/logic.js` | 규칙: 시드 섬 높이·생태(물/해변/풀밭/숲/바위), 자원 배치, 아이템·제작법, 배고픔·갈증·체온·체력·기력, 낮밤(하루 6분), 늑대, 벽 충돌, 저장/불러오기 |
| `src/main.js` | three.js 화면: 지형(정점 색), 인스턴싱 나무·바위·덤불, 물, 해·하늘·안개, 1인칭 이동, HUD, 제작 창, 설치 미리보기 |
| `vendor/three.module.min.js` | three.js r170 (MIT, `vendor/THREE_LICENSE`) — 설치 없이 돌도록 함께 둠 |

## 지금 되는 것 / 아직 안 되는 것
- 됨: 섬 생성(시드 공유), 채집 3종과 도구 보너스, 제작 6종, 모닥불(온기·늑대 쫓기·요리), 나무 벽(충돌), 생존 수치와 사망 원인, 밤 늑대, 10초마다 자동 저장, 포털 RP 등급(생존 일수).
- 안 됨(다음): 멀티플레이(협동), 몬스터 종류·보스, 계절·날씨, 동물 사냥, 인벤토리 무게, 건축 확장(바닥·지붕·문), 애니메이션·소리, 모바일 조작, 서버 검증(실시간 3D라 리플레이 검증기 없음 → 포털 PP 미등록).
