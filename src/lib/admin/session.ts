import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

// Sesiones cortas: se cierran solas tras 1 hora sin uso y, sí o sí, a las 8 horas del ingreso.
const idleMs = 60 * 60_000;
const maxAgeMs = 8 * 60 * 60_000;

const secure = process.env.NODE_ENV === "production";
// __Host-: el navegador solo la acepta por HTTPS, sin dominio y para todo el sitio (no la pisa un subdominio)
export const sessionCookie = secure ? "__Host-ion-admin" : "ion-admin";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const h = await headers();
  await db.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(now + maxAgeMs),
      ip: await clientIp(),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  // Limpieza de sesiones vencidas de cualquier usuario
  await db.adminSession.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date(now) } }, { lastSeenAt: { lt: new Date(now - idleMs) } }] } });
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeMs / 1000,
  });
}

export type Admin = { id: string; email: string; name: string; sessionId: string };

/** Administrador con sesión válida, o null. Extiende la sesión mientras se usa. */
export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || token.length > 100) return null;
  const session = await db.adminSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() < now || session.lastSeenAt.getTime() < now - idleMs || !session.user.active) {
    await db.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Como mucho una escritura por minuto
  if (now - session.lastSeenAt.getTime() > 60_000) {
    await db.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } });
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name, sessionId: session.id };
}

/** Para cada página y acción del panel: sin sesión, al ingreso. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/ingresar");
  return admin;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(sessionCookie)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(sessionCookie);
}

/** Registro de acciones del panel */
export async function logAdmin(userId: string | null, action: string, target?: string | null, detail?: Prisma.InputJsonValue) {
  await db.adminLog.create({ data: { userId, action, target: target ?? null, detail, ip: await clientIp() } });
}
