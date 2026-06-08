import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricStrip } from "@/components/metric-strip";
import { StatusBadge, TestStatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { compactDate, productSlug, scoreLabel } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      requests: { orderBy: { createdAt: "desc" }, include: { requester: true, creator: true } },
      bankItems: { orderBy: { createdAt: "desc" }, include: { creator: true } }
    }
  });
  if (!product) notFound();

  const winner = product.bankItems.filter((item) => item.testStatus === "WINNER").length;
  const loser = product.bankItems.filter((item) => item.testStatus === "LOSER").length;
  const biasa = product.bankItems.filter((item) => item.testStatus === "BIASA").length;
  const archived = product.bankItems.filter((item) => item.testStatus === "ARCHIVED").length;
  const slug = productSlug(product.name);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Produk Detail</p>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-copy">{product.notes ?? "Belum ada catatan produk."}</p>
        </div>
        <div className="button-row">
          <Link className="btn" href={`/bank-konten?product=${slug}`}>
            Bank Konten
          </Link>
          <Link className="btn" href={`/reports/products/${product.id}`}>
            Report
          </Link>
          <Link className="btn" href={`/tasks?product=${slug}`}>
            Task History
          </Link>
        </div>
      </header>

      <MetricStrip
        items={[
          { label: "Requests", value: product.requests.length },
          { label: "Bank items", value: product.bankItems.length },
          { label: "Winner", value: winner },
          { label: "Loser", value: loser },
          { label: "Biasa", value: biasa },
          { label: "Archived", value: archived }
        ]}
      />

      <section className="two-col">
        <div className="stack">
          <div className="surface surface-pad stack">
            <h2 className="asset-title">Bank Konten terkait</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Creator</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {product.bankItems.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>
                        <TestStatusBadge status={item.testStatus} />
                      </td>
                      <td>{scoreLabel(item.scoreTotal)}</td>
                      <td>{item.creator?.displayName ?? "-"}</td>
                      <td>
                        <Link className="btn" href={`/bank-konten/${item.id}`}>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="surface surface-pad stack">
            <h2 className="asset-title">Task history</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Creator</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {product.requests.map((request) => (
                    <tr key={request.id}>
                      <td>{compactDate(request.createdAt)}</td>
                      <td>{request.title}</td>
                      <td>
                        <StatusBadge status={request.status} deadlineAt={request.deadlineAt} />
                      </td>
                      <td>{request.creator?.displayName ?? "-"}</td>
                      <td>
                        <Link className="btn" href={`/tasks/${request.id}`}>
                          Task
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {user.role === "ADMIN" ? (
          <form className="surface surface-pad stack" action={`/api/products/${product.id}/update`} method="post">
            <h2 className="asset-title">Edit metadata</h2>
            <input className="input" name="category" defaultValue={product.category ?? ""} placeholder="Category" />
            <input className="input" name="niche" defaultValue={product.niche ?? ""} placeholder="Niche" />
            <input className="input" name="mainLpUrl" defaultValue={product.mainLpUrl ?? ""} placeholder="Main LP URL" />
            <input className="input" name="driveReferenceUrl" defaultValue={product.driveReferenceUrl ?? ""} placeholder="Drive reference URL" />
            <textarea className="textarea" name="description" defaultValue={product.description ?? ""} placeholder="Description" />
            <textarea className="textarea" name="notes" defaultValue={product.notes ?? ""} placeholder="Notes" />
            <input className="input" name="tags" defaultValue={product.tags ?? ""} placeholder="Tags" />
            <button className="btn primary" type="submit">
              Simpan
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
