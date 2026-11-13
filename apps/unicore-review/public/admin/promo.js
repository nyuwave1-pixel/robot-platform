/* =========================================================
   프로모션 관리 — UNI&CORE 1ST BIRTHDAY CREAM 구매 후기 이벤트
   관리자 화면 모듈 (/admin/index.html 이 불러 쓴다).
   데이터: {PROMO_API}/admin/promo/*  (권한 검사는 전부 서버에서 한다 — 여기서는 버튼을 감추는 정도만)
========================================================= */
(function () {
  'use strict';
  var BASE = String(window.PROMO_API || '').replace(/\/$/, '');
  var API = BASE + '/admin/promo';
  var SITE = String(window.PROMO_SITE || location.origin).replace(/\/$/, '');
  function abs(u) { return u ? BASE + u : u; }
  var cfg = { headers: function () { return {}; }, onUnauthorized: function () {}, navigate: null, onChange: null };
  var root = null, sub = 'dash', ME = null, EVENT = null;
  var F = { people: { q: '', status: '', member: '', winner: '', photos: '', rewardStatus: '', rewardType: 'PARTICIPATION', from: '', to: '', flag: '', test: '', offset: 0 },
            photos: { status: 'PENDING', offset: 0 }, rewards: { type: 'PARTICIPATION', status: '', q: '', sel: {} } };

  var SUBS = [['dash', '프로모션 대시보드'], ['event', '벌스데이 크림 후기 이벤트'], ['people', '이벤트 참여자 관리'], ['photos', '후기 및 사진 관리'],
              ['winners', '우수 후기 선정 관리'], ['rewards', '사은품 지급 관리'], ['stats', '이벤트 통계 및 보고서']];
  var RS = { PENDING: '검토 대기', APPROVED: '승인', REJECTED: '반려', REVISION_REQUESTED: '수정 요청' };
  var WS = { ELIGIBLE: '지급 대상', PREPARING: '지급 준비', SHIP_READY: '배송 준비', SHIPPING: '배송 중', DELIVERED: '지급 완료', ON_HOLD: '지급 보류', CANCELED: '지급 취소' };
  var CARRIERS = ['CJ대한통운', '한진택배', '롯데택배', '우체국택배', '로젠택배', '직접 전달'];
  var ACT = { 'review.submit': '후기 접수', 'review.revise': '참여자 재제출', 'review.status': '검토 상태 변경', 'review.memo': '메모 저장', 'review.edit': '참여자 정보 수정', 'review.purge': '개인정보 파기',
    'review.view_pii': '개인정보 열람', 'image.view': '사진 열람', 'image.list': '사진 목록 열람', 'candidate.add': '우수 후기 후보 등록', 'candidate.remove': '후보 해제', 'flag.clear': '확인 완료', 'flag.set': '확인 대상 표시',
    'winner.select': '우수 후기 선정', 'winner.cancel': '선정 취소', 'winner.rank': '순위 변경', 'winner.confirm': '당첨자 최종 확정', 'winner.unconfirm': '확정 해제',
    'reward.create': '사은품 지급 대상 등록', 'reward.reopen': '사은품 지급 재개', 'reward.status': '지급 상태 변경', 'reward.edit': '배송 정보 수정',
    'event.update': '이벤트 설정 변경', 'export.reviews': '엑셀 다운로드', 'reentry.grant': '재참여 예외 승인', 'reentry.revoke': '예외 승인 회수' };

  // ---------- 유틸 ----------
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, el) { return (el || root).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); }
  function has(p) { return !!ME && ME.perms.indexOf(p) >= 0; }
  function dt(iso) { if (!iso) return '—'; var d = new Date(iso); if (isNaN(d)) return E(iso); var p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function day(iso) { return iso ? dt(iso).slice(0, 10) : '—'; }
  function stars(n) { if (!n) return '<span class="pm-mut">—</span>'; return '<span class="pm-stars" title="' + n + '점">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>'; }
  function qs(o) { var p = []; Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null && typeof o[k] !== 'object') p.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k])); }); return p.join('&'); }
  function say(msg, bad) {
    if (typeof window.toast === 'function') return window.toast(msg, bad);
    var t = document.getElementById('pmToast'); if (!t) { t = document.createElement('div'); t.id = 'pmToast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = 'on' + (bad ? ' bad' : ''); clearTimeout(t._t); t._t = setTimeout(function () { t.className = ''; }, 2800);
  }
  function api(method, path, body) {
    var h = Object.assign({ 'x-br-csrf': '1' }, cfg.headers());
    if (body !== undefined) h['content-type'] = 'application/json';
    return fetch(API + path, { method: method, headers: h, credentials: 'omit', body: body === undefined ? undefined : JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: { message: '서버 응답을 읽지 못했습니다. (' + r.status + ')' } }; }).then(function (j) {
        if (r.status === 401) { cfg.onUnauthorized(j.error); var e0 = new Error((j.error && j.error.message) || '로그인이 필요합니다.'); e0.status = 401; e0.code = j.error && j.error.code; throw e0; }
        if (!j.ok) { var e = new Error((j.error && j.error.message) || '요청을 처리하지 못했습니다.'); e.status = r.status; e.code = j.error && j.error.code; throw e; }
        return j.data;
      });
    });
  }
  function run(p, okMsg, after) { return p.then(function (d) { if (okMsg) say(typeof okMsg === 'function' ? okMsg(d) : okMsg); if (after) after(d); if (cfg.onChange) { try { cfg.onChange(); } catch (x) {} } return d; }).catch(function (e) { say(e.message, true); }); }
  function rsBadge(s) { return '<span class="pm-b pm-rs-' + s + '">' + E(RS[s] || s) + '</span>'; }
  function wsBadge(r) { return r ? '<span class="pm-b pm-ws-' + r.status + '">' + E(WS[r.status] || r.status) + '</span>' : '<span class="pm-mut">—</span>'; }

  // ---------- 스타일 (pm- 접두사로 기존 어드민과 충돌 없음) ----------
  function css() {
    if (document.getElementById('pmCss')) return;
    var s = document.createElement('style'); s.id = 'pmCss';
    s.textContent = [
      '.pm-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 20px}.pm-tabs button{padding:8px 13px;border:1px solid var(--line);border-radius:99px;background:#fff;font:inherit;font-size:12.5px;font-weight:600;color:var(--sub);cursor:pointer}.pm-tabs button.on{background:var(--ink);border-color:var(--ink);color:#fff}',
      '.pm-b{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:600;background:#F0EFEC;color:var(--sub);white-space:nowrap}',
      '.pm-rs-PENDING{background:#FBF3E4;color:var(--warn)}.pm-rs-APPROVED{background:#E5F3EB;color:var(--ok)}.pm-rs-REJECTED{background:#FBEAE7;color:var(--accent)}.pm-rs-REVISION_REQUESTED{background:#E9F0FB;color:var(--info)}',
      '.pm-ws-ELIGIBLE{background:#FBF3E4;color:var(--warn)}.pm-ws-PREPARING,.pm-ws-SHIP_READY,.pm-ws-SHIPPING{background:#E9F0FB;color:var(--info)}.pm-ws-DELIVERED{background:#E5F3EB;color:var(--ok)}.pm-ws-ON_HOLD{background:#F0EFEC;color:var(--sub)}.pm-ws-CANCELED{background:#F0EFEC;color:var(--mut);text-decoration:line-through}',
      '.pm-gold{background:#F6EBD3;color:#7A5A1E}.pm-flag{background:#FBEAE7;color:var(--accent)}.pm-test{background:#EDE7FA;color:#5B3FA6}',
      '.pm-mut{color:var(--mut)}.pm-stars{color:#C6A16A;letter-spacing:1px;font-size:13px}.pm-stars i{color:#E3DED4;font-style:normal}',
      '.pm-ph{display:inline-flex;gap:3px}.pm-ph span{font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;background:#F0EFEC;color:#B9B6AE;letter-spacing:.04em}.pm-ph span.y{background:#1C1C1C;color:#E5C58D}',
      '.pm-note{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;font-size:13px;color:var(--sub);margin-bottom:18px;line-height:1.6}',
      '.pm-warn{border-color:#EBC7C2;background:#FDF6F5;color:#8C2A20}',
      '.pm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:1000px){.pm-grid2{grid-template-columns:1fr}}',
      '.pm-card{background:#fff;border:1px solid var(--line);border-radius:13px;padding:20px 22px;margin-bottom:16px}.pm-card h3{margin:0 0 14px;font-size:14px}.pm-card h3 small{font-weight:400;color:var(--mut);margin-left:8px;font-size:12px}',
      '.pm-form{display:grid;grid-template-columns:150px 1fr;gap:10px 14px;align-items:center;font-size:13px}.pm-form label{color:var(--sub)}.pm-form input[type=text],.pm-form input[type=number],.pm-form input[type=datetime-local],.pm-form select,.pm-form textarea,.pm-in{padding:9px 11px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;width:100%;background:#fff}.pm-form textarea,textarea.pm-in{min-height:76px;resize:vertical}.pm-form .pm-hint{grid-column:2;color:var(--mut);font-size:12px;margin-top:-6px}@media(max-width:700px){.pm-form{grid-template-columns:1fr}.pm-form .pm-hint{grid-column:1}}',
      '.pm-pager{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:12px;font-size:12.5px;color:var(--mut)}',
      '.pm-ov{position:fixed;inset:0;background:rgba(20,20,18,.45);z-index:60;opacity:0;pointer-events:none;transition:opacity .2s}.pm-ov.on{opacity:1;pointer-events:auto}',
      '.pm-dr{position:fixed;top:0;right:-900px;bottom:0;width:min(860px,100vw);background:var(--bg);z-index:61;transition:right .25s cubic-bezier(.2,.8,.2,1);overflow-y:auto;box-shadow:-18px 0 50px rgba(20,20,18,.18)}.pm-dr.on{right:0}',
      '.pm-dh{position:sticky;top:0;z-index:2;background:var(--ink);color:#fff;padding:18px 24px;display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.pm-dh h2{margin:0;font-size:17px}.pm-dh small{display:block;color:rgba(255,255,255,.6);font-size:12px;margin-top:4px}.pm-dh button{background:none;border:0;color:#fff;font-size:24px;cursor:pointer;line-height:1}',
      '.pm-db{padding:20px 24px 60px}.pm-kv{display:grid;grid-template-columns:110px 1fr;gap:8px 12px;font-size:13.5px}.pm-kv dt{color:var(--mut)}.pm-kv dd{margin:0;word-break:break-all;white-space:pre-wrap}',
      '.pm-review{white-space:pre-wrap;word-break:break-word;line-height:1.7;font-size:14px;background:#FAF9F6;border-radius:10px;padding:14px 16px;max-height:340px;overflow:auto}',
      '.pm-imgs{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pm-img{position:relative;background:#111;border-radius:10px;overflow:hidden;aspect-ratio:4/5}.pm-img img{width:100%;height:100%;object-fit:contain;display:block;cursor:zoom-in}.pm-img .tag{position:absolute;left:8px;top:8px;background:rgba(0,0,0,.7);color:#E5C58D;font-size:10.5px;font-weight:700;letter-spacing:.12em;padding:4px 8px;border-radius:5px}.pm-img .dl{position:absolute;right:8px;bottom:8px;background:rgba(255,255,255,.92);color:#111;font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:6px;text-decoration:none}.pm-img.none{display:flex;align-items:center;justify-content:center;color:#777;font-size:12.5px;background:#EFEDE8}',
      '.pm-cmp{position:relative;margin-top:12px;border-radius:10px;overflow:hidden;background:#111;aspect-ratio:4/5;max-height:560px;user-select:none;touch-action:none}.pm-cmp img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}.pm-cmp .top{clip-path:inset(0 50% 0 0)}.pm-cmp .bar{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#E5C58D;cursor:ew-resize}.pm-cmp .bar:after{content:"◂ ▸";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#E5C58D;color:#111;font-size:11px;padding:6px 7px;border-radius:99px;white-space:nowrap}.pm-cmp .l,.pm-cmp .r{position:absolute;bottom:8px;font-size:10.5px;font-weight:700;letter-spacing:.12em;color:#E5C58D;background:rgba(0,0,0,.7);padding:4px 8px;border-radius:5px}.pm-cmp .l{left:8px}.pm-cmp .r{right:8px}',
      '.pm-acts{display:flex;flex-wrap:wrap;gap:8px}.pm-log{font-size:12.5px;border-top:1px solid #F0EEEA;padding:9px 0;display:grid;grid-template-columns:118px 1fr;gap:10px}.pm-log:first-child{border-top:0}.pm-log time{color:var(--mut)}.pm-log b{font-weight:600}.pm-log em{font-style:normal;color:var(--sub)}',
      '.pm-zoom{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:80;display:flex;align-items:center;justify-content:center;cursor:zoom-out}.pm-zoom img{max-width:96vw;max-height:96vh}',
      '.pm-md{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(20,20,18,.5);padding:16px}.pm-md.on{display:flex}.pm-md .box{background:#fff;border-radius:14px;padding:24px;width:min(520px,100%);max-height:92vh;overflow:auto}.pm-md h3{margin:0 0 6px;font-size:16px}.pm-md p{margin:0 0 14px;color:var(--sub);font-size:13px;line-height:1.6}.pm-md .f{display:grid;gap:10px;margin-bottom:16px}.pm-md .f label{font-size:12px;color:var(--sub);display:grid;gap:5px}.pm-md .btns{display:flex;justify-content:flex-end;gap:8px}',
      '.pm-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:16px}.pm-gc{background:#fff;border:1px solid var(--line);border-radius:13px;overflow:hidden;display:flex;flex-direction:column}.pm-gc .pics{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#111;cursor:pointer}.pm-gc .pics .pm-img{border-radius:0;aspect-ratio:1/1}.pm-gc .pics .pm-img img{object-fit:cover;cursor:pointer}.pm-gc .bd{padding:14px 16px;display:grid;gap:8px;flex:1}.pm-gc .tt{font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pm-gc .tx{font-size:12.5px;color:var(--sub);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.pm-gc .ft{display:flex;gap:6px;flex-wrap:wrap;padding:0 16px 14px}',
      '.pm-slots{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-bottom:22px}.pm-slot{background:#fff;border:1px solid var(--line);border-radius:13px;padding:18px;min-height:150px;display:grid;gap:8px;align-content:start}.pm-slot.empty{border-style:dashed;color:var(--mut);place-items:center;text-align:center;font-size:13px}.pm-slot .rk{font-family:Archivo,sans-serif;font-size:11px;letter-spacing:.18em;color:#8F6B3A;font-weight:700}.pm-slot.win{border-color:#C6A16A;background:linear-gradient(180deg,#FFFDF8,#fff)}',
      '.pm-bars{display:grid;gap:7px}.pm-bar{display:grid;grid-template-columns:110px 1fr 46px;gap:10px;align-items:center;font-size:12.5px}.pm-bar i{display:block;height:9px;border-radius:99px;background:#C6A16A;min-width:2px}.pm-bar span:last-child{text-align:right;font-weight:600}',
      '.pm-chk{width:16px;height:16px}.pm-link{color:var(--info);cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
      '#pmToast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);background:#1C1C1C;color:#fff;padding:11px 20px;border-radius:99px;font-size:13px;opacity:0;transition:all .2s;z-index:90;pointer-events:none}#pmToast.on{opacity:1;transform:translate(-50%,0)}#pmToast.bad{background:#C0392B}',
      '@media print{.pm-tabs,.pm-noprint{display:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---------- 공통 틀 ----------
  function shell(title, crumb, acts) {
    return '<div class="pagehead"><div><div class="crumb">' + E(crumb || 'Promotion Management') + '</div><h1>' + E(title) + '</h1></div><div class="acts pm-noprint">' + (acts || '') + '</div></div>' +
      '<div class="pm-tabs">' + SUBS.map(function (t) { return '<button data-sub="' + t[0] + '" class="' + (t[0] === sub ? 'on' : '') + '">' + E(t[1]) + '</button>'; }).join('') + '</div><div id="pmBody"><div class="empty">불러오는 중…</div></div>';
  }
  function bindShell() { $$('.pm-tabs button').forEach(function (b) { b.onclick = function () { nav(b.dataset.sub); }; }); }
  function nav(s) { if (cfg.navigate) cfg.navigate(s); else { sub = s; render(); } }
  function body(html) { var b = $('#pmBody'); if (b) b.innerHTML = html; }
  function fail(e) { body('<div class="pm-note pm-warn">' + E(e.message) + '</div>'); }
  function ensureLayers() {
    if (document.getElementById('pmOv')) return;
    var d = document.createElement('div');
    d.innerHTML = '<div class="pm-ov" id="pmOv"></div><aside class="pm-dr" id="pmDr" aria-label="참여 상세"></aside><div class="pm-md" id="pmMd"><div class="box" id="pmMdBox"></div></div>';
    while (d.firstChild) document.body.appendChild(d.firstChild);
    document.getElementById('pmOv').onclick = closeDrawer;
    document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; var z = document.querySelector('.pm-zoom'); if (z) z.remove(); else if (document.getElementById('pmMd').classList.contains('on')) closeModal(); else closeDrawer(); });
  }
  function closeDrawer() { var o = document.getElementById('pmOv'), d = document.getElementById('pmDr'); if (o) o.classList.remove('on'); if (d) { d.classList.remove('on'); d.dataset.id = ''; } }
  function closeModal() { document.getElementById('pmMd').classList.remove('on'); }
  /** 입력 모달: fields=[{k,label,type,value,options,required,placeholder}] → Promise(values|null) */
  function ask(title, desc, fields, okLabel, danger) {
    ensureLayers();
    return new Promise(function (res) {
      var box = document.getElementById('pmMdBox');
      box.innerHTML = '<h3>' + E(title) + '</h3>' + (desc ? '<p>' + desc + '</p>' : '') + '<form><div class="f">' + (fields || []).map(function (f) {
        var a = 'name="' + f.k + '" class="pm-in"' + (f.required ? ' required' : '') + (f.placeholder ? ' placeholder="' + E(f.placeholder) + '"' : '');
        var inp = f.type === 'textarea' ? '<textarea ' + a + ' maxlength="' + (f.max || 400) + '">' + E(f.value || '') + '</textarea>'
          : f.type === 'select' ? '<select ' + a + '>' + f.options.map(function (o) { return '<option value="' + E(o[0]) + '"' + (String(o[0]) === String(f.value == null ? '' : f.value) ? ' selected' : '') + '>' + E(o[1]) + '</option>'; }).join('') + '</select>'
          : '<input type="' + (f.type || 'text') + '" ' + a + ' value="' + E(f.value == null ? '' : f.value) + '"' + (f.list ? ' list="' + f.list + '"' : '') + '>';
        return '<label>' + E(f.label) + inp + '</label>';
      }).join('') + '</div><datalist id="pmCarriers">' + CARRIERS.map(function (c) { return '<option value="' + E(c) + '">'; }).join('') + '</datalist>' +
        '<div class="btns"><button type="button" class="btn" data-x>취소</button><button type="submit" class="btn ' + (danger ? 'danger' : 'pri') + '">' + E(okLabel || '확인') + '</button></div></form>';
      var md = document.getElementById('pmMd'); md.classList.add('on');
      var form = box.querySelector('form'); var first = form.querySelector('.pm-in'); if (first) setTimeout(function () { first.focus(); }, 30);
      box.querySelector('[data-x]').onclick = function () { closeModal(); res(null); };
      form.onsubmit = function (e) { e.preventDefault(); var o = {}; (fields || []).forEach(function (f) { o[f.k] = form.elements[f.k].value.trim(); }); closeModal(); res(o); };
    });
  }
  function zoom(src) { var z = document.createElement('div'); z.className = 'pm-zoom'; z.innerHTML = '<img alt="확대 보기" src="' + E(src) + '">'; z.onclick = function () { z.remove(); }; document.body.appendChild(z); }
  function compareHtml(before, after) {
    return '<div class="pm-cmp" data-cmp><img alt="사용 후" src="' + E(after) + '"><img class="top" alt="사용 전" src="' + E(before) + '"><div class="bar"></div><span class="l">BEFORE</span><span class="r">AFTER</span></div>';
  }
  function bindCompare(scope) {
    $$('[data-cmp]', scope).forEach(function (c) {
      var top = c.querySelector('.top'), bar = c.querySelector('.bar');
      function set(x) { var r = c.getBoundingClientRect(); var p = Math.max(0, Math.min(100, (x - r.left) / r.width * 100)); top.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)'; bar.style.left = p + '%'; }
      c.addEventListener('pointerdown', function (e) { c.setPointerCapture(e.pointerId); set(e.clientX); c.onpointermove = function (ev) { set(ev.clientX); }; });
      c.addEventListener('pointerup', function () { c.onpointermove = null; });
    });
  }

  // =========================================================
  // 1. 프로모션 대시보드
  // =========================================================
  function vDash() {
    root.innerHTML = shell('프로모션 대시보드', 'Promotion Management', '<button class="btn" id="pmRf">새로고침</button>'); bindShell();
    $('#pmRf').onclick = vDash;
    api('GET', '/dashboard').then(function (d) {
      EVENT = d.event; var c = d.cards, x = d.extra;
      var card = function (l, v, unit, hot, go) { return '<div class="kpi' + (hot ? ' hot' : '') + '"' + (go ? ' data-go="' + go + '" style="cursor:pointer"' : '') + '><div class="l">' + E(l) + '</div><div class="v">' + v + (unit ? '<small>' + unit + '</small>' : '') + '</div></div>'; };
      var ph = { OPEN: '접수 중', UPCOMING: '시작 전', ENDED: '기간 종료', CLOSED: '접수 마감' }[d.event.phase];
      body('<div class="pm-note"><b>' + E(d.event.eventName) + '</b> · <span class="pm-b ' + (d.event.phase === 'OPEN' ? 'pm-rs-APPROVED' : 'pm-rs-PENDING') + '">' + ph + '</span> · 기간 ' +
        (d.event.startDate ? day(d.event.startDate) : '시작일 미정') + ' ~ ' + (d.event.endDate ? day(d.event.endDate) : '종료일 미정') +
        (ME.distributorCode ? ' · <b>총판 ' + E(ME.distributorCode) + '</b> 유입 참여자 기준' : '') + ' <span class="pm-mut">· ' + dt(d.asOf) + ' 기준 실시간 집계 (테스트 접수 제외)</span></div>' +
        '<div class="kpis">' +
        card('전체 참여자 수', c.total, '명', false, 'people') + card('오늘 신규 참여자', c.today, '명', c.today > 0, 'people:today') + card('사진 업로드 완료', c.photosDone, '건', false, 'people:photos') +
        card('후기 검토 대기', c.pendingReview, '건', c.pendingReview > 0, 'photos') + card('우수 후기 선정 인원', c.winners, '/ ' + c.winnerTarget + '명' + (c.winnersConfirmed ? ' 확정' : ''), false, 'winners') +
        card('프로틴 쉐이크 지급 대기', c.shakeWaiting, '건', c.shakeWaiting > 0, 'rewards:PARTICIPATION') + card('프로틴 쉐이크 지급 완료', c.shakeDelivered, '건', false, 'rewards:PARTICIPATION') +
        card('벌스데이 크림 지급 대기', c.creamWaiting, '건', c.creamWaiting > 0, 'rewards:WINNER') + card('벌스데이 크림 지급 완료', c.creamDelivered, '건', false, 'rewards:WINNER') + '</div>' +
        '<div class="pm-note">승인 <b>' + x.approved + '</b> · 반려 <b>' + x.rejected + '</b> · 수정 요청 <b>' + x.revision + '</b> · 우수 후기 후보 <b>' + x.candidates + '</b> · 평균 별점 <b>' + (x.avgRating == null ? '—' : x.avgRating.toFixed(2)) + '</b>' +
        (x.flagged ? ' · <span class="pm-b pm-flag">중복·부정 참여 확인 필요 ' + x.flagged + '건</span> <span class="pm-link" data-go="people:flag">확인하기</span>' : '') + '</div>' +
        '<h3 style="font-size:14px;margin:22px 0 10px">최근 접수</h3>' + peopleTable(d.recent, true));
      $$('[data-go]').forEach(function (el) { el.onclick = function () {
        var g = el.dataset.go.split(':'); var today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
        if (g[0] === 'people') { F.people = Object.assign(F.people, { q: '', status: '', photos: '', flag: '', from: '', to: '', offset: 0 }); if (g[1] === 'today') { F.people.from = today; F.people.to = today; } if (g[1] === 'photos') F.people.photos = 'BOTH'; if (g[1] === 'flag') F.people.flag = 'Y'; }
        if (g[0] === 'rewards') { F.rewards.type = g[1]; F.rewards.status = ''; }
        nav(g[0]);
      }; });
      bindRows();
    }).catch(fail);
  }

  // =========================================================
  // 3. 이벤트 참여자 관리 (목록·검색·필터·엑셀)
  // =========================================================
  function peopleTable(items, compact) {
    if (!items.length) return '<div class="tablewrap"><div class="empty">조건에 맞는 참여자가 없습니다.</div></div>';
    return '<div class="tablewrap"><table><thead><tr><th>접수번호</th><th>접수일</th><th>이름</th><th>휴대폰</th><th>회원 여부</th><th>주문번호</th><th>후기 제목</th><th>사진</th><th>별점</th><th>검토 상태</th><th>우수 후기</th><th>참가 보상<br>프로틴 쉐이크</th><th>추가 보상<br>벌스데이 크림</th>' + (compact ? '' : '<th>총판</th>') + '<th>관리</th></tr></thead><tbody>' +
      items.map(function (x) {
        return '<tr data-id="' + x.id + '"><td class="arch" style="font-size:11.5px">' + E(x.applicationNumber) + (x.isTest ? ' <span class="pm-b pm-test">테스트</span>' : '') + (x.flagged ? ' <span class="pm-b pm-flag" title="' + E(x.flagReason || '') + '">확인 필요</span>' : '') + '</td>' +
          '<td>' + dt(x.submittedAt) + '</td><td><b>' + E(x.name) + '</b></td><td>' + E(x.phone) + '</td>' +
          '<td>' + (x.memberClaimed ? '회원' + (x.memberLoginId ? ' <span class="pm-mut">' + E(x.memberLoginId) + '</span>' : '') : '<span class="pm-mut">비회원</span>') + '</td>' +
          '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis">' + E(x.orderNumber || '—') + '</td>' +
          '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">' + E(x.title) + '</td>' +
          '<td><span class="pm-ph"><span class="' + (x.hasBefore ? 'y' : '') + '">BEFORE</span><span class="' + (x.hasAfter ? 'y' : '') + '">AFTER</span></span></td>' +
          '<td>' + stars(x.rating) + '</td><td>' + rsBadge(x.reviewStatus) + '</td>' +
          '<td>' + (x.winner ? '<span class="pm-b pm-gold">' + x.winner.rank + '위 ' + (x.winner.status === 'CONFIRMED' ? '확정' : '선정') + '</span>' : x.isCandidate ? '<span class="pm-b">후보</span>' : '<span class="pm-mut">미선정</span>') + '</td>' +
          '<td>' + wsBadge(x.participationReward) + '</td><td>' + wsBadge(x.winnerReward) + '</td>' + (compact ? '' : '<td>' + E(x.distributorCode || '—') + '</td>') +
          '<td><button class="btn sm" data-open="' + x.id + '">상세보기</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function bindRows() { $$('tr[data-id]').forEach(function (tr) { tr.onclick = function () { openDetail(Number(tr.dataset.id)); }; }); }
  function vPeople() {
    var f = F.people, sel = function (k, opts) { return '<select data-f="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (f[k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
    root.innerHTML = shell('이벤트 참여자 관리', 'Participants', (has('promo.export') ? '<button class="btn" id="pmX">엑셀 다운로드</button>' : '') + '<button class="btn" id="pmRf">새로고침</button>'); bindShell();
    body('<div class="filters pm-noprint"><input type="text" data-f="q" placeholder="이름 · 휴대폰 번호 · 접수번호 · 주문번호 검색" value="' + E(f.q) + '">' +
      '<input type="date" data-f="from" value="' + E(f.from) + '" title="접수일 시작"><input type="date" data-f="to" value="' + E(f.to) + '" title="접수일 끝">' +
      sel('member', [['', '회원 여부 전체'], ['Y', '유니앤코어 회원'], ['N', '비회원']]) +
      sel('status', [['', '검토 상태 전체']].concat(Object.keys(RS).map(function (k) { return [k, RS[k]]; }))) +
      sel('winner', [['', '우수 후기 전체'], ['Y', '선정'], ['N', '미선정']]) +
      sel('photos', [['', '사진 제출 전체'], ['BOTH', '전·후 모두 제출'], ['PARTIAL', '1장만 제출'], ['NONE', '미제출']]) +
      sel('rewardType', [['PARTICIPATION', '프로틴 쉐이크'], ['WINNER', '벌스데이 크림']]) +
      sel('rewardStatus', [['', '지급 상태 전체'], ['NONE', '지급 대상 아님']].concat(Object.keys(WS).map(function (k) { return [k, WS[k]]; }))) +
      sel('flag', [['', '확인 대상 포함'], ['Y', '중복·부정 의심만']]) + sel('test', [['', '운영 접수만'], ['only', '테스트 접수만'], ['all', '테스트 포함']]) +
      '<span class="count" id="pmCnt"></span></div><div id="pmList"><div class="empty">불러오는 중…</div></div>');
    var load = function () {
      api('GET', '/reviews?' + qs(Object.assign({ limit: 50 }, f))).then(function (d) {
        $('#pmCnt').textContent = '총 ' + d.total + '명';
        $('#pmList').innerHTML = peopleTable(d.items) + '<div class="pm-pager pm-noprint">' + (d.total ? (d.offset + 1) + '–' + Math.min(d.total, d.offset + d.items.length) + ' / ' + d.total : '') +
          ' <button class="btn sm" id="pmPrev"' + (d.offset ? '' : ' disabled') + '>이전</button><button class="btn sm" id="pmNext"' + (d.offset + d.items.length < d.total ? '' : ' disabled') + '>다음</button></div>';
        bindRows();
        $('#pmPrev').onclick = function () { f.offset = Math.max(0, f.offset - 50); load(); }; $('#pmNext').onclick = function () { f.offset += 50; load(); };
      }).catch(function (e) { $('#pmList').innerHTML = '<div class="pm-note pm-warn">' + E(e.message) + '</div>'; });
    };
    var t; $$('[data-f]').forEach(function (el) { el.addEventListener(el.type === 'text' ? 'input' : 'change', function () { f[el.dataset.f] = el.value; f.offset = 0; clearTimeout(t); t = setTimeout(load, el.type === 'text' ? 300 : 0); }); });
    $('#pmRf').onclick = load; if ($('#pmX')) $('#pmX').onclick = function () { exportXlsx(f); };
    refreshList = load; load();
  }
  var refreshList = null;
  function exportXlsx(f) {
    if (!confirm('참여자의 이름·연락처·주소가 포함된 엑셀 파일을 내려받습니다.\n내려받은 사실은 활동 로그에 기록됩니다. 계속할까요?')) return;
    fetch(API + '/reviews.xlsx?' + qs(Object.assign({}, f, { offset: '' })), { headers: cfg.headers(), credentials: 'omit' }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error((j.error && j.error.message) || '내려받지 못했습니다.'); });
      return r.blob().then(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (r.headers.get('content-disposition') || '').replace(/.*filename="?([^";]+)"?.*/, '$1') || 'birthday-review.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); say('엑셀 파일을 내려받았습니다'); });
    }).catch(function (e) { say(e.message, true); });
  }

  // =========================================================
  // 상세 (고객 정보 · 후기 · 사진 · 처리 · 이력)
  // =========================================================
  function openDetail(id) {
    ensureLayers();
    var dr = document.getElementById('pmDr'); dr.dataset.id = id;
    dr.innerHTML = '<div class="pm-dh"><div><h2>불러오는 중…</h2></div><button aria-label="닫기" data-close>×</button></div>';
    document.getElementById('pmOv').classList.add('on'); dr.classList.add('on');
    dr.querySelector('[data-close]').onclick = closeDrawer;
    api('GET', '/reviews/' + id).then(function (d) { if (dr.dataset.id == id) drawDetail(d); }).catch(function (e) { dr.innerHTML += '<div class="pm-db"><div class="pm-note pm-warn">' + E(e.message) + '</div></div>'; });
  }
  function drawDetail(d) {
    var dr = document.getElementById('pmDr'), c = d.customer, r = d.review, st = d.status;
    d.images.forEach(function (i) { i.url = abs(i.url); i.downloadUrl = abs(i.downloadUrl); });
    var bf = d.images.filter(function (i) { return i.type === 'BEFORE'; })[0], af = d.images.filter(function (i) { return i.type === 'AFTER'; })[0];
    var pic = function (img, label) {
      if (!img) return '<div class="pm-img none">' + label + ' 사진 없음</div>';
      if (!img.url) return '<div class="pm-img none">' + label + ' 사진 제출됨<br>(열람 권한 없음)</div>';
      return '<div class="pm-img"><img alt="' + label + ' 사진" src="' + E(img.url) + '" data-zoom><span class="tag">' + (img.type) + '</span><a class="dl" href="' + E(img.downloadUrl) + '">원본 다운로드</a></div>';
    };
    var can = !d.purged;
    var acts = [];
    if (can && has('promo.review')) {
      if (st.reviewStatus !== 'APPROVED') acts.push('<button class="btn pri" data-a="approve">후기 승인</button>');
      if (st.reviewStatus !== 'REJECTED') acts.push('<button class="btn danger" data-a="reject">후기 반려</button>');
      if (st.reviewStatus !== 'REVISION_REQUESTED') acts.push('<button class="btn" data-a="revise">수정 요청</button>');
      if (st.reviewStatus !== 'PENDING') acts.push('<button class="btn" data-a="pending">검토 대기로</button>');
      if (!d.winner) acts.push('<button class="btn" data-a="cand">' + (st.isCandidate ? '우수 후기 후보 해제' : '우수 후기 후보 등록') + '</button>');
      if (st.flagged) acts.push('<button class="btn" data-a="unflag">중복·부정 확인 완료</button>'); else acts.push('<button class="btn" data-a="flag">확인 대상으로 표시</button>');
    }
    if (can && has('promo.winner')) acts.push(d.winner ? '<button class="btn danger" data-a="unwin">우수 후기 선정 취소</button>' : '<button class="btn" data-a="win" style="border-color:#C6A16A;color:#7A5A1E">우수 후기 선정</button>');
    if (can && has('promo.edit')) acts.push('<button class="btn" data-a="edit">참여자 정보 수정</button>');
    if (can && has('promo.purge')) acts.push('<button class="btn danger" data-a="purge">개인정보 삭제·파기</button>');
    dr.innerHTML = '<div class="pm-dh"><div><h2>' + E(c.name) + ' <span style="font-weight:400;font-size:13px;opacity:.75">' + E(d.applicationNumber) + '</span></h2><small>접수 ' + dt(d.submittedAt) + (d.entryNo > 1 ? ' · ' + d.entryNo + '번째 접수(예외 승인)' : '') + (d.isTest ? ' · 테스트 접수' : '') + '</small></div><button aria-label="닫기" data-close>×</button></div><div class="pm-db">' +
      (d.purged ? '<div class="pm-note pm-warn">개인정보가 파기된 접수입니다. (' + dt(d.purgedAt) + ')</div>' : '') +
      (st.flagged ? '<div class="pm-note pm-warn"><b>중복·부정 참여 확인 대상</b> — ' + E(st.flagReason || '') + '</div>' : '') +
      '<div class="pm-card"><h3>처리 상태</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px">' + rsBadge(st.reviewStatus) +
        (d.winner ? '<span class="pm-b pm-gold">우수 후기 ' + d.winner.rank + '위 ' + (d.winner.status === 'CONFIRMED' ? '· 최종 확정' : '· 선정') + '</span>' : st.isCandidate ? '<span class="pm-b">우수 후기 후보</span>' : '') +
        (st.reason ? '<span class="pm-mut" style="font-size:12.5px">사유: ' + E(st.reason) + '</span>' : '') + '</div><div class="pm-acts">' + (acts.join('') || '<span class="pm-mut" style="font-size:12.5px">조회 권한만 있는 계정입니다.</span>') + '</div>' +
        (d.winner ? '<div class="pm-mut" style="font-size:12.5px;margin-top:10px">선정 사유: ' + E(d.winner.note || '—') + ' · ' + E(d.winner.selectedBy) + ' · ' + dt(d.winner.selectedAt) + '</div>' : '') + '</div>' +
      '<div class="pm-card"><h3>고객 정보</h3><dl class="pm-kv"><dt>이름</dt><dd>' + E(c.name) + '</dd><dt>연락처</dt><dd>' + E(c.phone) + '</dd>' +
        '<dt>회원 ID</dt><dd>' + (c.memberClaimed ? E(c.memberLoginId || '(아이디 미입력)') + ' <span class="pm-mut">· 본인 입력' + (c.memberVerified ? ' · 회원 확인됨' : ' · 쇼핑몰 회원 DB 미대조') + '</span>' : '비회원') + '</dd>' +
        '<dt>주문 번호</dt><dd>' + E(c.orderNumber || '—') + '</dd><dt>신청 일자</dt><dd>' + dt(d.submittedAt) + '</dd><dt>접수 번호</dt><dd>' + E(d.applicationNumber) + '</dd>' +
        '<dt>배송 주소</dt><dd>' + (c.address ? '(' + E(c.postalCode || '') + ') ' + E(c.address) : '—') + '</dd><dt>유입 총판</dt><dd>' + E(c.distributorCode || '직접 유입') + '</dd>' +
        '<dt>보유 기한</dt><dd>' + E(d.retentionUntil ? String(d.retentionUntil).slice(0, 10) : '—') + ' 까지</dd></dl></div>' +
      '<div class="pm-card"><h3>후기 정보</h3><dl class="pm-kv" style="margin-bottom:12px"><dt>후기 제목</dt><dd><b>' + E(r.title) + '</b></dd><dt>제품 만족도</dt><dd>' + stars(r.rating) + '</dd><dt>사용 경험</dt><dd>' + stars(r.ratingExperience) + '</dd>' +
        '<dt>피부 타입</dt><dd>' + E(r.skinType || '—') + '</dd><dt>사용 기간</dt><dd>' + E(r.usagePeriod || '—') + '</dd>' + (r.recommendReason ? '<dt>추천 이유</dt><dd>' + E(r.recommendReason) + '</dd>' : '') + '</dl><div class="pm-review">' + E(r.content) + '</div></div>' +
      '<div class="pm-card"><h3>사용 전 / 사용 후 사진 <small>관리자만 열람 · 링크는 5분 뒤 만료</small></h3><div class="pm-imgs">' + pic(bf, '사용 전') + pic(af, '사용 후') + '</div>' +
        (bf && af && bf.url ? '<div class="pm-mut" style="font-size:12px;margin-top:14px">좌우로 끌어 사용 전·후를 비교합니다</div>' + compareHtml(bf.url, af.url) : '') +
        '<div class="pm-mut" style="font-size:12px;margin-top:10px">후기·사진 마케팅 활용 동의: <b>' + (d.consents.some(function (x) { return x.type === 'MARKETING_USE' && x.agreed; }) ? '동의' : '미동의 (외부 공개 불가)') + '</b></div></div>' +
      (d.adminMemo !== null ? '<div class="pm-card"><h3>내부 관리자 메모</h3><textarea class="pm-in" id="pmMemo" maxlength="2000" placeholder="내부 공유용 메모 (참여자에게 보이지 않습니다)"' + (has('promo.review') && can ? '' : ' disabled') + '>' + E(d.adminMemo || '') + '</textarea>' + (has('promo.review') && can ? '<div style="text-align:right;margin-top:8px"><button class="btn sm" data-a="memo">메모 저장</button></div>' : '') + '</div>' : '') +
      '<div class="pm-card"><h3>사은품 지급</h3>' + (d.rewards.length ? d.rewards.map(function (x) {
        return '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 0;border-top:1px solid #F0EEEA"><b style="min-width:150px">' + E(x.productName) + ' × ' + x.quantity + '</b><span class="pm-mut" style="font-size:12px">' + E(x.typeLabel) + '</span>' + wsBadge(x) +
          (x.trackingNumber ? '<span class="pm-mut" style="font-size:12px">' + E(x.carrier || '') + ' ' + E(x.trackingNumber) + '</span>' : '') + '</div>'; }).join('') + '<div style="margin-top:10px"><span class="pm-link" data-a="gorewards">사은품 지급 관리에서 처리 →</span></div>'
        : '<span class="pm-mut" style="font-size:13px">아직 지급 대상이 아닙니다. 후기를 승인하면 프로틴 쉐이크 지급 대상으로 자동 등록됩니다.</span>') + '</div>' +
      (d.related.length ? '<div class="pm-card"><h3>같은 휴대폰·주문번호의 다른 접수</h3>' + d.related.map(function (x) { return '<div style="padding:6px 0;font-size:13px"><span class="pm-link" data-rel="' + x.id + '">' + E(x.applicationNumber) + '</span> · ' + E(x.name) + ' · ' + rsBadge(x.reviewStatus) + ' <span class="pm-mut">' + (x.samePhone ? '같은 휴대폰 ' : '') + (x.sameOrder ? '같은 주문번호' : '') + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="pm-card"><h3>동의 기록</h3>' + d.consents.map(function (x) { var n = { PRIVACY_COLLECT: '개인정보 수집·이용', EVENT_PROCESSING: '이벤트 운영·당첨자 확인', GIFT_SHIPPING: '사은품 배송', MARKETING_USE: '후기·사진 마케팅 활용(선택)' }[x.type];
        return '<div style="font-size:13px;padding:5px 0">' + (x.agreed ? '✓' : '—') + ' ' + n + ' <span class="pm-mut">· ' + (x.agreed ? '동의' : '미동의') + ' · 문서 버전 ' + E(x.version) + ' · ' + dt(x.agreedAt) + '</span></div>'; }).join('') + '</div>' +
      '<div class="pm-card"><h3>상태 변경 이력 · 처리 담당자</h3>' + (d.logs.length ? d.logs.map(logRow).join('') : '<span class="pm-mut">이력이 없습니다.</span>') + '</div></div>';
    dr.querySelector('[data-close]').onclick = closeDrawer;
    $$('[data-zoom]', dr).forEach(function (im) { im.onclick = function () { zoom(im.src); }; im.onerror = function () { if (!dr.dataset.retried) { dr.dataset.retried = '1'; openDetail(d.id); } }; });
    bindCompare(dr);
    $$('[data-rel]', dr).forEach(function (a) { a.onclick = function () { openDetail(Number(a.dataset.rel)); }; });
    var again = function () { dr.dataset.retried = ''; openDetail(d.id); if (refreshList) refreshList(); };
    var status = function (to, reason) { return run(api('POST', '/reviews/' + d.id + '/status', { status: to, reason: reason, version: d.version }), '검토 상태를 ' + RS[to] + '(으)로 변경했습니다', again); };
    var on = {
      approve: function () { status('APPROVED'); },
      pending: function () { status('PENDING'); },
      reject: function () { ask('후기 반려', '반려하면 참가 보상(프로틴 쉐이크) 지급 대상에서 제외됩니다. 사유는 참여자의 접수 확인 화면에 표시됩니다.', [{ k: 'reason', label: '반려 사유', type: 'textarea', required: true }], '반려', true).then(function (v) { if (v) status('REJECTED', v.reason); }); },
      revise: function () { ask('수정 요청', '참여자가 접수 번호와 휴대폰 번호로 접수 확인 화면에 들어와 후기·사진을 다시 제출할 수 있습니다.', [{ k: 'reason', label: '수정 요청 내용', type: 'textarea', required: true, placeholder: '예) 사용 후 사진이 흐립니다. 밝은 곳에서 다시 찍어 올려 주세요.' }], '수정 요청').then(function (v) { if (v) status('REVISION_REQUESTED', v.reason); }); },
      cand: function () { run(api('POST', '/reviews/' + d.id + '/candidate', { on: !st.isCandidate }), st.isCandidate ? '후보에서 해제했습니다' : '우수 후기 후보로 등록했습니다', again); },
      unflag: function () { ask('중복·부정 참여 확인 완료', E(st.flagReason || ''), [{ k: 'reason', label: '확인 내용', type: 'textarea', required: true, placeholder: '예) 가족이 각각 구매한 것으로 확인' }], '확인 완료').then(function (v) { if (v) run(api('POST', '/reviews/' + d.id + '/flag', { action: 'CLEAR', reason: v.reason }), '확인 완료로 처리했습니다', again); }); },
      flag: function () { ask('확인 대상으로 표시', '중복·부정 참여가 의심되는 접수로 표시합니다. 확인을 마치기 전에는 우수 후기로 선정할 수 없습니다.', [{ k: 'reason', label: '사유', type: 'textarea', required: true }], '표시').then(function (v) { if (v) run(api('POST', '/reviews/' + d.id + '/flag', { action: 'FLAG', reason: v.reason }), '확인 대상으로 표시했습니다', again); }); },
      win: function () { selectWinner(d.id, again); },
      unwin: function () { ask('우수 후기 선정 취소', '추가 보상(퍼스트 벌스데이 크림) 지급 대상에서 제외됩니다. 참가 보상(프로틴 쉐이크)은 유지됩니다.', [{ k: 'reason', label: '취소 사유', type: 'textarea', required: true }], '선정 취소', true).then(function (v) { if (v) run(api('POST', '/winners/' + d.winner.id + '/cancel', { reason: v.reason }), '선정을 취소했습니다', again); }); },
      memo: function () { run(api('POST', '/reviews/' + d.id + '/memo', { memo: dr.querySelector('#pmMemo').value }), '메모를 저장했습니다'); },
      edit: function () { ask('참여자 정보 수정', '수정 내용과 사유는 변경 이력에 기록됩니다. 발송 전인 사은품의 수령 정보도 함께 바뀝니다.', [
        { k: 'name', label: '이름', value: c.name, required: true }, { k: 'phone', label: '휴대폰 번호', value: c.phone, required: true }, { k: 'orderNumber', label: '주문번호·구매 정보', value: c.orderNumber || '' },
        { k: 'memberLoginId', label: '회원 아이디', value: c.memberLoginId || '' }, { k: 'postalCode', label: '우편번호', value: c.postalCode || '' }, { k: 'address', label: '배송 주소', type: 'textarea', value: c.address || '', max: 220 },
        { k: 'distributorCode', label: '유입 총판 코드', value: c.distributorCode || '' }, { k: 'reason', label: '수정 사유', type: 'textarea', required: true }], '저장').then(function (v) { if (v) run(api('PATCH', '/reviews/' + d.id, v), '참여자 정보를 수정했습니다', again); }); },
      purge: function () { ask('개인정보 삭제 및 파기', '이름·연락처·주소·주문번호·후기 내용·사진 파일이 <b>영구 삭제</b>되며 되돌릴 수 없습니다. 접수 번호와 처리 이력만 남습니다.', [{ k: 'reason', label: '파기 사유', type: 'textarea', required: true, placeholder: '예) 본인 삭제 요청 / 보유 기간 만료' }, { k: 'confirm', label: '확인을 위해 접수 번호를 입력하세요', required: true, placeholder: d.applicationNumber }], '영구 삭제', true).then(function (v) {
        if (!v) return; if (v.confirm.toUpperCase() !== d.applicationNumber) return say('접수 번호가 일치하지 않습니다', true); run(api('POST', '/reviews/' + d.id + '/purge', { reason: v.reason }), '개인정보를 파기했습니다', again); }); },
      gorewards: function () { closeDrawer(); F.rewards.q = d.applicationNumber; F.rewards.type = ''; nav('rewards'); }
    };
    $$('[data-a]', dr).forEach(function (b) { b.onclick = function () { on[b.dataset.a](); }; });
  }
  function logRow(l) {
    var detail = '';
    if (l.previous && l.previous.status && l.next && l.next.status) detail = (RS[l.previous.status] || WS[l.previous.status] || l.previous.status) + ' → ' + (RS[l.next.status] || WS[l.next.status] || l.next.status);
    else if (l.next && l.next.fields) detail = l.next.fields.join(', ');
    else if (l.next && l.next.rank) detail = l.next.rank + '위';
    else if (l.next && l.next.productName) detail = l.next.productName;
    return '<div class="pm-log"><time>' + dt(l.at) + '</time><div><b>' + E(ACT[l.action] || l.action) + '</b>' + (detail ? ' <em>' + E(detail) + '</em>' : '') + ' <span class="pm-mut">· ' + E(l.actor) + '</span>' + (l.reason ? '<div class="pm-mut">사유: ' + E(l.reason) + '</div>' : '') + '</div></div>';
  }
  function selectWinner(reviewId, after) {
    ask('우수 후기 선정', '선정되면 <b>퍼스트 벌스데이 크림</b> 추가 지급 대상과 <b>프로틴 쉐이크</b> 지급 대상으로 자동 등록됩니다.', [
      { k: 'rank', label: '선정 순위', type: 'select', value: '', options: [['', '빈 순위 중 가장 앞']].concat(Array.apply(null, { length: (EVENT && EVENT.settings.winnerCount) || 3 }).map(function (_, i) { return [i + 1, (i + 1) + '위']; })) },
      { k: 'note', label: '선정 사유', type: 'textarea', required: true, placeholder: '예) 4주간의 변화가 구체적이고 사진이 선명함' }], '선정').then(function (v) {
      if (v) run(api('POST', '/winners', { reviewId: reviewId, rank: v.rank ? Number(v.rank) : undefined, note: v.note }), function (d) { return '우수 후기 ' + d.rank + '위로 선정했습니다'; }, after);
    });
  }

  // =========================================================
  // 4. 후기 및 사진 관리 (사진 중심 검토)
  // =========================================================
  function vPhotos() {
    var f = F.photos;
    root.innerHTML = shell('후기 및 사진 관리', 'Reviews & Photos', '<button class="btn" id="pmRf">새로고침</button>'); bindShell();
    if (!has('promo.images')) return body('<div class="pm-note pm-warn">사용 전·후 사진은 고객의 얼굴이 포함될 수 있어 본사 최고 관리자와 프로모션 운영 담당만 열람할 수 있습니다. 후기 내용은 「이벤트 참여자 관리」의 상세보기에서 확인하세요.</div>');
    body('<div class="filters pm-noprint">' + [['PENDING', '검토 대기'], ['APPROVED', '승인'], ['REVISION_REQUESTED', '수정 요청'], ['REJECTED', '반려'], ['', '전체']].map(function (o) { return '<button class="btn sm' + (f.status === o[0] ? ' pri' : '') + '" data-st="' + o[0] + '">' + o[1] + '</button>'; }).join('') +
      '<span class="count" id="pmCnt"></span></div><div class="pm-note">사진은 공개되지 않으며 이 화면에서만 볼 수 있습니다. 카드를 누르면 좌우 비교·확대·원본 다운로드가 가능한 상세 화면이 열립니다.</div><div id="pmList"><div class="empty">불러오는 중…</div></div>');
    var load = function () {
      api('GET', '/reviews?' + qs({ withImages: 1, limit: 24, offset: f.offset, status: f.status })).then(function (d) {
        $('#pmCnt').textContent = '총 ' + d.total + '건';
        $('#pmList').innerHTML = (d.items.length ? '<div class="pm-gal">' + d.items.map(function (x) {
          var im = function (t, label) { var i = (x.images || []).filter(function (y) { return y.type === t; })[0]; return i ? '<div class="pm-img"><img loading="lazy" alt="' + label + '" src="' + E(abs(i.url)) + '"><span class="tag">' + t + '</span></div>' : '<div class="pm-img none">' + label + ' 없음</div>'; };
          return '<div class="pm-gc"><div class="pics" data-open="' + x.id + '">' + im('BEFORE', '사용 전') + im('AFTER', '사용 후') + '</div><div class="bd"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center">' + stars(x.rating) + rsBadge(x.reviewStatus) + '</div>' +
            '<div class="tt">' + E(x.title) + '</div><div class="tx">' + E(x.content) + '</div><div class="pm-mut" style="font-size:12px">' + E(x.name) + ' · ' + E(x.applicationNumber) + ' · ' + day(x.submittedAt) + (x.flagged ? ' · <span class="pm-b pm-flag">확인 필요</span>' : '') + (x.winner ? ' · <span class="pm-b pm-gold">' + x.winner.rank + '위</span>' : x.isCandidate ? ' · <span class="pm-b">후보</span>' : '') + '</div></div>' +
            '<div class="ft">' + (has('promo.review') ? (x.reviewStatus !== 'APPROVED' ? '<button class="btn sm pri" data-ok="' + x.id + '" data-v="' + x.version + '">승인</button>' : '') + (x.reviewStatus !== 'REJECTED' ? '<button class="btn sm danger" data-no="' + x.id + '" data-v="' + x.version + '">반려</button>' : '') +
              (x.reviewStatus === 'APPROVED' && !x.winner ? '<button class="btn sm" data-cd="' + x.id + '" data-on="' + (x.isCandidate ? '0' : '1') + '">' + (x.isCandidate ? '후보 해제' : '후보 등록') + '</button>' : '') : '') + '<button class="btn sm" data-open="' + x.id + '">상세보기</button></div></div>';
        }).join('') + '</div>' : '<div class="tablewrap"><div class="empty">해당 상태의 후기가 없습니다.</div></div>') +
          '<div class="pm-pager pm-noprint"><button class="btn sm" id="pmPrev"' + (d.offset ? '' : ' disabled') + '>이전</button><button class="btn sm" id="pmNext"' + (d.offset + d.items.length < d.total ? '' : ' disabled') + '>다음</button></div>';
        $$('[data-open]').forEach(function (el) { el.onclick = function () { openDetail(Number(el.dataset.open)); }; });
        $$('[data-ok]').forEach(function (b) { b.onclick = function () { run(api('POST', '/reviews/' + b.dataset.ok + '/status', { status: 'APPROVED', version: Number(b.dataset.v) }), '승인했습니다 — 프로틴 쉐이크 지급 대상으로 등록되었습니다', load); }; });
        $$('[data-no]').forEach(function (b) { b.onclick = function () { ask('후기 반려', '사유는 참여자의 접수 확인 화면에 표시됩니다.', [{ k: 'reason', label: '반려 사유', type: 'textarea', required: true }], '반려', true).then(function (v) { if (v) run(api('POST', '/reviews/' + b.dataset.no + '/status', { status: 'REJECTED', reason: v.reason, version: Number(b.dataset.v) }), '반려했습니다', load); }); }; });
        $$('[data-cd]').forEach(function (b) { b.onclick = function () { run(api('POST', '/reviews/' + b.dataset.cd + '/candidate', { on: b.dataset.on === '1' }), b.dataset.on === '1' ? '우수 후기 후보로 등록했습니다' : '후보에서 해제했습니다', load); }; });
        $('#pmPrev').onclick = function () { f.offset = Math.max(0, f.offset - 24); load(); }; $('#pmNext').onclick = function () { f.offset += 24; load(); };
      }).catch(function (e) { $('#pmList').innerHTML = '<div class="pm-note pm-warn">' + E(e.message) + '</div>'; });
    };
    $$('[data-st]').forEach(function (b) { b.onclick = function () { f.status = b.dataset.st; f.offset = 0; vPhotos(); }; });
    $('#pmRf').onclick = load; refreshList = load; load();
  }

  // =========================================================
  // 5. 우수 후기 선정 관리
  // =========================================================
  function vWinners() {
    root.innerHTML = shell('우수 후기 선정 관리', 'Best Reviews', '<button class="btn" id="pmRf">새로고침</button>'); bindShell();
    var load = function () {
      api('GET', '/winners').then(function (d) {
        var slots = [], i;
        for (i = 1; i <= d.winnerCount; i++) (function (rank) {
          var w = d.winners.filter(function (x) { return x.winner.rank === rank; })[0];
          slots.push(w ? '<div class="pm-slot win"><div class="rk">BEST REVIEW · ' + rank + '위' + (w.winner.status === 'CONFIRMED' ? ' · 최종 확정' : '') + '</div><div style="font-size:16px;font-weight:700">' + E(w.name) + ' <span class="pm-mut" style="font-size:12px;font-weight:400">' + E(w.phone) + '</span></div>' +
            '<div>' + stars(w.rating) + '</div><div style="font-weight:600;font-size:13.5px">' + E(w.title) + '</div><div class="pm-mut" style="font-size:12.5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + E(w.content) + '</div>' +
            '<div style="font-size:12px;color:#7A5A1E">선정 사유: ' + E(w.note || '—') + '</div><div class="pm-mut" style="font-size:11.5px">' + E(w.selectedBy) + ' · ' + dt(w.selectedAt) + '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px">프로틴 쉐이크 ' + wsBadge(w.participationReward) + ' 벌스데이 크림 ' + wsBadge(w.winnerReward) + '</div>' +
            '<div class="pm-acts"><button class="btn sm" data-open="' + w.id + '">상세보기</button>' + (has('promo.winner') && !d.confirmed ? '<button class="btn sm" data-rank="' + w.winner.id + '" data-cur="' + rank + '">순위 변경</button><button class="btn sm danger" data-cancel="' + w.winner.id + '">선정 취소</button>' : '') + '</div></div>'
            : '<div class="pm-slot empty"><div><div class="rk">' + rank + '위</div>아직 선정되지 않았습니다<br>아래 후보에서 선정해 주세요</div></div>');
        })(i);
        body('<div class="pm-note">우수 후기는 <b>' + d.winnerCount + '명</b>까지 선정합니다 (현재 ' + d.selected + '명' + (d.confirmed ? ' · <b>최종 확정됨</b>' : '') + '). 선정된 고객은 <b>프로틴 쉐이크</b> 지급 대상이면서 <b>퍼스트 벌스데이 크림</b> 추가 지급 대상이 됩니다. 당첨 안내는 최종 확정 후 개별 연락으로 진행하며, 참여자의 접수 확인 화면에도 확정 후에만 표시됩니다.' +
          (has('promo.winner') ? '<div style="margin-top:10px" class="pm-noprint">' + (d.confirmed ? '<button class="btn sm" id="pmUnc">확정 해제</button>' : '<button class="btn sm pri" id="pmCf"' + (d.selected === d.winnerCount ? '' : ' disabled title="' + d.winnerCount + '명을 모두 선정해야 확정할 수 있습니다"') + '>최종 당첨자 ' + d.winnerCount + '명 확정</button>') + '</div>' : '<div class="pm-mut" style="margin-top:6px">선정·확정은 본사 최고 관리자만 할 수 있습니다.</div>') + '</div>' +
          '<div class="pm-slots">' + slots.join('') + '</div><h3 style="font-size:14px;margin:0 0 10px">우수 후기 후보 <span class="pm-mut" style="font-weight:400">' + d.candidates.length + '건 · 「후기 및 사진 관리」에서 승인된 후기를 후보로 등록합니다</span></h3>' +
          (d.candidates.length ? '<div class="tablewrap"><table><thead><tr><th>접수번호</th><th>이름</th><th>별점</th><th>후기 제목</th><th>후기 내용</th><th>사진</th><th>마케팅 동의</th><th></th></tr></thead><tbody>' + d.candidates.map(function (x) {
            return '<tr data-id="' + x.id + '"><td class="arch" style="font-size:11.5px">' + E(x.applicationNumber) + (x.flagged ? ' <span class="pm-b pm-flag">확인 필요</span>' : '') + '</td><td><b>' + E(x.name) + '</b></td><td>' + stars(x.rating) + '</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">' + E(x.title) + '</td>' +
              '<td style="max-width:360px;overflow:hidden;text-overflow:ellipsis" class="pm-mut">' + E(x.content) + '</td><td><span class="pm-ph"><span class="' + (x.hasBefore ? 'y' : '') + '">BEFORE</span><span class="' + (x.hasAfter ? 'y' : '') + '">AFTER</span></span></td><td>' + (x.marketingConsent ? '동의' : '<span class="pm-mut">미동의</span>') + '</td>' +
              '<td>' + (has('promo.winner') && !d.confirmed && d.selected < d.winnerCount ? '<button class="btn sm" data-win="' + x.id + '" style="border-color:#C6A16A;color:#7A5A1E">우수 후기 선정</button> ' : '') + (has('promo.review') ? '<button class="btn sm" data-uncand="' + x.id + '">후보 해제</button>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="tablewrap"><div class="empty">등록된 후보가 없습니다.</div></div>'));
        bindRows();
        $$('[data-open]').forEach(function (b) { b.onclick = function () { openDetail(Number(b.dataset.open)); }; });
        $$('[data-win]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); selectWinner(Number(b.dataset.win), load); }; });
        $$('[data-uncand]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); run(api('POST', '/reviews/' + b.dataset.uncand + '/candidate', { on: false }), '후보에서 해제했습니다', load); }; });
        $$('[data-cancel]').forEach(function (b) { b.onclick = function () { ask('우수 후기 선정 취소', '추가 보상(퍼스트 벌스데이 크림) 지급 대상에서 제외됩니다.', [{ k: 'reason', label: '취소 사유', type: 'textarea', required: true }], '선정 취소', true).then(function (v) { if (v) run(api('POST', '/winners/' + b.dataset.cancel + '/cancel', { reason: v.reason }), '선정을 취소했습니다', load); }); }; });
        $$('[data-rank]').forEach(function (b) { b.onclick = function () { ask('순위 변경', '이미 선정된 순위를 고르면 두 사람의 순위가 서로 바뀝니다.', [{ k: 'rank', label: '바꿀 순위', type: 'select', value: b.dataset.cur, options: Array.apply(null, { length: d.winnerCount }).map(function (_, k) { return [k + 1, (k + 1) + '위']; }) }], '변경').then(function (v) { if (v) run(api('POST', '/winners/' + b.dataset.rank + '/rank', { rank: Number(v.rank) }), '순위를 변경했습니다', load); }); }; });
        if ($('#pmCf')) $('#pmCf').onclick = function () { if (confirm('우수 후기 ' + d.winnerCount + '명을 최종 당첨자로 확정할까요?\n확정 후에는 선정 변경이 잠기며, 참여자의 접수 확인 화면에 당첨 사실이 표시됩니다.')) run(api('POST', '/winners/confirm', {}), '최종 당첨자를 확정했습니다', load); };
        if ($('#pmUnc')) $('#pmUnc').onclick = function () { ask('최종 확정 해제', '확정을 해제하면 선정을 다시 변경할 수 있습니다.', [{ k: 'reason', label: '해제 사유', type: 'textarea', required: true }], '확정 해제', true).then(function (v) { if (v) run(api('POST', '/winners/confirm', { undo: true, reason: v.reason }), '확정을 해제했습니다', load); }); };
      }).catch(fail);
    };
    $('#pmRf').onclick = load; refreshList = load; load();
  }

  // =========================================================
  // 6. 사은품 지급 관리
  // =========================================================
  function vRewards() {
    var f = F.rewards; f.sel = {};
    root.innerHTML = shell('사은품 지급 관리', 'Gift Fulfillment', (has('promo.reward') ? '<button class="btn" id="pmIssue" title="승인된 유효 참여자 중 아직 지급 대상에 없는 건을 등록합니다">유효 참여자 전체 지급 대상 등록</button>' : '') + '<button class="btn" id="pmRf">새로고침</button>'); bindShell();
    var load = function () {
      api('GET', '/rewards?' + qs({ type: f.type, status: f.status, q: f.q, limit: 300 })).then(function (d) {
        f.sel = {};
        var sum = function (type, st) { return d.summary.filter(function (x) { return x.type === type && (!st || x.status === st); }).reduce(function (n, x) { return n + x.count; }, 0); };
        var chip = function (type) { return Object.keys(WS).map(function (s) { var n = sum(type, s); return n ? '<span class="pm-b pm-ws-' + s + '">' + WS[s] + ' ' + n + '</span>' : ''; }).join(' ') || '<span class="pm-mut">대상 없음</span>'; };
        body('<div class="pm-grid2"><div class="pm-card" style="margin:0"><h3>기본 참여 보상 <small>유효 참여자 전체</small></h3><div style="font-size:15px;font-weight:700;margin-bottom:10px">' + E(d.policy.participation.productName) + ' × ' + d.policy.participation.quantity + '</div>' + chip('PARTICIPATION') + '</div>' +
          '<div class="pm-card" style="margin:0"><h3>우수 후기 추가 보상 <small>선정자</small></h3><div style="font-size:15px;font-weight:700;margin-bottom:10px">' + E(d.policy.winner.productName) + ' × ' + d.policy.winner.quantity + '</div>' + chip('WINNER') + '</div></div>' +
          '<div class="filters pm-noprint" style="margin-top:18px">' + [['PARTICIPATION', '프로틴 쉐이크'], ['WINNER', '벌스데이 크림'], ['', '전체']].map(function (o) { return '<button class="btn sm' + (f.type === o[0] ? ' pri' : '') + '" data-ty="' + o[0] + '">' + o[1] + '</button>'; }).join('') +
          '<select id="pmSt"><option value="">지급 상태 전체</option>' + Object.keys(WS).map(function (s) { return '<option value="' + s + '"' + (f.status === s ? ' selected' : '') + '>' + WS[s] + '</option>'; }).join('') + '</select>' +
          '<input type="text" id="pmQ" placeholder="수령인 · 접수번호 · 운송장 번호" value="' + E(f.q) + '">' +
          (has('promo.reward') ? '<select id="pmBulk"><option value="">선택한 건 일괄 처리…</option><option value="PREPARING">지급 준비로</option><option value="SHIP_READY">배송 준비로</option><option value="DELIVERED">지급 완료로 (배송 중인 건)</option></select>' : '') +
          '<span class="count">' + d.total + '건</span></div>' +
          (d.items.length ? '<div class="tablewrap"><table><thead><tr>' + (has('promo.reward') ? '<th><input type="checkbox" class="pm-chk" id="pmAll"></th>' : '') + '<th>접수번호</th><th>구분</th><th>상품명</th><th>수량</th><th>수령인</th><th>배송 상태</th><th>처리</th><th>연락처</th><th>우편번호</th><th>배송 주소</th><th>택배사</th><th>운송장 번호</th><th>발송일</th></tr></thead><tbody>' +
            d.items.map(function (x) {
              return '<tr style="cursor:default">' + (has('promo.reward') ? '<td><input type="checkbox" class="pm-chk" data-sel="' + x.id + '"></td>' : '') +
                '<td class="arch" style="font-size:11.5px"><span class="pm-link" data-open="' + x.reviewId + '">' + E(x.applicationNumber) + '</span></td><td>' + (x.type === 'WINNER' ? '<span class="pm-b pm-gold">우수 후기' + (x.winnerRank ? ' ' + x.winnerRank + '위' : '') + '</span>' : '<span class="pm-b">참가 보상</span>') + '</td>' +
                '<td>' + E(x.productName) + '</td><td>' + x.quantity + '</td><td><b>' + E(x.recipientName || '—') + '</b></td>' +
                '<td>' + wsBadge(x) + (x.deliveredAt ? '<div class="pm-mut" style="font-size:11px">' + day(x.deliveredAt) + '</div>' : '') + '</td>' +
                '<td>' + (has('promo.reward') ? (x.nextStatuses.length ? '<select data-next="' + x.id + '" data-v="' + x.version + '" style="padding:5px 8px;border:1px solid var(--line);border-radius:7px;font:inherit;font-size:12px"><option value="">상태 변경…</option>' + x.nextStatuses.map(function (s) { return '<option value="' + s + '">' + WS[s] + '</option>'; }).join('') + '</select> ' : '') +
                  (['DELIVERED', 'CANCELED'].indexOf(x.status) < 0 ? '<button class="btn sm" data-edit="' + x.id + '">배송 정보</button>' : '') : '<span class="pm-mut">조회 전용</span>') + '</td>' +
                '<td>' + E(x.recipientPhone) + '</td><td>' + E(x.postalCode || '—') + '</td>' +
                '<td style="max-width:240px;white-space:normal;font-size:12.5px">' + E(x.address || '—') + '</td><td>' + E(x.carrier || '—') + '</td><td>' + E(x.trackingNumber || '—') + '</td><td>' + (x.shippedAt ? day(x.shippedAt) : '—') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '<div class="tablewrap"><div class="empty">지급 대상이 없습니다. 후기를 승인하면 프로틴 쉐이크 지급 대상으로, 우수 후기로 선정하면 벌스데이 크림 지급 대상으로 자동 등록됩니다.</div></div>'));
        var byId = {}; d.items.forEach(function (x) { byId[x.id] = x; });
        $$('[data-ty]').forEach(function (b) { b.onclick = function () { f.type = b.dataset.ty; load(); }; });
        $('#pmSt').onchange = function () { f.status = this.value; load(); };
        var t; $('#pmQ').oninput = function () { f.q = this.value; clearTimeout(t); t = setTimeout(load, 350); };
        $$('[data-open]').forEach(function (a) { a.onclick = function () { openDetail(Number(a.dataset.open)); }; });
        $$('[data-sel]').forEach(function (c) { c.onchange = function () { f.sel[c.dataset.sel] = c.checked; }; });
        if ($('#pmAll')) $('#pmAll').onchange = function () { var on = this.checked; $$('[data-sel]').forEach(function (c) { c.checked = on; f.sel[c.dataset.sel] = on; }); };
        if ($('#pmBulk')) $('#pmBulk').onchange = function () {
          var to = this.value, ids = Object.keys(f.sel).filter(function (k) { return f.sel[k]; }).map(Number); this.value = '';
          if (!to) return; if (!ids.length) return say('먼저 처리할 건을 선택해 주세요', true);
          if (!confirm('선택한 ' + ids.length + '건을 「' + WS[to] + '」(으)로 변경할까요?\n조건이 맞지 않는 건은 건너뜁니다.')) return;
          run(api('POST', '/rewards/bulk-status', { ids: ids, status: to }), function (r) { return r.done + '건 처리' + (r.failed ? ', ' + r.failed + '건 건너뜀' : ''); }, load);
        };
        var editShip = function (x, thenStatus) {
          return ask(thenStatus ? '배송 시작 — 운송장 입력' : '배송 정보', E(x.productName) + ' · ' + E(x.applicationNumber), [
            { k: 'recipientName', label: '수령인', value: x.recipientName || '', required: true }, { k: 'recipientPhone', label: '연락처', value: x.recipientPhone === '—' ? '' : x.recipientPhone, required: true },
            { k: 'postalCode', label: '우편번호', value: x.postalCode || '', required: true }, { k: 'address', label: '배송 주소', type: 'textarea', value: x.address || '', required: true, max: 220 },
            { k: 'carrier', label: '택배사', value: x.carrier || '', list: 'pmCarriers', required: !!thenStatus }, { k: 'trackingNumber', label: '운송장 번호', value: x.trackingNumber || '', required: !!thenStatus }, { k: 'note', label: '메모', value: x.note || '' }], '저장');
        };
        $$('[data-edit]').forEach(function (b) { b.onclick = function () { var x = byId[b.dataset.edit]; editShip(x).then(function (v) { if (v) run(api('PATCH', '/rewards/' + x.id, Object.assign(v, { version: x.version })), '배송 정보를 저장했습니다', load); }); }; });
        $$('[data-next]').forEach(function (s) { s.onchange = function () {
          var x = byId[s.dataset.next], to = s.value; s.value = ''; if (!to) return;
          var go = function (extra) { run(api('POST', '/rewards/' + x.id + '/status', Object.assign({ status: to }, extra || {})), WS[to] + ' 처리했습니다', load); };
          if (to === 'SHIPPING' && (!x.carrier || !x.trackingNumber)) return editShip(x, true).then(function (v) { if (!v) return; api('PATCH', '/rewards/' + x.id, Object.assign(v, { version: x.version })).then(function () { go(); }).catch(function (e) { say(e.message, true); }); });
          if (to === 'ON_HOLD' || to === 'CANCELED' || (x.status === 'DELIVERED') || (x.status === 'CANCELED')) return ask(WS[to] + ' 처리', '사유는 활동 로그에 기록됩니다.', [{ k: 'reason', label: '사유', type: 'textarea', required: true }], '확인', to === 'CANCELED').then(function (v) { if (v) go({ reason: v.reason, version: x.version }); });
          if (to === 'DELIVERED' && !confirm(x.recipientName + ' 님의 ' + x.productName + ' 을(를) 지급 완료 처리할까요?\n지급 완료는 본사 최고 관리자만 되돌릴 수 있습니다.')) return;
          go({ version: x.version });
        }; });
      }).catch(fail);
    };
    $('#pmRf').onclick = load;
    if ($('#pmIssue')) $('#pmIssue').onclick = function () { run(api('POST', '/rewards/issue-participation', {}), function (d) { return d.created ? d.created + '건을 지급 대상으로 등록했습니다' : '새로 등록할 대상이 없습니다 (이미 모두 등록됨)'; }, load); };
    refreshList = load; load();
  }

  // =========================================================
  // 7. 이벤트 통계 및 보고서
  // =========================================================
  function vStats() {
    root.innerHTML = shell('이벤트 통계 및 보고서', 'Statistics & Report', '<button class="btn" id="pmPr">보고서 인쇄 · PDF 저장</button>' + (has('promo.export') ? '<button class="btn" id="pmX">참여자 엑셀 다운로드</button>' : '')); bindShell();
    $('#pmPr').onclick = function () { window.print(); }; if ($('#pmX')) $('#pmX').onclick = function () { exportXlsx({}); };
    api('GET', '/stats').then(function (d) {
      var t = d.totals, max = Math.max.apply(null, d.daily.map(function (x) { return x.count; }).concat([1]));
      var W = 760, H = 180, n = Math.max(d.daily.length, 1), bw = Math.min(34, (W - 40) / n - 4);
      var chart = d.daily.length ? '<svg viewBox="0 0 ' + W + ' ' + (H + 30) + '" style="width:100%;height:auto" role="img" aria-label="일자별 참여자 수">' + d.daily.map(function (x, i) { var h = Math.max(2, x.count / max * (H - 20)), xx = 30 + i * ((W - 40) / n);
        return '<rect x="' + xx.toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="#C6A16A"><title>' + x.date + ' · ' + x.count + '명</title></rect><text x="' + (xx + bw / 2).toFixed(1) + '" y="' + (H - h - 5).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#5A5A54">' + x.count + '</text>' +
          (n <= 16 || i % Math.ceil(n / 12) === 0 ? '<text x="' + (xx + bw / 2).toFixed(1) + '" y="' + (H + 16) + '" text-anchor="middle" font-size="9.5" fill="#8A8A84">' + x.date.slice(5) + '</text>' : ''); }).join('') + '<line x1="24" y1="' + H + '" x2="' + W + '" y2="' + H + '" stroke="#E6E4DF"/></svg>' : '<div class="empty">아직 접수된 후기가 없습니다.</div>';
      var bars = function (rows, lab) { var m = Math.max.apply(null, rows.map(function (x) { return x.count; }).concat([1])); return rows.length ? '<div class="pm-bars">' + rows.map(function (x) { return '<div class="pm-bar"><span>' + E(lab ? lab(x) : x.key) + '</span><i style="width:' + (x.count / m * 100).toFixed(1) + '%"></i><span>' + x.count + '</span></div>'; }).join('') + '</div>' : '<span class="pm-mut">데이터 없음</span>'; };
      body('<div class="pm-note"><b>' + E(d.event.eventName) + '</b> 보고서 · ' + dt(d.asOf) + ' 기준' + (ME.distributorCode ? ' · 총판 ' + E(ME.distributorCode) : '') + ' <span class="pm-mut">· 테스트 접수 ' + t.excludedTest + '건, 파기된 접수 ' + t.purged + '건은 집계에서 제외</span></div>' +
        '<div class="kpis"><div class="kpi"><div class="l">전체 참여자</div><div class="v">' + t.total + '<small>명</small></div></div><div class="kpi"><div class="l">평균 제품 만족도</div><div class="v">' + (t.avgRating == null ? '—' : t.avgRating.toFixed(2)) + '<small>/ 5</small></div></div>' +
        '<div class="kpi"><div class="l">평균 사용 경험</div><div class="v">' + (t.avgExperience == null ? '—' : t.avgExperience.toFixed(2)) + '<small>/ 5</small></div></div><div class="kpi"><div class="l">유니앤코어 회원</div><div class="v">' + t.members + '<small>명 (' + (t.total ? Math.round(t.members / t.total * 100) : 0) + '%)</small></div></div>' +
        '<div class="kpi"><div class="l">마케팅 활용 동의</div><div class="v">' + t.marketingConsent + '<small>명</small></div></div><div class="kpi"><div class="l">평균 후기 길이</div><div class="v">' + (t.avgLength == null ? '—' : t.avgLength) + '<small>자</small></div></div></div>' +
        '<div class="pm-card"><h3>일자별 참여자 수 <small>최근 90일 · 한국 시간</small></h3>' + chart + '</div>' +
        '<div class="pm-grid2"><div class="pm-card"><h3>검토 상태</h3>' + bars(d.byStatus, function (x) { return x.label; }) + '</div><div class="pm-card"><h3>별점 분포 (제품 만족도)</h3>' + bars(d.byRating.slice().sort(function (a, b) { return b.key - a.key; }), function (x) { return '★ ' + x.key; }) + '</div>' +
        '<div class="pm-card"><h3>피부 타입</h3>' + bars(d.bySkinType) + '</div><div class="pm-card"><h3>사용 기간</h3>' + bars(d.byUsagePeriod) + '</div></div>' +
        '<div class="pm-card"><h3>총판별 참여 실적 <small>이벤트 링크의 총판 코드(?d=코드) 기준</small></h3><div class="tablewrap" style="border:0"><table style="min-width:600px"><thead><tr><th>총판 코드</th><th>참여</th><th>승인</th><th>검토 대기</th><th>우수 후기</th><th>프로틴 쉐이크 지급 완료</th><th>평균 별점</th></tr></thead><tbody>' +
        (d.byDistributor.length ? d.byDistributor.map(function (x) { return '<tr style="cursor:default"><td><b>' + E(x.code) + '</b></td><td>' + x.total + '</td><td>' + x.approved + '</td><td>' + x.pending + '</td><td>' + x.winners + '</td><td>' + x.delivered + '</td><td>' + (x.avgRating == null ? '—' : x.avgRating.toFixed(2)) + '</td></tr>'; }).join('') : '<tr><td colspan="7"><div class="empty">데이터 없음</div></td></tr>') + '</tbody></table></div></div>');
    }).catch(fail);
  }

  // =========================================================
  // 2. 벌스데이 크림 후기 이벤트 (기간·정책 설정, 링크, 예외 승인, 보유·파기, 활동 로그)
  // =========================================================
  function vEvent() {
    root.innerHTML = shell('벌스데이 크림 후기 이벤트', 'Event Settings', '<a class="btn" href="' + E(SITE) + '/" target="_blank" rel="noopener">이벤트 페이지 열기 ↗</a>'); bindShell();
    var canSet = has('promo.settings');
    Promise.all([api('GET', '/event'), has('promo.edit') ? api('GET', '/reentries') : Promise.resolve(null), has('promo.purge') ? api('GET', '/retention') : Promise.resolve(null), has('promo.logs') ? api('GET', '/logs?limit=40') : Promise.resolve(null)]).then(function (res) {
      var ev = res[0], re = res[1], ret = res[2], logs = res[3], s = ev.settings, p = ev.rewardPolicy; EVENT = ev;
      var local = function (iso) { if (!iso) return ''; var d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
      var dis = canSet ? '' : ' disabled', chk = function (k, v) { return '<input type="checkbox" name="' + k + '"' + (v ? ' checked' : '') + dis + ' style="width:16px;height:16px;justify-self:start">'; };
      var ph = { OPEN: '접수 중', UPCOMING: '시작 전', ENDED: '기간 종료', CLOSED: '접수 마감' }[ev.phase];
      body((canSet ? '' : '<div class="pm-note">이벤트 설정은 본사 최고 관리자만 변경할 수 있습니다. 현재 설정을 조회 중입니다.</div>') +
        '<form id="pmEv"><div class="pm-grid2"><div><div class="pm-card"><h3>이벤트 운영 <small>현재: ' + ph + '</small></h3><div class="pm-form">' +
          '<label>이벤트 이름</label><input type="text" name="eventName" value="' + E(ev.eventName) + '"' + dis + '>' +
          '<label>접수 상태</label><select name="eventStatus"' + dis + '>' + [['OPEN', '접수 받기 (기간 안에서)'], ['CLOSED', '접수 마감'], ['DRAFT', '준비 중 (비공개)']].map(function (o) { return '<option value="' + o[0] + '"' + (ev.eventStatus === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
          '<label>시작 일시</label><input type="datetime-local" name="startDate" value="' + local(ev.startDate) + '"' + dis + '><label>종료 일시</label><input type="datetime-local" name="endDate" value="' + local(ev.endDate) + '"' + dis + '>' +
          '<div class="pm-hint">비워 두면 기간 제한 없이 접수 상태만 따릅니다.</div></div></div>' +
          '<div class="pm-card"><h3>지급 정책</h3><div class="pm-form"><label>기본 참여 보상</label><input type="text" name="pName" value="' + E(p.participation.productName) + '"' + dis + '><label>수량</label><input type="number" name="pQty" min="1" max="99" value="' + p.participation.quantity + '"' + dis + '>' +
          '<label>우수 후기 추가 보상</label><input type="text" name="wName" value="' + E(p.winner.productName) + '"' + dis + '><label>수량</label><input type="number" name="wQty" min="1" max="99" value="' + p.winner.quantity + '"' + dis + '>' +
          '<label>우수 후기 선정 인원</label><input type="number" name="winnerCount" min="1" max="50" value="' + s.winnerCount + '"' + dis + '>' +
          '<label>선정자 기본 보상</label>' + chk('both', p.winnersAlsoGetParticipation) + '<div class="pm-hint">켜 두면 우수 후기 선정자에게도 기본 참여 보상(프로틴 쉐이크)을 함께 지급합니다.</div></div></div></div>' +
        '<div><div class="pm-card"><h3>후기 작성 기준</h3><div class="pm-form"><label>최소 글자 수</label><input type="number" name="minChars" min="0" max="1000" value="' + s.minChars + '"' + dis + '><label>최대 글자 수</label><input type="number" name="maxChars" min="50" max="5000" value="' + s.maxChars + '"' + dis + '>' +
          '<label>제목 최대 글자 수</label><input type="number" name="titleMaxChars" min="10" max="120" value="' + s.titleMaxChars + '"' + dis + '>' +
          '<label>사진 제출 필수</label>' + chk('requireImages', s.requireImages) + '<div class="pm-hint">끄면 사용 전·후 사진 없이도 참여할 수 있습니다.</div>' +
          '<label>주문번호 필수</label>' + chk('requireOrderNumber', s.requireOrderNumber) + '<label>배송 주소 수집</label>' + chk('requireAddress', s.requireAddress) + '<div class="pm-hint">끄면 주소를 받지 않고, 지급 단계에서 「사은품 지급 관리」에 직접 입력합니다.</div>' +
          '<label>사진 최대 용량(MB)</label><input type="number" name="maxImageMb" min="0.5" max="5" step="0.5" value="' + (s.maxImageBytes / 1048576).toFixed(1) + '"' + dis + '><label>사진 최대 해상도(px)</label><input type="number" name="maxImagePixels" min="800" max="12000" value="' + s.maxImagePixels + '"' + dis + '></div></div>' +
          '<div class="pm-card"><h3>개인정보</h3><div class="pm-form"><label>보유 기간(일)</label><input type="number" name="retentionDays" min="30" max="1825" value="' + s.retentionDays + '"' + dis + '><div class="pm-hint">이벤트 종료일(없으면 접수일)부터 계산합니다. 동의 문서의 보유 기간 문구에 그대로 반영됩니다.</div>' +
          '<label>동의 문서 버전</label><input type="text" name="consentVersion" value="' + E(s.consentVersion) + '"' + dis + '><div class="pm-hint">동의 문구가 바뀌면 버전을 올려 주세요. 참여자가 동의한 버전이 접수마다 기록됩니다.</div></div></div></div></div>' +
        (canSet ? '<div style="text-align:right;margin-bottom:22px"><button class="btn pri" type="submit">설정 저장</button></div>' : '') + '</form>' +
        '<div class="pm-card"><h3>총판별 이벤트 링크 <small>링크로 들어온 참여자는 해당 총판 실적으로 집계되고, 총판 관리자는 자기 코드의 참여자만 볼 수 있습니다</small></h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="pm-in" id="pmDc" style="max-width:200px" placeholder="총판 코드 (예: SEOUL-01)" value="' + E(ME.distributorCode || '') + '"' + (ME.distributorCode ? ' disabled' : '') + '><input class="pm-in" id="pmDl" style="flex:1;min-width:260px" readonly><button class="btn sm" id="pmCp">복사</button></div></div>' +
        (re ? '<div class="pm-card"><h3>재참여 예외 승인 <small>같은 휴대폰 번호는 1회만 접수됩니다. 정상적인 재참여가 필요하면 1회용 예외를 승인합니다</small></h3><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><input class="pm-in" id="pmRp" style="max-width:200px" placeholder="휴대폰 번호"><input class="pm-in" id="pmRr" style="flex:1;min-width:220px" placeholder="예외 승인 사유"><button class="btn sm pri" id="pmRg">예외 승인</button></div>' +
          (re.length ? re.map(function (x) { return '<div style="font-size:13px;padding:7px 0;border-top:1px solid #F0EEEA">' + E(x.phone) + ' · ' + E(x.reason) + ' <span class="pm-mut">· ' + E(x.grantedBy) + ' · ' + dt(x.createdAt) + '</span> ' + (x.usedAt ? '<span class="pm-b pm-rs-APPROVED">사용됨 ' + E(x.usedApplicationNumber || '') + '</span>' : '<span class="pm-b pm-rs-PENDING">미사용</span> <span class="pm-link" data-rv="' + x.id + '">회수</span>') + '</div>'; }).join('') : '<span class="pm-mut" style="font-size:13px">승인 내역이 없습니다.</span>') + '</div>' : '') +
        (ret ? '<div class="pm-card"><h3>개인정보 보유 기간 만료 · 파기</h3><div style="font-size:13.5px;margin-bottom:12px">보유 기한이 지난 접수 <b>' + ret.expired + '건</b> · 지금까지 파기 <b>' + ret.purged + '건</b>' + (ret.nextDue ? ' · 가장 빠른 보유 기한 ' + E(String(ret.nextDue).slice(0, 10)) : '') + '</div><button class="btn sm danger" id="pmPg"' + (ret.expired ? '' : ' disabled') + '>보유 기간이 지난 ' + ret.expired + '건 파기</button> <span class="pm-mut" style="font-size:12px">이름·연락처·주소·후기 내용·사진 파일이 영구 삭제됩니다. 당첨자와 지급 진행 중인 건은 제외됩니다.</span></div>' : '') +
        (logs ? '<div class="pm-card"><h3>관리자 활동 로그 <small>최근 40건 (열람 기록 제외)</small></h3>' + (logs.length ? logs.map(logRow).join('') : '<span class="pm-mut">기록이 없습니다.</span>') + '</div>' : ''));
      var link = function () { var c = $('#pmDc').value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''); $('#pmDl').value = SITE + '/' + (c ? '?d=' + encodeURIComponent(c) : ''); };
      $('#pmDc').oninput = link; link();
      $('#pmCp').onclick = function () { var el = $('#pmDl'); el.select(); (navigator.clipboard ? navigator.clipboard.writeText(el.value) : Promise.reject()).catch(function () { document.execCommand('copy'); }); say('링크를 복사했습니다'); };
      if (canSet) $('#pmEv').onsubmit = function (e) {
        e.preventDefault(); var f = this.elements, iso = function (v) { return v ? new Date(v).toISOString() : null; };
        run(api('PATCH', '/event', { eventName: f.eventName.value, eventStatus: f.eventStatus.value, startDate: iso(f.startDate.value), endDate: iso(f.endDate.value),
          settings: { minChars: f.minChars.value, maxChars: f.maxChars.value, titleMaxChars: f.titleMaxChars.value, requireImages: f.requireImages.checked, requireOrderNumber: f.requireOrderNumber.checked, requireAddress: f.requireAddress.checked,
            maxImageMb: f.maxImageMb.value, maxImagePixels: f.maxImagePixels.value, winnerCount: f.winnerCount.value, retentionDays: f.retentionDays.value, consentVersion: f.consentVersion.value },
          rewardPolicy: { participation: { productName: f.pName.value, quantity: f.pQty.value }, winner: { productName: f.wName.value, quantity: f.wQty.value }, winnersAlsoGetParticipation: f.both.checked } }), '이벤트 설정을 저장했습니다 — 이벤트 페이지에 바로 반영됩니다', vEvent);
      };
      if ($('#pmRg')) $('#pmRg').onclick = function () { run(api('POST', '/reentries', { phone: $('#pmRp').value, reason: $('#pmRr').value }), '재참여 예외를 승인했습니다', vEvent); };
      $$('[data-rv]').forEach(function (a) { a.onclick = function () { run(api('DELETE', '/reentries/' + a.dataset.rv), '예외 승인을 회수했습니다', vEvent); }; });
      if ($('#pmPg')) $('#pmPg').onclick = function () { if (confirm('보유 기간이 지난 ' + ret.expired + '건의 개인정보와 사진을 영구 삭제합니다.\n되돌릴 수 없습니다. 계속할까요?')) run(api('POST', '/retention/purge-expired', {}), function (d) { return d.purged + '건을 파기했습니다'; }, vEvent); };
    }).catch(fail);
  }

  // ---------- 진입점 ----------
  var VIEWS = { dash: vDash, event: vEvent, people: vPeople, photos: vPhotos, winners: vWinners, rewards: vRewards, stats: vStats };
  function render() {
    refreshList = null;
    if (!ME) {
      root.innerHTML = '<div class="empty">프로모션 관리 권한을 확인하는 중…</div>';
      return Promise.all([api('GET', '/me'), api('GET', '/event')]).then(function (r) { ME = r[0]; EVENT = r[1]; render(); }).catch(function (e) {
        root.innerHTML = '<div class="pagehead"><div><div class="crumb">Promotion Management</div><h1>프로모션 관리</h1></div></div><div class="pm-note pm-warn">' + E(e.message) + '</div>';
      });
    }
    (VIEWS[sub] || vDash)();
  }
  window.PromoAdmin = {
    SUBS: SUBS,
    /** el: 화면 영역, opts: { sub, headers(): 인증 헤더, onUnauthorized(err), navigate(sub) } */
    mount: function (el, opts) { css(); root = el; opts = opts || {}; if (opts.headers) cfg.headers = opts.headers; if (opts.onUnauthorized) cfg.onUnauthorized = opts.onUnauthorized; cfg.navigate = opts.navigate || null; cfg.onChange = opts.onChange || null; sub = VIEWS[opts.sub] ? opts.sub : 'dash'; closeDrawer(); render(); },
    reset: function () { ME = null; EVENT = null; },
    pendingCount: function () { return api('GET', '/dashboard').then(function (d) { return d.cards.pendingReview; }); }
  };
})();
