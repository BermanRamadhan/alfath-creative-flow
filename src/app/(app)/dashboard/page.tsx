import Link from "next/link";
import { MetricStrip } from "@/components/metric-strip";
import { StatusBadge, TestStatusBadge } from "@/components/badge";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { compactDate, formatDuration } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const whereByRole =
    user.role === "ADVERTISER"
      ? { requesterId: user.id }
      : user.role === "CC"
        ? { OR: [{ creatorId: user.id }, { status: "BELUM" }] }
        : {};

  const [totalRequests, activeTasks, waitingReview, overdueTasks, bankItems, winners, recentTasks, recentBank, todayLogs] =
    await Promise.all([
      db.workRequest.count({ where: whereByRole }),
      db.workRequest.count({
        where: {
          ...whereByRole,
          status: { in: ["BELUM", "DIKERJAKAN", "REVISI", "REVISI_DIKEMBALIKAN"] }
        }
      }),
      db.workRequest.count({ where: { ...whereByRole, status: "SUDAH" } }),
      db.workRequest.count({
        where: {
          ...whereByRole,
          status: { not: "BERES" },
          deadlineAt: { lt: new Date() }
        }
      }),
      db.contentBank.count({ where: user.role === "ADVERTISER" ? { requesterId: user.id } : {} }),
      db.contentBank.count({
        where: {
          ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {}),
          testStatus: "WINNER"
        }
      }),
      db.workRequest.findMany({
        where: whereByRole,
        orderBy: { deadlineAt: "asc" },
        take: 8,
        include: { creator: true, requester: true }
      }),
      db.contentBank.findMany({
        where: user.role === "ADVERTISER" ? { requesterId: user.id } : {},
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { creator: true }
      }),
      db.workTimeLog.findMany({
        where: {
          ...(user.role === "CC" ? { creatorId: user.id } : {}),
          startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ]);

  const totalTodaySeconds = todayLogs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Dashboard</p>
          <h1 className="page-title">Ruang kerja {user.displayName}</h1>
          <p className="page-copy">
            Ringkasan tipis untuk request, review, task aktif, deadline, dan asset yang sudah masuk Bank Konten.
          </p>
        </div>
        <div className="button-row">
          {["ADMIN", "ADVERTISER"].includes(user.role) ? (
            <Link className="btn primary" href="/requests/new">
              Buat Request
            </Link>
          ) : null}
          {["ADMIN", "CC"].includes(user.role) ? (
            <Link className="btn" href="/tasks">
              Lihat Task
            </Link>
          ) : null}
        </div>
      </header>

      <MetricStrip
        items={[
          { label: "Total request", value: totalRequests },
          { label: "Task aktif", value: activeTasks },
          { label: "Menunggu review", value: waitingReview },
          { label: "Overdue", value: overdueTasks },
          { label: "Bank Konten", value: bankItems },
          { label: "Winner", value: winners },
          { label: "Kerja hari ini", value: formatDuration(totalTodaySeconds) }
        ]}
      />

      <section className="two-col">
        <div className="stack">
          <div className="toolbar">
            <h2 className="asset-title">Deadline & task terbaru</h2>
            <Link className="btn" href="/tasks">
              Semua task
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deadline</th>
                  <th>Produk</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{compactDate(task.deadlineAt)}</td>
                    <td>
                      <strong>{task.productName}</strong>
                      <div className="subtle">{task.title}</div>
                    </td>
                    <td>{task.requestType}</td>
                    <td>
                      <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
                    </td>
                    <td>{task.creator?.displayName ?? task.requester.displayName}</td>
                    <td>
                      <Link className="btn" href={`/tasks/${task.id}`}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="toolbar">
            <h2 className="asset-title">Asset terbaru</h2>
            <Link className="btn" href="/bank-konten">
              Bank Konten
            </Link>
          </div>
          {recentBank.map((item) => (
            <Link className="asset-card" href={`/bank-konten/${item.id}`} key={item.id}>
              <div className="split-line">
                <span className="badge">{item.assetKind}</span>
                <TestStatusBadge status={item.testStatus} />
              </div>
              <h3 className="asset-title">{item.title}</h3>
              <div className="subtle">
                {item.productName} · {item.platform} · {item.creator?.displayName ?? "Belum ada creator"}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
