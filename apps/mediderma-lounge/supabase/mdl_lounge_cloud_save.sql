-- BEAUTY LIFE (뷰티 라이프): 클라우드 백업 · 기기 이전
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_cloud_save" 로 적용한 것과 같은 내용 (기록용).
-- 콘테스트와 같은 비공개 스키마 · 같은 본인 확인(mdl_contest.auth)을 쓴다.
--  - 백업: 플레이어 코드 + 기기 비밀값으로만 쓰고 읽는다 (세이브 한 벌, 600KB 미만)
--  - 기기 이전: 옛 기기가 30분짜리 이전 코드를 만들면, 새 기기가 친구 코드 + 이전 코드로 계정을 넘겨받는다
--    (새 기기의 비밀값으로 바뀌므로 옛 기기는 더 이상 그 계정으로 쓰지 못한다). 이전 코드는 해시로만 저장, 5번 틀리면 무효.
create table mdl_contest.saves (
  code text primary key references mdl_contest.players(code) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 600000),
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) < 2000),
  updated_at timestamptz not null default now()
);
create table mdl_contest.save_transfers (
  code text primary key references mdl_contest.players(code) on delete cascade,
  pin_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0
);
alter table mdl_contest.saves enable row level security;
alter table mdl_contest.save_transfers enable row level security;

-- 백업 올리기 (20초에 한 번까지)
create or replace function public.mdl_save_put(p_code text, p_secret text, p_data jsonb, p_meta jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare last timestamptz;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) >= 600000 then return jsonb_build_object('ok', false, 'error', 'size'); end if;
  if p_meta is null or jsonb_typeof(p_meta) <> 'object' or pg_column_size(p_meta) >= 2000 then p_meta := '{}'::jsonb; end if;
  select updated_at into last from mdl_contest.saves where code = p_code;
  if last is not null and last > now() - interval '20 seconds' then return jsonb_build_object('ok', false, 'error', 'wait'); end if;
  insert into mdl_contest.saves(code, data, meta, updated_at) values (p_code, p_data, p_meta, now())
  on conflict (code) do update set data = excluded.data, meta = excluded.meta, updated_at = now();
  return jsonb_build_object('ok', true, 'at', now());
end $$;

-- 내 백업 정보 (데이터 없이 요약만)
create or replace function public.mdl_save_meta(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select meta, updated_at into r from mdl_contest.saves where code = p_code;
  if not found then return jsonb_build_object('ok', true, 'exists', false); end if;
  return jsonb_build_object('ok', true, 'exists', true, 'meta', r.meta, 'at', r.updated_at);
end $$;

-- 기기 이전 코드 만들기 (8자, 30분, 다시 만들면 이전 코드는 무효)
create or replace function public.mdl_transfer_create(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; pin text := ''; b bytea; i int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if not exists (select 1 from mdl_contest.saves where code = p_code) then return jsonb_build_object('ok', false, 'error', 'nosave'); end if;
  b := extensions.gen_random_bytes(8);
  for i in 0..7 loop pin := pin || substr(chars, (get_byte(b, i) % 32) + 1, 1); end loop;
  insert into mdl_contest.save_transfers(code, pin_hash, expires_at, attempts)
  values (p_code, encode(extensions.digest(pin, 'sha256'), 'hex'), now() + interval '30 minutes', 0)
  on conflict (code) do update set pin_hash = excluded.pin_hash, expires_at = excluded.expires_at, attempts = 0;
  return jsonb_build_object('ok', true, 'pin', pin, 'expires', now() + interval '30 minutes');
end $$;

-- 새 기기에서 이전 받기: 맞으면 계정 비밀값을 새 기기 것으로 바꾸고 백업을 돌려준다
create or replace function public.mdl_transfer_claim(p_code text, p_pin text, p_new_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t record; s record;
begin
  if p_code !~ '^[A-Z0-9]{6}$' or p_pin !~ '^[A-Z0-9]{8}$' or p_new_secret !~ '^[0-9a-f]{32}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  select * into t from mdl_contest.save_transfers where code = p_code for update;
  if not found or t.expires_at < now() or t.attempts >= 5 then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  if t.pin_hash <> encode(extensions.digest(p_pin, 'sha256'), 'hex') then
    update mdl_contest.save_transfers set attempts = attempts + 1 where code = p_code;
    return jsonb_build_object('ok', false, 'error', 'pin');
  end if;
  select data, updated_at into s from mdl_contest.saves where code = p_code;
  if not found then return jsonb_build_object('ok', false, 'error', 'nosave'); end if;
  update mdl_contest.players set secret_hash = encode(extensions.digest(p_new_secret, 'sha256'), 'hex') where code = p_code;
  delete from mdl_contest.save_transfers where code = p_code;
  return jsonb_build_object('ok', true, 'data', s.data, 'at', s.updated_at);
end $$;

revoke all on function public.mdl_save_put(text, text, jsonb, jsonb) from public;
revoke all on function public.mdl_save_meta(text, text) from public;
revoke all on function public.mdl_transfer_create(text, text) from public;
revoke all on function public.mdl_transfer_claim(text, text, text) from public;
grant execute on function public.mdl_save_put(text, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.mdl_save_meta(text, text) to anon, authenticated;
grant execute on function public.mdl_transfer_create(text, text) to anon, authenticated;
grant execute on function public.mdl_transfer_claim(text, text, text) to anon, authenticated;

-- 2026-11-25 추가 (마이그레이션 "mdl_lounge_save_get"): 비트파크 계정에 연결된 진행 불러오기
create or replace function public.mdl_save_get(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select data, meta, updated_at into r from mdl_contest.saves where code = p_code;
  if not found then return jsonb_build_object('ok', false, 'error', 'nosave'); end if;
  return jsonb_build_object('ok', true, 'data', r.data, 'meta', r.meta, 'at', r.updated_at);
end $$;
revoke all on function public.mdl_save_get(text, text) from public;
grant execute on function public.mdl_save_get(text, text) to anon, authenticated;
