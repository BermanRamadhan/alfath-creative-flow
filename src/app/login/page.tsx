import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="login-page">
      <section className="login-panel stack">
        <div>
          <div className="brand-lockup" style={{ padding: 0, borderBottom: 0 }}>
            <span className="brand-mark">AF</span>
            <span>
              <span className="brand-title">Al-Fath Flow</span>
              <span className="brand-subtitle">Internal CreativeOps</span>
            </span>
          </div>
          <p className="page-copy">Masuk dengan username internal untuk mengatur request, review, Bank Konten, dan feedback performa.</p>
        </div>
        {searchParams?.error ? <span className="badge red">{searchParams.error}</span> : null}
        <form className="stack" action="/api/auth/login" method="post">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input className="input" id="username" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn primary" type="submit">
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
