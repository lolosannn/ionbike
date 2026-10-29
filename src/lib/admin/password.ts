import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Contraseñas con scrypt (resistente a ataques con placas de video), sal aleatoria por usuario.
// Formato guardado: scrypt$N$r$p$sal$hash (base64)
const N = 2 ** 15;
const r = 8;
const p = 1;
const keyLength = 64;
const maxmem = 128 * N * r * 2;

export const minPasswordLength = 12;

function derive(password: string, salt: Buffer, n = N, rr = r, pp = p) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keyLength, { N: n, r: rr, p: pp, maxmem }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

// Hash de una contraseña cualquiera: cuando el email no existe se verifica contra este,
// para que la respuesta tarde lo mismo y no delate qué emails son de administradores
let dummy: Promise<string> | null = null;

export async function verifyPassword(password: string, stored: string | null) {
  stored ??= await (dummy ??= hashPassword(randomBytes(16).toString("hex")));
  const [scheme, n, rr, pp, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await derive(password, Buffer.from(salt, "base64"), Number(n), Number(rr), Number(pp));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Motivo por el que una contraseña no sirve, o null si está bien. */
export function passwordProblem(password: string, email = "") {
  if (password.length < minPasswordLength) return `Tiene que tener al menos ${minPasswordLength} caracteres.`;
  if (password.length > 200) return "Es demasiado larga.";
  if (new Set(password).size < 6) return "Tiene muy pocos caracteres distintos.";
  const lower = password.toLowerCase();
  if (email && lower.includes(email.split("@")[0].toLowerCase())) return "No puede contener tu email.";
  if (["ionbike", "ionbikestore", "password", "contraseña", "123456", "qwerty"].some((w) => lower.includes(w))) {
    return "Es demasiado fácil de adivinar.";
  }
  return null;
}
