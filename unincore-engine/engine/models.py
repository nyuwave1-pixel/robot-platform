"""Database schema (SQLAlchemy 2.0). Works on SQLite (default) and PostgreSQL.

Everything hangs off products.id. Facts and AI-generated text are kept apart:
product_attributes.kind is "fact" (label / official page) or "ai" (generated copy).
Metrics columns are nullable on purpose: NULL means "not measured", never a guess.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class TS:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


def pk():
    return mapped_column(Integer, primary_key=True, autoincrement=True)


def product_fk(nullable: bool = True):
    return mapped_column(String(40), ForeignKey("products.id"), nullable=nullable, index=True)


class Product(Base, TS):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # e.g. UC-US-449
    source: Mapped[str] = mapped_column(String(40))  # us.unincore.com | csv | manual
    source_ref: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(300))
    category: Mapped[str | None] = mapped_column(String(120))
    product_code: Mapped[str | None] = mapped_column(String(60))
    price: Mapped[float | None] = mapped_column(Float)
    currency: Mapped[str | None] = mapped_column(String(8))
    url: Mapped[str | None] = mapped_column(String(500))
    amazon_asin: Mapped[str | None] = mapped_column(String(20))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ProductImage(Base, TS):
    __tablename__ = "product_images"
    __table_args__ = (UniqueConstraint("product_id", "url"),)
    id: Mapped[int] = pk()
    product_id: Mapped[str] = product_fk(False)
    url: Mapped[str] = mapped_column(String(700))
    kind: Mapped[str] = mapped_column(String(20))  # packshot | detail
    alt_text: Mapped[str | None] = mapped_column(String(300))
    locked: Mapped[bool] = mapped_column(Boolean, default=True)  # originals are never AI-edited


class ProductAttribute(Base, TS):
    __tablename__ = "product_attributes"
    id: Mapped[int] = pk()
    product_id: Mapped[str] = product_fk(False)
    key: Mapped[str] = mapped_column(String(80))
    value: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(10), default="fact")  # fact | ai
    source: Mapped[str | None] = mapped_column(String(200))


class Keyword(Base, TS):
    __tablename__ = "keywords"
    __table_args__ = (UniqueConstraint("keyword", "country", "language"),)
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    keyword: Mapped[str] = mapped_column(String(200))
    country: Mapped[str] = mapped_column(String(8), default="US")
    language: Mapped[str] = mapped_column(String(8), default="en")
    group: Mapped[str] = mapped_column(String(20))  # brand | product | purchase | concern | longtail
    intent: Mapped[str] = mapped_column(String(20))  # navigational | informational | commercial | transactional
    source: Mapped[str] = mapped_column(String(60))  # seed:product-name | gsc | amazon-search-terms | websearch
    priority: Mapped[int] = mapped_column(Integer, default=0)


class KeywordMetric(Base, TS):
    __tablename__ = "keyword_metrics"
    id: Mapped[int] = pk()
    keyword_id: Mapped[int] = mapped_column(ForeignKey("keywords.id"), index=True)
    date: Mapped[str] = mapped_column(String(10))
    source: Mapped[str] = mapped_column(String(40))
    search_volume: Mapped[int | None] = mapped_column(Integer)
    competition: Mapped[float | None] = mapped_column(Float)
    position: Mapped[float | None] = mapped_column(Float)
    impressions: Mapped[int | None] = mapped_column(Integer)
    clicks: Mapped[int | None] = mapped_column(Integer)
    ctr: Mapped[float | None] = mapped_column(Float)
    conversions: Mapped[int | None] = mapped_column(Integer)


class SeoPage(Base, TS):
    __tablename__ = "seo_pages"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    site: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(String(500), unique=True)
    status_code: Mapped[int | None] = mapped_column(Integer)
    last_audited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    issue_count: Mapped[int] = mapped_column(Integer, default=0)


class SeoMetadata(Base, TS):
    __tablename__ = "seo_metadata"
    id: Mapped[int] = pk()
    page_id: Mapped[int] = mapped_column(ForeignKey("seo_pages.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(400))
    description: Mapped[str | None] = mapped_column(Text)
    h1: Mapped[str | None] = mapped_column(String(400))
    canonical: Mapped[str | None] = mapped_column(String(500))
    og_image: Mapped[str | None] = mapped_column(String(500))
    schema_types: Mapped[list | None] = mapped_column(JSON)
    is_backup: Mapped[bool] = mapped_column(Boolean, default=False)  # snapshot taken before any change


class SeoAuditLog(Base, TS):
    __tablename__ = "seo_audit_logs"
    id: Mapped[int] = pk()
    page_id: Mapped[int] = mapped_column(ForeignKey("seo_pages.id"), index=True)
    severity: Mapped[str] = mapped_column(String(10))  # error | warn
    code: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(String(400))
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)


class ContentArticle(Base, TS):
    __tablename__ = "content_articles"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    kind: Mapped[str] = mapped_column(String(30))  # meta | faq | guide | blog | social | youtube
    language: Mapped[str] = mapped_column(String(8), default="en")
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text)
    generator: Mapped[str] = mapped_column(String(40))  # gemini | human | claude-session
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | pending_approval | approved | published | rejected
    seo_score: Mapped[int | None] = mapped_column(Integer)  # internal metric, not a Google ranking


class ContentTranslation(Base, TS):
    __tablename__ = "content_translations"
    id: Mapped[int] = pk()
    article_id: Mapped[int] = mapped_column(ForeignKey("content_articles.id"), index=True)
    language: Mapped[str] = mapped_column(String(8))
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="draft")


class CreativeAsset(Base, TS):
    __tablename__ = "creative_assets"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    provider: Mapped[str] = mapped_column(String(20))  # canva | higgsfield | gemini | engine
    format: Mapped[str] = mapped_column(String(40))
    url: Mapped[str | None] = mapped_column(String(700))
    status: Mapped[str] = mapped_column(String(30))
    cost: Mapped[float | None] = mapped_column(Float)


class VideoJob(Base, TS):
    __tablename__ = "video_jobs"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    provider: Mapped[str] = mapped_column(String(20), default="higgsfield")
    spec: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(30))  # waiting_connection | queued | running | done | failed
    external_id: Mapped[str | None] = mapped_column(String(120))
    result_url: Mapped[str | None] = mapped_column(String(700))
    cost: Mapped[float | None] = mapped_column(Float)
    error: Mapped[str | None] = mapped_column(Text)


class ImageJob(Base, TS):
    __tablename__ = "image_jobs"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    image_id: Mapped[int | None] = mapped_column(ForeignKey("product_images.id"))
    provider: Mapped[str] = mapped_column(String(20), default="gemini")
    task: Mapped[str] = mapped_column(String(30))  # analyze | alt_text | design
    status: Mapped[str] = mapped_column(String(30))
    result: Mapped[dict | None] = mapped_column(JSON)
    cost: Mapped[float | None] = mapped_column(Float)
    error: Mapped[str | None] = mapped_column(Text)


class SocialCampaign(Base, TS):
    __tablename__ = "social_campaigns"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    channel: Mapped[str] = mapped_column(String(30))
    language: Mapped[str] = mapped_column(String(8), default="en")
    copy_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="draft")


class AutomationJob(Base, TS):
    __tablename__ = "automation_jobs"
    id: Mapped[int] = pk()
    name: Mapped[str] = mapped_column(String(60), index=True)
    status: Mapped[str] = mapped_column(String(30))  # running | success | failed | skipped | waiting_connection
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    result: Mapped[dict | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(Text)
    cost: Mapped[float] = mapped_column(Float, default=0.0)


class AutomationSchedule(Base, TS):
    __tablename__ = "automation_schedules"
    id: Mapped[int] = pk()
    job_name: Mapped[str] = mapped_column(String(60), unique=True)
    local_time: Mapped[str] = mapped_column(String(5))  # HH:MM, Asia/Seoul
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str] = mapped_column(String(300))


class SearchPerformance(Base, TS):
    __tablename__ = "search_performance"
    id: Mapped[int] = pk()
    engine: Mapped[str] = mapped_column(String(20))  # google | naver
    site: Mapped[str] = mapped_column(String(120))
    date: Mapped[str] = mapped_column(String(10))
    page: Mapped[str | None] = mapped_column(String(500))
    query: Mapped[str | None] = mapped_column(String(300))
    country: Mapped[str | None] = mapped_column(String(8))
    impressions: Mapped[int | None] = mapped_column(Integer)
    clicks: Mapped[int | None] = mapped_column(Integer)
    ctr: Mapped[float | None] = mapped_column(Float)
    position: Mapped[float | None] = mapped_column(Float)


class AmazonCampaign(Base, TS):  # kept separate from search_performance on purpose
    __tablename__ = "amazon_campaigns"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    asin: Mapped[str | None] = mapped_column(String(20))
    campaign_id: Mapped[str | None] = mapped_column(String(60))
    name: Mapped[str | None] = mapped_column(String(300))
    date: Mapped[str | None] = mapped_column(String(10))
    country: Mapped[str | None] = mapped_column(String(8))
    search_term: Mapped[str | None] = mapped_column(String(300))
    impressions: Mapped[int | None] = mapped_column(Integer)
    clicks: Mapped[int | None] = mapped_column(Integer)
    spend: Mapped[float | None] = mapped_column(Float)
    sales: Mapped[float | None] = mapped_column(Float)
    orders: Mapped[int | None] = mapped_column(Integer)


class ApiConnection(Base, TS):
    __tablename__ = "api_connections"
    id: Mapped[int] = pk()
    provider: Mapped[str] = mapped_column(String(40), unique=True)
    status: Mapped[str] = mapped_column(String(30))  # connected | configured_unverified | pending | error
    detail: Mapped[str | None] = mapped_column(String(400))
    required_env: Mapped[list | None] = mapped_column(JSON)
    fallback: Mapped[str | None] = mapped_column(String(400))
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ApprovalRequest(Base, TS):
    __tablename__ = "approval_requests"
    id: Mapped[int] = pk()
    product_id: Mapped[str | None] = product_fk()
    target: Mapped[str] = mapped_column(String(60))  # e.g. seo_metadata, content_article
    target_id: Mapped[int | None] = mapped_column(Integer)
    change: Mapped[dict | None] = mapped_column(JSON)
    protected: Mapped[bool] = mapped_column(Boolean, default=False)  # price/ingredients/certs/clinical → always manual
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | approved | rejected | applied
    decided_by: Mapped[str | None] = mapped_column(String(80))


class SystemLog(Base):
    __tablename__ = "system_logs"
    id: Mapped[int] = pk()
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    level: Mapped[str] = mapped_column(String(10))
    area: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text)
