-- MEDIDERMA LOUNGE: 라운지 방명록
-- 2026-11-23 Supabase 프로젝트에 마이그레이션 "mdl_lounge_guestbook" 로 적용한 것과 같은 내용 (기록용).
-- 콘테스트와 같은 비공개 스키마 · 같은 본인 확인(mdl_contest.auth)을 쓴다.
-- 자유 글은 받지 않는다: 정해진 문구 번호와 스티커 번호만 저장한다.
create table mdl_contest.guestbook (
  id bigint generated always as identity primary key,
  owner text not null check (owner ~ '^[A-Z0-9]{6}$'),
  writer text not null references mdl_contest.players(code) on delete cascade,
  writer_name text not null check (char_length(writer_name) between 1 and 12),
  msg int not null check (msg between 0 and 19),
  sticker int not null check (sticker between 0 and 9),
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  created_at timestamptz not null default now(),
  check (owner <> writer),
  unique (owner, writer, day)
);
create index guestbook_owner on mdl_contest.guestbook (owner, created_at desc);
create index guestbook_writer_day on mdl_contest.guestbook (writer, day);
alter table mdl_contest.guestbook enable row level security;

-- 쓰기: 라운지마다 하루 한 번, 하루 최대 10곳. 라운지마다 최근 100개만 남긴다.
create or replace function public.mdl_guest_write(p_code text, p_secret text, p_owner text, p_name text, p_msg int, p_sticker int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Seoul')::date; n text; used int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_owner is null or p_owner !~ '^[A-Z0-9]{6}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_owner = p_code then return jsonb_build_object('ok', false, 'error', 'self'); end if;
  if p_msg is null or p_msg not between 0 and 19 or p_sticker is null or p_sticker not between 0 and 9 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  select count(*) into used from mdl_contest.guestbook where writer = p_code and day = d;
  if used >= 10 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  n := left(regexp_replace(coalesce(p_name, ''), '[\x00-\x1f<>]', '', 'g'), 12);
  if char_length(trim(n)) = 0 then n := 'GUEST'; end if;
  insert into mdl_contest.guestbook(owner, writer, writer_name, msg, sticker, day) values (p_owner, p_code, trim(n), p_msg, p_sticker, d)
  on conflict (owner, writer, day) do nothing;
  if not found then return jsonb_build_object('ok', false, 'error', 'dup'); end if;
  delete from mdl_contest.guestbook where owner = p_owner and id not in (
    select id from mdl_contest.guestbook where owner = p_owner order by created_at desc limit 100);
  return jsonb_build_object('ok', true);
end $$;

-- 읽기: 그 라운지의 최근 방명록 30개
create or replace function public.mdl_guest_list(p_owner text)
returns table(writer text, name text, msg int, sticker int, at timestamptz)
language sql security definer stable set search_path = '' as $$
  select g.writer, g.writer_name, g.msg, g.sticker, g.created_at
  from mdl_contest.guestbook g
  where p_owner ~ '^[A-Z0-9]{6}$' and g.owner = p_owner
  order by g.created_at desc
  limit 30
$$;

revoke all on function public.mdl_guest_write(text, text, text, text, int, int) from public;
revoke all on function public.mdl_guest_list(text) from public;
grant execute on function public.mdl_guest_write(text, text, text, text, int, int) to anon, authenticated;
grant execute on function public.mdl_guest_list(text) to anon, authenticated;
