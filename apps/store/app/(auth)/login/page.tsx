import { AuthForm } from "@/components/auth/auth-form";

const messages: Record<string, string> = {
  email_updated:
    "Your email address was updated and all sessions were signed out. Sign in again with your new email.",
  password_updated:
    "Your password was updated and all sessions were signed out. Sign in again with your new password.",
  callback_error:
    "That sign-in link was invalid or has expired. Request a new one and open it in this browser.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  return <LoginContent searchParams={searchParams} />;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>;
}) {
  const { next, message } = await searchParams;
  return (
    <AuthForm
      mode="login"
      next={next?.startsWith("/") ? next : "/"}
      initialNotice={message ? messages[message] : undefined}
    />
  );
}
