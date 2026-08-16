import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <ComingSoon
      title="Security"
      description="Password management, 2FA preparation, active sessions, login history, and activity monitoring. Coming in a later phase."
    />
  );
}
