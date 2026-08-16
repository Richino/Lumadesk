import { requireAdmin } from "@/lib/auth/require-admin";

// Printable documents render outside the dark app shell on a white page.
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl px-8 py-10 print:px-0 print:py-0">{children}</div>
    </div>
  );
}
