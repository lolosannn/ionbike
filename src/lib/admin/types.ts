// Filas que el panel le pasa al navegador (sin datos de más)
import type { AppointmentStatus, InquiryStatus } from "@prisma/client";

export type InquiryRow = {
  id: string;
  createdAt: string;
  productId: string | null;
  productName: string;
  productSlug: string | null;
  preference: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: InquiryStatus;
  adminNotes: string | null;
};

export type AppointmentRow = {
  id: string;
  date: string;
  time: string;
  services: string[];
  name: string;
  phone: string;
  email: string | null;
  bike: string | null;
  notes: string | null;
  status: AppointmentStatus;
  adminNotes: string | null;
  createdAt: string;
};
