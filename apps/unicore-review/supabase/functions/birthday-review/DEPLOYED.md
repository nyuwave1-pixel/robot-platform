# 배포된 Edge Function

- 프로젝트: Supabase `qeabsjyglethzkwlkmaw` · 함수 `birthday-review` · `verify_jwt` 끔(함수가 자체 인증)
- 주소: `https://qeabsjyglethzkwlkmaw.supabase.co/functions/v1/birthday-review`
- 배포된 진입 파일은 아래 한 줄짜리 로더이며, 이 폴더의 번들(`index.ts`)을 **커밋 해시로 고정**해 불러온다. 배포 시점에 함께 묶이므로 실행 중에는 GitHub 에 의존하지 않는다.

```ts
import "https://raw.githubusercontent.com/nyuwave1-pixel/robot-platform/<커밋 해시>/apps/unicore-review/supabase/functions/birthday-review/index.ts";
```

현재 배포: 커밋 `15b4755bb821cd6c359a33b7e88386a3a3fd4be2` (2026-11-13)

코드를 고친 뒤 다시 배포하려면: `backend` 에서 `npm run build` → 커밋·푸시 → 로더의 커밋 해시를 새 해시로 바꿔 배포.
