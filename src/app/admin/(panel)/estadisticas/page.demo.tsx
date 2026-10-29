import { StatsDashboard } from "@/components/admin/StatsDashboard";
import { demoStats } from "@/lib/admin/demo-data";

export const metadata = { title: "Estadísticas" };

// Vista previa: números simulados, para ver cómo se arma el tablero
export default function StatsPreview() {
  return <StatsDashboard datasets={[demoStats(30), demoStats(7), demoStats(90)]} note="Vista previa: los números son simulados, para ver cómo se arma el tablero. En la tienda real se llenan solos con las visitas y ventas." />;
}
