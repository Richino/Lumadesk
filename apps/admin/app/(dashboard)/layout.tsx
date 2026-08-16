import { requireAdmin } from "@/lib/auth/require-admin";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  return <AppShell profile={profile}>{children}</AppShell>;
}
