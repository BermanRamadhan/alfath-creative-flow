import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="login-page">
      <section className="login-panel stack">
        <div>
          <p className="page-kicker">Akses ditolak</p>
          <h1 className="page-title">Halaman ini bukan untuk role kamu.</h1>
          <p className="page-copy">Kembali ke dashboard untuk melanjutkan workflow yang tersedia.</p>
        </div>
        <Link className="btn primary" href="/dashboard">
          Kembali
        </Link>
      </section>
    </main>
  );
}
