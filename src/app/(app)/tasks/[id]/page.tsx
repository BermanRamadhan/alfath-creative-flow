import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deserializeLinks,
  externalHref,
  fullDate,
  formatDuration,
  noteTypeLabel,
  reviewDecisionLabel,
  submissionTypeLabel,
  workLogLabel
} from "@/lib/utils";
import { ASSET_KIND_LABELS, PLATFORM_LABELS, STYLE_LABELS, USE_FRAME_LABELS } from "@/lib/constants";

function canViewTask(user: { id: string; role: string }, task: { requesterId: string; creatorId: string | null }) {
  if (user.role === "ADMIN") return true;
  if (user.role === "ADVERTISER") return task.requesterId === user.id;
  if (user.role === "CC") return !task.creatorId || task.creatorId === user.id;
  return false;
}

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const task = await db.workRequest.findUnique({
    where: { id: params.id },
    include: {
      requester: true,
      creator: true,
      product: true,
      timeLogs: { orderBy: { startedAt: "desc" }, include: { creator: true } },
      submissions: { orderBy: { version: "desc" }, include: { creator: true, assets: { orderBy: { sortOrder: "asc" } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { user: true } },
      reviewLogs: { orderBy: { createdAt: "desc" }, include: { reviewer: true } },
      bankItems: true
    }
  });
  if (!task) notFound();
  if (!canViewTask(user, task)) redirect("/forbidden");

  const canWork = ["ADMIN", "CC"].includes(user.role);
  const canEditPending = ["ADMIN", "ADVERTISER"].includes(user.role) && task.status === "BELUM" && (user.role === "ADMIN" || task.requesterId === user.id);
  const activeLog = task.timeLogs.find((log) => !log.endedAt);
  const finishedLogs = task.timeLogs.filter((log) => log.endedAt);
  const latestFinishedLog = finishedLogs[0];
  const finishedSeconds = finishedLogs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0);
  const activeSeconds = activeLog ? Math.max(0, Math.floor((Date.now() - activeLog.startedAt.getTime()) / 1000)) : 0;
  const totalWorkSeconds = finishedSeconds + activeSeconds;
  const focusLog = activeLog ?? latestFinishedLog;
  const references = task.requestType === "LP" ? deserializeLinks(task.referenceLinks) : deserializeLinks(task.rawOrReferenceLinks);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Task Detail</p>
          <h1 className="page-title">{task.title}</h1>
          <p className="page-copy">
            {task.productName} · {PLATFORM_LABELS[task.postPlatform] ?? task.postPlatform} · Deadline {fullDate(task.deadlineAt)}
          </p>
        </div>
        <div className="button-row">
          <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
          {canEditPending ? (
            <Link className="btn" href={`/requests/${task.id}/edit`}>
              Edit Request
            </Link>
          ) : null}
          {task.product ? (
            <Link className="btn" href={`/products/${task.product.id}`}>
              Produk
            </Link>
          ) : null}
          {task.bankItems[0] ? (
            <Link className="btn" href={`/bank-konten?product=${task.productKey}`}>
              Bank Konten
            </Link>
          ) : null}
        </div>
      </header>

      <section className="two-col">
        <div className="stack">
          <div className="surface surface-pad stack">
            <h2 className="asset-title">Brief</h2>
            <div className="form-grid">
              <div>
                <div className="metric-label">Requester</div>
                <strong>{task.requester.displayName}</strong>
              </div>
              <div>
                <div className="metric-label">Creator</div>
                <strong>{task.creator?.displayName ?? "Belum diklaim"}</strong>
              </div>
              <div>
                <div className="metric-label">Output</div>
                <strong>{task.requestType === "LP" ? "1 LP" : `${task.videoAmount} video · ${task.imageAmount} gambar`}</strong>
              </div>
              <div>
                <div className="metric-label">Style / Frame</div>
                <strong>{task.requestType === "LP" ? (task.style ? STYLE_LABELS[task.style] : "-") : task.useFrame ? USE_FRAME_LABELS[task.useFrame] : "-"}</strong>
              </div>
            </div>
            {task.angle ? <p className="subtle">Angle: {task.angle}</p> : null}
            {task.hook ? <p className="subtle">Hook: {task.hook}</p> : null}
            {task.domainLpUrl ? (
              <a className="btn" href={externalHref(task.domainLpUrl)} target="_blank" rel="noreferrer">
                Open Domain LP
              </a>
            ) : null}
            {task.additionalNotes ? <p>{task.additionalNotes}</p> : null}
            {references.length ? (
              <div className="button-row">
                {references.map((link, index) => (
                  <a className="btn" href={externalHref(link)} target="_blank" rel="noreferrer" key={link}>
                    Reference {index + 1}
                  </a>
                ))}
              </div>
            ) : (
              <span className="subtle">Tidak ada reference link.</span>
            )}
          </div>

          {canWork && ["BELUM", "REVISI"].includes(task.status) ? (
            <form className="surface surface-pad stack mobile-action-panel" action={`/api/tasks/${task.id}/start`} method="post">
              <h2 className="asset-title">{task.status === "REVISI" ? "Mulai revisi" : "Mulai kerja"}</h2>
              <p className="subtle">Klik start untuk claim task dan mulai timer.</p>
              <button className="btn primary" type="submit">
                {task.status === "REVISI" ? "Start Revision" : "Start"}
              </button>
            </form>
          ) : null}

          {canWork && task.status === "DIKERJAKAN" ? (
            <form className="surface surface-pad form-grid mobile-action-panel" action={`/api/tasks/${task.id}/submit`} method="post">
              <div className="field full">
                <h2 className="asset-title">Submit hasil</h2>
                <p className="subtle">Isi link per asset. Setiap baris akan masuk sebagai asset terpisah saat ACC.</p>
              </div>
              {task.requestType === "LP" ? (
                <div className="field full">
                  <label>Link LP final</label>
                  <input className="input" name="lpLink" required placeholder="https://..." />
                </div>
              ) : (
                <>
                  <div className="field">
                    <label>Video links</label>
                    <textarea className="textarea" name="videoLinks" placeholder="Satu link video per baris" />
                  </div>
                  <div className="field">
                    <label>Gambar links</label>
                    <textarea className="textarea" name="imageLinks" placeholder="Satu link gambar per baris" />
                  </div>
                </>
              )}
              <div className="field full">
                <label>Additional/bundle links</label>
                <textarea className="textarea" name="additionalLinks" placeholder="Folder Drive, link mentahan, atau tambahan lain" />
              </div>
              <div className="field full">
                <label>Note / kendala</label>
                <textarea className="textarea" name="note" />
              </div>
              <div className="field full">
                <button className="btn primary" type="submit">
                  Submit Result
                </button>
              </div>
            </form>
          ) : null}

          {canWork && task.status === "REVISI" ? (
            <form className="surface surface-pad stack mobile-action-panel" action={`/api/tasks/${task.id}/return-revision`} method="post">
              <h2 className="asset-title">Return revision</h2>
              <textarea className="textarea" name="returnNote" required placeholder="Jelaskan bagian revisi yang belum jelas" />
              <button className="btn warning" type="submit">
                Return Revision
              </button>
            </form>
          ) : null}
        </div>

        <aside className="stack">
          <div className="surface surface-pad stack">
            <h2 className="asset-title">Durasi kerja</h2>
            <div className="duration-grid">
              <div className="duration-cell">
                <div className="metric-label">Total</div>
                <strong className="duration-value large">{formatDuration(totalWorkSeconds)}</strong>
              </div>
              <div className="duration-cell">
                <div className="metric-label">Sesi</div>
                <strong className="duration-value">{focusLog ? workLogLabel(focusLog.logType) : "Belum mulai"}</strong>
              </div>
              <div className="duration-cell">
                <div className="metric-label">Mulai</div>
                <strong className="duration-value">{focusLog ? fullDate(focusLog.startedAt) : "-"}</strong>
              </div>
              <div className="duration-cell">
                <div className="metric-label">Submit</div>
                <strong className="duration-value">
                  {activeLog ? "Belum submit" : latestFinishedLog?.endedAt ? fullDate(latestFinishedLog.endedAt) : "-"}
                </strong>
              </div>
            </div>
            {activeLog ? (
              <span className="badge blue">Timer berjalan: {workLogLabel(activeLog.logType)}</span>
            ) : finishedLogs.length ? (
              <span className="badge green">{finishedLogs.length} sesi selesai</span>
            ) : (
              <span className="subtle">Durasi muncul setelah CC klik Start.</span>
            )}
          </div>

          <form className="surface surface-pad stack" action={`/api/tasks/${task.id}/note`} method="post">
            <h2 className="asset-title">Tambah note</h2>
            <select className="select" name="noteType" defaultValue="GENERAL">
              <option value="GENERAL">Catatan</option>
              <option value="KENDALA">Kendala</option>
              <option value="CLARIFICATION">Klarifikasi</option>
            </select>
            <textarea className="textarea" name="note" required />
            <button className="btn" type="submit">
              Simpan Note
            </button>
          </form>

          <div className="surface surface-pad stack">
            <h2 className="asset-title">Submissions</h2>
            {task.submissions.map((submission) => (
              <div className="asset-card" key={submission.id}>
                <div className="split-line">
                  <span className="badge">{submissionTypeLabel(submission.submissionType)}</span>
                  <span className="badge">v{submission.version}</span>
                </div>
                <div className="subtle">
                  {submission.creator.displayName} · {fullDate(submission.createdAt)}
                </div>
                <div className="button-row">
                  {submission.assets.map((asset) => (
                    <a className="btn" href={externalHref(asset.link)} target="_blank" rel="noreferrer" key={asset.id}>
                      Buka {ASSET_KIND_LABELS[asset.assetKind] ?? asset.assetKind}
                    </a>
                  ))}
                </div>
                {submission.note ? <p className="subtle">{submission.note}</p> : null}
              </div>
            ))}
          </div>

          <div className="surface surface-pad stack">
            <h2 className="asset-title">History</h2>
            {activeLog ? <span className="badge blue">Timer aktif: {workLogLabel(activeLog.logType)}</span> : null}
            {task.timeLogs.map((log) => (
              <div key={log.id} className="subtle">
                <strong>{workLogLabel(log.logType)}</strong> - {log.creator.displayName} - {formatDuration(log.durationSeconds)} - Mulai {fullDate(log.startedAt)}
                {log.endedAt ? ` - Submit ${fullDate(log.endedAt)}` : " - Belum submit"}
              </div>
            ))}
            {task.reviewLogs.map((log) => (
              <div key={log.id} className="subtle">
                <strong>{reviewDecisionLabel(log.decision)}</strong> - {log.reviewer.displayName} - {log.reviewNote ?? "-"}
              </div>
            ))}
            {task.notes.map((note) => (
              <div key={note.id} className="subtle">
                <strong>{noteTypeLabel(note.noteType)}</strong> - {note.user.displayName} - {note.note}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
