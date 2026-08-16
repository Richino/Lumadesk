import Link from "next/link";
import type { Profile } from "@/lib/auth/require-user";

const navigation = [["Overview", "/dashboard"], ["Orders", "/orders"], ["Wishlist", "/wishlist"], ["Addresses", "/addresses"], ["Settings", "/settings"]] as const;

export function AccountShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const name = `${profile.first_name} ${profile.last_name}`.trim() || "LumaDesk member";
  return <main className="account-page"><header className="account-header"><Link className="brand" href="/">Luma<span>Desk</span></Link><form action="/auth/signout" method="post"><button>Sign out</button></form></header><div className="account-layout"><aside className="account-nav"><p className="eyebrow">YOUR ACCOUNT</p><h1>{name}</h1><nav>{navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav></aside><section className="account-content">{children}</section></div></main>;
}

export function EmptyState({ title, copy }: { title: string; copy: string }) { return <section className="account-empty"><p className="eyebrow">LUMADESK</p><h2>{title}</h2><p>{copy}</p></section>; }
