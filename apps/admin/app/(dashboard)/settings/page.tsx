import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Store Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Store Settings"
      description="General store details, shipping, taxes, payments, email templates, security, and API keys. Coming in a later phase."
    />
  );
}
