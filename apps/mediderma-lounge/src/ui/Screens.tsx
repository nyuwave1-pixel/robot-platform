/** SPLASH · GAME INTRO · CHARACTER CREATION */
import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { EYE_COLORS, EYE_SHAPES, FACE_SHAPES, HAIR_COLORS, SKIN_TONES } from "../data/game";
import { DEFAULT_LOOK, useGame, type Look } from "../store/game";
import { useUI } from "../store/ui";
import { useT } from "../i18n";
import { Character } from "../three/Character";

export function Splash() {
  const t = useT();
  const started = useGame((s) => s.started);
  const name = useGame((s) => s.name);
  const set = useUI((s) => s.set);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#fde7ee] via-cream to-[#f3e6ff] px-6 text-center">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-soft/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-lav/70 blur-3xl" />
      <div className="relative h-56 w-56 sm:h-64 sm:w-64">
        <Preview look={useGame.getState().look} growth={started ? useGame.getState().stage : 1} auto />
      </div>
      <p className="mt-2 text-[11px] font-semibold tracking-[0.35em] text-gold">UNI&CORE × DERMA HOME</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-6xl">MEDIDERMA <span className="text-pink-deep">LOUNGE</span></h1>
      <p className="mt-3 text-xs font-semibold tracking-[0.2em] text-ink/60 sm:text-sm">BEAUTY LIFE. BEAUTY GROWTH. BEAUTY SOCIAL.</p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {started && (
          <button className="btn-primary" onClick={() => set({ screen: "game" })}>{t("splash.continue", { name })}</button>
        )}
        <button className={started ? "btn-ghost" : "btn-primary"} onClick={() => set({ screen: "intro" })}>{t("splash.new")}</button>
      </div>
      <p className="absolute bottom-4 px-6 text-[10px] leading-relaxed text-ink/45">{t("splash.notice")}</p>
    </div>
  );
}

export function Intro() {
  const t = useT();
  const set = useUI((s) => s.set);
  const [i, setI] = useState(0);
  const slides = [1, 2, 3, 4];
  const last = i === slides.length - 1;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-ink to-[#3a2a33] px-6 text-center text-cream">
      <p className="text-[11px] font-semibold tracking-[0.35em] text-gold">STORY {i + 1} / {slides.length}</p>
      <div className="mt-5 text-6xl">{["🌸", "🧴", "✨", "🏛️"][i]}</div>
      <h2 className="mt-5 max-w-md text-2xl font-bold sm:text-3xl">{t(`intro.${i + 1}.title`)}</h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/75">{t(`intro.${i + 1}.body`)}</p>
      <div className="mt-8 flex gap-2">{slides.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-pink-deep" : "w-2 bg-cream/30"}`} />)}</div>
      <div className="mt-8 flex w-full max-w-xs gap-3">
        <button className="btn-dark flex-1" onClick={() => set({ screen: "create" })}>{t("common.skip")}</button>
        <button className="btn-primary flex-1" onClick={() => (last ? set({ screen: "create" }) : setI(i + 1))}>{last ? t("intro.start") : t("common.next")}</button>
      </div>
    </div>
  );
}

export function Create() {
  const t = useT();
  const [name, setName] = useState("");
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const patch = (p: Partial<Look>) => setLook((l) => ({ ...l, ...p }));
  const start = () => {
    useGame.getState().startNew(name, look);
    useUI.setState({ screen: "game", panel: null, mode: "explore", customers: [], care: null });
  };
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#fde7ee] to-cream md:flex-row">
      <div className="relative h-[38%] w-full md:h-full md:w-1/2">
        <Preview look={look} growth={1} />
        <p className="absolute left-0 right-0 top-4 text-center text-[11px] font-semibold tracking-[0.3em] text-gold">STAGE 1 · BABY BEAUTY</p>
        <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-ink/45">{t("create.rotate")}</p>
      </div>
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-white/85 p-5 shadow-[0_-8px_30px_rgba(231,154,174,0.25)] backdrop-blur md:rounded-none md:p-10">
        <h2 className="text-2xl font-black text-ink">{t("create.title")}</h2>
        <p className="mt-1 text-sm text-ink/60">{t("create.desc")}</p>
        <label className="mt-5 block text-xs font-bold text-ink/70">{t("create.name")}</label>
        <input
          value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder={t("create.namePh")}
          className="mt-1 w-full rounded-2xl border-2 border-pink-soft bg-white px-4 py-3 text-base font-semibold text-ink outline-none focus:border-pink-deep"
        />
        <Swatches label={t("look.skin")} values={SKIN_TONES} value={look.skin} onPick={(v) => patch({ skin: v })} />
        <Swatches label={t("look.hairColor")} values={HAIR_COLORS} value={look.hairColor} onPick={(v) => patch({ hairColor: v })} />
        <Swatches label={t("look.eyeColor")} values={EYE_COLORS} value={look.eyeColor} onPick={(v) => patch({ eyeColor: v })} />
        <Chips label={t("look.hair")} values={["hair-bob", "hair-twin"]} value={look.hair} onPick={(v) => patch({ hair: v })} render={(v) => t(`hair.${v}`)} />
        <Chips label={t("look.face")} values={[...FACE_SHAPES]} value={look.face} onPick={(v) => patch({ face: v })} render={(v) => t(`face.${v}`)} />
        <Chips label={t("look.eyes")} values={[...EYE_SHAPES]} value={look.eyes} onPick={(v) => patch({ eyes: v })} render={(v) => t(`eyes.${v}`)} />
        <p className="mt-4 text-[11px] leading-relaxed text-ink/45">{t("create.diversity")}</p>
        <button className="btn-primary mt-5 w-full" onClick={start}>{t("create.start")}</button>
      </div>
    </div>
  );
}

export function Preview({ look, growth, auto }: { look: Look; growth: number; auto?: boolean }) {
  return (
    <Canvas camera={{ fov: 32, position: [0, 0.75, 3.1] }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <hemisphereLight args={["#fff4ee", "#f3d9e0", 1.2]} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} />
      <Suspense fallback={null}>
        <group position={[0, -0.1, 0]}>
          <Character look={look} growth={growth} anim={auto ? "wave" : "idle"} />
          <ContactShadows opacity={0.3} scale={3} blur={2.4} far={2} color="#e79aae" />
        </group>
      </Suspense>
      <OrbitControls enablePan={false} target={[0, 0.5 + (growth - 1) * 0.12, 0]} minDistance={1.6} maxDistance={5} autoRotate={auto} autoRotateSpeed={1.2} maxPolarAngle={1.7} />
    </Canvas>
  );
}

export function Swatches({ label, values, value, onPick }: { label: string; values: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-ink/70">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {values.map((v) => (
          <button key={v} aria-label={v} onClick={() => onPick(v)} style={{ background: v }}
            className={`h-9 w-9 rounded-full border-2 transition-transform active:scale-90 ${value === v ? "scale-110 border-pink-deep ring-2 ring-pink-soft" : "border-white shadow"}`} />
        ))}
      </div>
    </div>
  );
}
export function Chips<T extends string>({ label, values, value, onPick, render }: { label: string; values: T[]; value: string; onPick: (v: T) => void; render: (v: T) => string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-ink/70">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {values.map((v) => (
          <button key={v} onClick={() => onPick(v)} className={`chip ${value === v ? "chip-on" : ""}`}>{render(v)}</button>
        ))}
      </div>
    </div>
  );
}
