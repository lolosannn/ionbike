/** "29" → "R29"; talles de ropa ("M", "42") quedan igual salvo los rodados típicos. */
export function formatSize(size: string) {
  return /^\d+(\.\d+)?$/.test(size) && Number(size) <= 29 ? `R${size}` : size;
}

export function variantLabel(v: { color: string | null; size: string | null }) {
  return [v.color, v.size && formatSize(v.size)].filter(Boolean).join(" · ");
}
