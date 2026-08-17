"use client";

import Link from "next/link";
import { Menu, Search, Bell } from "lucide-react";
import type { AdminProfile } from "@/lib/auth/require-admin";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({
  profile,
  notificationCount,
  onMenuClick,
  onSearchClick,
}: {
  profile: AdminProfile;
  notificationCount: number;
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Global search / command palette trigger */}
        <button
          onClick={onSearchClick}
          className="group flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-64 sm:justify-start sm:gap-2 sm:px-3"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Search…</span>
          <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </button>

        <NotificationsBell count={notificationCount} />

        <div className="hidden sm:block">
          <UserMenu profile={profile} compact />
        </div>
      </div>
    </header>
  );
}

function NotificationsBell({ count }: { count: number }) {
  return (
    <Button asChild variant="ghost" size="icon-sm" className="relative" aria-label={`Notifications${count > 0 ? ` (${count})` : ""}`}>
      <Link href="/notifications">
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
