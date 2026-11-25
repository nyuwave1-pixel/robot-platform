-- BEAUTY LIFE (뷰티 라이프): 플레이어 간 선물 (하트 · 코인)
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_gifts" 로 적용한 것과 같은 내용 (기록용).
-- 콘테스트와 같은 비공개 스키마 · 같은 본인 확인(mdl_contest.auth)을 쓴다. 자유 글은 없다.
--  - 하트: 무료, 받는 사람 SOCIAL STAR +1. 하루 5명, 같은 사람에게 하루 한 번
--  - 코인: 100 또는 500 (보내는 사람 코인에서 뺀다), 하루 3번
--  - 받은 선물은 선물함에서 받기(claim) 하면 지급. 받은 지 30일 지난 기록은 지운다
create table mdl_contest.gifts (
  id bigint generated always as identity primary key,
  sender text not null references mdl_contest.players(code) on delete cascade,
  sender_name text not null check (char_length(sender_name) between 1 and 12),
  recipient text not null check (recipient ~ '^[A-Z0-9]{6}$'),
  kind text not null check (kind in ('heart', 'coins')),
  amount int not null check (amount in (1, 100, 500)),
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  check (sender <> recipient)
);
create index gifts_inbox on mdl_contest.gifts (recipient, claimed_at, created_at desc);
create index gifts_sender_day on mdl_contest.gifts (sender, day);
alter table mdl_contest.gifts enable row level security;

create or replace function public.mdl_gift_send(p_code text, p_secret text, p_name text, p_to text, p_kind text, p_amount int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Seoul')::date; n text; used int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_to is null or p_to !~ '^[A-Z0-9]{6}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_to = p_code then return jsonb_build_object('ok', false, 'error', 'self'); end if;
  if not exists (select 1 from mdl_contest.players where code = p_to) then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if p_kind = 'heart' then
    if p_amount <> 1 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    if exists (select 1 from mdl_contest.gifts where sender = p_code and recipient = p_to and kind = 'heart' and day = d) then return jsonb_build_object('ok', false, 'error', 'dup'); end if;
    select count(*) into used from mdl_contest.gifts where sender = p_code and kind = 'heart' and day = d;
    if used >= 5 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  elsif p_kind = 'coins' then
    if p_amount not in (100, 500) then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    select count(*) into used from mdl_contest.gifts where sender = p_code and kind = 'coins' and day = d;
    if used >= 3 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  else
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  n := left(regexp_replace(coalesce(p_name, ''), '[\x00-\x1f<>]', '', 'g'), 12);
  if char_length(trim(n)) = 0 then n := 'GUEST'; end if;
  insert into mdl_contest.gifts(sender, sender_name, recipient, kind, amount, day) values (p_code, trim(n), p_to, p_kind, p_amount, d);
  delete from mdl_contest.gifts where claimed_at < now() - interval '30 days';
  return jsonb_build_object('ok', true);
end $$;

-- 선물함: 아직 안 받은 선물 (최근 50개)
create or replace function public.mdl_gift_inbox(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  return jsonb_build_object('ok', true, 'gifts', coalesce((
    select jsonb_agg(jsonb_build_object('id', g.id, 'from', g.sender, 'name', g.sender_name, 'kind', g.kind, 'amount', g.amount, 'at', g.created_at) order by g.created_at desc)
    from (select * from mdl_contest.gifts where recipient = p_code and claimed_at is null order by created_at desc limit 50) g), '[]'::jsonb));
end $$;

-- 받기: 안 받은 내 선물만 받음 처리하고, 받은 것을 돌려준다 (게임이 그만큼 지급)
create or replace function public.mdl_gift_claim(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  with c as (
    update mdl_contest.gifts set claimed_at = now()
    where id in (select id from mdl_contest.gifts where recipient = p_code and claimed_at is null order by created_at desc limit 50)
    returning kind, amount
  ) select jsonb_build_object('hearts', coalesce(sum(case when kind = 'heart' then amount end), 0), 'coins', coalesce(sum(case when kind = 'coins' then amount end), 0), 'count', count(*)) into r from c;
  return jsonb_build_object('ok', true) || r;
end $$;

revoke all on function public.mdl_gift_send(text, text, text, text, text, int) from public;
revoke all on function public.mdl_gift_inbox(text, text) from public;
revoke all on function public.mdl_gift_claim(text, text) from public;
grant execute on function public.mdl_gift_send(text, text, text, text, text, int) to anon, authenticated;
grant execute on function public.mdl_gift_inbox(text, text) to anon, authenticated;
grant execute on function public.mdl_gift_claim(text, text) to anon, authenticated;
