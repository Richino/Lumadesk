import Link from "next/link";
export default function VerifyEmailPage() { return <section className="auth-card"><p className="eyebrow">ONE LAST DETAIL</p><h1>Verify your email.</h1><p className="auth-intro">Your email has been confirmed. Sign in to begin shaping your LumaDesk account.</p><Link className="auth-submit" href="/login">Continue to sign in</Link></section>; }
