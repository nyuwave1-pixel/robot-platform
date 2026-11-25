-- BEAUTY LIFE (뷰티 라이프): 뷰티 자랑 피드 (SNS)
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_brag" 로 적용한 것과 같은 내용 (기록용).
-- 콘테스트 · 방명록과 같은 비공개 스키마 · 같은 본인 확인(mdl_contest.auth)을 쓴다.
-- 자유 글 · 이미지는 받지 않는다: 자랑 종류, 정해진 문구 번호, 게임 데이터(아이템 id · 숫자)만 저장하고
-- 게임이 읽을 때 아는 값만 골라 그린다.
create table mdl_contest.brags (
  id bigint generated always as identity primary key,
  writer text not null references mdl_contest.players(code) on delete cascade,
  writer_name text not null check (char_length(writer_name) between 1 and 12),
  kind text not null check (kind in ('look', 'pet', 'plant', 'care', 'collection')),
  msg int not null check (msg between 0 and 19),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 2000),
  likes int not null default 0,
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  created_at timestamptz not null default now()
);
create index brags_new on mdl_contest.brags (created_at desc);
create index brags_writer_day on mdl_contest.brags (writer, day);
create table mdl_contest.brag_likes (
  brag_id bigint not null references mdl_contest.brags(id) on delete cascade,
  liker text not null references mdl_contest.players(code) on delete cascade,
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  primary key (brag_id, liker)
);
create index brag_likes_liker_day on mdl_contest.brag_likes (liker, day);
alter table mdl_contest.brags enable row level security;
alter table mdl_contest.brag_likes enable row level security;

-- 올리기: 하루 3번. 전체 최근 500개만 남긴다.
create or replace function public.mdl_brag_post(p_code text, p_secret text, p_name text, p_kind text, p_msg int, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Seoul')::date; n text; used int; new_id bigint;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_kind is null or p_kind not in ('look', 'pet', 'plant', 'care', 'collection') or p_msg is null or p_msg not between 0 and 19
     or p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) >= 2000 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  select count(*) into used from mdl_contest.brags where writer = p_code and day = d;
  if used >= 3 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  n := left(regexp_replace(coalesce(p_name, ''), '[\x00-\x1f<>]', '', 'g'), 12);
  if char_length(trim(n)) = 0 then n := 'GUEST'; end if;
  insert into mdl_contest.brags(writer, writer_name, kind, msg, data, day) values (p_code, trim(n), p_kind, p_msg, p_data, d) returning id into new_id;
  delete from mdl_contest.brags where id not in (select id from mdl_contest.brags order by created_at desc limit 500);
  return jsonb_build_object('ok', true, 'id', new_id);
end $$;

-- 읽기: 최신순(new) 또는 최근 7일 인기순(hot), 종류로 거를 수 있다. p_code 를 주면 내가 좋아요 했는지도 알려 준다.
create or replace function public.mdl_brag_list(p_sort text default 'new', p_kind text default null, p_code text default null)
returns table(id bigint, writer text, name text, kind text, msg int, data jsonb, likes int, liked boolean, at timestamptz)
language sql security definer stable set search_path = '' as $$
  select b.id, b.writer, b.writer_name, b.kind, b.msg, b.data, b.likes,
         exists(select 1 from mdl_contest.brag_likes l where l.brag_id = b.id and l.liker = p_code),
         b.created_at
  from mdl_contest.brags b
  where (p_kind is null or b.kind = p_kind)
    and (coalesce(p_sort, 'new') <> 'hot' or b.created_at > now() - interval '7 days')
  order by case when p_sort = 'hot' then b.likes else 0 end desc, b.created_at desc
  limit 40
$$;

-- 좋아요: 자랑마다 한 번, 내 자랑은 안 됨, 하루 30번
create or replace function public.mdl_brag_like(p_code text, p_secret text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Seoul')::date; w text; used int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select writer into w from mdl_contest.brags where id = p_id;
  if w is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if w = p_code then return jsonb_build_object('ok', false, 'error', 'self'); end if;
  select count(*) into used from mdl_contest.brag_likes where liker = p_code and day = d;
  if used >= 30 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  insert into mdl_contest.brag_likes(brag_id, liker, day) values (p_id, p_code, d) on conflict do nothing;
  if not found then return jsonb_build_object('ok', false, 'error', 'dup'); end if;
  update mdl_contest.brags set likes = likes + 1 where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- 내 자랑 지우기
create or replace function public.mdl_brag_delete(p_code text, p_secret text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  delete from mdl_contest.brags where id = p_id and writer = p_code;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.mdl_brag_post(text, text, text, text, int, jsonb) from public;
revoke all on function public.mdl_brag_list(text, text, text) from public;
revoke all on function public.mdl_brag_like(text, text, bigint) from public;
revoke all on function public.mdl_brag_delete(text, text, bigint) from public;
grant execute on function public.mdl_brag_post(text, text, text, text, int, jsonb) to anon, authenticated;
grant execute on function public.mdl_brag_list(text, text, text) to anon, authenticated;
grant execute on function public.mdl_brag_like(text, text, bigint) to anon, authenticated;
grant execute on function public.mdl_brag_delete(text, text, bigint) to anon, authenticated;
