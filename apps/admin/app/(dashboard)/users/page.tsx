import type { Metadata } from "next";
import { listUsers, type UserRoleFilter } from "@/lib/queries/users";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PageHeader } from "@/components/shared/page-header";
import { UsersTable } from "@/components/users/users-table";

export const metadata: Metadata = { title: "Users & Roles" };
export const dynamic = "force-dynamic";

const ROLES: UserRoleFilter[] = ["all", "admin", "customer"];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [admin, sp] = await Promise.all([requireAdmin(), searchParams]);

  const q = one(sp.q) ?? "";
  const roleParam = one(sp.role);
  const role: UserRoleFilter = ROLES.includes(roleParam as UserRoleFilter) ? (roleParam as UserRoleFilter) : "all";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listUsers({ q, role, page, pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description={`Manage staff access. ${result.adminCount} admin${result.adminCount === 1 ? "" : "s"}.`}
      />
      <UsersTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
        role={role}
        currentUserId={admin.id}
      />
    </div>
  );
}
