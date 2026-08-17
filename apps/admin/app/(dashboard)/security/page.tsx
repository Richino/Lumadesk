import type { Metadata } from "next";
import { KeyRound, ShieldCheck, Clock, Monitor } from "lucide-react";
import { getSecurityOverview } from "@/lib/queries/security";
import { dateTime, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PasswordForm, SignOutEverywhere } from "@/components/security/security-panels";

export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const overview = await getSecurityOverview();

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Manage your account credentials and sessions." />

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Last sign-in
          </div>
          <p className="mt-2 text-sm font-medium">
            {overview.lastSignInAt ? relativeTime(overview.lastSignInAt) : "—"}
          </p>
          {overview.lastSignInAt && <p className="text-xs text-muted-foreground">{dateTime(overview.lastSignInAt)}</p>}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Two-factor auth
          </div>
          <div className="mt-2">
            {overview.mfaEnabled ? (
              <Badge variant="success">Enabled ({overview.mfaFactorCount})</Badge>
            ) : (
              <Badge variant="warning">Not enabled</Badge>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="h-4 w-4" /> Sign-in method
          </div>
          <p className="mt-2 text-sm font-medium capitalize">{overview.provider ?? "email"}</p>
        </Card>
      </div>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Change password
          </CardTitle>
          <p className="text-sm text-muted-foreground">Use at least 8 characters. You&apos;ll stay signed in on this device.</p>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sessions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign out everywhere to revoke every active session across devices. A full login history
            and per-session management requires Supabase auth audit logs.
          </p>
        </CardHeader>
        <CardContent>
          <SignOutEverywhere />
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Two-factor authentication</CardTitle>
          <p className="text-sm text-muted-foreground">
            {overview.mfaEnabled
              ? "Your account has a verified authenticator app. New sign-ins require a one-time code."
              : "Add an authenticator app (TOTP) for a second layer of protection. Enrollment is enabled at the Supabase project level and can be wired into this panel."}
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
