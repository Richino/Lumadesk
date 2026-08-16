import { AuthForm } from "@/components/auth/auth-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const initialNotice = error === "invalid_or_expired_link"
    ? "This password-reset link is invalid or has expired. Request a new one and open it once in this browser."
    : undefined;

  return <AuthForm mode="reset" initialNotice={initialNotice} />;
}
