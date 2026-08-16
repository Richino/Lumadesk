"use client";

import { Printer } from "lucide-react";

/** Light-themed print trigger; hidden from the printed output itself. */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
