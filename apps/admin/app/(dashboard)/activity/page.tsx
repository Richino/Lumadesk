import type { Metadata } from "next";
import { listActivity } from "@/lib/queries/activity";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityTable } from "@/components/activity/activity-table";

export const metadata: Metadata = { title: "Activity Log" };
export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const entityType = one(sp.entity) ?? "all";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const result = await listActivity({ q, entityType, page, pageSize: 30 });

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="A complete audit trail of every important action." />
      <ActivityTable
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        q={q}
        entityType={entityType}
        entityTypes={result.entityTypes}
      />
    </div>
  );
}
