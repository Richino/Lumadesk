"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SignOutButton({ children, showIcon, ...props }: ButtonProps & { showIcon?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button onClick={signOut} disabled={loading} {...props}>
      {showIcon && <LogOut className="h-4 w-4" />}
      {children ?? "Sign out"}
    </Button>
  );
}
