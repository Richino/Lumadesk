import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Access denied" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/25 bg-rose-500/10 text-rose-400">
          <ShieldX className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in but doesn&apos;t have admin privileges. If you believe this is
            a mistake, contact a store owner to have your role updated.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <SignOutButton variant="outline">Switch account</SignOutButton>
          <Button asChild variant="ghost">
            <a href="https://lumadesk.com" target="_blank" rel="noreferrer">
              Go to storefront
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
