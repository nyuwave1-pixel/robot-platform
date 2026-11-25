-- MEDIDERMA AI — 서버 저장소 스키마 (PostgreSQL). 앱이 시작할 때 없으면 자동 생성한다 (src/server/store.ts).
-- 얼굴 사진·랜드마크·개별 점수·IP 주소는 어떤 테이블에도 저장하지 않는다.
create table if not exists md_events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  type text not null,        -- src/lib/events.ts EVENT_TYPES
  sid text not null,         -- 임시 세션 ID (익명)
  locale text not null,
  country text not null,     -- CDN 헤더의 국가 코드 (없으면 ZZ)
  props jsonb not null default '{}'
);
create index if not exists md_events_ts on md_events (ts);
create table if not exists md_kv (
  key text primary key,      -- app_config, config_history
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists md_reports (
  id bigserial primary key,
  ts timestamptz not null default now(),
  sid text not null,
  locale text not null,
  message text not null,     -- 사용자 신고 텍스트 (이미지 없음)
  context text not null,
  status text not null default 'open'
);
