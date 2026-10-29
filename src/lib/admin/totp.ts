import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Códigos de 6 dígitos de una app de autenticación (Google Authenticator, Authy, 1Password…),
// según RFC 6238: HMAC-SHA1, cada 30 segundos.
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const period = 30;

function base32Encode(buf: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(text: string) {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of text.replace(/=+$/, "").toUpperCase()) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) throw new Error("Secreto inválido");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Secreto nuevo de 160 bits, en base32 (lo que se carga en la app). */
export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

function codeAt(key: Buffer, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const n = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return n.toString().padStart(6, "0");
}

/**
 * Verifica un código aceptando 30 segundos de diferencia de reloj para cada lado.
 * Devuelve el paso usado (para no aceptar el mismo código dos veces) o null.
 */
export function verifyTotp(secret: string, code: string, lastStep: number, now = Date.now()) {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const key = base32Decode(secret);
  const current = Math.floor(now / 1000 / period);
  for (const step of [current - 1, current, current + 1]) {
    if (step <= lastStep) continue;
    if (timingSafeEqual(Buffer.from(codeAt(key, step)), Buffer.from(clean))) return step;
  }
  return null;
}

/** Link otpauth:// para el QR que se escanea con la app. */
export function otpauthUrl(secret: string, email: string, issuer = "IonBikeStore") {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${period}`;
}
