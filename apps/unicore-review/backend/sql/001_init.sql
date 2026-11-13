-- UNI&CORE 1ST BIRTHDAY CREAM 구매 후기 이벤트 — 전용 스키마 (2026-11-13)
-- 같은 Supabase 프로젝트의 다른 테이블(public 스키마)과 섞이지 않도록 birthday_review 스키마에만 만든다.
-- 이 스키마는 Data API(PostgREST)에 노출하지 않으며, Edge Function 이 DB 에 직접 연결해 쓴다.
-- 롤백: sql/001_init.down.sql
CREATE SCHEMA IF NOT EXISTS birthday_review;
REVOKE ALL ON SCHEMA birthday_review FROM anon, authenticated;
SET search_path = birthday_review;

CREATE OR REPLACE FUNCTION birthday_review.mp_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = birthday_review AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

-- 서버 설정 (암호화 키 재료·최초 설정 코드 등). 외부로 내보내지 않는다.
CREATE TABLE app_config (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- 암호화 키 재료: DB 안에서 무작위로 만든다(어디에도 출력하지 않음). 실제 키 = 이 값 + 서버 비밀값(서비스 키)의 해시.
INSERT INTO app_config (key, value) VALUES ('key_salt', jsonb_build_object('v', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')));

-- 속도 제한 (고정 창)
CREATE TABLE rate_limits (
  bucket       text NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

-- 관리자 계정 · 세션
CREATE TABLE admin_users (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           text NOT NULL,
  name            text NOT NULL,
  password_hash   text NOT NULL,
  role            text NOT NULL CHECK (role IN ('SUPER','PROMO_MANAGER','DISTRIBUTOR','VIEWER')),
  distributor_code text,                      -- 총판 관리자가 볼 수 있는 총판 코드
  totp_secret_enc text,
  mfa_enabled     boolean NOT NULL DEFAULT false,
  active          boolean NOT NULL DEFAULT true,
  failed_logins   integer NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  created_by      bigint REFERENCES admin_users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_email_uq ON admin_users (lower(email));
CREATE TRIGGER admin_users_touch BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION birthday_review.mp_touch_updated_at();
CREATE TABLE admin_sessions (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash   text NOT NULL UNIQUE,
  admin_id     bigint NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  mfa_passed   boolean NOT NULL DEFAULT false,
  ip_hash      text,
  user_agent   text,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 이벤트 ------------------------------------------------------------------------------------
CREATE TABLE promotion_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug          text NOT NULL UNIQUE,
  event_name    text NOT NULL,
  event_type    text NOT NULL DEFAULT 'REVIEW' CHECK (event_type IN ('REVIEW')),
  start_date    timestamptz,
  end_date      timestamptz,
  event_status  text NOT NULL DEFAULT 'DRAFT' CHECK (event_status IN ('DRAFT','OPEN','CLOSED')),
  settings      jsonb NOT NULL DEFAULT '{}'::jsonb,       -- 글자 수·사진 필수 여부·용량·당첨 인원·보유 기간 등 운영 설정
  reward_policy jsonb NOT NULL DEFAULT '{}'::jsonb,       -- 지급 정책(상품명·수량·중복 지급 여부)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER promotion_events_touch BEFORE UPDATE ON promotion_events FOR EACH ROW EXECUTE FUNCTION birthday_review.mp_touch_updated_at();

CREATE SEQUENCE birthday_review_no_seq START 1;

-- 후기(참여) --------------------------------------------------------------------------------
-- 개인정보: 휴대폰·주소는 AES-GCM 암호문(_enc)으로만 저장. 중복 검사·검색은 HMAC 해시(phone_hash)와 끝 4자리로 수행.
CREATE TABLE birthday_reviews (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id            bigint NOT NULL REFERENCES promotion_events(id),
  application_number  text NOT NULL UNIQUE,                -- 접수 번호 (BD261113-00001)
  entry_no            integer NOT NULL DEFAULT 1,          -- 같은 사람의 n번째 접수 (관리자 예외 승인 시에만 2 이상)
  -- 유니앤코어 쇼핑몰 회원 정보는 본인 입력값(미검증). 쇼핑몰 회원 DB 와 연동되면 member_id 를 채운다.
  member_claimed      boolean NOT NULL DEFAULT false,
  member_login_id     text,
  member_id           bigint,
  distributor_code    text,                                -- 유입 총판 코드(링크 ?d=코드). 총판 관리자 조회 범위
  applicant_name      text,
  phone_enc           text,
  phone_hash          text,
  phone_last4         text,
  order_number        text,
  order_number_norm   text,
  postal_code         text,
  address_enc         text,
  review_title        text NOT NULL,
  review_content      text NOT NULL,
  rating              smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),                       -- 제품 만족도
  rating_experience   smallint CHECK (rating_experience IS NULL OR rating_experience BETWEEN 1 AND 5), -- 사용 경험
  skin_type           text,
  usage_period        text,
  recommend_reason    text,
  review_status       text NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING','APPROVED','REJECTED','REVISION_REQUESTED')),
  status_reason       text,
  is_candidate        boolean NOT NULL DEFAULT false,      -- 우수 후기 후보
  duplicate_flag      boolean NOT NULL DEFAULT false,      -- 중복·부정 참여 의심 (관리자 확인 대상)
  duplicate_reason    text,
  duplicate_cleared_at timestamptz,
  privacy_consent     boolean NOT NULL DEFAULT false,
  image_marketing_consent boolean NOT NULL DEFAULT false,
  admin_memo          text,
  is_test             boolean NOT NULL DEFAULT false,      -- 테스트 접수(운영 통계·지급에서 제외)
  ip_hash             text,
  user_agent          text,
  retention_until     date,                                -- 개인정보 보유 기한
  purged_at           timestamptz,                         -- 개인정보 파기 일시
  version             integer NOT NULL DEFAULT 1,
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- 중복 접수 차단: 같은 이벤트·같은 휴대폰은 접수 차수(entry_no)당 1건. 동시 요청도 DB 가 막는다.
CREATE UNIQUE INDEX birthday_reviews_phone_uq ON birthday_reviews (event_id, phone_hash, entry_no) WHERE phone_hash IS NOT NULL;
CREATE INDEX birthday_reviews_event_idx ON birthday_reviews (event_id, submitted_at DESC);
CREATE INDEX birthday_reviews_order_idx ON birthday_reviews (event_id, order_number_norm) WHERE order_number_norm IS NOT NULL;
CREATE INDEX birthday_reviews_status_idx ON birthday_reviews (event_id, review_status);
CREATE INDEX birthday_reviews_dist_idx ON birthday_reviews (event_id, distributor_code);
CREATE TRIGGER birthday_reviews_touch BEFORE UPDATE ON birthday_reviews FOR EACH ROW EXECUTE FUNCTION birthday_review.mp_touch_updated_at();

-- 동의 기록 (항목별 동의 여부·문서 버전·일시)
CREATE TABLE birthday_review_consents (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id     bigint NOT NULL REFERENCES birthday_reviews(id) ON DELETE CASCADE,
  consent_type  text NOT NULL CHECK (consent_type IN ('PRIVACY_COLLECT','EVENT_PROCESSING','GIFT_SHIPPING','MARKETING_USE')),
  required      boolean NOT NULL,
  agreed        boolean NOT NULL,
  version       text NOT NULL,
  agreed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, consent_type)
);

-- 사용 전/후 사진 (비공개 저장소 키만 보관. review_id 가 NULL 이면 아직 접수에 묶이지 않은 임시 업로드)
CREATE TABLE birthday_review_images (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id          bigint NOT NULL REFERENCES promotion_events(id),
  review_id         bigint REFERENCES birthday_reviews(id) ON DELETE CASCADE,
  image_type        text NOT NULL CHECK (image_type IN ('BEFORE','AFTER')),
  storage_path      text NOT NULL UNIQUE,
  original_filename text,
  file_size         integer NOT NULL CHECK (file_size > 0),
  mime_type         text NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  width             integer,
  height            integer,
  sha256            text,
  upload_token_hash text,                                  -- 임시 업로드 소유 증명 (접수 시 소멸)
  ip_hash           text,
  deleted_at        timestamptz,                           -- 파기(파일 삭제) 일시
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX birthday_review_images_one_per_type ON birthday_review_images (review_id, image_type) WHERE review_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX birthday_review_images_pending_idx ON birthday_review_images (created_at) WHERE review_id IS NULL;

-- 동일 고객 재참여 예외 승인
CREATE TABLE birthday_review_reentries (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id      bigint NOT NULL REFERENCES promotion_events(id),
  phone_hash    text NOT NULL,
  phone_last4   text,
  reason        text NOT NULL,
  granted_by    bigint REFERENCES admin_users(id),
  granted_label text NOT NULL,
  used_review_id bigint REFERENCES birthday_reviews(id) ON DELETE SET NULL,
  used_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX birthday_review_reentries_idx ON birthday_review_reentries (event_id, phone_hash) WHERE used_at IS NULL;

-- 우수 후기 선정
CREATE TABLE birthday_review_winners (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id        bigint NOT NULL REFERENCES promotion_events(id),
  review_id       bigint NOT NULL UNIQUE REFERENCES birthday_reviews(id),
  winner_rank     integer NOT NULL CHECK (winner_rank >= 1),
  status          text NOT NULL DEFAULT 'SELECTED' CHECK (status IN ('SELECTED','CONFIRMED')),
  selection_note  text,
  selected_by     bigint REFERENCES admin_users(id),
  selected_label  text NOT NULL,
  selected_at     timestamptz NOT NULL DEFAULT now(),
  confirmed_at    timestamptz,
  UNIQUE (event_id, winner_rank)
);

-- 사은품 지급 (후기 1건당 보상 종류별 1행 — UNIQUE 로 중복 지급 차단)
CREATE TABLE birthday_review_rewards (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id         bigint NOT NULL REFERENCES promotion_events(id),
  review_id        bigint NOT NULL REFERENCES birthday_reviews(id),
  reward_type      text NOT NULL CHECK (reward_type IN ('PARTICIPATION','WINNER')),
  product_name     text NOT NULL,
  quantity         integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
  reward_status    text NOT NULL DEFAULT 'ELIGIBLE' CHECK (reward_status IN ('ELIGIBLE','PREPARING','SHIP_READY','SHIPPING','DELIVERED','ON_HOLD','CANCELED')),
  recipient_name   text,
  recipient_phone_enc text,
  postal_code      text,
  shipping_address_enc text,
  carrier          text,
  tracking_number  text,
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  note             text,
  version          integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, reward_type)
);
CREATE INDEX birthday_review_rewards_status_idx ON birthday_review_rewards (event_id, reward_type, reward_status);
CREATE TRIGGER birthday_review_rewards_touch BEFORE UPDATE ON birthday_review_rewards FOR EACH ROW EXECUTE FUNCTION birthday_review.mp_touch_updated_at();

-- 관리자 활동 로그 (상태 변경 이력·처리 담당자)
CREATE TABLE promotion_admin_logs (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id       bigint REFERENCES promotion_events(id),
  actor_type     text NOT NULL CHECK (actor_type IN ('ADMIN','SYSTEM','PARTICIPANT')),
  admin_id       bigint REFERENCES admin_users(id),
  actor_label    text NOT NULL,
  action_type    text NOT NULL,
  target_type    text,
  target_id      text,
  previous_value jsonb,
  new_value      jsonb,
  reason         text,
  ip_hash        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX promotion_admin_logs_target_idx ON promotion_admin_logs (target_type, target_id, id DESC);
CREATE INDEX promotion_admin_logs_event_idx ON promotion_admin_logs (event_id, id DESC);

-- 기본 이벤트 — 처음에는 '접수 마감' 상태. 관리자 화면 > 벌스데이 크림 후기 이벤트 에서 기간을 정하고 '접수 받기'로 바꾼다
INSERT INTO promotion_events (slug, event_name, event_type, event_status, settings, reward_policy) VALUES (
  'birthday-review', 'UNI&CORE 1ST BIRTHDAY CREAM 구매 후기 이벤트', 'REVIEW', 'CLOSED',
  '{"minChars":30,"maxChars":2000,"titleMaxChars":60,"requireImages":true,"requireOrderNumber":true,"requireAddress":true,
    "maxImageBytes":4194304,"maxImagePixels":6000,"winnerCount":3,"retentionDays":180,"consentVersion":"2026-11-13"}'::jsonb,
  '{"participation":{"productName":"프로틴 쉐이크 1박스","quantity":1},
    "winner":{"productName":"UNI&CORE 1ST BIRTHDAY CREAM 50g","quantity":1},
    "winnersAlsoGetParticipation":true}'::jsonb
);

-- 모든 테이블에 RLS 를 켜 둔다(정책 없음 = Data API 로는 아무 것도 못 읽음). 서버는 DB 소유자 권한으로 직접 연결한다.
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'birthday_review' LOOP
    EXECUTE format('ALTER TABLE birthday_review.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON birthday_review.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
RESET search_path;
