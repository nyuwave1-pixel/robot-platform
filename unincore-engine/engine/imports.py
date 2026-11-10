"""CSV imports: the fallback while Search Console / Amazon Ads APIs are not connected.

Only values present in the file are stored; nothing is estimated.
- Search Console: Performance → Export → Queries.csv  (Top queries, Clicks, Impressions, CTR, Position)
- Amazon Ads: Sponsored Products "Search term" report CSV
"""
from __future__ import annotations

import csv
import io
from datetime import date

from sqlalchemy import select

from .core import session
from .models import AmazonCampaign, ApprovalRequest, Keyword, KeywordMetric, Product, SearchPerformance


def _num(v: str | None, cast=float):
    if v is None:
        return None
    v = v.strip().replace(",", "").replace("%", "").replace("$", "")
    if v in ("", "-", "--"):
        return None
    try:
        return cast(float(v)) if cast is int else cast(v)
    except ValueError:
        return None


def _rows(text: str) -> list[dict]:
    text = text.lstrip("﻿")
    return [{(k or "").strip().lower(): (v or "").strip() for k, v in r.items()} for r in csv.DictReader(io.StringIO(text))]


def _pick(r: dict, *names: str) -> str | None:
    for n in names:
        if r.get(n):
            return r[n]
    return None


def _match_product(s, term: str) -> str | None:
    """Relate a search term to a product only when the product's own name words appear in it."""
    t = term.lower()
    best, score = None, 0
    for p in s.scalars(select(Product)):
        words = [w for w in p.name.lower().replace("&", " ").split() if len(w) > 3 and not w[0].isdigit()]
        hit = sum(w in t for w in words)
        if hit >= 2 and hit > score:
            best, score = p.id, hit
    return best


def import_gsc_queries(text: str, site: str, country: str = "US", day: str | None = None) -> dict:
    day = day or date.today().isoformat()
    rows = _rows(text)
    new_kw = stored = 0
    with session() as s:
        for r in rows:
            q = _pick(r, "top queries", "query", "queries", "인기 검색어", "검색어")
            if not q:
                continue
            clicks, imps = _num(_pick(r, "clicks", "클릭수"), int), _num(_pick(r, "impressions", "노출"), int)
            ctr, pos = _num(_pick(r, "ctr")), _num(_pick(r, "position", "게재순위"))
            s.add(SearchPerformance(engine="google", site=site, date=day, query=q, country=country, clicks=clicks, impressions=imps, ctr=ctr, position=pos))
            kw = s.scalars(select(Keyword).where(Keyword.keyword == q.lower(), Keyword.country == country, Keyword.language == "en")).first()
            if kw is None:
                kw = Keyword(product_id=_match_product(s, q), keyword=q.lower(), country=country, group="longtail", intent="informational", source="gsc", priority=80)
                s.add(kw)
                s.flush()
                new_kw += 1
            s.add(KeywordMetric(keyword_id=kw.id, date=day, source="gsc", impressions=imps, clicks=clicks, ctr=ctr, position=pos))
            stored += 1
    return {"rows": len(rows), "stored": stored, "new_keywords": new_kw}


def import_amazon_search_terms(text: str, country: str = "US") -> dict:
    rows = _rows(text)
    stored = new_kw = 0
    with session() as s:
        for r in rows:
            term = _pick(r, "customer search term", "search term", "고객 검색어")
            if not term:
                continue
            s.add(AmazonCampaign(
                product_id=_match_product(s, term), campaign_id=_pick(r, "campaign id"), name=_pick(r, "campaign name", "campaign"),
                date=_pick(r, "date", "start date"), country=country, search_term=term,
                impressions=_num(_pick(r, "impressions"), int), clicks=_num(_pick(r, "clicks"), int),
                spend=_num(_pick(r, "spend", "cost")), sales=_num(_pick(r, "7 day total sales", "14 day total sales", "sales")),
                orders=_num(_pick(r, "7 day total orders (#)", "14 day total orders (#)", "orders"), int),
            ))
            stored += 1
            if not s.scalars(select(Keyword).where(Keyword.keyword == term.lower(), Keyword.country == country, Keyword.language == "en")).first():
                s.add(Keyword(product_id=_match_product(s, term), keyword=term.lower(), country=country, group="purchase", intent="transactional", source="amazon-search-terms", priority=85))
                s.flush()
                new_kw += 1
    return {"rows": len(rows), "stored": stored, "new_keywords": new_kw}


# ---- approvals (directive §10: generated changes wait for a person; protected fields can never auto-apply)

PROTECTED_FIELDS = {"price", "ingredients", "full_ingredients", "certification", "clinical", "claims", "size"}


def request_approval(target: str, change: dict, product_id: str | None = None, target_id: int | None = None) -> int:
    with session() as s:
        a = ApprovalRequest(product_id=product_id, target=target, target_id=target_id, change=change, protected=bool(PROTECTED_FIELDS & set(change)))
        s.add(a)
        s.flush()
        return a.id


def decide(approval_id: int, approve: bool, by: str) -> dict:
    with session() as s:
        a = s.get(ApprovalRequest, approval_id)
        if a is None:
            raise KeyError(approval_id)
        if a.status != "pending":
            raise ValueError(f"already {a.status}")
        a.status, a.decided_by = ("approved" if approve else "rejected"), by
        return {"id": a.id, "status": a.status, "protected": a.protected}
