import { PromosList } from "@/components/admin/PromosList";
import { demoNow, demoPromos } from "@/lib/admin/demo-data";
import { todayKey } from "@/lib/workshop";

export const metadata = { title: "Promociones" };

export default function PromosPreview() {
  return <PromosList promos={demoPromos()} today={todayKey(new Date(demoNow))} />;
}
