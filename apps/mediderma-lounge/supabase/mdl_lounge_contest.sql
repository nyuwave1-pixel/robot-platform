-- BEAUTY LIFE (뷰티 라이프): 주간 라운지 꾸미기 콘테스트
-- 2026-11-22 Supabase 프로젝트에 마이그레이션 "mdl_lounge_contest" 로 적용한 것과 같은 내용 (기록용).
-- 테이블은 공개되지 않는 별도 스키마에 두고, 게임은 아래 검증 함수(RPC)로만 접근한다.
create schema if not exists mdl_contest;
revoke all on schema mdl_contest from public, anon, authenticated;

create table mdl_contest.players (
  code text primary key check (code ~ '^[A-Z0-9]{6}$'),
  secret_hash text not null,
  created_at timestamptz not null default now()
);
create table mdl_contest.entries (
  week text not null check (week ~ '^[0-9]{4}-W[0-9]{2}$'),
  code text not null references mdl_contest.players(code) on delete cascade,
  name text not null check (char_length(name) between 1 and 12),
  level int not null check (level between 1 and 10),
  snapshot jsonb not null check (pg_column_size(snapshot) < 24000),
  updated_at timestamptz not null default now(),
  primary key (week, code)
);
create table mdl_contest.votes (
  week text not null,
  voter text not null references mdl_contest.players(code) on delete cascade,
  owner text not null,
  created_at timestamptz not null default now(),
  primary key (week, voter, owner),
  foreign key (week, owner) references mdl_contest.entries(week, code) on delete cascade,
  check (voter <> owner)
);
create index votes_owner on mdl_contest.votes (week, owner);
alter table mdl_contest.players enable row level security;
alter table mdl_contest.entries enable row level security;
alter table mdl_contest.votes enable row level security;

-- 이번 주 (한국 시간 기준 ISO 주, 월요일 0시 시작)
create or replace function mdl_contest.cur_week() returns text language sql stable set search_path = '' as $$
  select to_char(now() at time zone 'Asia/Seoul', 'IYYY-"W"IW')
$$;

-- 플레이어 확인: 처음이면 등록, 이후에는 같은 비밀값이어야 한다 (남의 코드로 투표·출품 방지)
create or replace function mdl_contest.auth(p_code text, p_secret text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare h text; cur text;
begin
  if p_code !~ '^[A-Z0-9]{6}$' or p_secret !~ '^[0-9a-f]{32}$' then return false; end if;
  h := encode(extensions.digest(p_secret, 'sha256'), 'hex');
  select secret_hash into cur from mdl_contest.players where code = p_code;
  if cur is null then
    insert into mdl_contest.players(code, secret_hash) values (p_code, h) on conflict (code) do nothing;
    select secret_hash into cur from mdl_contest.players where code = p_code;
  end if;
  return cur = h;
end $$;

-- 출품(이번 주 한 번 등록, 다시 내면 사진을 바꾼다)
create or replace function public.mdl_contest_enter(p_code text, p_secret text, p_name text, p_level int, p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare w text := mdl_contest.cur_week(); n text;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  n := left(regexp_replace(coalesce(p_name, ''), '[\x00-\x1f<>]', '', 'g'), 12);
  if char_length(trim(n)) = 0 then n := 'GUEST'; end if;
  if jsonb_typeof(p_snapshot) <> 'object' or pg_column_size(p_snapshot) >= 24000 then return jsonb_build_object('ok', false, 'error', 'size'); end if;
  insert into mdl_contest.entries(week, code, name, level, snapshot) values (w, p_code, trim(n), greatest(1, least(10, coalesce(p_level, 1))), p_snapshot)
  on conflict (week, code) do update set name = excluded.name, level = excluded.level, snapshot = excluded.snapshot, updated_at = now();
  return jsonb_build_object('ok', true, 'week', w);
end $$;

-- 투표: 이번 주 출품작에, 내 라운지 제외, 작품마다 한 번, 한 주 최대 5표
create or replace function public.mdl_contest_vote(p_code text, p_secret text, p_owner text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare w text := mdl_contest.cur_week(); used int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_owner = p_code then return jsonb_build_object('ok', false, 'error', 'self'); end if;
  if not exists (select 1 from mdl_contest.entries where week = w and code = p_owner) then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  select count(*) into used from mdl_contest.votes where week = w and voter = p_code;
  if used >= 5 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  insert into mdl_contest.votes(week, voter, owner) values (w, p_code, p_owner) on conflict do nothing;
  if not found then return jsonb_build_object('ok', false, 'error', 'dup'); end if;
  return jsonb_build_object('ok', true, 'left', 4 - used);
end $$;

-- 순위표 (지난 주 결과도 볼 수 있다)
create or replace function public.mdl_contest_board(p_week text default null)
returns table(code text, name text, level int, snapshot jsonb, votes bigint, rank bigint)
language sql security definer stable set search_path = '' as $$
  with w as (select coalesce(nullif(p_week, ''), mdl_contest.cur_week()) as week)
  select e.code, e.name, e.level, e.snapshot, count(v.voter) as votes,
         rank() over (order by count(v.voter) desc) as rank
  from mdl_contest.entries e cross join w
  left join mdl_contest.votes v on v.week = e.week and v.owner = e.code
  where e.week = w.week and (p_week is null or p_week ~ '^[0-9]{4}-W[0-9]{2}$')
  group by e.code, e.name, e.level, e.snapshot, e.updated_at
  order by votes desc, e.updated_at asc
  limit 50
$$;

-- 내 상태: 이번 주 출품 여부·받은 표·쓴 표·투표한 작품, 지난 주 내 순위
create or replace function public.mdl_contest_me(p_code text)
returns jsonb language sql security definer stable set search_path = '' as $$
  with w as (select mdl_contest.cur_week() as week,
                    to_char((now() at time zone 'Asia/Seoul') - interval '7 days', 'IYYY-"W"IW') as prev)
  select jsonb_build_object(
    'week', (select week from w),
    'prev', (select prev from w),
    'entered', exists (select 1 from mdl_contest.entries e, w where e.week = w.week and e.code = p_code),
    'received', (select count(*) from mdl_contest.votes v, w where v.week = w.week and v.owner = p_code),
    'used', (select count(*) from mdl_contest.votes v, w where v.week = w.week and v.voter = p_code),
    'votedFor', coalesce((select jsonb_agg(v.owner) from mdl_contest.votes v, w where v.week = w.week and v.voter = p_code), '[]'::jsonb),
    'prevRank', (select r.rank from (
        select e.code, rank() over (order by count(v.voter) desc) as rank, count(v.voter) as n
        from mdl_contest.entries e cross join w
        left join mdl_contest.votes v on v.week = e.week and v.owner = e.code
        where e.week = w.prev group by e.code) r where r.code = p_code and r.n > 0)
  )
  where p_code ~ '^[A-Z0-9]{6}$'
$$;

revoke all on function mdl_contest.auth(text, text) from public, anon, authenticated;
revoke all on function public.mdl_contest_enter(text, text, text, int, jsonb) from public;
revoke all on function public.mdl_contest_vote(text, text, text) from public;
revoke all on function public.mdl_contest_board(text) from public;
revoke all on function public.mdl_contest_me(text) from public;
grant execute on function public.mdl_contest_enter(text, text, text, int, jsonb) to anon, authenticated;
grant execute on function public.mdl_contest_vote(text, text, text) to anon, authenticated;
grant execute on function public.mdl_contest_board(text) to anon, authenticated;
grant execute on function public.mdl_contest_me(text) to anon, authenticated;
