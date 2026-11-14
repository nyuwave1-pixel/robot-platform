"""Publish approved SEO changes into the promotion site (directive §10).

Flow: someone (Gemini job, the daily Claude session, or a person) files an approval request with
target "site_seo" → an admin approves it → this job validates it and writes
unincore-promotion/src/content/seo-overrides.json → the change ships with the next git push/deploy.

Only title / description / extra FAQs can be published. Facts (price, ingredients, certifications,
clinical numbers) are "protected": they are never applied by this job, even when approved.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from sqlalchemy import select

from . import core
from .core import session
from .models import ApprovalRequest

OVERRIDES = core.ROOT.parent / "unincore-promotion" / "src" / "content" / "seo-overrides.json"
SLUGS = {"UC-US-441": "vita-c-enzyme-powder-wash", "UC-US-445": "vita-c-brightening-mask", "UC-US-449": "vitamin-c-13-5-ampoule"}
BANNED = re.compile(r"whitening|bleach|\bcures?\b|\btreat(s|ment)?\b|\bheals?\b|fda[- ]approved|\bguarantee", re.I)
ALLOWED = {"seoTitle", "seoDescription", "faq"}


def validate(change: dict) -> list[str]:
    errs = []
    extra = set(change) - ALLOWED
    if extra:
        errs.append(f"허용되지 않은 항목: {', '.join(sorted(extra))}")
    t, d, f = change.get("seoTitle"), change.get("seoDescription"), change.get("faq")
    if t is not None and (len(t) > 60 or "UNI&CORE" not in t):
        errs.append("seoTitle은 60자 이내이고 UNI&CORE를 포함해야 함")
    if d is not None and not (50 <= len(d) <= 160):
        errs.append("seoDescription은 50~160자")
    if f is not None and not (isinstance(f, dict) and 10 <= len(f.get("q", "")) <= 200 and 20 <= len(f.get("a", "")) <= 1000):
        errs.append("faq는 {q, a} 형식 (q 10~200자, a 20~1000자)")
    if BANNED.search(json.dumps(change, ensure_ascii=False)):
        errs.append("금지 표현 포함 (whitening/cure/treat/guarantee 등)")
    if not change:
        errs.append("변경 내용 없음")
    return errs


def publish(path: Path | None = None) -> dict:
    path = path or OVERRIDES
    data = json.loads(path.read_text()) if path.exists() else {"products": {}}
    applied = rejected = skipped_protected = 0
    with session() as s:
        for a in s.scalars(select(ApprovalRequest).where(ApprovalRequest.status == "approved", ApprovalRequest.target == "site_seo").order_by(ApprovalRequest.id)):
            if a.protected:
                skipped_protected += 1  # stays "approved"; a person must apply it by hand
                continue
            slug = SLUGS.get(a.product_id or "")
            errs = validate(a.change or {}) if slug else ["프로모션 사이트에 없는 제품"]
            if errs:
                a.status, a.decided_by = "rejected", f"publish-validator: {'; '.join(errs)}"[:80]
                rejected += 1
                continue
            o = data["products"].setdefault(slug, {})
            for k in ("seoTitle", "seoDescription"):
                if k in a.change:
                    o[k] = a.change[k]
            if "faq" in a.change:
                faqs = o.setdefault("extraFaqs", [])
                if not any(x["q"] == a.change["faq"]["q"] for x in faqs):
                    faqs.append({"q": a.change["faq"]["q"], "a": a.change["faq"]["a"]})
            a.status = "applied"
            applied += 1
    if applied:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    return {"applied": applied, "rejected_by_validator": rejected, "protected_left_for_manual": skipped_protected, "file": (str(path.relative_to(core.ROOT.parent)) if path.is_relative_to(core.ROOT.parent) else str(path)) if applied else None}
