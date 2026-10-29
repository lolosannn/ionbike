import { PromoEditor } from "@/components/admin/PromoEditor";
import { emptyPromo } from "@/lib/admin/promo-form";
import { demoNow, demoPromoTargets } from "@/lib/admin/demo-data";
import { todayKey } from "@/lib/workshop";

export const metadata = { title: "Nueva promo" };

export default function NewPromoPreview() {
  const today = todayKey(new Date(demoNow));
  return <PromoEditor initial={{ ...emptyPromo, startsOn: today }} today={today} targets={demoPromoTargets()} />;
}
