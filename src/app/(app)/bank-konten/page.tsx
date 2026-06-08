import Link from "next/link";
import { TestStatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ASSET_KIND_LABELS, PLATFORM_LABELS, TEST_STATUSES, TEST_STATUS_LABELS } from "@/lib/constants";
import { compactDate, externalHref, scoreLabel } from "@/lib/utils";

export default async function BankKontenPage({
  searchParams
}: {
  searchParams?: { product?: string; status?: string; type?: string; creator?: string; task?: string; view?: string; q?: string };
}) {
  const user = await requireUser();
  const view = searchParams?.view === "card" ? "card" : "table";
  const query = searchParams?.q?.trim();
  const where = {
    ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {}),
    ...(searchParams?.product ? { productKey: searchParams.product } : {}),
    ...(searchParams?.status ? { testStatus: searchParams.status } : {}),
    ...(searchParams?.type ? { assetKind: searchParams.type } : {}),
    ...(searchParams?.creator ? { creatorId: searchParams.creator } : {}),
    ...(searchParams?.task ? { requestId: searchParams.task } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { productName: { contains: query } },
            { angle: { contains: query } },
            { hook: { contains: query } }
          ]
        }
      : {})
  };

  const [items, creators] = await Promise.all([
    db.contentBank.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { creator: true, requester: true, product: true }
    }),
    db.user.findMany({ where: { role: "CC" }, orderBy: { displayName: "asc" } })
  ]);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Bank Konten</p>
          <h1 className="page-title">Library asset final</h1>
          <p className="page-copy">Setiap asset final berdiri sendiri sehingga status Winner/Loser/Biasa tidak tercampur dalam satu request.</p>
        </div>
        <div className="button-row">
          <Link className="btn" href="/bank-konten?view=table">
            Tabel
          </Link>
          <Link className="btn" href="/bank-konten?view=card">
            Kartu
          </Link>
        </div>
      </header>

      <form className="surface surface-pad form-grid" action="/bank-konten">
        <input type="hidden" name="view" value={view} />
        <div className="field">
          <label>Cari</label>
          <input className="input" name="q" defaultValue={query} placeholder="Produk, asset, angle..." />
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" name="status" defaultValue={searchParams?.status ?? ""}>
            <option value="">Semua</option>
            {TEST_STATUSES.map((status) => (
              <option value={status} key={status}>
                {TEST_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Tipe asset</label>
          <select className="select" name="type" defaultValue={searchParams?.type ?? ""}>
            <option value="">Semua</option>
            <option value="LP">LP</option>
            <option value="VIDEO">Video</option>
            <option value="IMAGE">Gambar</option>
          </select>
        </div>
        <div className="field">
          <label>Creator</label>
          <select className="select" name="creator" defaultValue={searchParams?.creator ?? ""}>
            <option value="">Semua</option>
            {creators.map((creator) => (
              <option value={creator.id} key={creator.id}>
                {creator.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <button className="btn primary" type="submit">
            Filter
          </button>
        </div>
      </form>

      {view === "card" ? (
        <section className="card-grid">
          {items.map((item) => (
            <article className="asset-card" key={item.id}>
              <div className="split-line">
                <span className="badge">{ASSET_KIND_LABELS[item.assetKind] ?? item.assetKind}</span>
                <span className="badge">{PLATFORM_LABELS[item.platform] ?? item.platform}</span>
                <TestStatusBadge status={item.testStatus} />
              </div>
              <h2 className="asset-title">{item.title}</h2>
              <p className="subtle">
                {item.productName} · Creator: {item.creator?.displayName ?? "-"} · Requester: {item.requester.displayName}
              </p>
              <p className="subtle">Score: {scoreLabel(item.scoreTotal)}</p>
              <div className="button-row">
                <a className="btn primary" href={externalHref(item.mainLink)} target="_blank" rel="noreferrer">
                  Buka Link
                </a>
                <Link className="btn" href={`/bank-konten/${item.id}`}>
                  Feedback
                </Link>
                {item.product ? (
                  <Link className="btn" href={`/products/${item.product.id}`}>
                    Produk
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Asset</th>
                <th>Tipe</th>
                <th>Platform</th>
                <th>Status Tes</th>
                <th>Skor</th>
                <th>Creator</th>
                <th>Feedback</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.productName}</strong>
                    <div className="subtle">{compactDate(item.createdAt)}</div>
                  </td>
                  <td>{item.title}</td>
                  <td>{ASSET_KIND_LABELS[item.assetKind] ?? item.assetKind}</td>
                  <td>{PLATFORM_LABELS[item.platform] ?? item.platform}</td>
                  <td>
                    <TestStatusBadge status={item.testStatus} />
                  </td>
                  <td>{scoreLabel(item.scoreTotal)}</td>
                  <td>{item.creator?.displayName ?? "-"}</td>
                  <td>{item.feedbackCount}</td>
                  <td>
                    <div className="button-row">
                      <a className="btn primary" href={externalHref(item.mainLink)} target="_blank" rel="noreferrer">
                        Open
                      </a>
                      <Link className="btn" href={`/bank-konten/${item.id}`}>
                        Detail
                      </Link>
                      <Link className="btn" href={`/tasks/${item.requestId}`}>
                        Task
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
