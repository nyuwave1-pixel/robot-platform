# Blender 에셋 파이프라인

게임의 3D 모델은 **Blender 5.3** 파이썬 스크립트로 만들어집니다. 스크립트가 모델을 생성하고, 게임용 `GLB`와
Blender에서 바로 열 수 있는 `.blend`, 그리고 Cycles 렌더 이미지를 내보냅니다.

| 파일 | 내용 |
|---|---|
| `tools/blender/lib.py` | 모델링 헬퍼(베벨 박스, 원기둥, 림, 스윕 튜브, 로프트 메시, 피벗 계층) |
| `tools/blender/weapons.py` | 총기 10종 + 1인칭 팔 |
| `tools/blender/models.py` | 병사, 침투 보트, 헬기, APC, 나무, 야자수, 바위, 소품 4종 |
| `tools/blender/build.py` | 전체 빌드 → GLB / .blend / 렌더 |
| `blender/special_soldier_assets.blend` | **결과물. Blender 5.3에서 열어 수정 가능** |
| `src/assets/assets.glb` | 게임이 로드하는 파일(번들에 인라인) |

## 내 PC의 Blender 5.3에서 열기 / 다시 빌드하기 (Windows)

`.blend` 열기: Blender 실행 → File → Open → `apps\special-soldier\blender\special_soldier_assets.blend`

스크립트로 전체 재생성(저장소의 `apps\special-soldier` 폴더에서):

```bat
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" --background --python tools\blender\build.py
```

렌더를 건너뛰려면 끝에 `-- --no-render` 를 붙입니다. 이후 `npm run build` 로 게임에 반영됩니다.

Blender에서 직접 모델을 고친 경우에는 File → Export → glTF 2.0 (.glb) 로 `src\assets\assets.glb` 에 덮어쓰면 됩니다
(Format: glTF Binary, +Y Up 체크). **오브젝트 이름과 부모-자식 구조는 유지해야 합니다** — 게임이 이름으로 찾습니다.

## 게임이 찾는 노드 이름

| 에셋 | 노드 | 용도 |
|---|---|---|
| `Soldier` | `body` › `legL` `legR` `upper` › `head` `arms` › `gun` | 걷기·앉기·조준 애니메이션 피벗, 무기 부착점 |
| | `acc_helmet` `acc_nvg` `acc_cap` `acc_beret` `acc_hood` `acc_visor` `acc_heavy` | 병종별 장구(게임이 종류에 맞는 것만 사용) |
| `W_m4` … `W_gl` | `mag` `pump` / 빈 오브젝트 `muzzle` `sight` `gripL` | 재장전·펌프 동작, 총구 화염 위치, 조준선 높이, 왼손 위치 |
| `Heli` | `rotor` `tail` `light` | 회전, 점멸등 |
| `APC` | `turret` | 포탑 회전 |
| `Tree` `Palm` | `trunk` `canopy` | 인스턴싱(잎은 바람 셰이더) |
| `P_crate` `P_barrel` `P_sandbags` `P_container` | — | 1×1×1 단위 큐브 안에 모델링 → 게임이 충돌 박스 크기로 스케일 |

머티리얼 이름 `cloth` `vest` `skin` `helmet` 은 게임에서 병종 팔레트 색으로 바뀝니다.

## 축 / 단위

Blender: 정면 −Y, 위 +Z, 미터. glTF로 내보내면 정면 +Z, 위 +Y.

## 한계 (정직하게)

- 형상은 프리미티브 조합 + 베벨/스윕/로프트로 만든 **하드서피스 수준**입니다. 스컬프팅·리토폴로지·하이폴리 베이크는 없습니다.
- **텍스처 없음**(PBR 단색 머티리얼), UV는 기본값.
- **리깅/스키닝 없음** — 병사는 관절이 분리된 강체 파츠이며 애니메이션은 게임 코드가 피벗을 돌립니다.
- 건물·차량 트럭·통신탑·지형은 아직 게임 코드의 박스 지오메트리입니다.

## 이 저장소의 에셋은 어디서 만들어졌나

클라우드 세션은 사용자 PC의 Blender에 직접 접속할 수 없어서, 같은 버전인 `bpy 5.3.0`(Blender를 파이썬 모듈로 빌드한 공식 패키지)을
Linux에서 헤드리스로 실행해 만들었습니다. 같은 스크립트가 PC의 Blender 5.3에서도 그대로 돌아가도록 작성되어 있지만,
**Windows의 Blender에서 실행해 본 것은 아닙니다.**
