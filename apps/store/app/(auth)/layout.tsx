import "../auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-page"><a className="brand auth-brand" href="/">Luma<span>Desk</span></a>{children}</main>;
}
