/**
 * IndexNow 제출 — 네이버·빙·얀덱스 등 IndexNow 참여 검색엔진에 URL 변경을 즉시 통지.
 * 사용: node scripts/indexnow.mjs [url ...]   (인자 없으면 /, /en, /zh)
 * 키 파일: public/a2c49604d6902b1f8d4f478cf8116d86.txt (사이트 루트에서 서비스됨)
 */
const HOST = "birthday.unincore.com";
const KEY = "a2c49604d6902b1f8d4f478cf8116d86";
const urls = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/en", "/zh"];
const urlList = urls.map((u) => (u.startsWith("http") ? u : `https://${HOST}${u}`));
const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList };
const endpoints = ["https://api.indexnow.org/indexnow", "https://searchadvisor.naver.com/indexnow", "https://www.bing.com/indexnow"];
for (const ep of endpoints) {
  try {
    const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
    console.log(ep, r.status, (await r.text()).slice(0, 120));
  } catch (e) {
    console.log(ep, "ERR", e.message);
  }
}
