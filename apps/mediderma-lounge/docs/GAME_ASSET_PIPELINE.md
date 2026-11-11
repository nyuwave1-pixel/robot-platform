# Game Asset Pipeline

## 현재 상태
v0.1 의 3D 에셋은 **전부 코드로 만든 프로시저럴 지오메트리**다(캐릭터, 라운지, DERMA HOME, 제품 용기, 가구). 외부 모델·텍스처·폰트 파일이 0개라 라이선스 리스크가 없고 번들이 작다. 반대로 시각 품질의 상한도 여기서 정해진다.

요청서에 있던 Blender · Meshy · Tripo3D · Tinkercad · Blockbench · Womp · Gemini · Google Flow 는 **이번 작업에서 사용하지 않았다.** 이 실행 환경에는 해당 도구의 계정·GUI 가 없고, AI 생성 모델을 검수 없이 넣지 않는다는 원칙과도 맞지 않기 때문이다. 아래는 이후 교체 절차다.

## 교체 우선순위
1. **DERMA HOME 본체·핸드피스** — 브랜드 정확도가 가장 중요. 공식 제품 사진(정면·측면·헤드 3종)을 기준으로 Blender 에서 직접 모델링. AI 변환 결과는 로고·버튼 위치가 왜곡되기 쉬워 초안으로만 쓴다.
2. **제품 용기 17종** — 실루엣은 단순(자·튜브·펌프)하므로 Blender 로 제작, 라벨은 공식 패키지 아트웍을 받아 텍스처로.
3. **캐릭터** — 5단계 공통 스켈레톤 + 단계별 메쉬 또는 블렌드셰이프.
4. 가구·소품 — 로우폴리 제작 도구(Blockbench 등)로 충분.

## 제작 규칙
| 항목 | 기준 |
|---|---|
| 포맷 | GLB (glTF 2.0), Y-up, 1 unit = 1 m |
| 폴리곤 | 캐릭터 ≤ 25k tris, 디바이스 ≤ 8k, 제품 ≤ 1.5k, 가구 ≤ 3k |
| 텍스처 | PBR(BaseColor / ORM / Normal), 캐릭터 2K 1장, 소품 1K 이하, KTX2(BasisU) 압축 |
| 지오메트리 압축 | Draco 또는 Meshopt |
| LOD | 캐릭터 2단계, NPC 는 LOD1 고정 |
| 리깅 | 공통 본 이름: `root, hips, spine, chest, neck, head, arm.L/R, forearm.L/R, hand.L/R, leg.L/R, shin.L/R, foot.L/R` + 헤어·스커트 보조 본 |
| 애니메이션 | idle, walk, sit, lie, wave, pay, pose×3 — 30fps, 루프 구간 명시 |

## AI 생성 모델 검수 체크리스트
자동 삽입 금지. 아래를 통과한 것만 리포지토리에 넣는다.
- [ ] 형태·비율이 콘셉트(또는 실제 제품 사진)와 일치
- [ ] 로고·문자가 왜곡되지 않음 (제품·디바이스는 필수)
- [ ] 토폴로지: 비매니폴드·내부 면·뒤집힌 노멀 없음, 리토폴로지 완료
- [ ] UV 겹침 없음, 텍셀 밀도 균일
- [ ] 폴리곤·텍스처 예산 준수
- [ ] 리깅 시 관절 변형 확인
- [ ] **도구 약관상 상업적 이용 가능 플랜으로 생성했는지** 기록 (LICENSE_AUDIT.md 표에 추가)

## 코드 연결 지점
- 캐릭터: `src/three/Character.tsx` 가 `look / growth / anim / mood` 만 받는다. 같은 props 를 받는 GLB 버전 컴포넌트로 바꿔 끼우면 된다. 단계 블렌딩은 (a) 본 스케일 보간 또는 (b) 단계별 메쉬 크로스페이드 중 선택.
- 소품: `src/three/Props.tsx` 의 `DermaHome`, `Handpiece`, `ProductBottle`, `FurnitureMesh` 가 교체 단위.
- 로딩: drei `useGLTF` + `Suspense`, `KTX2Loader`/`DRACOLoader` 설정은 `World.tsx` 에 추가.

## 제품 이미지
`public/products/{productSeq}.webp` — 공식몰 상품 이미지를 320px WebP 로 줄인 것(총 280KB). 도감·숍 UI 에만 쓴다. 3D 용기에는 붙이지 않았다.

## 영상(컷신)
인트로는 현재 텍스트 4컷이다. 영상 컷신을 넣을 때는 실제 게임 엔진 화면 캡처를 우선하고, 생성 영상은 컷신·홍보용으로만 쓴다. 조작 가능한 플레이 화면을 영상으로 대체하지 않는다.
