# Game Asset Pipeline

## 현재 상태
v0.1 의 3D 에셋은 전부 코드로 만든 프로시저럴 지오메트리였다. v0.2 부터 DERMA HOME 본체·케어 베드·소파는 Blender 모델(GLB)이고, 나머지(캐릭터, 펫, 라운지 구조, 제품 용기, 그 밖의 가구)는 여전히 코드 형상이다. 외부 모델·텍스처·폰트 파일이 0개라 라이선스 리스크가 없고 번들이 작다. 반대로 시각 품질의 상한도 여기서 정해진다.

요청서의 도구 중 **Blender 는 v0.2 부터 사용한다**(아래). Meshy · Tripo3D · Tinkercad · Blockbench · Womp · Gemini · Google Flow 는 사용하지 않았다. 이 실행 환경에는 해당 도구의 계정·GUI 가 없고, AI 생성 모델을 검수 없이 넣지 않는다는 원칙과도 맞지 않기 때문이다. 아래는 이후 교체 절차다.

## Blender 파이프라인 (v0.2 에서 도입)
`tools/blender/build_assets.py` 가 Blender(bpy 5.3, 화면 없이 실행)로 모델을 만들어 `public/models/*.glb` 로 내보낸다. 손으로 만든 .blend 파일은 없고 이 스크립트가 원본이다.

```bash
python -m venv .bl && .bl/bin/pip install bpy==5.3.0
.bl/bin/python tools/blender/build_assets.py --preview
```

| 모델 | 삼각형 | 크기 | 내용 |
|---|---|---|---|
| `derma_home.glb` | 5,328 | 149 KB | 베벨 처리한 본체, 기울어진 스크린 하우징과 유리, 힌지 바, 라이트 스트립, 방열 슬릿·포트·고무 발·전원 버튼 |
| `care_bed.glb` | 2,484 | 72 KB | 둥근 매트리스, 시트, 베개, 타월, 골드 다리·레일 |
| `sofa_1/2/3.glb` | 2,672 / 3,648 / 4,624 | 71 / 95 / 118 KB | 좌석·등받이 쿠션, 둥근 팔걸이, 단추, 골드 다리 |

- 게임은 `src/three/Model.tsx` 로 불러온다. 불러오는 중이거나 실패하면 기존의 코드 형상을 그대로 보여 준다.
- 재질 이름(`accent`, `fabric`, `glow`)으로 테마색·모드색을 코드에서 바꾼다.
- 스크린 화면과 로고 플레이트의 글자는 GLB 에 굽지 않고 코드가 캔버스 텍스처로 덧그린다.
- Draco 압축은 쓰지 않았다(디코더를 외부 CDN 에서 받아야 해서). 모델이 작아 압축 없이 총 506 KB 다.
- `tools/blender/preview/*.png` 는 Cycles 로 렌더한 확인용 이미지다.
- 아직 Blender 로 옮기지 않은 것: 캐릭터, 펫, 제품 용기, 샹들리에, 그 밖의 가구. 텍스처 베이크(AO·라이트맵)와 LOD 도 하지 않았다.

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
