import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

// Fotos que se suben desde el panel. Se vuelven a generar desde cero con sharp: se rotan según la
// cámara, se achican a 2000 px, se pasan a WebP y se descartan los metadatos (GPS, cámara, etc.).
// Así nunca se sirve el archivo original que mandó el navegador.
export const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
export const maxUploadBytes = 15 * 1024 * 1024;
const maxSide = 2000;
const allowedFormats = new Set(["jpeg", "png", "webp", "avif", "heif", "gif", "tiff"]);

/** Nombre de archivo guardado: 32 caracteres hex + .webp */
export const mediaName = /^[a-f0-9]{32}\.webp$/;

export class ImageError extends Error {}

export async function saveImage(input: Buffer) {
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new ImageError("El archivo no es una imagen válida.");
  }
  if (!meta.format || !allowedFormats.has(meta.format)) throw new ImageError("Formato no soportado. Subí JPG, PNG o WebP.");
  if ((meta.width ?? 0) < 300 || (meta.height ?? 0) < 300) throw new ImageError("La foto es muy chica (mínimo 300 × 300 px).");

  const output = await sharp(input, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  const name = `${randomBytes(16).toString("hex")}.webp`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), output, { flag: "wx" });
  return `/media/${name}`;
}

export async function readImage(name: string) {
  if (!mediaName.test(name)) return null;
  return readFile(path.join(uploadsDir, name)).catch(() => null);
}
