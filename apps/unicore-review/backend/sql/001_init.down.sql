-- 롤백: 후기 이벤트 스키마 전체 삭제. 참여자·사진 메타·지급 기록이 모두 사라진다 — 먼저 백업.
-- 사진 파일은 Storage 버킷 birthday-review-images 를 따로 비운다.
DROP SCHEMA IF EXISTS birthday_review CASCADE;
