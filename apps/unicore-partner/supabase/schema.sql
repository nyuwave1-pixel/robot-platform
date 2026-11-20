-- UNI&CORE PARTNER (화이트라벨 사업자 사이트) — 최종 스키마
-- Supabase 프로젝트에 이미 적용됨 (마이그레이션: partner_platform_v1, partner_products_id_case,
-- site_platform_rename_and_fix_checks, site_platform_grants, site_profiles_anon_column_grant, site_photo_select_own_folder).
-- 기존 ERP 의 partners/partner_* 테이블과 구분하기 위해 site_ 접두사를 쓴다. 기존 테이블은 건드리지 않는다.

create table public.site_hq_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.site_hq_admins enable row level security;

create or replace function public.site_is_hq_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.site_hq_admins where user_id = (select auth.uid())) $$;
revoke all on function public.site_is_hq_admin() from public;
grant execute on function public.site_is_hq_admin() to anon, authenticated;

create policy "hq admins read own row" on public.site_hq_admins for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.site_valid_sns(j jsonb)
returns boolean language sql immutable set search_path = ''
as $$
  select jsonb_typeof(j) = 'object'
     and not exists (
       select 1 from jsonb_each(j) e
       where e.key not in ('instagram','youtube','blog','facebook','tiktok','website','kakao_channel')
          or jsonb_typeof(e.value) <> 'string'
          or char_length(e.value #>> '{}') > 300
          or (e.value #>> '{}') !~ '^https://[^[:space:]<>"''`]{3,}$')
$$;

create or replace function public.site_valid_sections(j jsonb)
returns boolean language sql immutable set search_path = ''
as $$
  select jsonb_typeof(j) = 'array'
     and jsonb_array_length(j) <= 8
     and not exists (
       select 1 from jsonb_array_elements(j) e
       where jsonb_typeof(e) <> 'string'
          or (e #>> '{}') not in ('hero','about','products','contact','sns','qr'))
$$;

-- 본사 공식 제품 (사업자는 읽기만)
create table public.site_hq_products (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 120),
  tagline text check (char_length(tagline) <= 200),
  description text check (char_length(description) <= 2000),
  image_url text check (char_length(image_url) <= 400 and image_url ~ '^(https://|/)[^[:space:]<>"''`]+$'),
  shop_url text check (char_length(shop_url) <= 400 and shop_url ~ '^https://[^[:space:]<>"''`]{3,}$'),
  certifications text check (char_length(certifications) <= 500),
  clinical_note text check (char_length(clinical_note) <= 1000),
  sort integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.site_hq_products enable row level security;
create policy "products readable" on public.site_hq_products for select to anon, authenticated using (published or (select public.site_is_hq_admin()));
create policy "hq inserts products" on public.site_hq_products for insert to authenticated with check ((select public.site_is_hq_admin()));
create policy "hq updates products" on public.site_hq_products for update to authenticated using ((select public.site_is_hq_admin())) with check ((select public.site_is_hq_admin()));
create policy "hq deletes products" on public.site_hq_products for delete to authenticated using ((select public.site_is_hq_admin()));

-- 사업자 페이지
create table public.site_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
       and slug not in ('admin','hq','studio','login','logout','api','p','www','unicore','unincore','help','about','terms','privacy')),
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  display_name text not null check (char_length(display_name) between 1 and 60),
  title text check (char_length(title) <= 80),
  business_name text check (char_length(business_name) <= 100),
  bio text check (char_length(bio) <= 1500),
  phone text check (char_length(phone) <= 30 and phone ~ '^[0-9+() -]*$'),
  email text check (char_length(email) <= 120 and (email = '' or email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$')),
  address text check (char_length(address) <= 200),
  photo_path text check (photo_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$'),
  sns jsonb not null default '{}'::jsonb constraint site_profiles_sns_check check (public.site_valid_sns(sns)),
  design text not null default 'luxury_black' check (design in ('luxury_black','premium_white')),
  sections jsonb not null default '["hero","about","products","sns","contact","qr"]'::jsonb constraint site_profiles_sections_check check (public.site_valid_sections(sections)),
  product_ids text[] not null default '{}' check (cardinality(product_ids) <= 12),
  seo_description text check (char_length(seo_description) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create index site_profiles_status_idx on public.site_profiles (status);
alter table public.site_profiles enable row level security;

-- 사업자는 승인 상태·소유자를 바꿀 수 없다. 승인 후 주소(slug)를 바꾸면 다시 심사 대기.
create or replace function public.site_profiles_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare is_admin boolean := public.site_is_hq_admin();
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if not is_admin then
      new.owner_id := auth.uid();
      new.status := 'pending';
      new.approved_at := null;
    end if;
  else
    new.owner_id := old.owner_id;
    new.created_at := old.created_at;
    if not is_admin then
      new.status := old.status;
      new.approved_at := old.approved_at;
      if new.slug <> old.slug and old.status = 'approved' then
        new.status := 'pending';
      end if;
    end if;
  end if;
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status <> 'approved') then
    new.approved_at := now();
  end if;
  return new;
end $$;
create trigger site_profiles_guard before insert or update on public.site_profiles for each row execute function public.site_profiles_guard();

create policy "approved pages are public" on public.site_profiles for select to anon, authenticated
  using (status = 'approved' or owner_id = (select auth.uid()) or (select public.site_is_hq_admin()));
create policy "owner creates own page" on public.site_profiles for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner or hq updates" on public.site_profiles for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.site_is_hq_admin()))
  with check (owner_id = (select auth.uid()) or (select public.site_is_hq_admin()));
create policy "owner or hq deletes" on public.site_profiles for delete to authenticated
  using (owner_id = (select auth.uid()) or (select public.site_is_hq_admin()));

-- 권한: 비로그인은 공개 열만 (owner_id 제외)
grant usage on schema public to anon, authenticated;
revoke all on public.site_profiles from anon;
grant select (id, slug, status, display_name, title, business_name, bio, phone, email, address, photo_path, sns, design, sections, product_ids, seo_description, updated_at, approved_at) on public.site_profiles to anon;
grant select, insert, update, delete on public.site_profiles to authenticated;
revoke all on public.site_hq_products from anon;
grant select on public.site_hq_products to anon;
grant select, insert, update, delete on public.site_hq_products to authenticated;
revoke all on public.site_hq_admins from anon;
grant select on public.site_hq_admins to authenticated;

-- 사진 저장소: 공개 읽기, 본인 폴더(auth.uid)에만 쓰기, 5MB·JPG/PNG/WEBP 제한
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partner-photos', 'partner-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- 본인 폴더 목록 조회 (삭제가 동작하려면 조회 권한이 필요). 공개 URL 읽기는 버킷 public 설정으로 가능.
create policy "site photo list own folder" on storage.objects for select to authenticated
  using (bucket_id = 'partner-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.site_is_hq_admin())));
create policy "site photo upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.site_is_hq_admin())));
create policy "site photo update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'partner-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.site_is_hq_admin())));
create policy "site photo delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'partner-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.site_is_hq_admin())));

-- 본사 관리자 지정 (가입한 계정의 이메일로):
-- insert into public.site_hq_admins (user_id) select id from auth.users where email = '<본사 관리자 이메일>';
