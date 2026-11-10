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
    for name in ("gemini_content", "creatives", "performance"):
        j = core.run_job(name, jobs.JOBS[name])
        assert j.status == "waiting_connection", name


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
    assert s["kpi"]["google_clicks"] is None and len(s["phases"]) == 10 and len(s["schedule"]) == 8
    assert c.patch("/api/schedule/report", params={"local_time": "25:00"}).status_code == 422
    assert c.patch("/api/schedule/report", params={"local_time": "07:30"}).json()["time"] == "07:30"
    monkeypatch.setenv("ENGINE_ADMIN_PASSWORD", "pw")
    assert c.get("/").status_code == 401
    assert c.get("/", auth=("admin", "pw")).status_code == 200
