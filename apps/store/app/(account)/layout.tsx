import "../account.css";
import "../account-loading.css";
import { AccountShell } from "@/components/account/shell";
import { requireUser } from "@/lib/auth/require-user";
export default async function AccountLayout({ children }: { children: React.ReactNode }) { const profile = await requireUser(); return <AccountShell profile={profile}>{children}</AccountShell>; }
