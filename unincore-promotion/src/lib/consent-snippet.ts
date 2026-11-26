/** Inline, render-blocking-free snippet placed in <head>: defines gtag + Consent Mode defaults before any tag loads. */
/**
 * Browser translators (Chrome / Papago in Whale / Edge) replace page text nodes with
 * their own <font> nodes. When React later updates one of those nodes, removeChild /
 * insertBefore throw "node is not a child" and the page falls into the error screen.
 * This well-known guard makes those two calls tolerant (facebook/react#11538).
 */
const TRANSLATE_GUARD = `(function(){if(typeof Node!=='function'||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c.parentNode!==this){return c}return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return n}return i.apply(this,arguments)}})();`;

/**
 * GA4 measurement IDs from NEXT_PUBLIC_GA4_ID: one ID, or several separated by commas
 * (e.g. "G-N8BRZ7ZYN5,G-QDK6Q436G5"). Every ID gets its own gtag('config'), and every
 * gtag('event') without send_to goes to all of them. Invalid entries are dropped.
 */
export function ga4Ids(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => /^G-[A-Z0-9]{4,15}$/.test(x));
}

export function consentDefaultSnippet(consentMode: "opt-out" | "opt-in", ga4Id?: string) {
  // GA4 config goes here (not in the lazily loaded tag) so it precedes every event the
  // page fires during hydration — otherwise early events like view_item are dropped.
  const ids = ga4Ids(ga4Id);
  const ga4 = ids.length
    ? `var dbg=false;try{if(/[?&]ga_debug=1/.test(location.search))sessionStorage.setItem('uc_ga_debug','1');dbg=sessionStorage.getItem('uc_ga_debug')==='1';}catch(e){}gtag('js',new Date());` +
      ids.map((id) => `gtag('config','${id}',dbg?{send_page_view:false,debug_mode:true}:{send_page_view:false});`).join("")
    : "";
  const def = consentMode === "opt-out" ? "granted" : "denied";
  return `${TRANSLATE_GUARD}window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;var gpc=navigator.globalPrivacyControl===true;var c=null;try{c=localStorage.getItem('uc_consent');}catch(e){}var s=gpc?'denied':(c==='granted'||c==='denied')?c:'${def}';gtag('consent','default',{analytics_storage:s,ad_storage:s,ad_user_data:s,ad_personalization:s,wait_for_update:500});${ga4}`;
}
