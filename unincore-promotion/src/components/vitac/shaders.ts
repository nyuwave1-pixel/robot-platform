/**
 * Fragment shaders for the VITA C scenes. All effects are procedural (no textures,
 * no external assets). Each one outputs premultiplied-alpha color so the section's
 * own background and photography show through.
 *
 * Uniforms: uTime (s), uRes (px), uProgress (0..1 scroll through the section),
 * uPointer (-1..1, smoothed), uDensity (0.5 mid tier, 1 high tier).
 */

export const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const COMMON = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform float uProgress;
uniform vec2 uPointer;
uniform float uDensity;

const vec3 CHAMPAGNE = vec3(0.776, 0.631, 0.416);
const vec3 CITRUS = vec3(0.914, 0.725, 0.302);
const vec3 FRESH = vec3(0.965, 0.843, 0.420);
const vec3 IVORY = vec3(0.957, 0.937, 0.906);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
vec2 aspectUv() {
  vec2 uv = vUv - 0.5;
  uv.x *= uRes.x / max(uRes.y, 1.0);
  return uv;
}
`;

/** Floating golden light particles (hero + finale). */
export const GOLD = /* glsl */ `
${COMMON}
float bokeh(vec2 uv, float scale, float speed, float seed) {
  uv *= scale;
  uv.y -= uTime * speed;
  vec2 id = floor(uv);
  vec2 f = fract(uv) - 0.5;
  float h = hash(id + seed);
  if (h < 1.0 - 0.38 * uDensity) return 0.0;
  vec2 o = (vec2(hash(id + seed + 1.3), hash(id + seed + 2.7)) - 0.5) * 0.7;
  o += 0.08 * vec2(sin(uTime * 0.6 + h * 40.0), cos(uTime * 0.5 + h * 21.0));
  float r = mix(0.05, 0.2, hash(id + seed + 4.1));
  float d = length(f - o);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + h * 1.7) + h * 31.0);
  return smoothstep(r, r * 0.15, d) * twinkle;
}
void main() {
  vec2 uv = aspectUv();
  float a = 0.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 p = uv + uPointer * (0.015 + fi * 0.02);
    float b = bokeh(p, 5.0 + fi * 4.0, 0.03 + fi * 0.02, fi * 7.7);
    float w = 0.9 - fi * 0.22;
    vec3 c = mix(CHAMPAGNE, mix(CITRUS, FRESH, hash(vec2(fi, 3.0))), 0.4 + 0.3 * fi);
    col += c * b * w;
    a += b * w;
  }
  // soft central glow
  float glow = smoothstep(0.75, 0.0, length(uv - vec2(0.12, 0.0) - uPointer * 0.03));
  col += CITRUS * glow * 0.10;
  a += glow * 0.10;
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

/** Wash: fine powder falls, meets water, blooms into foam as you scroll. */
export const POWDER = /* glsl */ `
${COMMON}
float grains(vec2 uv, float scale, float speed, float seed) {
  uv *= scale;
  uv.y += uTime * speed;
  uv.x += sin(uv.y * 0.35 + seed) * 0.25;
  vec2 id = floor(uv);
  vec2 f = fract(uv) - 0.5;
  float h = hash(id + seed);
  if (h < 1.0 - 0.55 * uDensity) return 0.0;
  vec2 o = (vec2(hash(id + seed + 3.1), hash(id + seed + 5.9)) - 0.5) * 0.8;
  return smoothstep(0.09, 0.0, length(f - o));
}
vec2 cell(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash(i + g), hash(i + g + 9.1));
    o = 0.5 + 0.35 * sin(uTime * 0.6 + 6.283 * o);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return vec2(d1, d2);
}
void main() {
  vec2 uv = aspectUv();
  float p = clamp(uProgress, 0.0, 1.0);
  // 1. powder: strongest at the start, settles as foam forms
  float fall = 1.0 - smoothstep(0.35, 0.8, p);
  float g = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    g += grains(uv + uPointer * 0.02 * (fi + 1.0), 16.0 + fi * 10.0, 0.18 + fi * 0.1, fi * 3.3) * (1.0 - fi * 0.25);
  }
  g *= fall * smoothstep(-0.55, 0.1, uv.y + 0.2);
  // 2. water drop ripple at the center
  float r = length(uv - vec2(0.0, -0.05));
  float wave = smoothstep(0.2, 0.55, p) * (1.0 - smoothstep(0.55, 0.85, p));
  float ripple = wave * smoothstep(0.012, 0.0, abs(fract(r * 6.0 - uTime * 0.6) - 0.5) * 0.08) * smoothstep(0.6, 0.05, r);
  // 3. foam: soft bubbles growing from the bottom
  float foamAmt = smoothstep(0.45, 0.95, p);
  vec2 c = cell(uv * 7.0 + vec2(0.0, uTime * 0.05));
  float bubble = smoothstep(0.0, 0.1, c.y - c.x);           // bubble walls
  float body = 1.0 - smoothstep(0.0, 0.55, c.x);            // soft fill
  float rise = smoothstep(0.35 - foamAmt * 0.9, -0.5, uv.y + fbm(uv * 3.0 + uTime * 0.1) * 0.15);
  float foam = foamAmt * rise * (0.55 * body + 0.45 * (1.0 - bubble));
  float a = clamp(g * 0.9 + ripple * 0.55 + foam * 0.92, 0.0, 1.0);
  // unpremultiplied colour: white powder/foam, ivory shading between bubbles, a hint of gold light
  vec3 col = mix(vec3(1.0), IVORY * 0.94, foam * (1.0 - body) * 0.8) + FRESH * 0.06 * ripple;
  gl_FragColor = vec4(col * a, a);
}
`;

/** Mask: translucent essence flowing over a fine sheet texture, with drops sliding down. */
export const ESSENCE = /* glsl */ `
${COMMON}
void main() {
  vec2 uv = aspectUv();
  float t = uTime * 0.12;
  vec2 q = vec2(fbm(uv * 2.0 + t), fbm(uv * 2.0 - t + 4.0));
  float flow = fbm(uv * 2.4 + q * 1.6 + vec2(0.0, -t * 2.0) + uPointer * 0.15);
  float sheen = smoothstep(0.55, 0.85, flow) * (0.6 + 0.4 * sin(uTime * 0.8 + flow * 9.0));
  // fine sheet fibres (diagonal)
  float fibre = 0.5 + 0.5 * sin((uv.x * 0.8 + uv.y) * 260.0 + noise(uv * 40.0) * 3.0);
  // small essence beads sliding down: bright core + soft refractive rim + faint wet trail
  float drops = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    if (fi > 6.0 * uDensity) break;
    float x = (hash(vec2(fi, 1.7)) - 0.5) * 1.7;
    float speed = 0.03 + hash(vec2(fi, 4.2)) * 0.05;
    float y = 0.65 - fract(uTime * speed + hash(vec2(fi, 9.3))) * 1.5;
    vec2 d = uv - vec2(x + sin(uTime * 0.3 + fi) * 0.01, y);
    float r = 0.012 + hash(vec2(fi, 3.3)) * 0.012;
    float len = length(d * vec2(1.0, 0.85));
    float core = smoothstep(r * 0.55, 0.0, length(d - vec2(-r * 0.3, r * 0.35)));
    float rim = smoothstep(r, r * 0.7, len) * (1.0 - smoothstep(r * 0.7, r * 0.3, len));
    float trail = smoothstep(0.004, 0.0, abs(d.x)) * smoothstep(0.0, 0.03, d.y) * smoothstep(0.22, 0.0, d.y) * 0.18;
    drops += core * 0.9 + rim * 0.55 + trail;
  }
  float reveal = 0.35 + 0.65 * smoothstep(0.0, 0.5, uProgress);
  vec3 col = mix(IVORY, FRESH, 0.35) * sheen * 0.5 + vec3(1.0) * drops + CHAMPAGNE * fibre * 0.015;
  float a = clamp((sheen * 0.28 + drops * 0.8 + fibre * 0.012) * reveal, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`;

/** Ampoule: molten gold drops (metaballs) that fall along the sides, merge and catch the light. */
export const LIQUID = /* glsl */ `
${COMMON}
float field(vec2 uv) {
  float aspect = uRes.x / max(uRes.y, 1.0);
  float f = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float h = hash(vec2(fi, 2.3));
    float speed = 0.035 + h * 0.05;
    float y = 0.72 - fract(uTime * speed + h) * 1.6;
    // keep drops to the left/right edges so they never cross the copy
    float side = hash(vec2(fi, 7.1)) < 0.5 ? -1.0 : 1.0;
    float x = side * aspect * (0.33 + 0.14 * hash(vec2(fi, 8.8))) + 0.012 * sin(uTime * 0.7 + fi * 2.0);
    float r = 0.016 + hash(vec2(fi, 5.5)) * 0.022;
    vec2 d = uv - vec2(x, y) - uPointer * 0.03;
    d.y *= 0.8; // a falling drop is slightly elongated
    f += r * r / max(dot(d, d), 1e-5);
  }
  float pool = smoothstep(-0.455, -0.53, uv.y + 0.018 * sin(uv.x * 5.0 + uTime * 0.8) - uProgress * 0.03);
  return f + pool * 4.0;
}
float height(vec2 uv) { return smoothstep(0.9, 2.6, field(uv)); }
void main() {
  vec2 uv = aspectUv();
  float f = field(uv);
  float mask = smoothstep(0.92, 1.08, f);
  float e = 0.0025;
  float hx = height(uv + vec2(e, 0.0)) - height(uv - vec2(e, 0.0));
  float hy = height(uv + vec2(0.0, e)) - height(uv - vec2(0.0, e));
  vec3 n = normalize(vec3(-hx * 2.2, -hy * 2.2, 1.0));
  vec3 l = normalize(vec3(-0.45, 0.65, 0.6));
  float diff = clamp(dot(n, l), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 40.0);
  float rim = pow(1.0 - n.z, 1.5);
  vec3 deep = vec3(0.36, 0.22, 0.05);
  vec3 col = mix(deep, CITRUS, 0.25 + 0.75 * diff) + FRESH * rim * 0.5 + vec3(1.0, 0.97, 0.88) * spec * 1.4;
  float halo = smoothstep(0.4, 0.92, f) * (1.0 - mask) * 0.18;
  float a = clamp(mask + halo, 0.0, 1.0);
  col = mix(CITRUS * 0.7, col, mask);
  gl_FragColor = vec4(col * a, a);
}
`;

export const SHADERS = { gold: GOLD, powder: POWDER, essence: ESSENCE, liquid: LIQUID } as const;
export type ShaderName = keyof typeof SHADERS;
