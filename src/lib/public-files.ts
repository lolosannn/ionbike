import fs from "node:fs";
import path from "node:path";

const imageExtensions = ["svg", "png", "webp", "jpg", "jpeg"];
// En la vista previa de GitHub Pages el sitio vive en /ionbike
const basePath = process.env.PAGES_BASE_PATH ?? "";

/**
 * URL de una imagen de public/ si existe (prueba las extensiones habituales), o null.
 * Ej: publicImage("marcas", "zion") → "/marcas/zion.svg"
 */
export function publicImage(dir: string, name: string) {
  const ext = imageExtensions.find((e) => fs.existsSync(path.join(process.cwd(), "public", dir, `${name}.${e}`)));
  return ext ? `${basePath}/${dir}/${name}.${ext}` : null;
}
