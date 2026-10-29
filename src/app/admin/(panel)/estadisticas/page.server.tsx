import { requireAdmin } from "@/lib/admin/session";
import { getStats } from "@/lib/admin/stats";
import { periodOptions } from "@/lib/admin/stats-types";
import { StatsDashboard } from "@/components/admin/StatsDashboard";

export const metadata = { title: "Estadísticas" };

type Props = { searchParams: Promise<{ dias?: string }> };

export default async function StatsPage({ searchParams }: Props) {
  await requireAdmin();
  const requested = Number((await searchParams).dias);
  const days = periodOptions.find((d) => d === requested) ?? 30;
  const data = await getStats(days);
  return <StatsDashboard key={days} datasets={[data]} empty={data.totals.views === 0 && data.previous.views === 0} />;
}
