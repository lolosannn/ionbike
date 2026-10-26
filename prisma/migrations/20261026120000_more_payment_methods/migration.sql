-- Medios de pago propios para tarjeta, QR y efectivo en Pago Fácil o Rapipago
ALTER TYPE "PaymentMethod" ADD VALUE 'CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'TICKET';
ALTER TYPE "PaymentMethod" ADD VALUE 'QR';

-- QR dinámico de Mercado Pago
ALTER TABLE "Order" ADD COLUMN "mpQrOrderId" TEXT,
ADD COLUMN "mpQrData" TEXT,
ADD COLUMN "mpQrExpiresAt" TIMESTAMP(3);
