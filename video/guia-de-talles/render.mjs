// Renderiza index.html a MP4 cuadro por cuadro (Playwright + ffmpeg).
// Uso: node video/guia-de-talles/render.mjs [salida.mp4]
// Por defecto escribe public/talles/guia-de-talles.mp4 y su portada .jpg.
// Si hay una locución en voz.mp3 (o voz.wav) al lado de este archivo, la suma como audio.
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(process.argv[2] ?? path.join(here, "../../public/talles/guia-de-talles.mp4"));
mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(here, "index.html")).href + "?capture");
await page.evaluate(() => document.fonts.ready);
const { total, fps } = await page.evaluate(() => ({ total: window.TOTAL, fps: window.FPS }));
const frames = Math.round(total * fps);

const voice = ["voz.mp3", "voz.wav"].map((f) => path.join(here, f)).find(existsSync);
const audio = voice ? ["-i", voice, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k", "-af", "apad", "-shortest"] : [];
const ffmpeg = spawn("ffmpeg", [
  "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", ...audio,
  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });

const stage = page.locator("#stage");
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.render(t), i / fps);
  const buf = await stage.screenshot({ type: "png" });
  if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  if (i % fps === 0) process.stdout.write(`\r${Math.round((i / frames) * 100)}%`);
}
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on("close", r));

// Portada: el título de la intro ya armado
await page.evaluate(() => window.render(4));
await stage.screenshot({ path: out.replace(/\.mp4$/, ".jpg"), type: "jpeg", quality: 85 });
await browser.close();
console.log(`\n${out} (${frames} cuadros)`);
execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size", "-of", "default=nw=1", out], { stdio: "inherit" });
