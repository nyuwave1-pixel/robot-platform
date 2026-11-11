"""Unit tests (no network). Run: cd unincore-engine && python -m pytest -q"""
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

from fastapi.testclient import TestClient  # noqa: E402

from engine import core, jobs  # noqa: E402
from engine.api import app  # noqa: E402
from engine.models import AutomationJob, Base  # noqa: E402

core.init_db()

LISTING = """<a onclick="$.fnCart('449','VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g','100000134')"></a>
<a onclick="$.fnCartEdit('449','VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g','100000134')"></a>
<a onclick="$.fnCart('441','VITA C ENZYME POWDER WASH 30EA','600000952')"></a>"""
DETAIL = """<div class="product_detail"><div class="product_img"><img src="/uImage/product/a.png"></div>
<div class="another"><img src="/uImage/product/a.png"></div></div>
<div class="product_like"><img src="/uImage/product/other.png"></div>
<div class="product_con"><div class="product_con_title"><p>Skincare</p><h2>VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g</h2></div>
<p class="member">$<span>176</span></p><ul class="pay_info"><li><span>Product code</span><p>100000134</p></li></ul></div>
<div class="view_detail"><img src="https://x/detail.png"><img src="data:image/png;base64,AAAA"></div>"""


def test_schema_has_all_directive_tables():
    need = {"products", "product_images", "product_attributes", "keywords", "keyword_metrics", "seo_pages", "seo_metadata", "seo_audit_logs",
            "content_articles", "content_translations", "creative_assets", "video_jobs", "image_jobs", "social_campaigns", "automation_jobs",
            "automation_schedules", "search_performance", "amazon_campaigns", "api_connections", "approval_requests", "system_logs"}
    assert need <= set(Base.metadata.tables)


def test_listing_and_detail_parsing():
    assert jobs.parse_listing(LISTING) == [("449", "VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g"), ("441", "VITA C ENZYME POWDER WASH 30EA")]
    d = jobs.parse_detail(DETAIL, "https://us.unincore.com/shopping/search/view.do?productSeq=449")
    assert d["name"].startswith("VITA C 13.5") and d["category"] == "Skincare" and d["price"] == 176.0 and d["code"] == "100000134"
    assert d["packshots"] == ["https://us.unincore.com/uImage/product/a.png"]  # deduped, other products' photos excluded
    assert d["details"] == ["https://x/detail.png"]  # inline data: images skipped


def test_keyword_seeds_are_relevant_and_never_carry_volumes():
    kws = jobs.seeds_for("VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g", on_amazon=True)
    words = [k[0] for k in kws]
    assert "vita c 13.5 super brightening ampoule" in words and "uni&core vita c 13.5 super brightening ampoule" in words
    assert any(w.endswith(" amazon") for w in words)
    assert not any(w.endswith(" amazon") for w, *_ in jobs.seeds_for("DEEP HYDRATING SKIN NUTRITION CREAM 30ml"))  # no ASIN, no amazon keyword
    assert jobs.seeds_for("Thanksgiving Beauty Set") == []  # bundles are not search targets
    assert len(set(words)) == len(words)


def test_waiting_gemini_jobs_are_queued_not_lost():
    from engine.models import ImageJob, Product, ProductImage
    with core.session() as s:
        s.add(Product(id="T-1", source="test", source_ref="1", name="Test Cream"))
        s.flush()
        s.add(ProductImage(product_id="T-1", url="https://x/p.png", kind="packshot"))
    assert core.run_job("gemini_content", jobs.JOBS["gemini_content"]).status == "waiting_connection"
    with core.session() as s:
        assert s.query(ImageJob).filter_by(status="waiting_connection").count() == 1


def test_unconnected_api_is_never_reported_as_success():
    for name in ("gemini_content", "performance"):
        j = core.run_job(name, jobs.JOBS[name])
        assert j.status == "waiting_connection", name


jobs._real_build_posts = jobs.build_posts


def test_creatives_render_locally_and_keep_canva_higgsfield_waiting(monkeypatch, tmp_path):
    f = tmp_path / "x-pinterest_pin.png"
    f.write_bytes(b"png")
    monkeypatch.setattr(jobs, "render_creatives", lambda: [{"product_id": "UC-US-449", "format": "pinterest_pin", "file": str(f)}])
    monkeypatch.setattr(jobs, "build_posts", lambda: jobs.__dict__["_real_build_posts"](tmp_path))
    j = core.run_job("creatives", jobs.JOBS["creatives"])
    assert j.status == "success"
    assert j.result["rendered"] == 1 and j.result["provider"].startswith("engine")
    assert set(j.result["waiting_connection"]) == {"canva", "higgsfield"}  # never reported as connected


def test_creative_copy_is_compliant_and_uses_site_photos():
    import json

    from engine.publish import BANNED, SLUGS

    copy = json.loads((jobs.CREATIVE_DIR / "copy.json").read_text(encoding="utf-8"))
    assert set(copy["products"]) == set(SLUGS)
    site = (core.ROOT.parent / "unincore-promotion" / "src" / "content" / "products.ts").read_text(encoding="utf-8")
    for pid, c in copy["products"].items():
        assert c["slug"] == SLUGS[pid]
        text = " ".join([c["headline"], c["sub"], *c["points"]])
        assert not BANNED.search(text)
        assert not __import__("re").search(r"\$|% ?off|stars?|review|#1|best", text, __import__("re").I)
        assert (core.ROOT.parent / "unincore-promotion" / "public" / "products" / c["image"]).exists()
        for n in __import__("re").findall(r"\d+(?:\.\d+)?%", text):  # every percentage must be on the site
            assert n in site, (pid, n)


def test_job_retries_then_fails_and_duplicate_runs_are_skipped(monkeypatch):
    monkeypatch.setattr(core.time, "sleep", lambda *_: None)
    calls = []

    def boom():
        calls.append(1)
        raise RuntimeError("x")

    j = core.run_job("t_fail", boom, retries=3)
    assert j.status == "failed" and j.attempts == 3 and len(calls) == 3
    with core.session() as s:
        s.add(AutomationJob(name="t_lock", status="running"))
    assert core.run_job("t_lock", lambda: {}).status == "skipped"


def test_dashboard_and_api(monkeypatch):
    c = TestClient(app)
    assert c.get("/").status_code == 200 and "미연결" in c.get("/").text
    s = c.get("/api/summary").json()
    assert s["kpi"]["google_clicks"] is None and len(s["phases"]) == 10 and len(s["schedule"]) == 9
    assert c.patch("/api/schedule/report", params={"local_time": "25:00"}).status_code == 422
    assert c.patch("/api/schedule/report", params={"local_time": "07:30"}).json()["time"] == "07:30"
    monkeypatch.setenv("ENGINE_ADMIN_PASSWORD", "pw")
    assert c.get("/").status_code == 401
    assert c.get("/", auth=("admin", "pw")).status_code == 200


def test_csv_imports_store_only_real_values_and_relate_products():
    from engine import imports
    from engine.models import AmazonCampaign, Keyword, KeywordMetric, Product
    with core.session() as s:
        s.add(Product(id="T-AMP", source="test", source_ref="2", name="VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g"))
    gsc = "\ufeffTop queries,Clicks,Impressions,CTR,Position\nvita c 13.5 brightening ampoule,3,120,2.5%,8.4\nkorean powder wash,0,15,0%,\n"
    assert imports.import_gsc_queries(gsc, "https://promotion.unincore.com", day="2026-11-10") == {"rows": 2, "stored": 2, "new_keywords": 2}
    amz = "Customer Search Term,Campaign Name,Impressions,Clicks,Spend,7 Day Total Sales,7 Day Total Orders (#)\nvitamin c brightening ampoule,SP-Amp,\"1,200\",14,$9.80,$52.00,2\n"
    assert imports.import_amazon_search_terms(amz)["stored"] == 1
    with core.session() as s:
        k = s.query(Keyword).filter_by(keyword="vita c 13.5 brightening ampoule").one()
        assert k.source == "gsc" and k.product_id == "T-AMP"
        m = s.query(KeywordMetric).filter_by(keyword_id=k.id).one()
        assert (m.clicks, m.impressions, m.position, m.search_volume) == (3, 120, 8.4, None)
        k2 = s.query(Keyword).filter_by(keyword="korean powder wash").one()
        assert s.query(KeywordMetric).filter_by(keyword_id=k2.id).one().position is None  # blank stays NULL
        a = s.query(AmazonCampaign).one()
        assert (a.impressions, a.clicks, a.spend, a.sales, a.orders) == (1200, 14, 9.8, 52.0, 2)


def test_approvals_flag_protected_fields_and_cannot_be_decided_twice():
    from engine import imports
    c = TestClient(app)
    safe = imports.request_approval("seo_metadata", {"title": "New title"}, product_id="T-AMP")
    risky = imports.request_approval("product", {"price": 10, "title": "x"}, product_id="T-AMP")
    pend = {a["id"]: a for a in c.get("/api/approvals").json()}
    assert pend[safe]["protected"] is False and pend[risky]["protected"] is True
    assert c.post(f"/api/approvals/{safe}/approve").json()["status"] == "approved"
    assert c.post(f"/api/approvals/{safe}/reject").status_code == 409
    assert c.post("/api/approvals/99999/approve").status_code == 404


def test_publish_applies_only_valid_unprotected_approved_changes(tmp_path):
    import json
    from engine import imports
    from engine.models import ApprovalRequest, Product
    from engine.publish import publish, validate
    with core.session() as s:
        if not s.get(Product, "UC-US-449"):
            s.add(Product(id="UC-US-449", source="test", source_ref="449", name="VITA C 13.5 SUPER BRIGHTENING AMPOULE 30g"))
    good = imports.request_approval("site_seo", {"seoTitle": "13.5% Vitamin C Ampoule | UNI&CORE", "faq": {"q": "Can I use it every day?", "a": "Yes, most people use it daily after cleansing."}}, product_id="UC-US-449")
    bad = imports.request_approval("site_seo", {"seoTitle": "Skin whitening serum | UNI&CORE"}, product_id="UC-US-449")
    prot = imports.request_approval("site_seo", {"price": 1}, product_id="UC-US-449")
    pending = imports.request_approval("site_seo", {"seoTitle": "Pending title | UNI&CORE"}, product_id="UC-US-449")
    for i in (good, bad, prot):
        imports.decide(i, True, "tester")
    f = tmp_path / "o.json"
    f.write_text('{"products": {}}')
    r = publish(f)
    assert (r["applied"], r["rejected_by_validator"], r["protected_left_for_manual"]) == (1, 1, 1)
    o = json.loads(f.read_text())["products"]["vitamin-c-13-5-ampoule"]
    assert o["seoTitle"].startswith("13.5%") and o["extraFaqs"][0]["q"] == "Can I use it every day?"
    with core.session() as s:
        st = {i: s.get(ApprovalRequest, i).status for i in (good, bad, prot, pending)}
    assert st == {good: "applied", bad: "rejected", prot: "approved", pending: "pending"}
    assert publish(f)["applied"] == 0  # idempotent
    assert validate({"seoTitle": "x" * 61 + " UNI&CORE"}) and validate({"h1": "nope"})


def test_approvals_mirror_roundtrip():
    import json
    from engine import imports
    imports.dump_approvals()
    rows = json.loads((core.DATA / "approvals.json").read_text())
    assert rows and {"id", "status", "change", "protected"} <= set(rows[0])
    assert imports.restore_approvals() == 0  # database already has rows: never overwritten


def test_posting_kit_has_utm_links_and_compliant_captions(tmp_path):
    from engine.publish import BANNED

    posts = jobs.build_posts(tmp_path)
    assert len(posts) == 9 and (tmp_path / "posts.md").exists() and (tmp_path / "posts.json").exists()
    for x in posts:
        assert x["link"].startswith(core.PROMO_SITE + "/products/") and "utm_source=" in x["link"] and "utm_campaign=" in x["link"]
        assert len(x["title"]) <= 100 and not BANNED.search(x["caption"] + " ".join(x["hashtags"]))
        assert all(t.startswith("#") and " " not in t for t in x["hashtags"])
