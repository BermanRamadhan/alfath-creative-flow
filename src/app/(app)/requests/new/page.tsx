import Link from "next/link";
import { FileText, Clapperboard } from "lucide-react";
import { requireRole } from "@/lib/auth";

export default async function NewRequestPage() {
  await requireRole(["ADMIN", "ADVERTISER"]);
  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Request Baru</p>
          <h1 className="page-title">Pilih jenis pekerjaan</h1>
          <p className="page-copy">Request langsung muncul sebagai task yang bisa diklaim CC. Semua output tetap berupa link.</p>
        </div>
        <Link className="btn" href="/requests/drafts">
          Draft Request
        </Link>
      </header>
      <section className="card-grid">
        <Link className="asset-card" href="/requests/new/lp">
          <div className="split-line">
            <span className="badge green">
              <FileText size={14} /> LP
            </span>
          </div>
          <h2 className="asset-title">Request Landing Page</h2>
          <p className="subtle">Untuk 1 output landing page atau link final LP.</p>
        </Link>
        <Link className="asset-card" href="/requests/new/content">
          <div className="split-line">
            <span className="badge green">
              <Clapperboard size={14} /> Konten
            </span>
          </div>
          <h2 className="asset-title">Request Konten</h2>
          <p className="subtle">Untuk video dan gambar, hasil bisa lebih banyak dari jumlah request.</p>
        </Link>
      </section>
    </div>
  );
}
