# Claude Code × Unity 통합 개발 환경 — 설계와 실행 순서

사용자 지시서 "CLAUDE CODE × UNITY MASTER INTEGRATION"(2026-11-20)을 이 저장소와 PC 상황에 맞게 정리한 실행 문서입니다.
지시서 원문은 §2 "MCP 서버의 GitHub 공식 저장소와 설치 방법, 유지…" 에서 잘려 전달되었고, 이후 항목은 받는 대로 추가합니다.
현재 설치 상태는 [`UNITY_SETUP.md`](UNITY_SETUP.md), 세션 역할은 [`STUDIO_HUB.md`](STUDIO_HUB.md)를 따릅니다.

## 0. 현재 막힌 지점 (2026-11-20)

| 항목 | 상태 |
|---|---|
| Unity Editor 6000.6.9f1 + Windows·WebGL 모듈 | ✅ 설치됨 |
| Unity Hub | ❌ 미설치 |
| Unity 라이선스 | ❌ 없음 → batchmode 종료 198. **모든 Unity 작업이 여기서 멈춤.** 사용자가 Hub 설치 → 로그인 → Personal 라이선스 활성화 필요 |
| PC 세션 | 연결 끊김(PC가 꺼졌거나 Claude 앱 종료). 다시 켜지면 이어서 진행 |

## 1. 연동 방식 비교 (GitHub 검색 API·공식 문서로 확인, 2026-11-20)

| 순위 | 방식 | 출처 · 라이선스 · 관리 상태 | 하는 일 | 판단 |
|---|---|---|---|---|
| **1** | **Unity CLI 1.0 + Unity Pipeline 패키지 + 공식 Claude Code 플러그인** | Unity 공식. Pipeline 패키지는 Unity 6.0+ 필요 | `unity setup` 으로 플러그인 설치, `unity command ...` 로 실행 중인 에디터 제어, `unity command eval` 로 에디터 안에서 C# 실행(재컴파일 없음), 에디터 설치·라이선스·빌드·로그 | **기본 채택.** 공식 지원, 스킬 29개(UI·URP·오디오·내비·2D 등)와 한 묶음 |
| 2 | [CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp) (MCP for Unity) | ★16,083 · MIT · 2026-11-17 푸시 | 씬·게임오브젝트·스크립트·에셋·콘솔을 MCP 도구로 제어. Python 3.10+ / `uv` 필요. 설치: Package Manager → git URL `https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity` (릴리스 태그로 고정) | 1번으로 부족한 기능이 있을 때만 추가. **1번과 동시에 켜지 않음**(도구 중복·충돌) |
| 3 | [IvanMurzak/Unity-MCP](https://github.com/IvanMurzak/Unity-MCP) | ★4,671 · Apache-2.0 · 2026-11-19 푸시 | MCP + 런타임(게임 실행 중) 제어, 애니메이션·파티클·ProBuilder 확장 | 대안 |
| 4 | [CoderGamester/mcp-unity](https://github.com/CoderGamester/mcp-unity) | ★2,019 · MIT · 2026-10-11 | 에디터 제어 MCP | 대안 |
| — | Unity AI Assistant 패키지 내장 MCP | Unity 공식, **Unity 구독 필요**. 일부 문서는 CLI로 이관(지원 중단)이라고 함 | | 사용 안 함(Personal 라이선스 기준) |
| — | `AnkleBreaker-Studio/unity-mcp-server`, `jackwrichards/UnityMCP` | 라이선스 불명확(NOASSERTION) 또는 1년 이상 미관리 | | 사용 안 함 |

지시서의 우선순위(MCP 서버 → 에디터 제어 MCP → Claude MCP 클라이언트 → Editor Scripting API → AssetDatabase → Test Framework → Build Pipeline)는
다음처럼 대응합니다: 1·2·3번 = Unity CLI(`unity command`) 또는 MCP for Unity, 4·5번 = `Assets/Editor/*.cs` 의 `[MenuItem]`/static 메서드를
`-executeMethod` 또는 `unity command eval` 로 호출, 6번 = Unity Test Framework(EditMode/PlayMode) `-runTests`, 7번 = `BuildPipeline.BuildPlayer` 배치 빌드.

## 2. PC 환경 분석 체크리스트 (지시서 §1)

PC 세션이 아래를 확인하고 결과를 `UNITY_SETUP.md` 표에 추가합니다. **삭제·변경은 사용자 승인 후에만.**

| 항목 | 확인 명령(예) |
|---|---|
| Unity Hub / Editor 버전·실행 여부 | 시작 메뉴 바로가기 대상, `Get-Process Unity` |
| Unity 프로젝트 경로 탐색 | `C:\개발` 아래 `ProjectSettings\ProjectVersion.txt` 검색 |
| IDE | Visual Studio(`vswhere`), VS Code(`code --version`) + C# Dev Kit, Unity 외부 도구 설정 |
| .NET SDK | `dotnet --list-sdks` |
| Git / GitHub | `git --version`, `git remote -v`, 푸시 가능 여부 |
| Python / uv (MCP for Unity 쓸 때만) | `python --version`, `uv --version` |
| Unity CLI | `unity --version` (없으면 공식 문서의 winget 설치 안내 → 사용자 승인 후) |
| Package Manager | `Packages/manifest.json` 해석, 오류 패키지 |
| Console 오류 | 배치 로그 `Logs/batch-*.log` 의 `error CS`·`Exception` 수 |

## 3. 실행 순서

1. **(사용자)** Unity Hub 설치 → Unity ID 로그인 → Personal 라이선스 활성화 → Hub의 Installs에서 기존 6000.6.9f1 Locate. (`UNITY_SETUP.md` 의 단계)
2. **(PC 세션)** §2 체크리스트 실행·기록.
3. **(PC 세션)** `apps/unity-studio/run-batch.ps1` 실행 → URP 프로젝트 초기화, glTFast 추가, `assets.glb` 임포트, 테스트 씬, Windows 빌드. 로그로 증명.
4. **(PC 세션)** Unity CLI 설치(사용자 승인) → `unity setup` 으로 공식 Claude Code 플러그인 → Unity Pipeline 패키지를 `apps/unity-studio` 에 추가 →
   에디터를 띄운 상태에서 `unity command eval` 로 게임오브젝트 생성·씬 저장 왕복 테스트.
5. 필요할 때만 MCP for Unity(릴리스 태그 고정)를 추가하고, Claude Code에는 `claude mcp add` 로 **프로젝트 범위**에 등록.
6. 자동화 확장: EditMode 테스트 1개 + PlayMode 테스트 1개 → `-runTests` 배치 실행, 빌드 스크립트에 콘솔 오류 0 조건.
7. 그다음 게임 기능(물리·애니메이션·UI·사운드)은 사용자가 Unity로 옮길 게임을 정한 뒤 `free-asset-pipeline` 스킬 규칙으로 진행.

## 4. 안전 규칙

- 기존 웹 게임(SPECIAL SOLDIER 등)의 엔진과 코드는 바꾸지 않습니다.
- Unity Asset Store 에셋, `Library/`, 빌드 결과물은 이 공개 저장소에 커밋하지 않습니다.
- MCP 서버는 공식 저장소에서 **태그로 고정한 버전**만 설치하고, 이 문서에 버전을 기록합니다.
- 실행하지 못한 단계는 "못 함"으로 기록합니다.

출처: [Unity CLI 1.0](https://unity.com/the-unity-cli-1.0-is-here), [Meet the Unity CLI](https://unity.com/blog/meet-the-unity-cli),
[Unity CLI 에디터 명령](https://docs.unity.com/en-us/unity-cli/reference/editor-project-commands),
[Unity 공식 Claude Code 플러그인](https://unity.com/ja/blog/unity-plugin-for-claude-code),
[MCP for Unity 설치 문서](https://coplaydev.github.io/unity-mcp/getting-started/install)
