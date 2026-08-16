import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function safeNext(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));
  const supabase = await createClient();
  let error: { message: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = { message: "Missing recovery credentials." };
  }

  if (!error) return NextResponse.redirect(new URL(next, url.origin));

  // Keep the provider error in server logs for diagnosis, but never expose
  // recovery-token details to the browser.
  console.error("Supabase auth callback failed", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type,
    message: error.message,
  });

  if (next.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL("/reset-password?error=invalid_or_expired_link", url.origin));
  }

  return NextResponse.redirect(new URL("/login?message=callback_error", url.origin));
}
