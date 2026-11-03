/** Inline, render-blocking-free snippet placed in <head>: defines gtag + Consent Mode defaults before any tag loads. */
export function consentDefaultSnippet(consentMode: "opt-out" | "opt-in") {
  const def = consentMode === "opt-out" ? "granted" : "denied";
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;var gpc=navigator.globalPrivacyControl===true;var c=null;try{c=localStorage.getItem('uc_consent');}catch(e){}var s=gpc?'denied':(c==='granted'||c==='denied')?c:'${def}';gtag('consent','default',{analytics_storage:s,ad_storage:s,ad_user_data:s,ad_personalization:s,wait_for_update:500});`;
}
