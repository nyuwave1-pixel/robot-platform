"""Settings, database session, job runner (lock + retry + log)."""
from __future__ import annotations

import os
import time
import traceback
from contextlib import contextmanager
from datetime import timedelta
from pathlib import Path
from typing import Callable

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from .models import AutomationJob, AutomationSchedule, Base, SystemLog, now

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{DATA / 'engine.db'}"
# Hosted Postgres (Supabase, Neon …) hands out postgres:// or postgresql:// URLs; use the psycopg 3 driver for both.
for _prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefix):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(_prefix):]
USER_AGENT = "UNICORE-SEO-Engine/0.1 (+https://promotion.unincore.com; brand-owned tool)"
PROMO_SITE = os.environ.get("PROMO_SITE", "https://promotion.unincore.com")
SHOP_SITE = os.environ.get("SHOP_SITE", "https://us.unincore.com")

_engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(_engine, expire_on_commit=False)

# Directive §09 daily plan (Asia/Seoul). `job` is the engine job that implements the step.
DEFAULT_SCHEDULE = [
    ("connections", "00:55", "API 연결 상태 점검"),
    ("sync_products", "01:00", "제품 데이터 동기화 (us.unincore.com)"),
    ("seo_audit", "01:20", "사이트 SEO 상태 점검"),
    ("discover_keywords", "02:00", "신규 키워드 분석 · 우선순위 선정"),
    ("gemini_content", "03:00", "Gemini 콘텐츠 · 이미지 분석"),
    ("creatives", "04:00", "Canva 디자인 · Higgsfield 영상 요청"),
    ("publish", "05:00", "승인된 SEO 변경을 사이트 파일에 반영"),
    ("performance", "06:00", "Search Console · Naver · Amazon 성과 수집"),
    ("report", "07:00", "통합 리포트 생성"),
]


def init_db() -> None:
    DATA.mkdir(exist_ok=True)
    Base.metadata.create_all(_engine)
    with session() as s:
        have = set(s.scalars(select(AutomationSchedule.job_name)))
        for name, t, desc in DEFAULT_SCHEDULE:
            if name not in have:
                s.add(AutomationSchedule(job_name=name, local_time=t, description=desc))


@contextmanager
def session():
    s: Session = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def log(area: str, message: str, level: str = "info") -> None:
    with session() as s:
        s.add(SystemLog(level=level, area=area, message=message[:4000]))


class WaitingConnection(Exception):
    """Raised by a job whose API is not connected. Recorded as waiting_connection, never as success."""


def run_job(name: str, fn: Callable[[], dict], retries: int = 3, lock_minutes: int = 120) -> AutomationJob:
    """Run one job: skip if the same job is already running, retry on failure, record everything."""
    with session() as s:
        running = s.scalars(
            select(AutomationJob).where(AutomationJob.name == name, AutomationJob.status == "running", AutomationJob.started_at > now() - timedelta(minutes=lock_minutes))
        ).first()
        if running:
            job = AutomationJob(name=name, status="skipped", error="already running (duplicate run prevented)", finished_at=now())
            s.add(job)
            return job
        job = AutomationJob(name=name, status="running")
        s.add(job)
        s.flush()
        job_id = job.id

    status, result, error, attempts = "failed", None, None, 0
    for attempt in range(1, retries + 1):
        attempts = attempt
        try:
            result = fn()
            status, error = "success", None
            break
        except WaitingConnection as e:
            status, error = "waiting_connection", str(e)
            break
        except Exception as e:  # noqa: BLE001 - job boundary
            error = f"{e}\n{traceback.format_exc(limit=3)}"
            if attempt < retries:
                time.sleep(min(2**attempt, 20))
    with session() as s:
        job = s.get(AutomationJob, job_id)
        job.status, job.result, job.error, job.attempts, job.finished_at = status, result, error, attempts, now()
        if isinstance(result, dict) and "cost" in result:
            job.cost = float(result["cost"] or 0)
    if status == "failed":
        log("jobs", f"{name} failed after {attempts} attempts: {error}", "error")
    return job
