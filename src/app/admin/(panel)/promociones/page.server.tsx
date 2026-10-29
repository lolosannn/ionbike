import { requireAdmin } from "@/lib/admin/session";
import { listPromos } from "@/lib/admin/promos";
import { todayKey } from "@/lib/workshop";
import { PromosList } from "@/components/admin/PromosList";
import { setPromoActiveAction } from "../../actions";

export const metadata = { title: "Promociones" };

export default async function PromosPage() {
  await requireAdmin();
  return <PromosList promos={await listPromos()} today={todayKey()} setActive={setPromoActiveAction} />;
}
