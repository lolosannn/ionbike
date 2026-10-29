import { requireAdmin } from "@/lib/admin/session";
import { listActivity } from "@/lib/admin/activity";
import { ActivityLog } from "@/components/admin/ActivityLog";

export const metadata = { title: "Actividad" };

export default async function ActivityPage() {
  await requireAdmin();
  return <ActivityLog rows={await listActivity()} now={Date.now()} />;
}
