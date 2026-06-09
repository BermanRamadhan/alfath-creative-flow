import Link from "next/link";
import { StatusBadge } from "@/components/badge";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { compactDate, externalHref } from "@/lib/utils";
import { ASSET_KIND_LABELS } from "@/lib/constants";

export default async function ReviewPage() {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const tasks = await db.workRequest.findMany({
    where: {
      ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {}),
      status: { in: ["SUDAH", "REVISI_DIKEMBALIKAN"] }
    },
    orderBy: { updatedAt: "desc" },
    include: {
      creator: true,
      requester: true,
      submissions: { orderBy: { version: "desc" }, take: 1, include: { assets: true } },
      reviewLogs: { orderBy: { createdAt: "desc" }, take: 2 }
    }
  });

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Review</p>
          <h1 className="page-title">Menunggu keputusan advertiser</h1>
          <p className="page-copy">ACC akan membuat item Bank Konten per asset final. Revisi harus punya catatan.</p>
        </div>
      </header>
      <div className="table-wrap desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Update</th>
              <th>Produk</th>
              <th>Status</th>
              <th>Creator</th>
              <th>Submission</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{compactDate(task.updatedAt)}</td>
                <td>
                  <strong>{task.productName}</strong>
                  <div className="subtle">{task.title}</div>
                </td>
                <td>
                  <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
                </td>
                <td>{task.creator?.displayName ?? "-"}</td>
                <td>
                  {task.submissions[0] ? (
                    <div className="button-row">
                      {task.submissions[0].assets.slice(0, 3).map((asset) => (
                        <a className="btn" href={externalHref(asset.link)} target="_blank" rel="noreferrer" key={asset.id}>
                          {ASSET_KIND_LABELS[asset.assetKind] ?? asset.assetKind}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="subtle">Belum ada submission</span>
                  )}
                  {task.reviewLogs[0] ? <div className="subtle">Last: {task.reviewLogs[0].reviewNote}</div> : null}
                </td>
                <td>
                  <Link className="btn" href={`/review/${task.id}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mobile-card-list" aria-label="Daftar review mobile">
        {tasks.map((task) => (
          <article className="mobile-card" key={task.id}>
            <div className="mobile-card-head">
              <div className="mobile-card-title">
                <strong>{task.productName}</strong>
                <span className="subtle truncate">{task.title}</span>
              </div>
              <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
            </div>
            <div className="mobile-card-meta">
              <div>
                Update
                <strong>{compactDate(task.updatedAt)}</strong>
              </div>
              <div>
                Creator
                <strong>{task.creator?.displayName ?? "-"}</strong>
              </div>
            </div>
            {task.submissions[0] ? (
              <div className="mobile-card-actions">
                {task.submissions[0].assets.slice(0, 3).map((asset) => (
                  <a className="btn" href={externalHref(asset.link)} target="_blank" rel="noreferrer" key={asset.id}>
                    {ASSET_KIND_LABELS[asset.assetKind] ?? asset.assetKind}
                  </a>
                ))}
              </div>
            ) : (
              <span className="subtle">Belum ada submission</span>
            )}
            {task.reviewLogs[0] ? <span className="subtle truncate">Last: {task.reviewLogs[0].reviewNote}</span> : null}
            <div className="mobile-card-actions">
              <Link className="btn primary" href={`/review/${task.id}`}>
                Review
              </Link>
              <Link className="btn" href={`/tasks/${task.id}`}>
                Task
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
