import Link from "next/link";

export function ContentPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="content-page"><Link className="brand" href="/">Luma<span>Desk</span></Link><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="content-copy">{children}</div></main>;
}
