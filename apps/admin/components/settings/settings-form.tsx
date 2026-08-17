"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { StoreSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateStoreSettings } from "@/app/(dashboard)/settings/actions";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const addr = settings.business_address ?? {};
  const [form, setForm] = useState({
    store_name: settings.store_name,
    support_email: settings.support_email,
    phone: settings.phone,
    line1: addr.line1 ?? "",
    line2: addr.line2 ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    postal_code: addr.postal_code ?? "",
    country: addr.country ?? "",
    flat_shipping: (settings.flat_shipping_cents / 100).toString(),
    free_threshold: settings.free_shipping_threshold_cents != null ? (settings.free_shipping_threshold_cents / 100).toString() : "",
    tax_rate: (settings.tax_rate_bps / 100).toString(),
    order_confirmation_template: settings.order_confirmation_template,
    shipping_notification_template: settings.shipping_notification_template,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    const payload = {
      store_name: form.store_name,
      support_email: form.support_email,
      phone: form.phone,
      business_address: {
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        country: form.country,
      },
      flat_shipping_cents: Math.round(Number(form.flat_shipping || 0) * 100),
      free_shipping_threshold_cents: form.free_threshold.trim() ? Math.round(Number(form.free_threshold) * 100) : null,
      tax_rate_bps: Math.round(Number(form.tax_rate || 0) * 100),
      order_confirmation_template: form.order_confirmation_template,
      shipping_notification_template: form.shipping_notification_template,
    };
    startTransition(async () => {
      const result = await updateStoreSettings(payload);
      if (result.ok) {
        toast.success("Settings saved.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Store details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Store name">
                  <Input value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
                </Field>
                <Field label="Support email">
                  <Input type="email" value={form.support_email} onChange={(e) => set("support_email", e.target.value)} placeholder="support@lumadesk.com" />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Business address</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={form.line1} onChange={(e) => set("line1", e.target.value)} placeholder="Address line 1" />
                  <Input value={form.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Address line 2" />
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
                  <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State" />
                  <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} placeholder="Postal code" />
                  <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shipping</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Flat shipping rate (USD)">
                <Input type="number" min={0} step="0.01" value={form.flat_shipping} onChange={(e) => set("flat_shipping", e.target.value)} />
              </Field>
              <Field label="Free shipping over (USD)" hint="Leave blank to disable">
                <Input type="number" min={0} step="0.01" value={form.free_threshold} onChange={(e) => set("free_threshold", e.target.value)} placeholder="—" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Taxes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Default tax rate (%)" hint="Applied at checkout where required">
                <Input type="number" min={0} max={100} step="0.01" value={form.tax_rate} onChange={(e) => set("tax_rate", e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Order confirmation">
                <Textarea rows={4} value={form.order_confirmation_template} onChange={(e) => set("order_confirmation_template", e.target.value)} placeholder="Thanks for your order, {{name}}…" />
              </Field>
              <Field label="Shipping notification">
                <Textarea rows={4} value={form.shipping_notification_template} onChange={(e) => set("shipping_notification_template", e.target.value)} placeholder="Your order has shipped…" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
