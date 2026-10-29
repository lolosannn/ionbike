import { readImage } from "@/lib/admin/images";

// Fotos subidas desde el panel (carpeta uploads/). Los nombres son aleatorios y nunca cambian,
// así que el navegador las puede guardar en caché para siempre.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const file = await readImage((await params).name);
  if (!file) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
