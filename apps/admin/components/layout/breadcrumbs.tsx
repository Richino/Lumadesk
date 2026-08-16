"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ALL_NAV_ITEMS } from "@/lib/nav";

function titleFor(segment: string): string {
  const match = ALL_NAV_ITEMS.find((i) => i.href === `/${segment}`);
  if (match) return match.title;
  // UUID-ish → shorten; otherwise title-case the slug.
  if (/^[0-9a-f]{8}-/i.test(segment)) return `${segment.slice(0, 8)}…`;
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
            {isLast ? (
              <span className="font-medium text-foreground">{titleFor(segment)}</span>
            ) : (
              <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                {titleFor(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
