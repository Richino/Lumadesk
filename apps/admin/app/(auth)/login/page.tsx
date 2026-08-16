import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand rail */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-[hsl(240_6%_5%)] p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(600px circle at 20% 10%, hsl(244 75% 63%), transparent 45%), radial-gradient(500px circle at 80% 80%, hsl(190 70% 55%), transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            L
          </div>
          <span className="text-sm font-semibold tracking-tight">LumaDesk Admin</span>
        </div>
        <div className="relative space-y-4">
          <p className="max-w-md text-2xl font-medium leading-snug tracking-tight text-foreground">
            The operations console for a made-to-order desk business.
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Orders, inventory, customers, and revenue — one fast, focused surface. Staff access
            only.
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} LumaDesk. Internal use only.
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                L
              </div>
              <span className="text-sm font-semibold tracking-tight">LumaDesk Admin</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Use your staff credentials to continue.</p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
