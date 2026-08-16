import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Users & Roles" };

export default function UsersPage() {
  return (
    <ComingSoon
      title="Users & Roles"
      description="Invite and remove staff, assign admin/manager roles, and manage permissions. Role changes run through the service-role client for safety. Coming in a later phase."
    />
  );
}
