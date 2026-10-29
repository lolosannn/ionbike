"use server";

import { db } from "@/lib/db";
import { allowed } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";
import { isEmail, isPhone, onlyDigits } from "@/lib/validation";
import type { InquiryState } from "./InquiryForm";

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

/** Consulta por una bici a pedido: queda guardada para que el local la responda desde el panel */
export async function sendInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  // Campo trampa: invisible para las personas, los bots lo completan
  if (text(form, "website")) return { error: "No pudimos enviar la consulta." };
  const data = {
    name: text(form, "name"),
    phone: onlyDigits(text(form, "phone", 40)),
    email: text(form, "email") || null,
    preference: text(form, "preference", 120) || null,
    message: text(form, "message", 1000) || null,
  };
  if (!data.name || !data.phone) return { error: "Completá tu nombre y teléfono." };
  if (!isPhone(data.phone)) return { error: "Revisá el teléfono (con código de área)." };
  if (data.email && !isEmail(data.email)) return { error: "Revisá el email." };

  const product = await db.product.findFirst({ where: { id: text(form, "productId", 40), active: true, onRequest: true } });
  if (!product) return { error: "Este modelo ya no está disponible para consultar." };
  if (!(await allowed("inquiry"))) return { error: "Hiciste muchas consultas seguidas. Esperá unos minutos o escribinos por WhatsApp." };

  await db.inquiry.create({ data: { ...data, productId: product.id, productName: product.name } });
  await track("inquiry", { path: `/producto/${product.slug}`, productId: product.id });
  return { sent: true, name: data.name };
}
