import { Construction } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} actions={<Badge variant="muted">Planned</Badge>} />
      <EmptyState
        icon={Construction}
        title={`${title} is on the roadmap`}
        description={description}
        className="py-20"
      />
    </div>
  );
}
