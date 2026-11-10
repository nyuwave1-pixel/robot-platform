"""FastAPI app: JSON API + admin dashboard.

Run:  ENGINE_ADMIN_PASSWORD=... uvicorn engine.api:app --port 8100
Auth: HTTP Basic (user "admin"). Without ENGINE_ADMIN_PASSWORD only loopback clients are served.
"""
from __future__ import annotations

import os
import secrets
from pathlib import Path

from fastapi import Body, Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import func, select

from . import core, imports
from .jobs import JOBS
from .models import (
    ApiConnection, ApprovalRequest, AutomationJob, AutomationSchedule, ImageJob, Keyword, Product,
    ProductImage, SeoAuditLog, SeoPage, VideoJob,
)

core.init_db()
app = FastAPI(title="UNI&CORE AI SEO & Auto Marketing Engine", docs_url="/api/docs")
basic = HTTPBasic(auto_error=False)
tpl = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates"), autoescape=select_autoescape())

# Directive §16 phases with their real state. Update only when the phase actually runs end to end.
PHASES = [
    (1, "사이트 · 제품 데이터 분석", "done", "us.unincore.com 60개 제품 수집, promotion 사이트 감사"),
    (2, "통합 DB · 관리자 대시보드", "partial", "21개 테이블, 읽기 전용 대시보드. 편집 UI·권한 관리는 미구현"),
    (3, "Gemini 이미지 분석 · 키워드", "waiting", "키 인증 확인. 생성 호출은 Gemini 선불 크레딧 소진(402)으로 미검증. 키워드는 제품명 시드 + CSV 가져오기"),
    (4, "Google · Naver SEO 엔진", "partial", "promotion 사이트 감사·메타 백업 동작. 서치 콘솔 API 미연결"),
    (5, "Canva · Higgsfield 연동", "waiting", "API 키/OAuth 미연결. 작업 사양만 대기열 저장"),
    (6, "사이트 자동 반영 · 승인", "partial", "승인 → 검증 → 사이트 파일(seo-overrides.json) 반영 동작. 배포는 git push/Netlify에 따름"),
    (7, "Amazon 광고 데이터", "waiting", "Amazon Ads API 권한 필요. 테이블만 준비"),
    (8, "매일 자동 실행", "partial", "일일 파이프라인 동작(잠금·재시도·로그). GitHub Actions 워크플로 포함"),
    (9, "통합 테스트 · 보안", "partial", "단위 테스트, Basic 인증. 보안 검증은 미완"),
    (10, "운영 배포", "todo", "호스팅·PostgreSQL 결정 필요"),
]


def guard(request: Request, cred: HTTPBasicCredentials | None = Depends(basic)) -> None:
    pw = os.environ.get("ENGINE_ADMIN_PASSWORD")
    if not pw:
        if request.client and request.client.host in ("127.0.0.1", "::1", "testclient"):
            return
        raise HTTPException(503, "Set ENGINE_ADMIN_PASSWORD before exposing the dashboard")
    if not cred or cred.username != "admin" or not secrets.compare_digest(cred.password, pw):
        raise HTTPException(401, "auth required", headers={"WWW-Authenticate": "Basic"})


def summary() -> dict:
    with core.session() as s:
        n = lambda m, *w: s.scalar(select(func.count()).select_from(m).where(*w)) or 0  # noqa: E731
        last = {}
        for j in s.scalars(select(AutomationJob).order_by(AutomationJob.id.desc()).limit(60)):
            last.setdefault(j.name, j)
        done = [j for j in last.values() if j.status in ("success", "failed")]
        return {
            "kpi": {
                "products": n(Product),
                "images": n(ProductImage),
                "keywords": n(Keyword),
                "seo_pages": n(SeoPage),
                "open_issues": n(SeoAuditLog, SeoAuditLog.resolved.is_(False)),
                "image_jobs_waiting": n(ImageJob, ImageJob.status == "waiting_connection"),
                "video_jobs_waiting": n(VideoJob, VideoJob.status == "waiting_connection"),
                "approvals_pending": n(ApprovalRequest, ApprovalRequest.status == "pending"),
                "job_success_rate": round(100 * sum(j.status == "success" for j in done) / len(done)) if done else None,
                "api_cost": round(s.scalar(select(func.sum(AutomationJob.cost))) or 0, 2),
                # Not measured until a real source is connected — shown as "미연결", never estimated.
                "google_impressions": None, "google_clicks": None, "avg_position": None, "naver_visits": None,
            },
            "connections": [{"provider": c.provider, "status": c.status, "detail": c.detail, "env": c.required_env or [], "fallback": c.fallback} for c in s.scalars(select(ApiConnection).order_by(ApiConnection.provider))],
            "schedule": [{"job": a.job_name, "time": a.local_time, "enabled": a.enabled, "desc": a.description, "last": getattr(last.get(a.job_name), "status", "never"), "note": ((last[a.job_name].error or "").splitlines()[0][:160] if a.job_name in last and last[a.job_name].error else "")} for a in s.scalars(select(AutomationSchedule).order_by(AutomationSchedule.local_time))],
            "products": [{"id": p.id, "name": p.name, "category": p.category, "price": p.price, "asin": p.amazon_asin, "url": p.url, "image": s.scalar(select(ProductImage.url).where(ProductImage.product_id == p.id, ProductImage.kind == "packshot").limit(1)), "keywords": n(Keyword, Keyword.product_id == p.id)} for p in s.scalars(select(Product).order_by(Product.category, Product.name))],
            "pages": [{"url": p.url, "status": p.status_code, "issues": p.issue_count} for p in s.scalars(select(SeoPage).order_by(SeoPage.url))],
            "approvals": [{"id": a.id, "product_id": a.product_id, "target": a.target, "change": a.change, "protected": a.protected, "status": a.status} for a in s.scalars(select(ApprovalRequest).order_by(ApprovalRequest.id.desc()).limit(30))],
            "phases": [{"n": a, "name": b, "state": c, "note": d} for a, b, c, d in PHASES],
        }


@app.get("/", response_class=HTMLResponse, dependencies=[Depends(guard)])
def dashboard():
    return tpl.get_template("dashboard.html").render(**summary())


@app.get("/api/summary", dependencies=[Depends(guard)])
def api_summary():
    return summary()


@app.get("/api/keywords", dependencies=[Depends(guard)])
def api_keywords(product_id: str | None = None, limit: int = 200):
    with core.session() as s:
        q = select(Keyword).order_by(Keyword.priority.desc(), Keyword.keyword).limit(min(limit, 1000))
        if product_id:
            q = q.where(Keyword.product_id == product_id)
        return [{"keyword": k.keyword, "product_id": k.product_id, "group": k.group, "intent": k.intent, "source": k.source, "priority": k.priority, "search_volume": None} for k in s.scalars(q)]


@app.post("/api/jobs/{name}/run", dependencies=[Depends(guard)])
def api_run(name: str):
    if name not in JOBS:
        raise HTTPException(404, "unknown job")
    j = core.run_job(name, JOBS[name])
    return {"job": name, "status": j.status, "result": j.result, "error": (j.error or "")[:300]}


@app.patch("/api/schedule/{name}", dependencies=[Depends(guard)])
def api_schedule(name: str, local_time: str | None = None, enabled: bool | None = None):
    import re

    with core.session() as s:
        row = s.scalars(select(AutomationSchedule).where(AutomationSchedule.job_name == name)).first()
        if not row:
            raise HTTPException(404, "unknown job")
        if local_time is not None:
            if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", local_time):
                raise HTTPException(422, "local_time must be HH:MM")
            row.local_time = local_time
        if enabled is not None:
            row.enabled = enabled
        return {"job": row.job_name, "time": row.local_time, "enabled": row.enabled}


@app.post("/api/import/gsc-queries", dependencies=[Depends(guard)])
def api_import_gsc(csv_text: str = Body(..., media_type="text/csv"), site: str = core.PROMO_SITE, country: str = "US"):
    """Upload Search Console → Performance → Export → Queries.csv as the request body."""
    return imports.import_gsc_queries(csv_text, site, country)


@app.post("/api/import/amazon-search-terms", dependencies=[Depends(guard)])
def api_import_amazon(csv_text: str = Body(..., media_type="text/csv"), country: str = "US"):
    """Upload an Amazon Ads Sponsored Products search-term report (CSV) as the request body."""
    return imports.import_amazon_search_terms(csv_text, country)


@app.post("/api/approvals", dependencies=[Depends(guard)])
def api_create_approval(product_id: str = Body(...), change: dict = Body(...), target: str = Body("site_seo")):
    """File a change for review. For target "site_seo", change may hold seoTitle, seoDescription, faq {q, a}."""
    from .publish import validate
    errs = validate(change) if target == "site_seo" and not (imports.PROTECTED_FIELDS & set(change)) else []
    if errs:
        raise HTTPException(422, errs)
    return {"id": imports.request_approval(target, change, product_id=product_id)}


@app.get("/api/approvals", dependencies=[Depends(guard)])
def api_approvals(status: str = "pending"):
    with core.session() as s:
        return [{"id": a.id, "product_id": a.product_id, "target": a.target, "change": a.change, "protected": a.protected, "status": a.status} for a in s.scalars(select(ApprovalRequest).where(ApprovalRequest.status == status).order_by(ApprovalRequest.id.desc()))]


@app.post("/api/approvals/{approval_id}/{action}", dependencies=[Depends(guard)])
def api_decide(approval_id: int, action: str, by: str = "admin"):
    if action not in ("approve", "reject"):
        raise HTTPException(404, "action must be approve or reject")
    try:
        return imports.decide(approval_id, action == "approve", by)
    except KeyError:
        raise HTTPException(404, "unknown approval") from None
    except ValueError as e:
        raise HTTPException(409, str(e)) from None
