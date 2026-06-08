import Link from "next/link";
import { ExternalLink, Filter, Save } from "lucide-react";
import { Badge } from "@/components/badge";
import { MetricStrip } from "@/components/metric-strip";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  MATERIAL_SOURCES,
  MATERIAL_SOURCE_LABELS,
  MATERIAL_TYPES,
  MATERIAL_TYPE_LABELS,
  PLATFORM_LABELS,
  PLATFORMS
} from "@/lib/constants";
import { compactDate, externalHref } from "@/lib/utils";

function materialTone(type: string) {
  if (type === "MENTAHAN") return "blue";
  if (type === "REFERENSI") return "green";
  if (type === "JSON_TEMPLATE") return "amber";
  return "";
}

export default async function MaterialsPage({
  searchParams
}: {
  searchParams?: { q?: string; type?: string; source?: string; product?: string };
}) {
  const user = await requireUser();
  const q = searchParams?.q?.trim();
  const where = {
    ...(searchParams?.type ? { materialType: searchParams.type } : {}),
    ...(searchParams?.source ? { sourceType: searchParams.source } : {}),
    ...(searchParams?.product ? { productKey: searchParams.product } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { productName: { contains: q } },
            { url: { contains: q } },
            { note: { contains: q } }
          ]
        }
      : {})
  };

  const [materials, products] = await Promise.all([
    db.materialReference.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        request: true,
        submission: true,
        requester: true,
        creator: true
      }
    }),
    db.product.findMany({ orderBy: { name: "asc" } })
  ]);

  const typeCounts = MATERIAL_TYPES.map((type) => ({
    label: MATERIAL_TYPE_LABELS[type],
    value: materials.filter((item) => item.materialType === type).length
  }));

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Mentahan</p>
          <h1 className="page-title">Bahan kerja</h1>
        </div>
      </header>

      <MetricStrip
        items={[
          { label: "Total bahan", value: materials.length },
          ...typeCounts,
          { label: "Manual", value: materials.filter((item) => item.sourceType === "MANUAL").length }
        ]}
      />

      <section className="two-col">
        <div className="stack">
          <form className="surface surface-pad form-grid" action="/materials">
            <div className="field">
              <label>Cari</label>
              <input className="input" name="q" defaultValue={q} placeholder="Produk, link, catatan..." />
            </div>
            <div className="field">
              <label>Tipe bahan</label>
              <select className="select" name="type" defaultValue={searchParams?.type ?? ""}>
                <option value="">Semua</option>
                {MATERIAL_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {MATERIAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Sumber</label>
              <select className="select" name="source" defaultValue={searchParams?.source ?? ""}>
                <option value="">Semua</option>
                {MATERIAL_SOURCES.map((source) => (
                  <option value={source} key={source}>
                    {MATERIAL_SOURCE_LABELS[source]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Produk</label>
              <select className="select" name="product" defaultValue={searchParams?.product ?? ""}>
                <option value="">Semua</option>
                {products.map((product) => (
                  <option value={product.normalizedName.replace(/[^a-z0-9]+/g, "-")} key={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <button className="btn primary" type="submit">
                <Filter size={13} />
                Filter
              </button>
            </div>
          </form>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Bahan</th>
                  <th>Produk</th>
                  <th>Tipe</th>
                  <th>Sumber</th>
                  <th>Owner</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item) => (
                  <tr key={item.id}>
                    <td>{compactDate(item.createdAt)}</td>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="subtle compact-note">{item.note ?? item.url}</div>
                    </td>
                    <td>{item.productName}</td>
                    <td>
                      <Badge label={MATERIAL_TYPE_LABELS[item.materialType] ?? item.materialType} tone={materialTone(item.materialType)} />
                    </td>
                    <td>{MATERIAL_SOURCE_LABELS[item.sourceType] ?? item.sourceType}</td>
                    <td>{item.creator?.displayName ?? item.requester?.displayName ?? user.displayName}</td>
                    <td className="table-actions">
                      <div className="button-row">
                        <a className="btn primary" href={externalHref(item.url)} target="_blank" rel="noreferrer">
                          <ExternalLink size={13} />
                          Buka
                        </a>
                        {item.requestId ? (
                          <Link className="btn" href={`/tasks/${item.requestId}`}>
                            Task
                          </Link>
                        ) : null}
                        {item.product ? (
                          <Link className="btn" href={`/products/${item.product.id}`}>
                            Produk
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="stack">
          <form className="surface surface-pad stack" action="/api/materials/create" method="post">
            <h2 className="asset-title">Tambah manual</h2>
            <div className="field">
              <label>Nama produk</label>
              <input className="input" name="productName" required placeholder="Salep Varises" />
            </div>
            <div className="field">
              <label>Tipe bahan</label>
              <select className="select" name="materialType" defaultValue="REFERENSI">
                {MATERIAL_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {MATERIAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Platform</label>
              <select className="select" name="platform" defaultValue="META">
                {PLATFORMS.map((platform) => (
                  <option value={platform} key={platform}>
                    {PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Judul</label>
              <input className="input" name="title" required placeholder="Referensi hook TikTok" />
            </div>
            <div className="field">
              <label>Link</label>
              <input className="input" name="url" required placeholder="drive.google.com/..." />
            </div>
            <div className="field">
              <label>Catatan</label>
              <textarea className="textarea" name="note" />
            </div>
            <button className="btn primary" type="submit">
              <Save size={13} />
              Simpan
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
