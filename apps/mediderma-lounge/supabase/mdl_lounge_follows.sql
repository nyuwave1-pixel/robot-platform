-- BEAUTY LIFE (뷰티 라이프): 플레이어 팔로우 (실제 친구 목록)
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_follows" 로 적용한 것과 같은 내용 (기록용).
-- 콘테스트와 같은 비공개 스키마 · 같은 본인 확인(mdl_contest.auth). 한 사람당 최대 200명 팔로우.
create table mdl_contest.follows (
  follower text not null references mdl_contest.players(code) on delete cascade,
  followee text not null references mdl_contest.players(code) on delete cascade,
  followee_name text not null check (char_length(followee_name) between 1 and 12),
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index follows_followee on mdl_contest.follows (followee);
alter table mdl_contest.follows enable row level security;

-- 팔로우 / 언팔로우 (p_on)
create or replace function public.mdl_follow(p_code text, p_secret text, p_to text, p_name text, p_on boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n text; used int;
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_to is null or p_to !~ '^[A-Z0-9]{6}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_to = p_code then return jsonb_build_object('ok', false, 'error', 'self'); end if;
  if not coalesce(p_on, false) then
    delete from mdl_contest.follows where follower = p_code and followee = p_to;
    return jsonb_build_object('ok', true, 'on', false);
  end if;
  if not exists (select 1 from mdl_contest.players where code = p_to) then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  select count(*) into used from mdl_contest.follows where follower = p_code;
  if used >= 200 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  n := left(regexp_replace(coalesce(p_name, ''), '[\x00-\x1f<>]', '', 'g'), 12);
  if char_length(trim(n)) = 0 then n := 'GUEST'; end if;
  insert into mdl_contest.follows(follower, followee, followee_name) values (p_code, p_to, trim(n))
  on conflict (follower, followee) do update set followee_name = excluded.followee_name;
  return jsonb_build_object('ok', true, 'on', true);
end $$;

-- 내 팔로우 목록 + 나를 팔로우하는 사람 수 (이름은 상대의 최근 자랑 이름이 있으면 그것)
create or replace function public.mdl_follow_list(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  return jsonb_build_object('ok', true,
    'followers', (select count(*) from mdl_contest.follows where followee = p_code),
    'following', coalesce((
      select jsonb_agg(jsonb_build_object('code', f.followee,
        'name', coalesce((select b.writer_name from mdl_contest.brags b where b.writer = f.followee order by b.created_at desc limit 1), f.followee_name),
        'at', f.created_at) order by f.created_at desc)
      from mdl_contest.follows f where f.follower = p_code), '[]'::jsonb));
end $$;

revoke all on function public.mdl_follow(text, text, text, text, boolean) from public;
revoke all on function public.mdl_follow_list(text, text) from public;
grant execute on function public.mdl_follow(text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.mdl_follow_list(text, text) to anon, authenticated;
