// Validaciones de los datos que llegan de los formularios (nunca confiar en el navegador).

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** DNI (7 u 8 dígitos) o CUIT / CUIL (11 dígitos). */
export const isDni = (s: string) => /^(\d{7,8}|\d{11})$/.test(s);

/** Teléfono con código de área, con o sin el 54 adelante. */
export const isPhone = (s: string) => /^\d{8,15}$/.test(s);

export const isEmail = (s: string) => s.length <= 200 && /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i.test(s);

/** Token público de un pedido: 24 bytes en base64url. */
export const isPublicToken = (s: unknown): s is string => typeof s === "string" && /^[A-Za-z0-9_-]{32}$/.test(s);
