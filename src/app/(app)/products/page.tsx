import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ProductsPage() {
  await requireUser();
  const products = await db.product.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { requests: true, bankItems: true }
      }
    }
  });

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Produk</p>
          <h1 className="page-title">Knowledge base produk</h1>
          <p className="page-copy">Produk otomatis tergroup dari nama request. Admin bisa menambahkan metadata.</p>
        </div>
      </header>
      <div className="table-wrap desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Category</th>
              <th>Niche</th>
              <th>Request</th>
              <th>Bank</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <div className="subtle">{product.normalizedName}</div>
                </td>
                <td>{product.category ?? "-"}</td>
                <td>{product.niche ?? "-"}</td>
                <td>{product._count.requests}</td>
                <td>{product._count.bankItems}</td>
                <td>
                  <div className="button-row">
                    <Link className="btn" href={`/products/${product.id}`}>
                      Detail
                    </Link>
                    <Link className="btn" href={`/bank-konten?product=${product.normalizedName.replace(/[^a-z0-9]+/g, "-")}`}>
                      Bank
                    </Link>
                    <Link className="btn" href={`/reports/products/${product.id}`}>
                      Report
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mobile-card-list" aria-label="Daftar produk mobile">
        {products.map((product) => {
          const productKey = product.normalizedName.replace(/[^a-z0-9]+/g, "-");
          return (
            <article className="mobile-card" key={product.id}>
              <div className="mobile-card-head">
                <div className="mobile-card-title">
                  <strong>{product.name}</strong>
                  <span className="subtle">{product.normalizedName}</span>
                </div>
                <span className="badge">{product._count.bankItems} asset</span>
              </div>
              <div className="mobile-card-meta">
                <div>
                  Category
                  <strong>{product.category ?? "-"}</strong>
                </div>
                <div>
                  Niche
                  <strong>{product.niche ?? "-"}</strong>
                </div>
                <div>
                  Request
                  <strong>{product._count.requests}</strong>
                </div>
              </div>
              <div className="mobile-card-actions">
                <Link className="btn primary" href={`/products/${product.id}`}>
                  Detail
                </Link>
                <Link className="btn" href={`/bank-konten?product=${productKey}`}>
                  Bank
                </Link>
                <Link className="btn" href={`/reports/products/${product.id}`}>
                  Report
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
