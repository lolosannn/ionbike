"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  svg: string;
  expiresAt: string;
  check: () => Promise<boolean>;
  renew: () => Promise<void>;
};

/** QR para pagar desde MODO o la app del banco. Consulta el pago cada 5 segundos. */
export function QrPayment({ svg, expiresAt, check, renew }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [renewing, setRenewing] = useState(false);
  const left = Math.max(0, new Date(expiresAt).getTime() - now);
  const expired = left === 0;

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (expired) return;
    const poll = setInterval(async () => {
      if (await check().catch(() => false)) router.refresh();
    }, 5000);
    return () => clearInterval(poll);
  }, [expired, check, router]);

  const minutes = Math.floor(left / 60000);
  const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="qr-pay">
      <div className={`qr-code${expired ? " is-expired" : ""}`} dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="qr-pay-info">
        <ol>
          <li>Abrí MODO, Mercado Pago o la app de tu banco.</li>
          <li>Elegí <strong>Pagar con QR</strong> y escaneá el código.</li>
          <li>Confirmá el pago: esta página se actualiza sola.</li>
        </ol>
        {expired ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={renewing}
            onClick={async () => {
              setRenewing(true);
              await renew();
              router.refresh();
              setRenewing(false);
            }}
          >
            {renewing ? "Generando…" : "Generar un QR nuevo"}
          </button>
        ) : (
          <p className="muted" style={{ margin: 0 }}>El QR vence en {minutes}:{seconds} min.</p>
        )}
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>¿Estás comprando desde el celular? Sacale una captura al QR y, en la app, elegí escanear desde una imagen de la galería.</p>
      </div>
    </div>
  );
}
