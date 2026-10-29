import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getPromoForm, getPromoTargets } from "@/lib/admin/promos";
import { todayKey } from "@/lib/workshop";
import { PromoEditor } from "@/components/admin/PromoEditor";
import { deletePromoAction, savePromoAction } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Promo" };

export default async function EditPromoPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const promo = id.length <= 40 ? await getPromoForm(id) : null;
  if (!promo) notFound();
  return <PromoEditor key={promo.id} initial={promo} today={todayKey()} targets={await getPromoTargets()} save={savePromoAction} remove={deletePromoAction} />;
}
