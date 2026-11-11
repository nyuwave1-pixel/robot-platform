# MEDIDERMA LOUNGE

**BEAUTY LIFE. BEAUTY GROWTH. BEAUTY SOCIAL.**
UNI&CORE 제품과 DERMA HOME 디바이스로 캐릭터를 직접 케어해 5단계로 성장시키고, 나만의 메디더마 라운지를 운영하는 브라우저 3D 게임 (v0.1 플레이어블 MVP).

독립 Vite 앱이다. 루트의 Next.js 로봇 플랫폼, `apps/unicore-birthday` 와 빌드·의존성을 공유하지 않는다.

## 실행
```bash
cd apps/mediderma-lounge
npm install
npm run dev        # http://localhost:3200
```
```bash
npm run build      # 타입체크 + dist/ 정적 빌드
npm run preview
npm test           # 단위 테스트 30개 (상품 DB 정합성, 케어·고객·저장 로직)
npm run smoke      # 빌드본을 헤드리스 브라우저로 열어 6개 항목 확인, 스크린샷은 qa/evidence/
npm run docs:db    # src/data → docs/PRODUCT_ITEM_DATABASE.md 재생성
```

## 배포
`dist/` 는 순수 정적 파일이고 `base: "./"` 로 빌드되어 어떤 하위 경로에도 올릴 수 있다.
- Netlify: 이 폴더의 `netlify.toml` 사용 (base = `apps/mediderma-lounge`)
- Vercel: 새 프로젝트의 Root Directory 를 `apps/mediderma-lounge` 로 지정 (Framework: Vite)
- 루트 `vercel.json` 은 로봇 플랫폼용이므로 건드리지 않았다. **아직 어디에도 배포하지 않았다.**

## 플레이 방법
1. 새로 시작 → 캐릭터 이름·첫 모습 선택
2. 라운지에서 **BEAUTY CARE**(또는 케어 베드 앞에서 E) → 루틴 선택
3. 스텝마다 **바르기** → 부위 마커를 누른 채 문질러 게이지 채우기 → 미스트 마무리
4. EXP 가 차면 성장 시네마틱. 첫 풀 루틴 1회면 STAGE 2 가 된다
5. 소파에 앉은 고객(`!`)에게 다가가 상담 → 케어 → 코인·LOUNGE POINT
6. LOUNGE 에서 확장·인테리어 편집, ITEM SHOP 에서 제품·패션·인테리어, SOCIAL 에서 셀피 게시

| | PC | 모바일 |
|---|---|---|
| 이동 | WASD·방향키 / 바닥 클릭 | 조이스틱 / 바닥 탭 |
| 카메라 | 드래그, 휠 | 드래그, 핀치 |
| 상호작용 | E · Space | 액션 버튼 |

`?debug` 를 주소에 붙이면 밸런스 수치를 슬라이더로 바꿔 보는 TWEAK 패널과 `window.__mdl`(스토어 핸들)이 열린다 — QA 전용.

## 데이터 원칙
- `src/data/products.ts`, `devices.ts` 는 **공식 사이트에서 수집한 실데이터**다. 제품명·성분·사용법을 임의로 바꾸지 않는다. 출처·검증 범위는 `docs/PRODUCT_ITEM_DATABASE.md`.
- `src/data/config.json` 은 밸런스 수치(보상·경제·고객·성장)의 단일 출처다. 코드에 숫자를 직접 쓰지 않는다.
- `src/data/game.ts` 는 게임 기획 수치와 가상 콘텐츠(고객 NPC, 데모 SNS 계정)다.
- 게임 속 캐릭터 변화는 EXP 기반 판타지 연출이며 실제 제품 효능을 나타내지 않는다.

## 문서
| 문서 | 내용 |
|---|---|
| [GAME_DESIGN_DOCUMENT](docs/GAME_DESIGN_DOCUMENT.md) | 루프·성장·경제·화면별 구현 상태·한계 |
| [TECHNICAL_ARCHITECTURE](docs/TECHNICAL_ARCHITECTURE.md) | 스택, 구조, 성능, 온라인 전환 원칙 |
| [CHARACTER_DESIGN_GUIDE](docs/CHARACTER_DESIGN_GUIDE.md) | 5단계 프로포션, 공통 리그, 커스터마이징 |
| [PRODUCT_ITEM_DATABASE](docs/PRODUCT_ITEM_DATABASE.md) | 48종 상품 DB (자동 생성) |
| [LOUNGE_DESIGN_GUIDE](docs/LOUNGE_DESIGN_GUIDE.md) | 공간·등급·인테리어 |
| [GAME_ASSET_PIPELINE](docs/GAME_ASSET_PIPELINE.md) | GLB 교체 절차, AI 모델 검수 |
| [DEVELOPMENT_ROADMAP](docs/DEVELOPMENT_ROADMAP.md) | Phase 1~5 진행 상태 |
| [LICENSE_AUDIT](docs/LICENSE_AUDIT.md) | 의존성·참고 저장소·브랜드 자산 |
| [GAME_BRIEF](docs/GAME_BRIEF.md) | 한 장짜리 브리프 |
| [gdd/care-system](docs/gdd/care-system.md) | 케어 시스템 설계서(공식·튜닝·수용 기준) |
| [STUDIO_PRACTICES](docs/STUDIO_PRACTICES.md) | claude-code-game-studios 분석과 반영 내역 |

## 아직 없는 것
서버·계정·실제 멀티플레이/SNS, 운영자 어드민, 사운드, 리깅된 고품질 캐릭터 모델, 영상 컷신. 자세한 내용은 로드맵 참조.
