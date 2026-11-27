// 관리자 API 경로 (/admin/*) — 계정·세션 + 프로모션 관리(/admin/promo/*)
// 인증: 개인 관리자 세션 토큰(Authorization: Bearer …) + 2단계 인증. 변경 요청은 x-br-csrf 헤더 필수(공통 라우터).
import * as XLSX from "xlsx";
import { ok, readJson } from "./core.ts";
import { idParam, type Ctx } from "./router.ts";
import * as A from "./admin.ts";
import * as AU from "./auth.ts";

type R = { get: (p: string, h: (c: Ctx) => Promise<Response>) => void; post: (p: string, h: (c: Ctx) => Promise<Response>) => void; patch: (p: string, h: (c: Ctx) => Promise<Response>) => void; del: (p: string, h: (c: Ctx) => Promise<Response>) => void };

export function registerPromoRoutes(r: R) {
  const act = (c: Ctx, perm: string) => A.promoActor(c.req, perm);
  const body = (c: Ctx) => readJson(c.req, 64 * 1024);

  // 계정·세션
  r.get("/setup", async () => ok(await AU.setupStatus()));
  r.post("/bootstrap", async (c) => ok(await AU.bootstrap(c.req, await body(c)), 201));
  r.post("/login", async (c) => ok(await AU.login(c.req, await body(c))));
  r.post("/logout", async (c) => ok(await AU.logout(c.req)));
  r.get("/me", async (c) => { const a = await AU.currentAdmin(c.req); return ok(a ? { loggedIn: true, ...AU.meView(a) } : { loggedIn: false }); });
  r.post("/mfa/setup", async (c) => ok(await AU.mfaSetup(c.req)));
  r.post("/mfa/enable", async (c) => ok(await AU.mfaConfirm(c.req, await body(c), true)));
  r.post("/mfa/verify", async (c) => ok(await AU.mfaConfirm(c.req, await body(c), false)));
  r.post("/password", async (c) => ok(await AU.changeOwnPassword(c.req, await body(c))));
  r.get("/admins", async (c) => { await AU.requireAdmin(c.req, "admins.manage"); return ok(await AU.listAdmins()); });
  r.post("/admins", async (c) => ok(await AU.createAdmin(c.req, await body(c)), 201));
  r.patch("/admins/:id", async (c) => ok(await AU.updateAdmin(c.req, idParam(c), await body(c))));

  r.get("/promo/me", async (c) => ok(A.me(await act(c, "promo.read"))));
  r.get("/promo/meta", async (c) => { await act(c, "promo.read"); return ok(A.META); });

  // 이벤트·설정
  r.get("/promo/events", async (c) => { await act(c, "promo.read"); return ok(await A.listEvents()); });
  r.get("/promo/event", async (c) => { await act(c, "promo.read"); return ok(await A.getEvent()); });
  r.patch("/promo/event", async (c) => ok(await A.updateEvent(await act(c, "promo.settings"), await body(c))));

  // 대시보드·통계
  r.get("/promo/dashboard", async (c) => ok(await A.dashboard(await act(c, "promo.read"))));
  r.get("/promo/stats", async (c) => ok(await A.stats(await act(c, "promo.read"))));

  // 참여자·후기
  r.get("/promo/reviews", async (c) => ok(await A.listReviews(await act(c, "promo.read"), c.url.searchParams)));
  r.get("/promo/reviews.xlsx", async (c) => {
    const a = await act(c, "promo.export");
    const x = await A.exportRows(a, c.url.searchParams);
    const ws = XLSX.utils.aoa_to_sheet([x.header, ...x.data]);
    ws["!cols"] = x.header.map((h) => ({ wch: /내용|주소|이유|메모|사유/.test(h) ? 40 : /제목|구매정보/.test(h) ? 26 : 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "후기 이벤트 참여자");
    const buf = new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
    return new Response(buf, { headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="birthday-review-${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}.xlsx"`,
      "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  });
  r.post("/promo/reviews/bulk-status", async (c) => ok(await A.bulkReviewStatus(await act(c, "promo.review"), await body(c))));
  r.get("/promo/reviews/:id", async (c) => ok(await A.reviewDetail(await act(c, "promo.read"), idParam(c))));
  r.patch("/promo/reviews/:id", async (c) => ok(await A.editReview(await act(c, "promo.edit"), idParam(c), await body(c))));
  r.post("/promo/reviews/:id/status", async (c) => ok(await A.setReviewStatus(await act(c, "promo.review"), idParam(c), await body(c))));
  r.post("/promo/reviews/:id/candidate", async (c) => ok(await A.setCandidate(await act(c, "promo.review"), idParam(c), await body(c))));
  r.post("/promo/reviews/:id/memo", async (c) => ok(await A.setMemo(await act(c, "promo.review"), idParam(c), await body(c))));
  r.post("/promo/reviews/:id/flag", async (c) => ok(await A.setFlag(await act(c, "promo.review"), idParam(c), await body(c))));
  r.post("/promo/reviews/:id/purge", async (c) => ok(await A.purgeReview(await act(c, "promo.purge"), idParam(c), await body(c))));

  // 재참여 예외 승인
  r.get("/promo/reentries", async (c) => { await act(c, "promo.edit"); return ok(await A.listReentries()); });
  r.post("/promo/reentries", async (c) => ok(await A.grantReentry(await act(c, "promo.edit"), await body(c)), 201));
  r.del("/promo/reentries/:id", async (c) => ok(await A.revokeReentry(await act(c, "promo.edit"), idParam(c))));

  // 우수 후기 선정
  r.get("/promo/winners", async (c) => ok(await A.listWinners(await act(c, "promo.read"))));
  r.post("/promo/winners", async (c) => ok(await A.selectWinner(await act(c, "promo.winner"), await body(c)), 201));
  r.post("/promo/winners/confirm", async (c) => ok(await A.confirmWinners(await act(c, "promo.winner"), await body(c))));
  r.post("/promo/winners/:id/cancel", async (c) => ok(await A.cancelWinner(await act(c, "promo.winner"), idParam(c), await body(c))));
  r.post("/promo/winners/:id/rank", async (c) => ok(await A.setWinnerRank(await act(c, "promo.winner"), idParam(c), await body(c))));

  // 사은품 지급
  r.get("/promo/rewards", async (c) => ok(await A.listRewards(await act(c, "promo.read"), c.url.searchParams)));
  r.post("/promo/rewards/issue-participation", async (c) => ok(await A.issueParticipation(await act(c, "promo.reward"))));
  r.post("/promo/rewards/bulk-status", async (c) => ok(await A.bulkRewardStatus(await act(c, "promo.reward"), await body(c))));
  r.patch("/promo/rewards/:id", async (c) => ok(await A.updateReward(await act(c, "promo.reward"), idParam(c), await body(c))));
  r.post("/promo/rewards/:id/status", async (c) => ok(await A.setRewardStatus(await act(c, "promo.reward"), idParam(c), await body(c))));

  // 개인정보 보유·파기, 활동 로그
  r.get("/promo/retention", async (c) => { await act(c, "promo.purge"); return ok(await A.retentionSummary()); });
  r.post("/promo/retention/purge-expired", async (c) => ok(await A.purgeExpired(await act(c, "promo.purge"), await body(c))));
  r.get("/promo/logs", async (c) => { await act(c, "promo.logs"); return ok(await A.listLogs(c.url.searchParams)); });

  // 사진: 권한 검사를 거쳐 발급된 서명 URL(5분)로만 열린다 — 주소를 추측해서는 접근할 수 없다
  r.get("/promo/images/:id/file", async (c) => {
    const f = await A.imageFile(idParam(c), c.url.searchParams);
    return new Response(f.bytes, { headers: {
      "content-type": f.mime, "content-disposition": `${f.download ? "attachment" : "inline"}; filename="${f.filename}"`,
      "cache-control": "private, no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox", "x-robots-tag": "noindex" } });
  });
}
