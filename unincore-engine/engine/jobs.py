"""The daily jobs. Each returns a result dict, or raises WaitingConnection when its API is not connected."""
from __future__ import annotations

import base64
import json
import os
import re
import time
import urllib.robotparser
from datetime import date
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from sqlalchemy import func, select

from . import core
from .core import WaitingConnection, session
from .models import (
    ApiConnection, AutomationJob, ImageJob, Keyword, Product, ProductAttribute, ProductImage,
    SeoAuditLog, SeoMetadata, SeoPage, VideoJob, now,
)

HTTP = requests.Session()
HTTP.headers["User-Agent"] = core.USER_AGENT


def _get(url: str, **kw) -> requests.Response:
    r = HTTP.get(url, timeout=30, **kw)
    time.sleep(0.4)  # be polite to the shop
    return r


# --------------------------------------------------------------------------- connections

PROVIDERS = [
    # provider, required env, fallback while not connected
    ("gemini", ["GEMINI_API_KEY"], "이미지 분석·카피 생성 대기. 대체: Claude 세션에서 수동 생성"),
    ("google_search_console", ["GSC_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"], "성과 수집 대기. 대체: 서치 콘솔 CSV 업로드"),
    ("ga4", ["GA4_PROPERTY_ID", "GSC_SERVICE_ACCOUNT_JSON"], "GA4 Data API 대기. 대체: GA4 화면에서 확인"),
    ("naver_search_advisor", ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"], "네이버 서치어드바이저는 성과 API를 공개 제공하지 않음. DataLab 검색어 트렌드만 연동 가능"),
    ("canva", ["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET", "CANVA_REFRESH_TOKEN"], "디자인 자동 생성 대기. 대체: Claude 세션의 Canva 커넥터로 수동 실행"),
    ("higgsfield", ["HIGGSFIELD_API_KEY"], "영상 작업은 waiting_connection으로 큐에 저장. 대체: 실제 사진 기반 루프 영상(무료)"),
    ("amazon_ads", ["AMAZON_ADS_CLIENT_ID", "AMAZON_ADS_CLIENT_SECRET", "AMAZON_ADS_REFRESH_TOKEN", "AMAZON_ADS_PROFILE_ID"], "광고 데이터 대기. 대체: 검색어 보고서 CSV 업로드"),
    ("unincore_shop", [], "공개 페이지 수집 (robots.txt 허용 범위)"),
]


def check_connections() -> dict:
    out = {}
    with session() as s:
        for provider, env, fallback in PROVIDERS:
            missing = [e for e in env if not os.environ.get(e)]
            status, detail = ("pending", f"환경변수 없음: {', '.join(missing)}") if missing else ("configured_unverified", "키는 있으나 실제 호출 검증 전")
            if provider == "gemini" and not missing:
                try:
                    r = requests.get("https://generativelanguage.googleapis.com/v1beta/models", params={"key": os.environ["GEMINI_API_KEY"]}, timeout=20)
                    status, detail = ("connected", "models.list OK") if r.ok else ("error", f"HTTP {r.status_code}")
                except requests.RequestException as e:
                    status, detail = "error", str(e)[:200]
            if provider == "unincore_shop":
                try:
                    r = _get(core.SHOP_SITE + "/robots.txt")
                    status, detail = ("connected", "robots.txt 확인") if r.ok else ("error", f"HTTP {r.status_code}")
                except requests.RequestException as e:
                    status, detail = "error", str(e)[:200]
            row = s.scalars(select(ApiConnection).where(ApiConnection.provider == provider)).first() or ApiConnection(provider=provider, status=status)
            row.status, row.detail, row.required_env, row.fallback, row.last_checked_at = status, detail, env, fallback, now()
            s.add(row)
            out[provider] = status
    return out


def connected(provider: str) -> bool:
    with session() as s:
        row = s.scalars(select(ApiConnection).where(ApiConnection.provider == provider)).first()
        return bool(row and row.status == "connected")


# --------------------------------------------------------------------------- product sync

def _robots_ok(base: str, path: str) -> bool:
    rp = urllib.robotparser.RobotFileParser()
    try:
        r = _get(base + "/robots.txt")
        rp.parse(r.text.splitlines() if r.ok else [])
    except requests.RequestException:
        return False
    return rp.can_fetch(core.USER_AGENT, base + path)


def parse_listing(html: str) -> list[tuple[str, str]]:
    """(productSeq, name) pairs from a shop listing page."""
    return list(dict.fromkeys(re.findall(r"fnCart\('(\d+)','([^']+)','\d+'\)", html)))


def parse_detail(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.select_one(".product_con_title h2")
    cat = soup.select_one(".product_con_title p")
    price = soup.select_one("p.member span")
    code = None
    for li in soup.select(".pay_info li"):
        sp = li.find("span")
        if sp and "Product code" in sp.get_text():
            code = li.find("p").get_text(strip=True) if li.find("p") else None
    # Main photos only (.product_img / .another); ".product_like" holds other products' photos.
    packs = [urljoin(url, i["src"]) for i in soup.select(".product_detail .product_img img, .product_detail .another img") if "/uImage/product/" in i.get("src", "")]
    details = [urljoin(url, i["src"]) for i in soup.select(".view_detail img") if i.get("src") and not i["src"].startswith("data:")]
    p = None
    if price:
        try:
            p = float(price.get_text(strip=True).replace(",", ""))
        except ValueError:
            p = None
    return {
        "name": title.get_text(strip=True) if title else None,
        "category": cat.get_text(strip=True) if cat else None,
        "price": p,
        "code": code,
        "packshots": list(dict.fromkeys(packs)),
        "details": list(dict.fromkeys(details)),
    }


def sync_products(limit: int | None = None) -> dict:
    base = core.SHOP_SITE
    list_path = "/shopping/search/list.do"
    if not _robots_ok(base, list_path):
        raise RuntimeError("robots.txt disallows the shop listing; not crawling")
    home = _get(base + list_path).text
    cats = sorted(set(re.findall(r"schBigCategoryId=(\d+)&(?:amp;)?schMiddleCategoryId=(\d+)", home)))
    found: dict[str, tuple[str, str, str]] = {}
    for big, mid in cats:
        html = _get(f"{base}{list_path}?schBigCategoryId={big}&schMiddleCategoryId={mid}").text
        for seq, name in parse_listing(html):
            found.setdefault(seq, (name, big, mid))
    seqs = list(found)[:limit] if limit else list(found)
    created = updated = images = 0
    for seq in seqs:
        name, big, mid = found[seq]
        url = f"{base}/shopping/search/view.do?productSeq={seq}&schBigCategoryId={big}&schMiddleCategoryId={mid}"
        d = parse_detail(_get(url).text, url)
        pid = f"UC-US-{seq}"
        with session() as s:
            p = s.get(Product, pid)
            if p is None:
                p = Product(id=pid, source="us.unincore.com", source_ref=seq, name=d["name"] or name)
                s.add(p)
                created += 1
            else:
                updated += 1
            p.amazon_asin = AMAZON_ASIN.get(pid, p.amazon_asin)
            p.name, p.category, p.product_code, p.price, p.currency, p.url, p.last_synced_at, p.active = d["name"] or name, d["category"], d["code"], d["price"], "USD", url, now(), True
            s.flush()
            have = set(s.scalars(select(ProductImage.url).where(ProductImage.product_id == pid)))
            for kind, urls in (("packshot", d["packshots"]), ("detail", d["details"])):
                for u in urls:
                    if u not in have:
                        s.add(ProductImage(product_id=pid, url=u, kind=kind))
                        images += 1
    return {"categories": len(cats), "products_found": len(found), "synced": len(seqs), "created": created, "updated": updated, "new_images": images}


# --------------------------------------------------------------------------- SEO audit

def audit_page(url: str) -> tuple[dict, list[tuple[str, str, str]]]:
    r = _get(url)
    issues: list[tuple[str, str, str]] = []
    meta = {"status": r.status_code}
    if r.status_code != 200:
        return meta, [("error", "http_status", f"HTTP {r.status_code}")]
    soup = BeautifulSoup(r.text, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ""
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag.get("content", "") if desc_tag else ""
    h1s = [" ".join(h.get_text(" ", strip=True).split()) for h in soup.find_all("h1")]
    canon = soup.find("link", rel="canonical")
    og = soup.find("meta", property="og:image")
    types: list[str] = []
    for sc in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(sc.string or "")
            for o in data if isinstance(data, list) else [data]:
                if isinstance(o, dict) and o.get("@type"):
                    types.append(str(o["@type"]))
        except ValueError:
            issues.append(("error", "jsonld_invalid", "JSON-LD 파싱 실패"))
    if not title:
        issues.append(("error", "title_missing", "title 없음"))
    elif len(title) > 60:
        issues.append(("warn", "title_long", f"title {len(title)}자 (60자 초과)"))
    if not desc:
        issues.append(("error", "description_missing", "meta description 없음"))
    elif len(desc) > 160:
        issues.append(("warn", "description_long", f"description {len(desc)}자 (160자 초과)"))
    if len(h1s) != 1:
        issues.append(("warn", "h1_count", f"H1 {len(h1s)}개"))
    if not canon:
        issues.append(("warn", "canonical_missing", "canonical 없음"))
    if not og:
        issues.append(("warn", "og_image_missing", "og:image 없음"))
    no_alt = [i for i in soup.find_all("img") if i.get("alt") is None]
    if no_alt:
        issues.append(("warn", "img_alt_missing", f"alt 속성 없는 이미지 {len(no_alt)}개"))
    meta.update(title=title, description=desc, h1=h1s[0] if h1s else None, canonical=canon.get("href") if canon else None, og_image=og.get("content") if og else None, schema_types=types)
    return meta, issues


def seo_audit() -> dict:
    site = core.PROMO_SITE
    sm = _get(site + "/sitemap.xml")
    if sm.status_code != 200 or "<urlset" not in sm.text:
        raise RuntimeError(f"sitemap.xml not readable (HTTP {sm.status_code})")
    urls = re.findall(r"<loc>(https?://[^<]+)</loc>", sm.text)
    urls = [u for u in urls if not re.search(r"\.(webp|png|jpe?g)$", u) and "/og/" not in u]
    total_issues = 0
    for u in dict.fromkeys(urls):
        meta, issues = audit_page(u)
        with session() as s:
            page = s.scalars(select(SeoPage).where(SeoPage.url == u)).first() or SeoPage(site=site, url=u)
            page.status_code, page.last_audited_at, page.issue_count = meta.get("status"), now(), len(issues)
            s.add(page)
            s.flush()
            for old in s.scalars(select(SeoAuditLog).where(SeoAuditLog.page_id == page.id, SeoAuditLog.resolved.is_(False))):
                old.resolved = True
            for sev, code, msg in issues:
                s.add(SeoAuditLog(page_id=page.id, severity=sev, code=code, message=msg))
            if "title" in meta:
                s.add(SeoMetadata(page_id=page.id, title=meta["title"], description=meta["description"], h1=meta["h1"], canonical=meta["canonical"], og_image=meta["og_image"], schema_types=meta["schema_types"], is_backup=True))
        total_issues += len(issues)
    return {"site": site, "pages": len(set(urls)), "issues": total_issues}


# --------------------------------------------------------------------------- keywords

BRAND = "UNI&CORE"
PURCHASE = [("buy {n}", "transactional"), ("{n} price", "commercial"), ("{n} review", "commercial"), ("{n} amazon", "transactional")]
LONGTAIL = [("how to use {n}", "informational"), ("{n} ingredients", "informational")]
SIZE_RE = re.compile(r"\s+\d+(\.\d+)?\s?(ml|g|ea|set|oz)\b.*$", re.I)


def clean_name(name: str) -> str:
    n = SIZE_RE.sub("", name.strip(" ."))
    n = re.sub(r"^(USA|\.)\s*", "", n, flags=re.I)
    return re.sub(r"\s+", " ", n).strip().lower()


# Products with a confirmed Amazon.com listing (ASIN) — only these get "... amazon" keywords.
AMAZON_ASIN = {"UC-US-441": "B0HGQYFF13", "UC-US-445": "B0HGR6V48S", "UC-US-449": "B0HJRKRKT7"}


def seeds_for(name: str, on_amazon: bool = False) -> list[tuple[str, str, str, int]]:
    """Seed keywords derived only from the product's own name. No volumes are invented."""
    n = clean_name(name)
    if len(n) < 4 or re.search(r"\b(set|offer|opening)\b", n):
        return []  # bundles/promos are not search targets
    out = [(f"{BRAND.lower()} {n}", "brand", "navigational", 90), (n, "product", "commercial", 70)]
    out += [(t.format(n=n), "purchase", intent, 60) for t, intent in PURCHASE if on_amazon or "amazon" not in t]
    out += [(t.format(n=n), "longtail", intent, 50) for t, intent in LONGTAIL]
    return out


def discover_keywords() -> dict:
    new = dup = 0
    with session() as s:
        existing = {(k.keyword, k.country, k.language) for k in s.scalars(select(Keyword))}
        for p in s.scalars(select(Product).where(Product.active.is_(True))):
            for kw, group, intent, prio in seeds_for(p.name, bool(p.amazon_asin)):
                key = (kw, "US", "en")
                if key in existing:
                    dup += 1
                    continue
                existing.add(key)
                s.add(Keyword(product_id=p.id, keyword=kw, group=group, intent=intent, source="seed:product-name", priority=prio))
                new += 1
    return {"new_keywords": new, "duplicates_skipped": dup, "note": "검색량·경쟁도는 미측정(NULL). GSC/Amazon 데이터 연결 후 채워짐"}


# --------------------------------------------------------------------------- Gemini (image analysis + copy)

GEMINI_PROMPT = (
    "You are analysing an official cosmetic product image. Return JSON with keys: "
    "facts {product_name, size, visible_text[], claims_printed[]} — ONLY what is literally visible; "
    "ai {selling_points[], keywords[], alt_text, social_copy} — marketing suggestions. "
    "Never invent clinical numbers, certifications or medical effects."
)


def gemini_analyze_image(image_url: str) -> dict:
    key = os.environ["GEMINI_API_KEY"]
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    img = _get(image_url)
    body = {
        "contents": [{"parts": [{"text": GEMINI_PROMPT}, {"inline_data": {"mime_type": img.headers.get("content-type", "image/png").split(";")[0], "data": base64.b64encode(img.content).decode()}}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", params={"key": key}, json=body, timeout=120)
    r.raise_for_status()
    return json.loads(r.json()["candidates"][0]["content"]["parts"][0]["text"])


def gemini_content(max_images: int = 5) -> dict:
    with session() as s:
        done = set(s.scalars(select(ImageJob.image_id).where(ImageJob.status == "done")))
        todo = [i for i in s.scalars(select(ProductImage).where(ProductImage.kind == "packshot")) if i.id not in done][:max_images]
        is_connected = connected("gemini")
        if not is_connected:
            queued = set(s.scalars(select(ImageJob.image_id).where(ImageJob.status == "waiting_connection")))
            for i in todo:
                if i.id not in queued:
                    s.add(ImageJob(product_id=i.product_id, image_id=i.id, task="analyze", status="waiting_connection"))
        targets = [(i.id, i.product_id, i.url) for i in todo]
    if not is_connected:  # raised after the session commits, so the queue is kept
        raise WaitingConnection("GEMINI_API_KEY 미연결: 이미지 분석 작업을 대기열에 저장했습니다")
    ok = 0
    for image_id, pid, url in targets:
        with session() as s:
            try:
                res = gemini_analyze_image(url)
                s.add(ImageJob(product_id=pid, image_id=image_id, task="analyze", status="done", result=res))
                for k, v in (res.get("facts") or {}).items():
                    s.add(ProductAttribute(product_id=pid, key=f"image.{k}", value=json.dumps(v, ensure_ascii=False), kind="fact", source="gemini-ocr (needs human check)"))
                for k, v in (res.get("ai") or {}).items():
                    s.add(ProductAttribute(product_id=pid, key=f"ai.{k}", value=json.dumps(v, ensure_ascii=False), kind="ai", source="gemini"))
                ok += 1
            except Exception as e:  # noqa: BLE001
                s.add(ImageJob(product_id=pid, image_id=image_id, task="analyze", status="failed", error=str(e)[:500]))
    return {"analyzed": ok, "attempted": len(targets)}


# --------------------------------------------------------------------------- creatives / performance (connection-gated)

def creatives() -> dict:
    missing = [p for p in ("canva", "higgsfield") if not connected(p)]
    if missing:
        with session() as s:
            if not s.scalars(select(VideoJob).where(VideoJob.status == "waiting_connection")).first():
                for p in s.scalars(select(Product).where(Product.active.is_(True)).limit(3)):
                    s.add(VideoJob(product_id=p.id, spec={"length_s": 15, "style": "black luxury / champagne gold", "source": "official packshot, label locked"}, status="waiting_connection"))
        raise WaitingConnection(f"미연결: {', '.join(missing)}. 영상 작업 사양만 대기열에 저장했습니다")
    raise NotImplementedError("Canva/Higgsfield 실행기는 키 연결 후 PHASE 5에서 구현")


def performance() -> dict:
    missing = [p for p in ("google_search_console", "amazon_ads") if not connected(p)]
    raise WaitingConnection(f"미연결: {', '.join(missing) or 'naver'}. 성과 데이터는 수집되지 않았습니다 (CSV 업로드로 대체 가능)")


# --------------------------------------------------------------------------- report

def report() -> dict:
    today = date.today().isoformat()
    with session() as s:
        count = lambda m, *w: s.scalar(select(func.count()).select_from(m).where(*w)) or 0  # noqa: E731
        jobs = {}
        for j in s.scalars(select(AutomationJob).order_by(AutomationJob.id.desc()).limit(40)):
            jobs.setdefault(j.name, {"status": j.status, "attempts": j.attempts, "error": (j.error or "")[:200], "result": j.result})
        data = {
            "date": today,
            "products": count(Product),
            "product_images": count(ProductImage),
            "keywords": count(Keyword),
            "seo_pages": count(SeoPage),
            "open_seo_issues": count(SeoAuditLog, SeoAuditLog.resolved.is_(False)),
            "image_jobs_waiting": count(ImageJob, ImageJob.status == "waiting_connection"),
            "video_jobs_waiting": count(VideoJob, VideoJob.status == "waiting_connection"),
            "connections": {c.provider: c.status for c in s.scalars(select(ApiConnection))},
            "jobs": jobs,
            "disclaimer": "검색량·순위·전환은 연결된 실제 소스가 있을 때만 기록됩니다. SEO 점수는 자체 지표이며 Google 순위를 뜻하지 않습니다.",
        }
    rep = core.DATA / "reports"
    rep.mkdir(parents=True, exist_ok=True)
    (rep / f"{today}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    (core.DATA / "latest.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    return {"report": f"data/reports/{today}.json"}


JOBS = {
    "connections": check_connections,
    "sync_products": sync_products,
    "seo_audit": seo_audit,
    "discover_keywords": discover_keywords,
    "gemini_content": gemini_content,
    "creatives": creatives,
    "performance": performance,
    "report": report,
}
