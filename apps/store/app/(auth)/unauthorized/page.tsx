import Link from "next/link";
export default function UnauthorizedPage() { return <section className="auth-card"><p className="eyebrow">ACCESS RESTRICTED</p><h1>This space is private.</h1><p className="auth-intro">Your account does not have permission to view this page.</p><Link className="auth-submit" href="/dashboard">Return to your account</Link></section>; }
