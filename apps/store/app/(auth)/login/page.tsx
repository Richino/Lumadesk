import { AuthForm } from "@/components/auth/auth-form";
export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { return <LoginContent searchParams={searchParams} />; }
async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const { next } = await searchParams; return <AuthForm mode="login" next={next?.startsWith("/") ? next : "/"} />; }
