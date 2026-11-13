"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { reviewEvent } from "@/data/reviewEvent";
import { track } from "@/lib/track";
import { ApiError, submitReview, type EventConfig, type SubmitResult } from "./api";
import PhotoField, { CompareSlider, emptyPhoto, type PhotoState } from "./PhotoField";
import s from "./review.module.css";

type Values = {
  rating: number; ratingExperience: number; title: string; content: string; skinType: string; usagePeriod: string; recommendReason: string;
  name: string; phone: string; memberNumber: string; postalCode: string; address1: string; address2: string;
};
const EMPTY: Values = { rating: 0, ratingExperience: 0, title: "", content: "", skinType: "", usagePeriod: "", recommendReason: "", name: "", phone: "", memberNumber: "", postalCode: "", address1: "", address2: "" };
const DRAFT_KEY = "uc-review-draft-v2";
const STEPS = ["후기 작성", "사진 올리기", "정보 입력 · 동의"] as const;
/** 오류가 난 항목이 어느 단계에 있는지 */
const STEP_OF: Record<string, number> = { rating: 0, ratingExperience: 0, title: 0, content: 0, imageBefore: 1, imageAfter: 1 };
const count = (v: string) => [...v.trim()].length;
const fmtPhone = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 11); return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`; };

declare global { interface Window { daum?: { Postcode: new (o: { oncomplete: (d: { zonecode: string; roadAddress: string; jibunAddress: string; buildingName: string }) => void; width: string; height: string }) => { embed: (el: HTMLElement) => void } } } }

function Stars({ label, value, onChange, required, invalid, id }: { label: string; value: number; onChange: (n: number) => void; required?: boolean; invalid?: boolean; id: string }) {
  const WORDS = ["", "아쉬워요", "그저 그래요", "보통이에요", "만족해요", "아주 만족해요"];
  return (
    <div className={s.field} id={id}>
      <div className={s.label}>{label}{required ? <em>필수</em> : <i>선택</i>}</div>
      <div className={`${s.stars} ${invalid ? s.starsInvalid : ""}`} role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}점`} className={n <= value ? s.starOn : s.star}
            onClick={() => onChange(value === n && !required ? 0 : n)}
            onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(5, (value || 0) + 1)); } if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(1, (value || 2) - 1)); } }}>★</button>
        ))}
        <span className={s.starWord} aria-live="polite">{WORDS[value]}</span>
      </div>
    </div>
  );
}

export default function ReviewForm({ config, onDone }: { config: EventConfig; onDone: (r: SubmitResult) => void }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>(EMPTY);
  const [before, setBefore] = useState<PhotoState>(emptyPhoto);
  const [after, setAfter] = useState<PhotoState>(emptyPhoto);
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [post, setPost] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const postBox = useRef<HTMLDivElement>(null);
  const hp = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  // 작성 중인 글 임시 보관 (같은 탭에서만, 접수하면 지움). 사진·동의는 보관하지 않는다.
  useEffect(() => {
    try { const raw = sessionStorage.getItem(DRAFT_KEY); if (raw) setV({ ...EMPTY, ...JSON.parse(raw) }); } catch { /* 무시 */ }
    loaded.current = true;
  }, []);
  useEffect(() => { if (loaded.current) try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* 무시 */ } }, [v]);

  const uploading = [before, after].some((p) => p.status === "uploading" || p.status === "processing");
  const dirty = useMemo(() => uploading || !!v.title || !!v.content || !!before.uploaded || !!after.uploaded, [uploading, v.title, v.content, before.uploaded, after.uploaded]);
  // 작성·업로드 중 화면 이탈 방지 안내
  useEffect(() => {
    if (!dirty || sending) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, sending]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => { setV((p) => ({ ...p, [k]: val })); if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };
  const n = count(v.content);

  const validate = (target: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (target === 0) {
      if (!v.rating) e.rating = "제품 만족도 별점을 선택해 주세요.";
      if (count(v.title) < 2) e.title = "후기 제목을 2자 이상 입력해 주세요.";
      else if (count(v.title) > config.titleMaxChars) e.title = `후기 제목은 ${config.titleMaxChars}자까지 입력할 수 있습니다.`;
      if (n < config.minChars) e.content = `후기 내용을 ${config.minChars}자 이상 작성해 주세요. (현재 ${n}자)`;
      else if (n > config.maxChars) e.content = `후기 내용은 ${config.maxChars}자까지 작성할 수 있습니다. (현재 ${n}자)`;
    }
    if (target === 1) {
      if (uploading) e.imageBefore = "사진 업로드가 끝난 뒤 다음 단계로 넘어가 주세요.";
      else {
        for (const [k, p, name] of [["imageBefore", before, "사용 전"], ["imageAfter", after, "사용 후"]] as const) {
          if (p.status === "error") e[k] = `${name} 사진 업로드에 실패했습니다. '다시 시도'를 눌러 주세요.`;
          else if (config.requireImages && !p.uploaded) e[k] = `${name} 사진을 올려 주세요.`;
        }
      }
    }
    if (target === 2) {
      if (count(v.name) < 2) e.name = "이름을 입력해 주세요.";
      if (!/^01[016789]\d{7,8}$/.test(v.phone.replace(/\D/g, ""))) e.phone = "휴대폰 번호를 정확히 입력해 주세요.";
      if (v.memberNumber.replace(/[^A-Za-z0-9]/g, "").length < 4) e.memberNumber = "유니앤코어 회원번호를 정확히 입력해 주세요.";
      if (config.requireAddress) {
        if (v.postalCode.replace(/\D/g, "").length !== 5) e.postalCode = "우편번호 5자리를 입력해 주세요.";
        if (count(v.address1) < 5) e.address1 = "사은품을 받으실 주소를 입력해 주세요.";
      }
      for (const d of config.consents) if (d.required && !agree[d.type]) e["consent_" + d.type] = "필수 동의 항목입니다.";
    }
    return e;
  };
  const focusFirst = (e: Record<string, string>) => {
    const key = Object.keys(e)[0]; if (!key) return;
    const id = key === "imageBefore" ? "photo-before" : key === "imageAfter" ? "photo-after" : key.startsWith("consent_") ? "consents" : `f-${key}`;
    requestAnimationFrame(() => { const el = document.getElementById(id); el?.scrollIntoView({ block: "center", behavior: "smooth" }); (el?.querySelector("input,textarea,button") as HTMLElement | null)?.focus({ preventScroll: true }); });
  };
  const go = (to: number) => {
    setFormError("");
    if (to > step) { const e = validate(step); setErrors(e); if (Object.keys(e).length) { focusFirst(e); return; } track("review_step", { step: to + 1 }); }
    else setErrors({});
    setStep(to);
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  const openPostcode = async () => {
    setPost(true);
    try {
      if (!window.daum?.Postcode) {
        await new Promise<void>((res, rej) => { const sc = document.createElement("script"); sc.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"; sc.async = true; sc.onload = () => res(); sc.onerror = () => rej(new Error("load")); document.head.appendChild(sc); });
      }
      requestAnimationFrame(() => {
        if (!postBox.current || !window.daum) return;
        new window.daum.Postcode({
          width: "100%", height: "100%",
          oncomplete: (d) => {
            setV((p) => ({ ...p, postalCode: d.zonecode, address1: (d.roadAddress || d.jibunAddress) + (d.buildingName ? ` (${d.buildingName})` : "") }));
            setErrors((e) => { const x = { ...e }; delete x.postalCode; delete x.address1; return x; });
            setPost(false);
            requestAnimationFrame(() => document.getElementById("f-address2-input")?.focus());
          },
        }).embed(postBox.current);
      });
    } catch { setPost(false); setErrors((e) => ({ ...e, postalCode: "주소 검색을 불러오지 못했습니다. 우편번호와 주소를 직접 입력해 주세요." })); }
  };

  const submit = async () => {
    if (sending) return;
    for (const st of [0, 1, 2]) { const e = validate(st); if (Object.keys(e).length) { setErrors(e); setStep(st); focusFirst(e); return; } }
    setSending(true); setFormError("");
    try {
      const d = new URLSearchParams(window.location.search).get("d") || sessionStorage.getItem("uc-review-dist") || "";
      const result = await submitReview({
        name: v.name, phone: v.phone, memberNumber: v.memberNumber,
        title: v.title, content: v.content, rating: v.rating, ratingExperience: v.ratingExperience || null, skinType: v.skinType, usagePeriod: v.usagePeriod, recommendReason: v.recommendReason,
        postalCode: v.postalCode, address1: v.address1, address2: v.address2,
        consents: Object.fromEntries(config.consents.map((c) => [c.type, !!agree[c.type]])), consentVersion: config.consentVersion,
        images: { ...(before.uploaded ? { before: { uploadId: before.uploaded.uploadId, token: before.uploaded.token } } : {}), ...(after.uploaded ? { after: { uploadId: after.uploaded.uploadId, token: after.uploaded.token } } : {}) },
        distributorCode: d, website: hp.current?.value || "",
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* 무시 */ }
      track("review_submit", { photos: (before.uploaded ? 1 : 0) + (after.uploaded ? 1 : 0), rating: v.rating });
      onDone(result);
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "IMAGE_EXPIRED") { // 업로드 보관 시간이 지남 → 해당 사진만 다시 받는다
        if (e.fields?.imageBefore) setBefore({ ...emptyPhoto, error: "사진을 다시 올려 주세요." });
        if (e.fields?.imageAfter) setAfter({ ...emptyPhoto, error: "사진을 다시 올려 주세요." });
        setStep(1);
      } else if (e.fields && Object.keys(e.fields).length) {
        const mapped = Object.fromEntries(Object.entries(e.fields).map(([k, msg]) => [k, msg === "required" || msg === "invalid" || msg === "expired" ? e.message : msg]));
        setErrors(mapped);
        const st = STEP_OF[Object.keys(mapped)[0]] ?? 2;
        setStep(st); focusFirst(mapped);
      }
      setFormError(e.message || "접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      if (e.code === "CONSENT_VERSION") setTimeout(() => window.location.reload(), 2500);
    } finally { setSending(false); }
  };

  const required = config.consents.filter((c) => c.required), allOn = config.consents.every((c) => agree[c.type]);
  const err = (k: string) => errors[k] ? <p className={s.fieldError} role="alert">{errors[k]}</p> : null;
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const } : {});

  return (
    <div className={s.form} ref={top}>
      <ol className={s.stepper} aria-label="작성 단계">
        {STEPS.map((t, i) => (
          <li key={t} className={i === step ? s.stepOn : i < step ? s.stepDone : ""} aria-current={i === step ? "step" : undefined}>
            <button type="button" onClick={() => i < step && go(i)} disabled={i > step} aria-label={`${i + 1}단계 ${t}${i < step ? " (완료, 수정하려면 누르세요)" : ""}`}>
              <b>{i < step ? "✓" : i + 1}</b><span>{t}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* ---------- STEP 1. 후기 작성 ---------- */}
      {step === 0 && (
        <section aria-labelledby="st1">
          <h3 id="st1" className={s.stepTitle}><small>STEP 01</small>벌스데이 크림 사용 경험을<br />들려주세요</h3>
          <Stars id="f-rating" label="제품 만족도" required value={v.rating} invalid={!!errors.rating} onChange={(x) => set("rating", x)} />{err("rating")}
          <Stars id="f-ratingExperience" label="사용 경험 (발림성 · 흡수감 · 향)" value={v.ratingExperience} onChange={(x) => set("ratingExperience", x)} />
          <div className={s.field} id="f-title">
            <label className={s.label} htmlFor="title">후기 제목<em>필수</em></label>
            <input id="title" className={s.input} value={v.title} maxLength={config.titleMaxChars} onChange={(e) => set("title", e.target.value)} placeholder="예) 4주 만에 달라진 피부결" autoComplete="off" enterKeyHint="next" {...inv("title")} />
            {err("title")}
          </div>
          <div className={s.field} id="f-content">
            <label className={s.label} htmlFor="content">구매 및 사용 후기<em>필수</em></label>
            <textarea id="content" className={s.textarea} value={v.content} rows={9} onChange={(e) => set("content", e.target.value)} placeholder={reviewEvent.form.contentPlaceholder} {...inv("content")} aria-describedby="content-count" />
            <div id="content-count" className={`${s.counter} ${n > config.maxChars ? s.counterOver : n >= config.minChars ? s.counterOk : ""}`} aria-live="polite">
              <span>{n < config.minChars ? `${config.minChars - n}자 더 작성해 주세요` : n > config.maxChars ? `${n - config.maxChars}자 초과` : "충분히 작성하셨어요"}</span>
              <b>{n.toLocaleString()}</b> / {config.maxChars.toLocaleString()}자 <i>(최소 {config.minChars}자)</i>
            </div>
            {err("content")}
          </div>
          <details className={s.optional}>
            <summary>선택 항목 더 알려주기 <span>피부 타입 · 사용 기간 · 추천 이유</span></summary>
            <div className={s.field}><div className={s.label}>피부 타입<i>선택</i></div>
              <div className={s.chips} role="radiogroup" aria-label="피부 타입">{config.skinTypes.map((x) => <button key={x} type="button" role="radio" aria-checked={v.skinType === x} className={v.skinType === x ? s.chipOn : s.chip} onClick={() => set("skinType", v.skinType === x ? "" : x)}>{x}</button>)}</div></div>
            <div className={s.field}><div className={s.label}>사용 기간<i>선택</i></div>
              <div className={s.chips} role="radiogroup" aria-label="사용 기간">{config.usagePeriods.map((x) => <button key={x} type="button" role="radio" aria-checked={v.usagePeriod === x} className={v.usagePeriod === x ? s.chipOn : s.chip} onClick={() => set("usagePeriod", v.usagePeriod === x ? "" : x)}>{x}</button>)}</div></div>
            <div className={s.field}><label className={s.label} htmlFor="recommend">추천하고 싶은 이유<i>선택</i></label>
              <input id="recommend" className={s.input} value={v.recommendReason} maxLength={300} onChange={(e) => set("recommendReason", e.target.value)} placeholder="예) 건조한 계절에 특히 추천해요" /></div>
          </details>
        </section>
      )}

      {/* ---------- STEP 2. 사진 ---------- */}
      {step === 1 && (
        <section aria-labelledby="st2">
          <h3 id="st2" className={s.stepTitle}><small>STEP 02</small>사용 전 · 사용 후 사진을<br />올려 주세요</h3>
          <p className={s.help}>각 1장씩, 총 2장{config.requireImages ? "을 올려 주세요." : "까지 올릴 수 있습니다. (사진 없이도 참여 가능)"} 같은 조명·각도에서 찍은 사진이면 변화가 더 잘 보입니다.</p>
          <div className={s.photos}>
            <PhotoField kind="BEFORE" label="사용 전 사진" state={before} maxBytes={config.maxImageBytes} invalid={!!errors.imageBefore} onZoom={setZoom} onChange={(p) => { setBefore(p); setErrors((e) => { const x = { ...e }; delete x.imageBefore; return x; }); }} />
            <PhotoField kind="AFTER" label="사용 후 사진" state={after} maxBytes={config.maxImageBytes} invalid={!!errors.imageAfter} onZoom={setZoom} onChange={(p) => { setAfter(p); setErrors((e) => { const x = { ...e }; delete x.imageAfter; return x; }); }} />
          </div>
          {err("imageBefore")}{err("imageAfter")}
          {uploading && <p className={s.uploadNote} role="status">사진을 올리는 중입니다. 완료될 때까지 이 화면을 닫지 말아 주세요.</p>}
          {before.status === "done" && after.status === "done" && before.previewUrl && after.previewUrl && (
            <div className={s.compareWrap}><p className={s.label}>좌우로 밀어 변화를 확인해 보세요</p><CompareSlider before={before.previewUrl} after={after.previewUrl} /></div>
          )}
          <p className={s.privacyNote}>🔒 사진은 공개 갤러리에 노출되지 않으며, 후기 심사를 위해 권한이 있는 관리자만 확인합니다. 촬영 위치 정보는 올리기 전에 자동으로 지워집니다.</p>
        </section>
      )}

      {/* ---------- STEP 3. 정보·동의 ---------- */}
      {step === 2 && (
        <section aria-labelledby="st3">
          <h3 id="st3" className={s.stepTitle}><small>STEP 03</small>참여 정보를 입력하고<br />이벤트 참여를 완료해 주세요</h3>
          <div className={s.field} id="f-name"><label className={s.label} htmlFor="name">이름<em>필수</em></label>
            <input id="name" className={s.input} value={v.name} maxLength={40} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="받으시는 분 이름" enterKeyHint="next" {...inv("name")} />{err("name")}</div>
          <div className={s.field} id="f-phone"><label className={s.label} htmlFor="phone">휴대폰 번호<em>필수</em></label>
            <input id="phone" className={s.input} value={v.phone} onChange={(e) => set("phone", fmtPhone(e.target.value))} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="010-0000-0000" enterKeyHint="next" {...inv("phone")} />{err("phone")}
            <p className={s.hint}>당첨 안내와 사은품 배송 연락에 사용되며, 이 번호로 접수 내용을 확인하실 수 있습니다.</p></div>
          <div className={s.field} id="f-memberNumber"><label className={s.label} htmlFor="member">유니앤코어 회원번호<em>필수</em></label>
            <input id="member" className={s.input} value={v.memberNumber} maxLength={30} onChange={(e) => set("memberNumber", e.target.value.replace(/[^A-Za-z0-9-]/g, ""))} placeholder="회원번호 입력" autoComplete="off" autoCapitalize="characters" autoCorrect="off" enterKeyHint="next" {...inv("memberNumber")} />{err("memberNumber")}
            <p className={s.hint}>이 이벤트는 유니앤코어 회원만 참여할 수 있습니다. 회원번호는 유니앤코어 공식몰 로그인 후 마이오피스에서 확인하실 수 있습니다.</p></div>
          <div className={s.field} id="f-postalCode"><div className={s.label}>사은품 받으실 주소{config.requireAddress ? <em>필수</em> : <i>선택</i>}</div>
            <div className={s.postRow}>
              <input className={s.input} value={v.postalCode} onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" placeholder="우편번호" aria-label="우편번호" autoComplete="postal-code" {...inv("postalCode")} />
              <button type="button" className={s.postBtn} onClick={openPostcode}>주소 검색</button>
            </div>{err("postalCode")}
            <div id="f-address1"><input className={s.input} style={{ marginTop: 10 }} value={v.address1} maxLength={120} onChange={(e) => set("address1", e.target.value)} placeholder="도로명 주소" aria-label="도로명 주소" autoComplete="address-line1" {...inv("address1")} />{err("address1")}</div>
            <input id="f-address2-input" className={s.input} style={{ marginTop: 10 }} value={v.address2} maxLength={80} onChange={(e) => set("address2", e.target.value)} placeholder="상세 주소 (동 · 호수)" aria-label="상세 주소" autoComplete="address-line2" />
          </div>
          {/* 자동 등록 프로그램 방지용 칸 — 사람에게는 보이지 않는다 */}
          <input ref={hp} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className={s.hp} />

          <div className={s.consents} id="consents">
            <p className={s.label}>개인정보 및 이벤트 참여 동의</p>
            <label className={s.agreeAll}><input type="checkbox" checked={allOn} onChange={(e) => { setAgree(Object.fromEntries(config.consents.map((c) => [c.type, e.target.checked]))); setErrors((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith("consent_")))); }} /><span>전체 동의 <small>(선택 항목 포함)</small></span></label>
            {config.consents.map((c) => (
              <div key={c.type} className={`${s.agree} ${errors["consent_" + c.type] ? s.agreeInvalid : ""}`}>
                <div className={s.agreeRow}>
                  <label><input type="checkbox" checked={!!agree[c.type]} onChange={(e) => { setAgree((a) => ({ ...a, [c.type]: e.target.checked })); setErrors((x) => { const y = { ...x }; delete y["consent_" + c.type]; return y; }); }} />
                    <span><b className={c.required ? s.tagReq : s.tagOpt}>{c.required ? "필수" : "선택"}</b>{c.title.replace(/\s*\(선택\)$/, "")}</span></label>
                  <button type="button" className={s.agreeMore} aria-expanded={openDoc === c.type} onClick={() => setOpenDoc(openDoc === c.type ? null : c.type)}>{openDoc === c.type ? "접기" : "내용 보기"}</button>
                </div>
                {openDoc === c.type && (
                  <dl className={s.agreeDoc}>
                    <dt>수집·이용 목적</dt><dd>{c.purpose}</dd><dt>수집 항목</dt><dd>{c.items}</dd><dt>보유 및 이용 기간</dt><dd><b>{c.retention}</b></dd><dt>동의 거부 권리</dt><dd>{c.refusal}</dd>
                  </dl>
                )}
              </div>
            ))}
            {Object.keys(errors).some((k) => k.startsWith("consent_")) && <p className={s.fieldError} role="alert">필수 동의 항목 {required.length}개에 모두 동의해 주세요.</p>}
            <p className={s.legal}>개인정보처리자: {reviewEvent.company.name} · 문의 {reviewEvent.company.tel} · 동의 문서 버전 {config.consentVersion}<br />
              <a href={reviewEvent.company.privacy} target="_blank" rel="noopener noreferrer">개인정보처리방침</a> · <a href={reviewEvent.company.terms} target="_blank" rel="noopener noreferrer">이용약관</a></p>
          </div>
        </section>
      )}

      {formError && <p className={s.formError} role="alert">{formError}</p>}
      <div className={s.nav}>
        {step > 0 && <button type="button" className={s.btnGhost} onClick={() => go(step - 1)} disabled={sending}>이전</button>}
        {step < 2 ? <button type="button" className={s.btnGold} onClick={() => go(step + 1)} disabled={uploading}>{uploading ? "사진 업로드 중…" : "다음 단계"}</button>
          : <button type="button" className={s.btnGold} onClick={submit} disabled={sending}>{sending ? "접수하는 중…" : "이벤트 참여 완료하기"}</button>}
      </div>

      {zoom && (
        <div className={s.zoom} role="dialog" aria-modal="true" aria-label="사진 크게 보기" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="크게 보기" /><button type="button" aria-label="닫기">×</button>
        </div>
      )}
      {post && (
        <div className={s.sheetWrap} role="dialog" aria-modal="true" aria-label="주소 검색" onClick={() => setPost(false)}>
          <div className={s.postSheet} onClick={(e) => e.stopPropagation()}>
            <div className={s.postHead}><b>주소 검색</b><button type="button" onClick={() => setPost(false)} aria-label="닫기">×</button></div>
            <div ref={postBox} className={s.postBody} />
          </div>
        </div>
      )}
    </div>
  );
}
