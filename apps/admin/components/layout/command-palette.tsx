"use client";

import { useRouter } from "next/navigation";
import { PlusCircle, ArrowRight, Search } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/nav";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

type QuickAction = { label: string; href: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Create product", href: "/products/new" },
  { label: "View pending orders", href: "/orders?status=pending" },
  { label: "Low stock report", href: "/inventory?filter=low" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          {QUICK_ACTIONS.map((action) => (
            <CommandItem key={action.href} value={action.label} onSelect={() => go(action.href)}>
              <PlusCircle />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {NAV_SECTIONS.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`${section.label} ${item.title}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon />
                  {item.title}
                  {item.soon && <CommandShortcut>Soon</CommandShortcut>}
                  {!item.soon && (
                    <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 group-data-[selected=true]:opacity-100" />
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Tip">
          <CommandItem disabled value="tip">
            <Search />
            Press ⌘K anytime to open this palette
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
