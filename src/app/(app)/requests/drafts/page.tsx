import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { REQUEST_TYPE_LABELS } from "@/lib/constants";
import { compactDate, fullDate } from "@/lib/utils";

export default async function RequestDraftsPage() {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const drafts = await db.requestDraft.findMany({
    where: user.role === "ADMIN" ? {} : { requesterId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { requester: true }
  });

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Draft Request</p>
          <h1 className="page-title">Lanjutkan request tertunda</h1>
        </div>
        <Link className="btn primary" href="/requests/new">
          Request Baru
        </Link>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Update</th>
              <th>Jenis</th>
              <th>Produk</th>
              <th>Requester</th>
              <th>Deadline</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((draft) => (
              <tr key={draft.id}>
                <td>{compactDate(draft.updatedAt)}</td>
                <td>{REQUEST_TYPE_LABELS[draft.requestType] ?? draft.requestType}</td>
                <td>
                  <strong>{draft.productName || "Belum diisi"}</strong>
                  <div className="subtle">{draft.postPlatform || "-"}</div>
                </td>
                <td>{draft.requester.displayName}</td>
                <td>{draft.deadlineAt ? fullDate(draft.deadlineAt) : "Belum diisi"}</td>
                <td>
                  <div className="button-row">
                    <Link className="btn primary" href={`/requests/drafts/${draft.id}`}>
                      Lanjutkan
                    </Link>
                    <form action={`/api/request-drafts/${draft.id}/delete`} method="post">
                      <button className="btn danger" type="submit">
                        Hapus
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!drafts.length ? <span className="subtle">Belum ada draft request.</span> : null}
    </div>
  );
}
