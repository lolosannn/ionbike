"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { allowed } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/admin/password";
import { verifyTotp } from "@/lib/admin/totp";
import { open } from "@/lib/admin/secret-box";
import { createSession, destroySession, getAdmin, logAdmin, requireAdmin } from "@/lib/admin/session";
import { validateProduct, type SaveResult } from "@/lib/admin/product-form";
import { deleteProduct, saveProduct, setProductActive } from "@/lib/admin/products";
import { changeOrderStatus, saveOrderNotes, type OrderAction } from "@/lib/admin/orders";
import { inquiryStatuses, updateInquiry } from "@/lib/admin/inquiries";
import { appointmentStatuses, createManualAppointment, updateAppointment, type ManualAppointment } from "@/lib/admin/appointments";
import type { AppointmentStatus, InquiryStatus } from "@prisma/client";
import { validatePromo } from "@/lib/admin/promo-form";
import { deletePromo, savePromo, setPromoActive } from "@/lib/admin/promos";

const isId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 40;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

// email: para que no haya que volver a escribirlo después de un error
export type LoginState = { error?: string; email?: string };

const maxFailures = 5;
const lockMs = 15 * 60_000;
const genericError = "Email, contraseña o código incorrectos.";

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const code = String(form.get("code") ?? "").replace(/\s/g, "").slice(0, 10);

  if (!(await allowed("adminLogin"))) return { email, error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." };
  if (!email || !password || !code) return { email, error: "Completá email, contraseña y código." };

  const user = await db.adminUser.findUnique({ where: { email } });
  // Siempre se verifica una contraseña, exista o no el usuario, para que tarde lo mismo
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !user.active) {
    await logAdmin(null, "ingreso.fallido", email);
    return { email, error: genericError };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await logAdmin(user.id, "ingreso.bloqueado", email);
    return { email, error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." };
  }

  const step = passwordOk ? verifyTotp(open(user.totpSecret), code, user.lastTotpStep) : null;
  // El paso del código se marca como usado de forma atómica: el mismo código no sirve dos veces
  const claimed = step !== null && (await db.adminUser.updateMany({ where: { id: user.id, lastTotpStep: { lt: step } }, data: { lastTotpStep: step } })).count === 1;
  if (!claimed) {
    const failures = user.failedLogins + 1;
    await db.adminUser.update({
      where: { id: user.id },
      data: failures >= maxFailures ? { failedLogins: 0, lockedUntil: new Date(Date.now() + lockMs) } : { failedLogins: failures },
    });
    await logAdmin(user.id, "ingreso.fallido", email, { motivo: passwordOk ? "codigo" : "contraseña" });
    return { email, error: genericError };
  }

  await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await createSession(user.id);
  await logAdmin(user.id, "ingreso", email);
  redirect("/admin/estadisticas");
}

export async function logout() {
  const admin = await getAdmin();
  await destroySession();
  if (admin) await logAdmin(admin.id, "salida", admin.email);
  redirect("/admin/ingresar");
}

export async function saveProductAction(raw: unknown): Promise<SaveResult> {
  const admin = await requireAdmin();
  const parsed = validateProduct(raw);
  if (!parsed.ok) return parsed;
  const result = await saveProduct(parsed.data);
  if (!result.ok) return result;
  const { changes, ...saved } = result;
  if (!parsed.data.id || (changes && Object.keys(changes).length)) {
    await logAdmin(admin.id, parsed.data.id ? "producto.editado" : "producto.creado", `${saved.slug} (${saved.id})`, changes as object);
  }
  return saved;
}

export async function deleteProductAction(id: string) {
  const admin = await requireAdmin();
  if (typeof id !== "string" || id.length > 40) return { ok: false as const, error: "Producto inválido." };
  const result = await deleteProduct(id);
  if (result.ok) await logAdmin(admin.id, "producto.borrado", `${result.name} (${id})`);
  return result;
}

export async function setProductActiveAction(id: string, active: boolean) {
  const admin = await requireAdmin();
  if (typeof id !== "string" || id.length > 40 || typeof active !== "boolean") return { ok: false as const };
  const product = await setProductActive(id, active);
  if (!product) return { ok: false as const };
  await logAdmin(admin.id, active ? "producto.publicado" : "producto.ocultado", `${product.name} (${id})`);
  return { ok: true as const };
}

export async function orderStatusAction(id: string, action: OrderAction, trackingCode?: string) {
  const admin = await requireAdmin();
  if (!isId(id) || !["paid", "shipped", "delivered", "cancel"].includes(action)) return { ok: false, error: "Datos inválidos." };
  const res = await changeOrderStatus(id, action, str(trackingCode, 60));
  if (res.ok) await logAdmin(admin.id, `pedido.${action}`, id, trackingCode ? { seguimiento: str(trackingCode, 60) } : undefined);
  return res;
}

export async function orderNotesAction(id: string, notes: string, trackingCode: string) {
  const admin = await requireAdmin();
  if (!isId(id)) return { ok: false, error: "Datos inválidos." };
  const ok = await saveOrderNotes(id, str(notes, 2000), str(trackingCode, 60));
  if (ok) await logAdmin(admin.id, "pedido.notas", id);
  return ok ? { ok: true } : { ok: false, error: "El pedido no existe." };
}

export async function inquiryAction(id: string, data: { status?: InquiryStatus; adminNotes?: string }) {
  const admin = await requireAdmin();
  if (!isId(id) || !data || (data.status && !inquiryStatuses.includes(data.status))) return { ok: false, error: "Datos inválidos." };
  const ok = await updateInquiry(id, { status: data.status, adminNotes: data.adminNotes === undefined ? undefined : str(data.adminNotes, 2000) });
  if (ok) await logAdmin(admin.id, data.status ? `consulta.${data.status.toLowerCase()}` : "consulta.notas", id);
  return ok ? { ok: true } : { ok: false, error: "La consulta no existe." };
}

export async function appointmentAction(id: string, data: { status?: AppointmentStatus; adminNotes?: string }) {
  const admin = await requireAdmin();
  if (!isId(id) || !data || (data.status && !appointmentStatuses.includes(data.status))) return { ok: false, error: "Datos inválidos." };
  const ok = await updateAppointment(id, { status: data.status, adminNotes: data.adminNotes === undefined ? undefined : str(data.adminNotes, 2000) });
  if (ok) await logAdmin(admin.id, data.status ? `turno.${data.status.toLowerCase()}` : "turno.notas", id);
  return ok ? { ok: true } : { ok: false, error: "El turno no existe." };
}

export async function createAppointmentAction(raw: ManualAppointment) {
  const admin = await requireAdmin();
  const input: ManualAppointment = {
    date: str(raw?.date, 10),
    time: str(raw?.time, 5),
    services: Array.isArray(raw?.services) ? raw.services.map((s) => str(s, 40)).slice(0, 10) : [],
    name: str(raw?.name, 200),
    phone: str(raw?.phone, 40),
    bike: str(raw?.bike, 200),
    notes: str(raw?.notes, 1000),
  };
  const res = await createManualAppointment(input);
  if (res.ok) await logAdmin(admin.id, "turno.cargado", res.id, { dia: input.date, hora: input.time });
  return res;
}

export async function savePromoAction(raw: unknown) {
  const admin = await requireAdmin();
  const parsed = validatePromo(raw);
  if (!parsed.ok) return parsed;
  const res = await savePromo(parsed.data);
  if (res.ok) await logAdmin(admin.id, parsed.data.id ? "promo.editada" : "promo.creada", `${parsed.data.title} (${res.id})`);
  return res;
}

export async function deletePromoAction(id: string) {
  const admin = await requireAdmin();
  if (!isId(id)) return { ok: false, error: "Datos inválidos." };
  const ok = await deletePromo(id);
  if (ok) await logAdmin(admin.id, "promo.borrada", id);
  return ok ? { ok: true } : { ok: false, error: "La promo ya no existe." };
}

export async function setPromoActiveAction(id: string, active: boolean) {
  const admin = await requireAdmin();
  if (!isId(id) || typeof active !== "boolean") return { ok: false };
  const ok = await setPromoActive(id, active);
  if (ok) await logAdmin(admin.id, active ? "promo.activada" : "promo.pausada", id);
  return { ok };
}
