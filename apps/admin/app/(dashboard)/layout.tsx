import { requireAdmin } from "@/lib/auth/require-admin";
import { getNotificationCount } from "@/lib/queries/notifications";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const notificationCount = await getNotificationCount().catch(() => 0);
  return (
    <AppShell profile={profile} notificationCount={notificationCount}>
      {children}
    </AppShell>
  );
}
