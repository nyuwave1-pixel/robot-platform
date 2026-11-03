# 06. 영상·오디오 시스템 및 Canva 연동 설계

## 1. 영상 인벤토리 (확보 현황)
| 키 | 용도 | 상태 | 소스 | 규격 목표 |
|---|---|---|---|---|
| `introCake` | I-01 생일 케이크 인트로 | ❌ **신규 제작** | Canva(1순위) / Higgsfield 생성(2순위) / 실사 촬영(3순위) | 16:9 1080p 8~10초 + 9:16 버전, 무음(사운드는 사이트가 재생) |
| `productFilmLandscape` | I-03 제품 필름(데스크톱) | ✅ 확보 | Drive `임상강조_벌스데이_60초_16_9.mp4` (4K) | 1080p H.264 ~6Mbps + WebM VP9 ~4Mbps, 720p 폴백 |
| `productFilmPortrait` | I-03 제품 필름(모바일) | ✅ 확보 | Drive `임상강조_벌스데이_세로_60초.mp4` | 1080×1920 ~5Mbps + 720×1280 ~2.5Mbps |
| `macroCream` | S09 크림 텍스처 | ✅ 확보(추출) | 16:9 영상 22~30초 구간 트림(8초 루프) | 1080p 무음 루프 WebM/MP4 |
| `macroGinseng` | S06-01 인삼 매크로 | ✅ 확보(추출) | 16:9 영상 48~52초 트림 | 동일 |
| `boxOpening` | S05 폴백(WebGL 미지원) | ✅ 확보(추출) | 16:9 영상 8~14초 트림 | 동일 |
| `brandEnding` | S12 엔딩 | ✅ 확보(추출) | 16:9 영상 56~63초 트림 | 동일 |
| 사용 장면 영상 | S11 | ⏳ 없음 | 플레이스홀더(크림 매크로 재사용) | – |

영상 트림·추출은 원본 편집이 아닌 **구간 재사용**이며, 색·속도·자막은 변경하지 않습니다.

## 2. 데이터 구조 — `src/data/videos.ts`
```ts
export type VideoAsset = {
  key: string;
  sources: { src: string; type: 'video/webm' | 'video/mp4'; media?: string; width: number; height: number }[];
  poster: string;              // WebP, 16:9 t=13s / 9:16 t=12s 프레임
  aspect: '16/9' | '9/16' | '1/1';
  durationSec: number;
  origin: 'canva' | 'drive-upload' | 'generated' | 'placeholder';
  driveFileId?: string;        // 원본 추적용
  skipAt?: number;             // 스킵 시 다음 단계로 넘어가는 안전 지점(초)
  captions?: { t: number; text: string }[]; // 영상 내 텍스트를 HTML로 재표기(SEO·가독성)
};
```
교체 방식: 관리자는 파일을 스토리지(Vercel Blob/Supabase Storage)에 올리고 `videos.ts`의 경로만 바꾼다. 코드 수정 불필요.

## 3. 재생 파이프라인 (`VideoBlock` 컴포넌트)
1. `IntersectionObserver` 진입 500px 전 `preload="metadata"` → 진입 시 `play()`, 이탈 시 `pause()` + 리소스 해제.
2. `autoplay muted playsinline` 기본. 소리는 전역 `AudioController`가 사용자 제스처 이후에만 `muted=false`.
3. 로딩 진행률: `progress` 이벤트 → 골드 1px 바. 3초 이상 버퍼링 시 해상도 한 단계 하향(720p).
4. 오류(`error`, `stalled` 8초): 포스터 + 타이포 시퀀스 폴백으로 즉시 전환, 콘솔·분석 이벤트 기록.
5. 스킵: 항상 노출(우상단, 44px). I-03 스킵 시 `skipAt` 이후 로고 컷(60~63s) 0.8초만 보여주고 S01로.
6. 저전력·데이터 세이버·reduced-motion: 자동재생 금지 → "탭하여 재생" 오버레이.
7. 동시 재생 금지: 전역 스토어에 `activeVideoId` 1개만 허용.

## 4. 전역 오디오 컨트롤러
```
AudioController
 ├─ state: { enabled:boolean, master:0~1, bgm:HTMLAudio|null, sfx:Map }
 ├─ unlock(): 첫 제스처(SOUND ON/OFF/SKIP 클릭)에서 AudioContext.resume()
 ├─ playBgm('ambient'), crossfade(from,to,ms)
 ├─ sfx('candle-ignite' | 'gold-transition' | 'brand-logo')
 ├─ duck(videoPlaying) : 영상 재생 중 BGM -12dB
 └─ persist(): localStorage.soundEnabled
```
큐 시트:
| 시점 | 큐 | 비고 |
|---|---|---|
| I-01 1.8s | candle-ignite | 0.6s |
| I-01 2.4s~ | ambient(luxury cinematic) 페이드인 | 루프 |
| I-02 선택 직후 | brand-logo(0.8s) | 사운드 로고 |
| I-03 | 제품 영상 **원본 오디오** 재생, ambient 덕킹 | 영상 음악이 메인 |
| S01~S12 | ambient 저음량 루프, 섹션 전환 시 gold-transition | – |
| S12 CTA | ambient 페이드아웃 | – |
음원: **라이선스 음원 구매(Artlist/Epidemic Sound 등) 또는 오리지널 제작**. 제품 영상 BGM 저작권 범위(웹 사용 가능 여부)를 제작사에 확인 필요.

## 5. Canva 연동 구조 (케이크 인트로 영상)

### 5-A. 현재 세션에서 바로 가능한 경로 (Canva MCP — 인증 확인됨)
```
Canva 에디터에서 디자이너가 케이크 인트로 제작(브랜드 킷 kAF6r_2iDQg 활용)
 → 이 세션: get-export-formats(design_id) 로 mp4 지원 확인
 → export-design(type:'mp4', quality:'horizontal_1080p')  → 다운로드 URL
 → 샌드박스/서버에서 다운로드 → ffmpeg 트랜스코딩(WebM 추가, 9:16 리사이즈 디자인은 별도 Export)
 → 스토리지 업로드 → videos.ts 경로 갱신
```
세로 버전은 Canva `resize-design`으로 9:16 파생 후 동일 Export.

### 5-B. 서버 측 Canva Connect API (운영 자동화가 필요할 때만)
```
/api/canva/oauth/start → Canva OAuth 2.0 (PKCE), scopes: design:meta:read design:content:read asset:read
/api/canva/oauth/callback → 토큰을 서버 KV(암호화)에 저장. 프론트 노출 금지
/api/canva/export (POST, 관리자 인증) → POST /v1/exports {design_id, format:{type:'mp4', quality:'horizontal_1080p'}}
  → GET /v1/exports/{jobId} 폴링(2s, 최대 5분) → status success → urls[]
  → 서버가 다운로드 → Blob 업로드 → videos.ts 대신 KV `videos.introCake` 갱신(런타임 조회)
```
환경변수: `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REDIRECT_URI`, `KV_URL`. `CANVA_ACCESS_TOKEN` 류는 **서버 전용**. Canva는 제작·Export 도구이며 사이트 실시간 재생 엔진이 아닙니다.

### 5-C. 폴백
Canva 연결 불가 시: Canva에서 MP4 수동 다운로드 → 관리자가 스토리지 업로드 → `videos.ts` 경로 교체. 케이크 영상 자체가 없을 때는 Three.js 케이크 폴백(05 문서)으로 동일 큐 시트 재생.

### 5-D. Canva 제작 브리프 (디자이너 전달용)
- 길이 9초, 16:9 1920×1080 + 9:16 1080×1920, 30fps, 무음.
- 0~0.8s 완전 블랙 → 0.8~1.8s 중앙 골드 입자 → 1.8s 촛불 점화 → 3.5s 케이크 드러남 → 5.0s `1st Birthday` 토퍼 → 5.8s/7.6s 카피 2줄(Pretendard, 화이트) → 9.0s 불꽃 밝기 상승으로 끝(사이트가 화이트/골드 전환을 이어받음).
- 케이크 비주얼은 상세페이지 D-02 컷(아이보리 버터크림, 스크립트 토퍼)과 동일 톤. 컬러 토큰 03 문서.

## 6. 에셋 전처리 스크립트 (개발 단계 실행)
```bash
# 16:9 원본 → 웹 세트
ffmpeg -i film_16x9.mp4 -vf scale=1920:-2 -c:v libx264 -crf 20 -preset slow -movflags +faststart -c:a aac -b:a 128k film_16x9_1080.mp4
ffmpeg -i film_16x9.mp4 -vf scale=1920:-2 -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -c:a libopus film_16x9_1080.webm
ffmpeg -i film_16x9.mp4 -vf scale=1280:-2 -c:v libx264 -crf 22 -movflags +faststart -c:a aac film_16x9_720.mp4
# 포스터
ffmpeg -ss 13 -i film_16x9.mp4 -frames:v 1 -vf scale=1920:-2 poster_16x9.webp
# 매크로 루프
ffmpeg -ss 22 -t 8 -i film_16x9.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 20 macro_cream.mp4
# 오디오 정규화(사이트 BGM 믹스 시)
ffmpeg -i bgm.wav -af loudnorm=I=-16:TP=-1:LRA=11 bgm_web.m4a
```
