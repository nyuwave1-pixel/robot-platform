// Sky dome, ocean, sun/moon lighting, weather (rain, fog, wind, lightning), time-of-day presets and post-processing.
// UE5 equivalent: SkyAtmosphere + Volumetric Fog + Water plugin + Niagara rain + post-process volume.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { G } from '../core/ctx.js';
import { lerp, fbm, damp } from '../core/util.js';
import { windUniform, windStrength } from './build.js';

const C = (h) => new THREE.Color(h);
export const PRESETS = {
  night:    { top: C(0x050a18), bot: C(0x16263c), fog: C(0x0d1826), dens: 0.0036, sun: C(0x9fbcff), sunI: 1.7, hemi: 1.15,  dir: [-0.3, 0.36, -0.88], rain: 0,    wind: 0.6, storm: 0, stars: 1, night: 1,    exp: 1.5, label: '04:30 · NIGHT · CLEAR' },
  dawn:     { top: C(0x24364e), bot: C(0xc98a5a), fog: C(0x7d8a90), dens: 0.0085, sun: C(0xffc890), sunI: 1.6,  hemi: 0.8,  dir: [0.8, 0.22, 0.4],   rain: 0.35, wind: 0.9, storm: 0, stars: 0.15, night: 0.45, exp: 1.0, label: '05:40 · DAWN · FOG / LIGHT RAIN' },
  storm:    { top: C(0x2a3138), bot: C(0x59646a), fog: C(0x566067), dens: 0.006, sun: C(0xcfd8e0), sunI: 1.5,  hemi: 1.0,  dir: [0.3, 0.8, 0.3],    rain: 1,    wind: 1.8, storm: 1, stars: 0, night: 0.15, exp: 0.95, label: '09:10 · DAY · THUNDERSTORM' },
  facility: { top: C(0x1c2228), bot: C(0x000000), fog: C(0x0a0c0e), dens: 0.009, sun: C(0x000000), sunI: 0,    hemi: 1.0, dir: [0, 1, 0],          rain: 0,    wind: 0,   storm: 0, stars: 0, night: 0.8,  exp: 1.1, label: 'SUBLEVEL 3 · EMERGENCY POWER' },
  dusk:     { top: C(0x1a1c34), bot: C(0xd0603a), fog: C(0x5a4a50), dens: 0.0048, sun: C(0xff9a60), sunI: 1.8,  hemi: 0.75, dir: [-0.85, 0.2, -0.3], rain: 0.5,  wind: 1.5, storm: 1, stars: 0.25, night: 0.4, exp: 1.0, label: '18:50 · DUSK · STORM FRONT' },
};
export function waveHeight(x, z, t) { return Math.sin(x * 0.045 + t * 0.9) * 0.45 + Math.sin(z * 0.06 + t * 1.15 + 1.3) * 0.38 + Math.sin((x + z) * 0.11 + t * 1.7) * 0.16; }

export class Sky {
  constructor() {
    const S = G.scene;
    this.cur = {}; this.night = 1; this.wind = 1; this.flash = 0; this.nextBolt = 6; this.rainAmt = 0; this.indoor = false;
    this.hemi = new THREE.HemisphereLight(0xbfd0ff, 0x30281c, 0.5); S.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = sc.bottom = -70; sc.right = sc.top = 70; sc.near = 1; sc.far = 400; this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.06;
    S.add(this.sun, this.sun.target);
    S.fog = new THREE.FogExp2(0x0a1420, 0.004);
    this.domeU = { top: { value: C(0) }, bot: { value: C(0) }, flash: { value: 0 } };
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.domeU,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; uniform float flash; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y,0.0,1.0); vec3 c = mix(bot, top, pow(h,0.45)); gl_FragColor = vec4(c + flash*vec3(0.5,0.55,0.7), 1.0); }' }));
    this.dome.renderOrder = -10; S.add(this.dome);
    const sp = new Float32Array(1500 * 3); for (let i = 0; i < 1500; i++) { const a = Math.random() * 6.283, y = Math.random() * 0.95 + 0.05, r = Math.sqrt(1 - y * y); sp.set([Math.cos(a) * r * 1300, y * 1300, Math.sin(a) * r * 1300], i * 3); }
    this.stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(sp, 3)), new THREE.PointsMaterial({ color: 0xdfe8ff, size: 2.2, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false })); S.add(this.stars);
    this.moon = new THREE.Mesh(new THREE.CircleGeometry(38, 24), new THREE.MeshBasicMaterial({ color: 0xf4f6ff, fog: false, transparent: true })); S.add(this.moon);
    // ocean
    const nc = document.createElement('canvas'); nc.width = nc.height = 128; const ng = nc.getContext('2d'), img = ng.createImageData(128, 128);
    const hh = (x, y) => fbm(x * 0.06, y * 0.06, 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const dx = (hh(x + 1, y) - hh(x - 1, y)) * 6, dy = (hh(x, y + 1) - hh(x, y - 1)) * 6, i = (y * 128 + x) * 4; img.data[i] = 128 + dx * 127; img.data[i + 1] = 128 + dy * 127; img.data[i + 2] = 255; img.data[i + 3] = 255; }
    ng.putImageData(img, 0, 0); this.waterN = new THREE.CanvasTexture(nc); this.waterN.wrapS = this.waterN.wrapT = THREE.RepeatWrapping; this.waterN.repeat.set(140, 140);
    this.waterT = { value: 0 };
    const wm = new THREE.MeshStandardMaterial({ color: 0x0b2a3a, roughness: 0.3, metalness: 0.45, envMapIntensity: 0.85, normalMap: this.waterN, normalScale: new THREE.Vector2(0.45, 0.45), transparent: true, opacity: 0.93 });
    wm.onBeforeCompile = (s) => { s.uniforms.uT = this.waterT; s.vertexShader = 'uniform float uT;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wp = modelMatrix * vec4(position,1.0);\n transformed.z += sin(wp.x*0.045+uT*0.9)*0.45 + sin(wp.z*0.06+uT*1.15+1.3)*0.38 + sin((wp.x+wp.z)*0.11+uT*1.7)*0.16;'); };
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600, 180, 180), wm); this.water.rotation.x = -Math.PI / 2; this.water.receiveShadow = true; S.add(this.water);
    // rain streaks
    const RN = 2400; this.rainPos = new Float32Array(RN * 6); this.rainSeed = new Float32Array(RN * 3); for (let i = 0; i < RN * 3; i++) this.rainSeed[i] = Math.random();
    this.rain = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3)), new THREE.LineBasicMaterial({ color: 0xaec4d4, transparent: true, opacity: 0.35, fog: false, depthWrite: false })); this.rain.frustumCulled = false; S.add(this.rain);
    // image-based lighting: the sky gradient + sun/moon glow is pre-filtered into an environment map, so metal,
    // water and wet surfaces reflect the actual sky of the current weather preset
    this.pmrem = new THREE.PMREMGenerator(G.renderer); this.envScene = new THREE.Scene(); this.envT = 0; this.envKey = '';
    this.envU = { top: { value: C(0) }, bot: { value: C(0) }, sun: { value: C(0) }, dir: { value: new THREE.Vector3(0, 1, 0) }, dim: { value: 1 } };
    this.envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: this.envU,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; uniform vec3 sun; uniform vec3 dir; uniform float dim; varying vec3 vP; void main(){ vec3 n = normalize(vP); float h = n.y; vec3 c = h > 0.0 ? mix(bot, top, pow(h, 0.45)) : bot * mix(0.55, 0.2, -h); float s = max(dot(n, normalize(dir)), 0.0); c += sun * (pow(s, 600.0) * 10.0 + pow(s, 12.0) * 0.1); gl_FragColor = vec4(c * dim, 1.0); }' })));
    this.apply(PRESETS.night, 1); this.refreshEnv();
  }
  refreshEnv() {
    const c = this.cur, u = this.envU; u.top.value.copy(c.top); u.bot.value.copy(c.bot); u.sun.value.copy(c.sun).multiplyScalar(this.indoor ? 0 : c.sunI); u.dir.value.copy(c.dir); u.dim.value = this.indoor ? 0.35 : 1;
    if (this.indoor) { u.top.value.setRGB(0.1, 0.11, 0.12); u.bot.value.setRGB(0.05, 0.05, 0.055); }
    const rt = this.pmrem.fromScene(this.envScene, 0, 0.1, 200); if (this.envRT) this.envRT.dispose(); this.envRT = rt; G.scene.environment = rt.texture; G.scene.environmentIntensity = 1.15;
  }
  set(name, instant = false) { this.target = PRESETS[name]; this.presetName = name; if (instant) this.apply(this.target, 1); }
  apply(p, k) {
    const c = this.cur; if (!c.top) { Object.assign(c, { top: p.top.clone(), bot: p.bot.clone(), fog: p.fog.clone(), sun: p.sun.clone(), dir: new THREE.Vector3(...p.dir), dens: p.dens, sunI: p.sunI, hemi: p.hemi, rain: p.rain, wind: p.wind, stars: p.stars, night: p.night, exp: p.exp }); }
    c.top.lerp(p.top, k); c.bot.lerp(p.bot, k); c.fog.lerp(p.fog, k); c.sun.lerp(p.sun, k); c.dir.lerp(_d.set(...p.dir), k);
    for (const key of ['dens', 'sunI', 'hemi', 'rain', 'wind', 'stars', 'night', 'exp']) c[key] = lerp(c[key], p[key], k);
  }
  update(dt) {
    const p = this.target || PRESETS.night, c = this.cur, cam = G.camera.position; this.apply(p, Math.min(1, dt * 0.6));
    this.indoor = cam.y < -30; this.night = c.night;
    { const key = this.presetName + (this.indoor ? 'i' : 'o'); this.envT -= dt; if (key !== this.envKey || this.envT < 0) { const changed = key !== this.envKey; if (changed) this.envSettle = 5; if (changed || this.envSettle > 0) { this.refreshEnv(); this.envSettle = (this.envSettle || 0) - 1.5; } this.envKey = key; this.envT = 1.5; } } this.wind = c.wind; this.rainAmt = this.indoor ? 0 : c.rain;
    // lightning
    this.flash = Math.max(0, this.flash - dt * 5);
    if (p.storm && !this.indoor && G.state !== 'menu') { this.nextBolt -= dt; if (this.nextBolt < 0) { this.nextBolt = 5 + Math.random() * 12; this.flash = 1; setTimeout(() => G.audio.play('thunder'), 300 + Math.random() * 1500); } }
    const fl = this.flash > 0.5 || (this.flash > 0.15 && this.flash < 0.3) ? 1 : 0;
    this.domeU.top.value.copy(c.top); this.domeU.bot.value.copy(c.bot); this.domeU.flash.value = fl;
    G.scene.fog.color.copy(c.fog).addScalar(fl * 0.25); G.scene.fog.density = c.dens * (G.gear && G.gear.vision === 2 ? 0.4 : 1);
    this.hemi.intensity = c.hemi * 0.72 + fl * 2.5 + (G.state === 'cinematic' || G.state === 'menu' ? 0.9 * c.night : 0); this.hemi.color.copy(c.top).lerp(_w, 0.55); this.hemi.groundColor.copy(c.fog).multiplyScalar(0.5);
    this.sun.color.copy(c.sun); this.sun.intensity = this.indoor ? 0 : c.sunI; _d.copy(c.dir).normalize();
    const f = G.player ? G.player.pos : cam; this.sun.position.set(f.x + _d.x * 150, f.y + _d.y * 150, f.z + _d.z * 150); this.sun.target.position.copy(f);
    this.dome.position.copy(cam); this.stars.position.copy(cam); this.stars.material.opacity = c.stars; this.stars.visible = c.stars > 0.02 && !this.indoor;
    this.moon.position.copy(cam).addScaledVector(_d, 1250); this.moon.lookAt(cam); this.moon.material.opacity = c.stars; this.moon.visible = this.stars.visible; this.dome.visible = !this.indoor; this.water.visible = !this.indoor;
    G.renderer.toneMappingExposure = c.exp;
    this.waterT.value = G.time; this.waterN.offset.set(G.time * 0.004, G.time * 0.006); this.water.material.color.copy(c.bot).multiplyScalar(0.35).add(_wc);
    windUniform.value = G.time; windStrength.value = c.wind;
    // rain
    const amt = this.rainAmt; this.rain.visible = amt > 0.02;
    if (this.rain.visible) { const n = Math.floor((this.rainSeed.length / 3) * amt), rp = this.rainPos, rs = this.rainSeed, t = G.time; for (let i = 0; i < n; i++) { const x = cam.x + ((rs[i * 3] * 50 + t * c.wind * 2) % 50) - 25, z = cam.z + (rs[i * 3 + 2] * 50 % 50) - 25, y = cam.y + 14 - ((rs[i * 3 + 1] * 26 + t * 24) % 26); rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 2] = z; rp[i * 6 + 3] = x + c.wind * 0.12; rp[i * 6 + 4] = y + 0.75; rp[i * 6 + 5] = z; } this.rain.geometry.setDrawRange(0, n * 2); this.rain.geometry.attributes.position.needsUpdate = true; }
  }
}
const _d = new THREE.Vector3(), _w = new THREE.Color(0xffffff), _wc = new THREE.Color(0x061a26);

// ---------------- post processing ----------------
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uMode: { value: 0 }, uDamage: { value: 0 }, uVig: { value: 0.9 }, uWater: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uAspect: { value: 1.7 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uMode,uDamage,uVig,uWater,uFade,uFlash,uAspect; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec2 uv = vUv; if(uWater>0.5) uv += vec2(sin(uv.y*30.0+uTime*3.0), cos(uv.x*26.0+uTime*2.6))*0.004;
      vec3 c = texture2D(tDiffuse, uv).rgb; float l = dot(c, vec3(0.299,0.587,0.114));
      vec2 q = (vUv-0.5)*vec2(uAspect,1.0); float d = length(q);
      if(uMode>0.5 && uMode<1.5){ float g = clamp(pow(l*7.0,0.75),0.0,1.6); g += (rnd(vUv*vec2(640.0,360.0)+uTime)-0.5)*0.14; c = vec3(0.12,1.0,0.22)*g; c *= 0.92+0.08*sin(vUv.y*900.0); c *= smoothstep(0.62,0.42,d); }
      else if(uMode>1.5){ float h = clamp(l*0.55,0.0,1.0); vec3 cold = mix(vec3(0.02,0.02,0.10), vec3(0.32,0.12,0.42), smoothstep(0.0,0.45,h)); float hot = smoothstep(1.4,3.0,max(c.r,max(c.g,c.b))); c = mix(cold, mix(vec3(1.0,0.45,0.05), vec3(1.0,1.0,0.8), hot), smoothstep(0.0,0.3,hot)); c += (rnd(vUv*400.0+uTime)-0.5)*0.03; }
      if(uWater>0.5) c = c*vec3(0.35,0.7,0.8)*0.7;
      c *= 1.0 - uVig*smoothstep(0.35,0.95,d);
      c = mix(c, vec3(0.5,0.0,0.0), uDamage*smoothstep(0.25,0.8,d)*0.8);
      c += uFlash; c *= 1.0-uFade;
      c += (rnd(vUv*vec2(1280.0,720.0)+fract(uTime)*7.0)-0.5)*0.018;
      gl_FragColor = vec4(c,1.0); }`,
};
export class Post {
  constructor() {
    const r = G.renderer; this.composer = new EffectComposer(r); this.composer.addPass(new RenderPass(G.scene, G.camera));
    this.gtao = new GTAOPass(G.scene, G.camera, innerWidth, innerHeight); this.gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 }); this.gtao.enabled = false; this.composer.addPass(this.gtao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.36, 0.45, 0.95); this.composer.addPass(this.bloom);
    this.final = new ShaderPass(FinalShader); this.composer.addPass(this.final); this.composer.addPass(new OutputPass());
    this.u = this.final.uniforms; this.fade = 0; this.fadeTarget = 0; this.flash = 0;
  }
  resize(w, h, pr) { this.composer.setPixelRatio(pr); this.composer.setSize(w, h); this.u.uAspect.value = w / h; }
  render(dt) {
    const u = this.u; this.fade = damp(this.fade, this.fadeTarget, 5, dt); this.flash = Math.max(0, this.flash - dt * 2.2);
    u.uTime.value = G.time; u.uFade.value = this.fade; u.uFlash.value = this.flash; u.uMode.value = G.gear ? G.gear.vision : 0;
    u.uDamage.value = G.player ? G.player.hurt : 0; u.uWater.value = G.camera.position.y < -0.15 && G.camera.position.y > -30 ? 1 : 0;
    this.bloom.enabled = G.settings.quality !== 'low'; this.gtao.enabled = !!G.settings.ssao && (G.settings.quality === 'high' || G.settings.quality === 'ultra');
    if (G.settings.quality === 'low' && false) G.renderer.render(G.scene, G.camera); else this.composer.render(dt);
  }
}
