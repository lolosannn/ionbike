import { notFound } from "next/navigation";
import { PromoEditor } from "@/components/admin/PromoEditor";
import { demoNow, demoPromoTargets, demoPromos } from "@/lib/admin/demo-data";
import { todayKey } from "@/lib/workshop";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Promo" };

export function generateStaticParams() {
  return demoPromos().map((p) => ({ id: p.id }));
}

export default async function EditPromoPreview({ params }: Props) {
  const { id } = await params;
  const promo = demoPromos().find((p) => p.id === id);
  if (!promo) notFound();
  return <PromoEditor initial={promo} today={todayKey(new Date(demoNow))} targets={demoPromoTargets()} />;
}
