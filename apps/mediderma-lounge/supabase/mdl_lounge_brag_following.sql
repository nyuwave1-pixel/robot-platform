-- BEAUTY LIFE (뷰티 라이프): 팔로잉 피드 — 내가 팔로우한 플레이어의 자랑만 (최근 40개)
-- Supabase 프로젝트에 마이그레이션 "mdl_lounge_brag_following" 로 적용한 것과 같은 내용 (기록용).
-- 팔로우 관계는 본인만 볼 수 있어야 하므로 본인 확인(mdl_contest.auth)을 거친다.
create or replace function public.mdl_brag_following(p_code text, p_secret text, p_kind text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not mdl_contest.auth(p_code, p_secret) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  return jsonb_build_object('ok', true, 'list', coalesce((
    select jsonb_agg(x order by x.at desc) from (
      select b.id, b.writer, b.writer_name as name, b.kind, b.msg, b.data, b.likes,
             exists(select 1 from mdl_contest.brag_likes l where l.brag_id = b.id and l.liker = p_code) as liked,
             b.created_at as at
      from mdl_contest.brags b
      join mdl_contest.follows f on f.followee = b.writer and f.follower = p_code
      where (p_kind is null or b.kind = p_kind)
      order by b.created_at desc
      limit 40
    ) x), '[]'::jsonb));
end $$;

revoke all on function public.mdl_brag_following(text, text, text) from public;
grant execute on function public.mdl_brag_following(text, text, text) to anon, authenticated;
