-- BEAUTY LIFE (뷰티 라이프): 친구 접속 상태 (지금 접속 중 · 오늘 접속)
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_presence" 로 적용한 것과 같은 내용 (기록용).
--  - 게임이 켜져 있는 동안 5분마다 mdl_ping 으로 마지막 접속 시각을 남긴다 (본인 확인)
--  - 팔로우 목록에는 정확한 시각 대신 거친 상태만 준다: 'on'(7분 안) · 'day'(24시간 안) · 없음
alter table mdl_contest.players add column if not exists last_seen timestamptz;

create or replace function public.mdl_ping(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update mdl_contest.players set last_seen = now()
   where code = p_code and (last_seen is null or last_seen < now() - interval '1 minute');
  return jsonb_build_object('ok', true);
end $$;

-- 내 팔로우 목록 + 나를 팔로우하는 사람 수 + 상대의 접속 상태
create or replace function public.mdl_follow_list(p_code text, p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  return jsonb_build_object('ok', true,
    'followers', (select count(*) from mdl_contest.follows where followee = p_code),
    'following', coalesce((
      select jsonb_agg(jsonb_build_object('code', f.followee,
        'name', coalesce((select b.writer_name from mdl_contest.brags b where b.writer = f.followee order by b.created_at desc limit 1), f.followee_name),
        'at', f.created_at,
        'seen', case when p.last_seen > now() - interval '7 minutes' then 'on'
                     when p.last_seen > now() - interval '24 hours' then 'day' end) order by f.created_at desc)
      from mdl_contest.follows f join mdl_contest.players p on p.code = f.followee
      where f.follower = p_code), '[]'::jsonb));
end $$;

revoke all on function public.mdl_ping(text, text) from public;
grant execute on function public.mdl_ping(text, text) to anon, authenticated;
