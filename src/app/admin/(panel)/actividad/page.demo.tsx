import { ActivityLog } from "@/components/admin/ActivityLog";
import { demoActivity, demoNow } from "@/lib/admin/demo-data";

export const metadata = { title: "Actividad" };

export default function ActivityPreview() {
  return <ActivityLog rows={demoActivity()} now={demoNow} />;
}
