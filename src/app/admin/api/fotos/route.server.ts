import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, logAdmin } from "@/lib/admin/session";
import { allowed } from "@/lib/rate-limit";
import { ImageError, maxUploadBytes, saveImage } from "@/lib/admin/images";

// Subida de fotos del panel: una por pedido, solo con sesión de administrador y desde el mismo sitio.
export async function POST(req: NextRequest) {
  // La cookie es SameSite=Strict; además se exige que el pedido venga de esta misma página
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });

  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "La sesión se cerró. Volvé a ingresar." }, { status: 401 });
  if (!(await allowed("adminUpload"))) return NextResponse.json({ error: "Subiste muchas fotos seguidas. Esperá unos minutos." }, { status: 429 });
  if (Number(req.headers.get("content-length") ?? 0) > maxUploadBytes + 64 * 1024) {
    return NextResponse.json({ error: "La foto pesa más de 15 MB." }, { status: 413 });
  }

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  if (file.size > maxUploadBytes) return NextResponse.json({ error: "La foto pesa más de 15 MB." }, { status: 413 });

  try {
    const url = await saveImage(Buffer.from(await file.arrayBuffer()));
    await logAdmin(admin.id, "foto.subida", url);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof ImageError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
