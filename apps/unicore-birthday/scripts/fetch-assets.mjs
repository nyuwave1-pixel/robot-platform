#!/usr/bin/env node
/**
 * fetch-assets.mjs
 * 빌드/개발 전에 Google Drive(링크 공개) 원본 영상을 내려받아 웹용으로 변환하고
 * 시네마틱 필름의 스틸 22컷과 포스터를 추출합니다.
 *
 * - 결과물은 public/media/ (git 제외). 이미 있으면 건너뜁니다 (--force 로 재생성).
 * - SKIP_ASSETS=1 이면 아무것도 하지 않습니다 (UI만 볼 때).
 * - ffmpeg 는 ffmpeg-static 바이너리를 사용합니다 (Vercel 빌드 이미지에서 동작).
 */
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MEDIA = path.join(ROOT, "public", "media");
const CACHE = path.join(ROOT, ".assets-cache");
const FORCE = process.argv.includes("--force");

if (process.env.SKIP_ASSETS === "1") {
  console.log("[assets] SKIP_ASSETS=1 → 건너뜀");
  process.exit(0);
}

const SOURCES = {
  // 인트로 보이스 라인(여성, ko-KR) — 빌드 시 내려받아 public/audio/voice_intro.mp3 로 배치
  voiceIntroUrl: process.env.ASSET_VOICE_INTRO_URL || "https://d2ol7oe51mr4n9.cloudfront.net/user_3DTyZSlqPjD203YBlwJWTda3q73/c085d7d7-f760-4260-bc88-3e7251f3737f.mp3",
  film: process.env.ASSET_FILM_DRIVE_ID || "1oMyRx7j4OorJCE4PxYZSoki3tbJB_qUH",
  filmPortrait: process.env.ASSET_FILM_PORTRAIT_DRIVE_ID || "1ASIl1bw3QQfW_nbQivwWwXVF1h7UFYbv",
  filmClinical: process.env.ASSET_FILM_CLINICAL_DRIVE_ID || "1zn5SJGHlPsfLswqNV0Stu1-Uq9C3Wh_-",
};

// 시네마틱 필름 v1 스틸 타임코드 (docs/09_cinematic-film-analysis.md 와 동일)
const STILLS = [
  ["00_candle_dark", 0.8], ["01_cake_clean", 3.6], ["01_cake_titled", 6.0],
  ["02_flame_macro", 9.0], ["02_flame_gold", 11.0],
  ["03_box_black_clean", 13.6], ["03_box_black_titled", 16.0],
  ["04_box_opening", 21.5], ["04_masterpiece_open", 24.5],
  ["05_cream_clean", 26.6], ["05_cream_28", 29.8],
  ["06_lid_clean", 32.4], ["06_lid_4833", 36.5], ["07_gold_flash", 38.5],
  ["08_boxjar_clean", 40.4], ["08_boxjar_1906", 43.5],
  ["09_ginseng_particles", 46.6], ["09_molecule", 49.6],
  ["10_jar_candle_clean", 52.3], ["10_jar_candle_rebirth", 54.5], ["10_endline", 56.5],
  ["11_logo", 61.0],
];

let ffmpegPath = "ffmpeg";
try {
  const mod = await import("ffmpeg-static");
  if (mod.default) ffmpegPath = mod.default;
} catch {
  console.warn("[assets] ffmpeg-static 없음 → 시스템 ffmpeg 사용");
}

const driveUrl = (id) => `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

async function download(id, dest) {
  if (existsSync(dest) && statSync(dest).size > 1_000_000 && !FORCE) {
    console.log(`[assets] cached ${path.basename(dest)}`);
    return;
  }
  console.log(`[assets] download ${path.basename(dest)} …`);
  const res = await fetch(driveUrl(id), { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download failed ${id}: ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html")) throw new Error(`Drive returned HTML for ${id} (파일이 링크 공개 상태인지 확인)`);
  await pipeline(res.body, createWriteStream(dest));
  console.log(`[assets] ok ${path.basename(dest)} ${(statSync(dest).size / 1e6).toFixed(1)}MB`);
}

/** 작은 정적 파일(오디오 등) 다운로드 — 이미 있으면 건너뜀 */
async function downloadUrl(url, dest, minBytes = 10_000) {
  if (existsSync(dest) && statSync(dest).size > minBytes && !FORCE) {
    console.log(`[assets] cached ${path.basename(dest)}`);
    return;
  }
  console.log(`[assets] download ${path.basename(dest)} …`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download failed ${path.basename(dest)}: ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
  const size = statSync(dest).size;
  if (size < minBytes) throw new Error(`${path.basename(dest)} too small (${size}B)`);
  console.log(`[assets] ok ${path.basename(dest)} ${(size / 1e3).toFixed(0)}KB`);
}

function ff(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${args.join(" ")}`))));
  });
}

const need = (f) => FORCE || !existsSync(f);

async function main() {
  mkdirSync(MEDIA, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  for (const d of ["film", "stills", "posters"]) mkdirSync(path.join(MEDIA, d), { recursive: true });

  // 0) 인트로 보이스 라인 (실패해도 사이트는 BGM 만으로 동작)
  try {
    const audioDir = path.join(ROOT, "public", "audio");
    mkdirSync(audioDir, { recursive: true });
    await downloadUrl(SOURCES.voiceIntroUrl, path.join(audioDir, "voice_intro.mp3"));
  } catch (e) {
    console.warn("[assets] voice intro skipped:", e.message);
  }

  const srcFilm = path.join(CACHE, "film_src.mp4");
  const srcPortrait = path.join(CACHE, "film_portrait_src.mp4");
  const srcClinical = path.join(CACHE, "film_clinical_src.mp4");

  await download(SOURCES.film, srcFilm);

  // 1) 재생용 1080p (faststart) + 720p
  const film1080 = path.join(MEDIA, "film", "film_1080.mp4");
  if (need(film1080)) await ff(["-i", srcFilm, "-vf", "scale=1920:-2", "-c:v", "libx264", "-crf", "21", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", film1080]);
  const film720 = path.join(MEDIA, "film", "film_720.mp4");
  if (need(film720)) await ff(["-i", srcFilm, "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "96k", "-ar", "48000", film720]);

  // 2) 스크럽 전용 (짧은 GOP, 무음) — 섹션 스크롤 동기화에 사용
  const scrub = path.join(MEDIA, "film", "film_scrub_720.mp4");
  if (need(scrub)) await ff(["-i", srcFilm, "-an", "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "24", "-preset", "medium", "-g", "12", "-keyint_min", "12", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-movflags", "+faststart", scrub]);

  // 3) 스틸 22컷 (1600px webp + 2400px jpg)
  for (const [name, t] of STILLS) {
    const webp = path.join(MEDIA, "stills", `${name}.webp`);
    if (need(webp)) await ff(["-ss", String(t), "-i", srcFilm, "-frames:v", "1", "-vf", "scale=1600:-2", "-c:v", "libwebp", "-quality", "82", webp]);
    const jpg = path.join(MEDIA, "stills", `${name}.jpg`);
    if (need(jpg)) await ff(["-ss", String(t), "-i", srcFilm, "-frames:v", "1", "-q:v", "2", jpg]);
  }

  // 4) 포스터
  const poster = path.join(MEDIA, "posters", "film_poster.webp");
  if (need(poster)) await ff(["-ss", "3.6", "-i", srcFilm, "-frames:v", "1", "-vf", "scale=1920:-2", "-c:v", "libwebp", "-quality", "80", poster]);

  // 5) 모바일 세로 필름 (임상강조 세로 60초) — 세로 시네마틱 필름 제작 전까지 사용
  try {
    await download(SOURCES.filmPortrait, srcPortrait);
    const portrait = path.join(MEDIA, "film", "film_portrait_1080.mp4");
    if (need(portrait)) await ff(["-i", srcPortrait, "-vf", "scale=1080:-2", "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "112k", "-ar", "48000", portrait]);
    const pposter = path.join(MEDIA, "posters", "film_portrait_poster.webp");
    if (need(pposter)) await ff(["-ss", "12", "-i", srcPortrait, "-frames:v", "1", "-vf", "scale=1080:-2", "-c:v", "libwebp", "-quality", "80", pposter]);
  } catch (e) {
    console.warn("[assets] portrait film skipped:", e.message);
  }

  // 6) 임상강조 16:9 (S04 보조 영상)
  try {
    await download(SOURCES.filmClinical, srcClinical);
    const clin = path.join(MEDIA, "film", "film_clinical_720.mp4");
    if (need(clin)) await ff(["-i", srcClinical, "-vf", "scale=1280:-2", "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "96k", "-ar", "48000", clin]);
  } catch (e) {
    console.warn("[assets] clinical film skipped:", e.message);
  }

  console.log("[assets] done");
}

main().catch((e) => {
  console.error("[assets] FAILED:", e.message);
  // 에셋 실패가 빌드를 막지 않도록 종료 코드 0 — 사이트는 포스터/폴백으로 동작
  process.exit(0);
});
