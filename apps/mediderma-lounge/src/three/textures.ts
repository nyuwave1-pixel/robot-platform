/** 프로시저럴 텍스처: 대리석·헤링본·테라조·벽 패널·글로우. 이미지 파일 없이 캔버스로 그린다. */
import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, rnd: () => number) => void, repeat = true) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  let s = 0; for (const ch of key) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  draw(c.getContext("2d")!, rnd);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

/** 큰 판 대리석: 부드러운 얼룩 + 굵고 가는 결 */
export function marble(base: string, vein: string, accent?: string) {
  return make(`marble|${base}|${vein}|${accent}`, 1024, 1024, (g, r) => {
    g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 40; i++) {
      const x = r() * 1024, y = r() * 1024, rad = 120 + r() * 260;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, i % 2 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    }
    const veinPass = (n: number, color: string, wMin: number, wMax: number, alpha: number) => {
      g.strokeStyle = color; g.lineCap = "round";
      for (let i = 0; i < n; i++) {
        let x = r() * 1024, y = r() * 1024, a = r() * Math.PI * 2;
        g.globalAlpha = alpha * (0.4 + r() * 0.6); g.lineWidth = wMin + r() * (wMax - wMin);
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 26; k++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 44; y += Math.sin(a) * 44; g.lineTo(x, y); }
        g.stroke();
      }
      g.globalAlpha = 1;
    };
    g.filter = "blur(3px)"; veinPass(10, vein, 3, 9, 0.35);
    g.filter = "blur(0.6px)"; veinPass(22, vein, 0.6, 2, 0.55);
    if (accent) { g.filter = "blur(0.4px)"; veinPass(9, accent, 0.8, 2.2, 0.9); }
    g.filter = "none";
    // 판 줄눈
    g.strokeStyle = "rgba(0,0,0,0.10)"; g.lineWidth = 2;
    g.strokeRect(1, 1, 1022, 1022); g.beginPath(); g.moveTo(512, 0); g.lineTo(512, 1024); g.moveTo(0, 512); g.lineTo(1024, 512); g.stroke();
  });
}

/** 헤링본 원목 */
export function herringbone(a: string, b: string) {
  return make(`herring|${a}|${b}`, 512, 512, (g, r) => {
    g.fillStyle = a; g.fillRect(0, 0, 512, 512);
    const L = 128, W = 32;
    for (let row = -2; row < 20; row++) for (let col = -2; col < 10; col++) {
      const x = col * L + (row % 2 ? L / 2 : 0), y = row * W;
      g.save(); g.translate(x, y); g.rotate(row % 2 ? Math.PI / 4 : -Math.PI / 4);
      const t = r();
      g.fillStyle = t > 0.5 ? a : b; g.globalAlpha = 0.55 + t * 0.45; g.fillRect(0, 0, L, W);
      g.globalAlpha = 0.18; g.strokeStyle = "#5a4030"; g.lineWidth = 1.5; g.strokeRect(0, 0, L, W);
      g.globalAlpha = 0.08; g.strokeStyle = "#3a2a20";
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, 4 + r() * (W - 8)); g.lineTo(L, 4 + r() * (W - 8)); g.stroke(); }
      g.restore();
    }
  });
}

/** 테라조 타일 */
export function terrazzo(base: string, chips: string[]) {
  return make(`terrazzo|${base}|${chips.join()}`, 512, 512, (g, r) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 520; i++) {
      g.fillStyle = chips[Math.floor(r() * chips.length)]; g.globalAlpha = 0.5 + r() * 0.5;
      const x = r() * 512, y = r() * 512, s = 2 + r() * 9;
      g.beginPath(); g.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * Math.PI, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1; g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512);
  });
}

/** 벽 패널 몰딩 (한 칸). 밝은 선·어두운 선으로 베벨을 흉내 낸다 */
export function wallPanel(color: string, dark: boolean, tall: boolean) {
  return make(`panel|${color}|${dark}|${tall}`, 256, tall ? 512 : 256, (g, r) => {
    const h = tall ? 512 : 256;
    g.fillStyle = color; g.fillRect(0, 0, 256, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)"; g.fillRect(r() * 256, r() * h, 2 + r() * 5, 1 + r() * 3); }
    const hi = dark ? "rgba(201,166,107,0.75)" : "rgba(255,255,255,0.9)", lo = dark ? "rgba(0,0,0,0.6)" : "rgba(120,80,90,0.22)";
    const frame = (m: number) => {
      g.lineWidth = 3;
      g.strokeStyle = lo; g.strokeRect(m, m, 256 - m * 2, h - m * 2);
      g.strokeStyle = hi; g.strokeRect(m + 3, m + 3, 256 - m * 2 - 6, h - m * 2 - 6);
    };
    frame(22); if (tall) frame(40);
  });
}

/** 세로 그라디언트 (창밖 하늘, 빛줄기, 커튼) */
export function gradient(stops: [number, string][], key?: string) {
  return make(`grad|${key ?? stops.map((s) => s.join()).join("|")}`, 16, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  }, false);
}

/** 부드러운 원형 글로우 (바닥 빛 웅덩이, 후광) */
export function glow(color: string) {
  return make(`glow|${color}`, 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, color); gr.addColorStop(0.35, color + "88"); gr.addColorStop(1, color + "00");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }, false);
}

/** 플루팅(세로 홈) — 리셉션 데스크, 기둥 */
export function fluted(color: string) {
  return make(`flute|${color}`, 256, 64, (g) => {
    g.fillStyle = color; g.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 16) {
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, "rgba(0,0,0,0.22)"); gr.addColorStop(0.35, "rgba(255,255,255,0.18)"); gr.addColorStop(0.7, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,0.25)");
      g.fillStyle = gr; g.fillRect(x, 0, 16, 64);
    }
  });
}
