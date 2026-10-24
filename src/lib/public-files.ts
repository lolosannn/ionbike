import fs from "node:fs";
import path from "node:path";

const imageExtensions = ["svg", "png", "webp", "jpg", "jpeg"];
// En la vista previa de GitHub Pages el sitio vive en /ionbike
const basePath = process.env.PAGES_BASE_PATH ?? "";

/**
 * URL de un archivo de public/ si existe (prueba las extensiones en orden), o null.
 * Ej: publicFile("nosotros", "local", ["mp4"]) → "/nosotros/local.mp4"
 */
export function publicFile(dir: string, name: string, extensions: string[]) {
  const ext = extensions.find((e) => fs.existsSync(path.join(process.cwd(), "public", dir, `${name}.${e}`)));
  return ext ? `${basePath}/${dir}/${name}.${ext}` : null;
}

/** Igual que publicFile, con las extensiones de imagen habituales. */
export function publicImage(dir: string, name: string) {
  return publicFile(dir, name, imageExtensions);
}
