import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Cifra datos sensibles en la base (el secreto del 2FA) con ADMIN_SECRET, que vive solo en .env:
// si se filtra una copia de la base, sin esa clave no se pueden generar códigos.
function key() {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("Falta ADMIN_SECRET en .env (mínimo 32 caracteres; generarla con `openssl rand -base64 48`).");
  }
  return createHash("sha256").update(`ionbike-admin:${secret}`).digest();
}

/** AES-256-GCM. Formato: v1.iv.tag.datos (base64url) */
export function seal(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function open(sealed: string) {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("Dato cifrado inválido");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
