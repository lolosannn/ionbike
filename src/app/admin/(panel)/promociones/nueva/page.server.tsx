import { requireAdmin } from "@/lib/admin/session";
import { getPromoTargets } from "@/lib/admin/promos";
import { emptyPromo } from "@/lib/admin/promo-form";
import { todayKey } from "@/lib/workshop";
import { PromoEditor } from "@/components/admin/PromoEditor";
import { savePromoAction } from "../../../actions";

export const metadata = { title: "Nueva promo" };

export default async function NewPromoPage() {
  await requireAdmin();
  return <PromoEditor initial={{ ...emptyPromo, startsOn: todayKey() }} today={todayKey()} targets={await getPromoTargets()} save={savePromoAction} />;
}
