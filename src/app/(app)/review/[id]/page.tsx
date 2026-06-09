import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/badge";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { externalHref, fullDate, noteTypeLabel, reviewDecisionLabel, submissionTypeLabel } from "@/lib/utils";
import { ASSET_KIND_LABELS } from "@/lib/constants";

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const task = await db.workRequest.findUnique({
    where: { id: params.id },
    include: {
      requester: true,
      creator: true,
      submissions: { orderBy: { version: "desc" }, include: { creator: true, assets: { orderBy: { sortOrder: "asc" } } } },
      reviewLogs: { orderBy: { createdAt: "desc" }, include: { reviewer: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { user: true } }
    }
  });
  if (!task) notFound();
  if (user.role === "ADVERTISER" && task.requesterId !== user.id) redirect("/forbidden");

  const latest = task.submissions[0];

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Review Detail</p>
          <h1 className="page-title">{task.title}</h1>
          <p className="page-copy">
            {task.productName} · Creator {task.creator?.displayName ?? "-"} · Deadline {fullDate(task.deadlineAt)}
          </p>
        </div>
        <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
      </header>

      <section className="two-col">
        <div className="stack">
          <div className="surface surface-pad stack">
            <h2 className="asset-title">Submission terbaru</h2>
            {latest ? (
              <>
                <div className="split-line">
                  <span className="badge">{submissionTypeLabel(latest.submissionType)}</span>
                  <span className="badge">v{latest.version}</span>
                  <span className="badge green">
                    {latest.submittedVideoAmount} video · {latest.submittedImageAmount} gambar
                  </span>
                </div>
                <div className="card-grid">
                  {latest.assets.map((asset) => (
                    <div className="asset-card" key={asset.id}>
                      <span className="badge">{ASSET_KIND_LABELS[asset.assetKind] ?? asset.assetKind}</span>
                      <h3 className="asset-title">{asset.title}</h3>
                      <a className="btn primary" href={externalHref(asset.link)} target="_blank" rel="noreferrer">
                        Buka Link
                      </a>
                    </div>
                  ))}
                </div>
                {latest.note ? <p className="subtle">{latest.note}</p> : null}
              </>
            ) : (
              <p className="subtle">Belum ada submission.</p>
            )}
          </div>

          {task.status === "SUDAH" ? (
            <div className="surface surface-pad stack mobile-action-panel">
              <h2 className="asset-title">Keputusan review</h2>
              <div className="button-row">
                <form action={`/api/review/${task.id}/acc`} method="post">
                  <button className="btn primary" type="submit">
                    ACC / Beres
                  </button>
                </form>
              </div>
              <form className="stack" action={`/api/review/${task.id}/revision`} method="post">
                <textarea className="textarea" name="revisionNote" required placeholder="Catatan revisi wajib diisi" />
                <button className="btn warning" type="submit">
                  Minta Revisi
                </button>
              </form>
            </div>
          ) : null}

          {task.status === "REVISI_DIKEMBALIKAN" ? (
            <form className="surface surface-pad stack mobile-action-panel" action={`/api/review/${task.id}/clarify`} method="post">
              <h2 className="asset-title">Klarifikasi revisi</h2>
              <textarea className="textarea" name="clarificationNote" required placeholder="Perjelas revisi agar status kembali menjadi REVISI" />
              <button className="btn primary" type="submit">
                Kirim Klarifikasi
              </button>
            </form>
          ) : null}
        </div>

        <aside className="stack">
          <Link className="btn" href={`/tasks/${task.id}`}>
            Lihat Task
          </Link>
          <div className="surface surface-pad stack">
            <h2 className="asset-title">Review history</h2>
            {task.reviewLogs.map((log) => (
              <div className="subtle" key={log.id}>
                <strong>{reviewDecisionLabel(log.decision)}</strong> - {log.reviewer.displayName} - {log.reviewNote ?? "-"}
              </div>
            ))}
            {task.notes.map((note) => (
              <div className="subtle" key={note.id}>
                <strong>{noteTypeLabel(note.noteType)}</strong> - {note.user.displayName} - {note.note}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
