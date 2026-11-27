-- 접수한 사이트 언어. 영문 사이트(?lang=en) 접수는 회원 주소를 필수로 받는다.
ALTER TABLE birthday_review.birthday_reviews
  ADD COLUMN IF NOT EXISTS site_lang text NOT NULL DEFAULT 'ko' CHECK (site_lang IN ('ko','en'));
