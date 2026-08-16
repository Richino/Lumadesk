import Link from "next/link";
import { UserRound } from "lucide-react";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return <main className="account-page"><header className="account-header"><Link className="brand" href="/">Luma<span>Desk</span></Link><details className="account-menu"><summary className="account-trigger" aria-label="Open account menu"><UserRound size={17} strokeWidth={1.8} /></summary><nav className="account-popover" aria-label="Account"><Link href="/orders">Orders</Link><Link href="/wishlist">Saved desks</Link><Link href="/addresses">Addresses</Link><Link href="/settings">Settings</Link><form action="/auth/signout" method="post"><button type="submit">Sign out</button></form></nav></details></header><section className="account-content">{children}</section></main>;
}

export function EmptyState({ title, copy }: { title: string; copy: string }) { return <section className="account-empty"><p className="eyebrow">LUMADESK</p><h2>{title}</h2><p>{copy}</p><Link className="account-return" href="/#shop">Configure a desk</Link></section>; }
