import "../auth-loading.css";

export default function AuthLoading() {
  return <main className="auth-page" aria-busy="true"><section className="auth-card loading-card"><div className="loading-line" /><div className="loading-line loading-line-short" /><div className="loading-block" /></section></main>;
}
