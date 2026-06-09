import Link from "next/link";
import { MetricStrip } from "@/components/metric-strip";
import { StatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLATFORM_LABELS, REQUEST_TYPE_LABELS, STATUS_LABELS, STYLE_LABELS, USE_FRAME_LABELS } from "@/lib/constants";
import { compactDate, formatDuration } from "@/lib/utils";

export default async function TasksPage({ searchParams }: { searchParams?: { status?: string; product?: string } }) {
  const user = await requireUser();
  const status = searchParams?.status;
  const product = searchParams?.product;
  const canWork = ["ADMIN", "CC"].includes(user.role);
  const where = {
    ...(user.role === "CC" ? { OR: [{ creatorId: user.id }, { status: "BELUM" }] } : {}),
    ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {}),
    ...(status ? { status } : { status: { not: "BERES" } }),
    ...(product ? { productKey: product } : {})
  };

  const [tasks, doneToday, belum, revisi, totalLogs] = await Promise.all([
    db.workRequest.findMany({
      where,
      orderBy: [{ deadlineAt: "asc" }, { createdAt: "desc" }],
      include: { requester: true, creator: true, submissions: true }
    }),
    db.workRequest.count({
      where: {
        ...(user.role === "CC" ? { creatorId: user.id } : {}),
        status: "BERES",
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),
    db.workRequest.count({ where: { ...(user.role === "CC" ? { OR: [{ creatorId: user.id }, { status: "BELUM" }] } : {}), status: "BELUM" } }),
    db.workRequest.count({ where: { ...(user.role === "CC" ? { creatorId: user.id } : {}), status: { in: ["REVISI", "REVISI_DIKEMBALIKAN"] } } }),
    db.workTimeLog.findMany({
      where: {
        ...(user.role === "CC" ? { creatorId: user.id } : {}),
        startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    })
  ]);

  const totalSeconds = totalLogs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Task Content</p>
          <h1 className="page-title">Antrian kerja CC</h1>
          <p className="page-copy">
            Hari ini: {doneToday} selesai · {belum} belum · {revisi} revisi · {formatDuration(totalSeconds)} total kerja
          </p>
        </div>
        <div className="button-row">
          {["BELUM", "DIKERJAKAN", "SUDAH", "REVISI", "REVISI_DIKEMBALIKAN"].map((item) => (
            <Link className="btn" href={`/tasks?status=${item}`} key={item}>
              {STATUS_LABELS[item] ?? item}
            </Link>
          ))}
        </div>
      </header>

      <MetricStrip
        items={[
          { label: "Selesai hari ini", value: doneToday },
          { label: "Belum", value: belum },
          { label: "Revisi", value: revisi },
          { label: "Total kerja", value: formatDuration(totalSeconds) }
        ]}
      />

      <div className="table-wrap desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Deadline</th>
              <th>Produk</th>
              <th>Tipe</th>
              <th>Platform</th>
              <th>Jumlah</th>
              <th>Style/Frame</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{compactDate(task.deadlineAt)}</td>
                <td>
                  <strong>{task.productName}</strong>
                  <div className="subtle">Requester: {task.requester.displayName}</div>
                  <div className="subtle">Creator: {task.creator?.displayName ?? "Belum diklaim"}</div>
                </td>
                <td>{REQUEST_TYPE_LABELS[task.requestType] ?? task.requestType}</td>
                <td>{PLATFORM_LABELS[task.postPlatform] ?? task.postPlatform}</td>
                <td>
                  {task.requestType === "LP" ? "1 LP" : `${task.videoAmount} video · ${task.imageAmount} gambar`}
                  {task.submissions[0] ? (
                    <div className="subtle">
                      Submit: {task.submissions.at(-1)?.submittedVideoAmount ?? 0} video · {task.submissions.at(-1)?.submittedImageAmount ?? 0} gambar
                    </div>
                  ) : null}
                </td>
                <td>{task.requestType === "LP" ? (task.style ? STYLE_LABELS[task.style] : "-") : task.useFrame ? USE_FRAME_LABELS[task.useFrame] : "-"}</td>
                <td>
                  <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
                </td>
                <td>
                  <div className="button-row">
                    <Link className="btn" href={`/tasks/${task.id}`}>
                      Detail
                    </Link>
                    {["ADMIN", "ADVERTISER"].includes(user.role) && task.status === "BELUM" && (user.role === "ADMIN" || task.requesterId === user.id) ? (
                      <Link className="btn" href={`/requests/${task.id}/edit`}>
                        Edit
                      </Link>
                    ) : null}
                    {canWork && ["BELUM", "REVISI"].includes(task.status) ? (
                      <form action={`/api/tasks/${task.id}/start`} method="post">
                        <button className="btn primary" type="submit">
                          {task.status === "REVISI" ? "Start Revision" : "Start"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mobile-card-list" aria-label="Daftar task mobile">
        {tasks.map((task) => {
          const latestSubmission = task.submissions.at(-1);
          return (
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
                  Deadline
                  <strong>{compactDate(task.deadlineAt)}</strong>
                </div>
                <div>
                  Output
                  <strong>{task.requestType === "LP" ? "1 LP" : `${task.videoAmount} video / ${task.imageAmount} gambar`}</strong>
                </div>
                <div>
                  Platform
                  <strong>{PLATFORM_LABELS[task.postPlatform] ?? task.postPlatform}</strong>
                </div>
                <div>
                  Creator
                  <strong>{task.creator?.displayName ?? "Belum diklaim"}</strong>
                </div>
              </div>
              {latestSubmission ? (
                <span className="subtle">
                  Submit: {latestSubmission.submittedVideoAmount ?? 0} video / {latestSubmission.submittedImageAmount ?? 0} gambar
                </span>
              ) : null}
              <div className="mobile-card-actions">
                <Link className="btn" href={`/tasks/${task.id}`}>
                  Detail
                </Link>
                {["ADMIN", "ADVERTISER"].includes(user.role) && task.status === "BELUM" && (user.role === "ADMIN" || task.requesterId === user.id) ? (
                  <Link className="btn" href={`/requests/${task.id}/edit`}>
                    Edit
                  </Link>
                ) : null}
                {canWork && ["BELUM", "REVISI"].includes(task.status) ? (
                  <form action={`/api/tasks/${task.id}/start`} method="post">
                    <button className="btn primary" type="submit">
                      {task.status === "REVISI" ? "Start Revisi" : "Start"}
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
