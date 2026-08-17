"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Triggers a server-generated CSV download. The route handler streams the file
 * with a Content-Disposition attachment header, so a plain link is enough.
 */
export function ExportButton({ rangeDays }: { rangeDays: number }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/analytics/export?range=${rangeDays}`}>
        <Download className="h-4 w-4" /> Export CSV
      </a>
    </Button>
  );
}
