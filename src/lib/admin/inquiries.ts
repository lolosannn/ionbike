import "server-only";
import type { InquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { InquiryRow } from "@/lib/admin/types";

export async function listInquiries(): Promise<InquiryRow[]> {
  const rows = await db.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 500, include: { product: { select: { slug: true } } } });
  return rows.map((i) => ({
    id: i.id,
    createdAt: i.createdAt.toISOString(),
    productId: i.productId,
    productName: i.productName,
    productSlug: i.product?.slug ?? null,
    preference: i.preference,
    name: i.name,
    phone: i.phone,
    email: i.email,
    message: i.message,
    status: i.status,
    adminNotes: i.adminNotes,
  }));
}

export const inquiryStatuses: InquiryStatus[] = ["NEW", "CONTACTED", "RESERVED", "WON", "LOST"];

export async function updateInquiry(id: string, data: { status?: InquiryStatus; adminNotes?: string }) {
  const res = await db.inquiry.updateMany({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes.trim().slice(0, 2000) || null } : {}),
    },
  });
  return res.count > 0;
}
