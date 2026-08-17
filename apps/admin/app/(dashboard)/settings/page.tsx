import type { Metadata } from "next";
import { KeyRound, Check, X } from "lucide-react";
import { getStoreSettings, getIntegrationStatus } from "@/lib/queries/settings";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata: Metadata = { title: "Store Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, integrations] = await Promise.all([
    getStoreSettings(),
    Promise.resolve(getIntegrationStatus()),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Store Settings" description="General store details, shipping, taxes, and email templates." />

      <SettingsForm settings={settings} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> API keys & integrations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configured via environment variables. Values are never displayed here.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {integrations.map((integration) => (
              <div key={integration.env} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{integration.key}</p>
                  <p className="font-mono text-xs text-muted-foreground">{integration.env}</p>
                </div>
                {integration.configured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <X className="h-3.5 w-3.5" /> Not set
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
