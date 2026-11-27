-- BEAUTY LIFE (뷰티 라이프): 주간 자랑왕
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_brag_king" 로 적용한 것과 같은 내용 (기록용).
--  - 그 주(한국 시간 ISO 주, 월요일 0시 시작)에 올린 자랑이 받은 좋아요를 플레이어별로 더해 순위
--  - 지난 주 1~3위는 이번 주에 한 번 보상을 받는다 (보상량은 게임이 순위로 정한다)
alter table mdl_contest.brags add column if not exists week text not null default mdl_contest.cur_week();
create index if not exists brags_week on mdl_contest.brags (week, writer);
create table mdl_contest.brag_king_claims (
  week text not null,
  code text not null references mdl_contest.players(code) on delete cascade,
  rank int not null check (rank between 1 and 3),
  claimed_at timestamptz not null default now(),
  primary key (week, code)
);
alter table mdl_contest.brag_king_claims enable row level security;

-- 지난 주 (한국 시간)
create or replace function mdl_contest.prev_week() returns text language sql stable set search_path = '' as $$
  select to_char((now() at time zone 'Asia/Seoul') - interval '7 days', 'IYYY-"W"IW')
$$;

-- 순위표 (기본 이번 주, 좋아요 1개 이상 · 상위 10명)
create or replace function public.mdl_brag_king(p_week text default null)
returns table(code text, name text, likes bigint, posts bigint, rank bigint)
language sql security definer stable set search_path = '' as $$
  with w as (select coalesce(p_week, mdl_contest.cur_week()) as wk),
  agg as (
    select b.writer, sum(b.likes) as likes, count(*) as posts, max(b.created_at) as last_at,
           (array_agg(b.writer_name order by b.created_at desc))[1] as name
    from mdl_contest.brags b, w where b.week = w.wk group by b.writer
  )
  select writer, name, likes, posts, rank() over (order by likes desc, last_at asc)
  from agg where likes > 0 order by likes desc, last_at asc limit 10
$$;

-- 지난 주 자랑왕 보상 받기 (1~3위, 한 번)
create or replace function public.mdl_brag_king_claim(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare pw text := mdl_contest.prev_week(); r int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select k.rank into r from public.mdl_brag_king(pw) k where k.code = p_code;
  if r is null or r > 3 then return jsonb_build_object('ok', false, 'error', 'none', 'week', pw); end if;
  insert into mdl_contest.brag_king_claims(week, code, rank) values (pw, p_code, r) on conflict do nothing;
  if not found then return jsonb_build_object('ok', false, 'error', 'claimed', 'week', pw, 'rank', r); end if;
  return jsonb_build_object('ok', true, 'week', pw, 'rank', r);
end $$;

revoke all on function public.mdl_brag_king(text) from public;
revoke all on function public.mdl_brag_king_claim(text, text) from public;
grant execute on function public.mdl_brag_king(text) to anon, authenticated;
grant execute on function public.mdl_brag_king_claim(text, text) to anon, authenticated;
