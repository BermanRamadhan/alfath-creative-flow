import { BarList, DonutChart, StackedBar, TrendBars } from "@/components/charts";
import { MetricStrip } from "@/components/metric-strip";
import { StatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";

export default async function WorkflowReportPage() {
  await requireUser();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [createdWeek, completedWeek, overdue, requests, logs, submissions] = await Promise.all([
    db.workRequest.count({ where: { createdAt: { gte: weekAgo } } }),
    db.workRequest.count({ where: { status: "BERES", updatedAt: { gte: weekAgo } } }),
    db.workRequest.count({ where: { status: { not: "BERES" }, deadlineAt: { lt: new Date() } } }),
    db.workRequest.findMany({ orderBy: { createdAt: "desc" }, include: { reviewLogs: true } }),
    db.workTimeLog.findMany({ where: { durationSeconds: { not: null } } }),
    db.workSubmission.findMany()
  ]);
  const avgCompletion = logs.length ? Math.round(logs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0) / logs.length) : 0;
  const revisionLogs = requests.flatMap((request) => request.reviewLogs).filter((log) => log.decision === "REVISION_REQUESTED").length;
  const totalVideo = submissions.reduce((sum, item) => sum + item.submittedVideoAmount, 0);
  const totalImage = submissions.reduce((sum, item) => sum + item.submittedImageAmount, 0);
  const statusData = ["BELUM", "DIKERJAKAN", "SUDAH", "REVISI", "REVISI_DIKEMBALIKAN", "BERES"].map((status) => ({
    label: STATUS_LABELS[status],
    value: requests.filter((request) => request.status === status).length,
    tone: status === "BERES" ? "green" : status === "REVISI_DIKEMBALIKAN" ? "red" : status === "SUDAH" ? "blue" : "amber"
  })) as { label: string; value: number; tone: "green" | "red" | "blue" | "amber" }[];
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(date.getDate() + 1);
    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
    return {
      label,
      created: requests.filter((request) => request.createdAt >= date && request.createdAt < next).length,
      completed: requests.filter((request) => request.status === "BERES" && request.updatedAt >= date && request.updatedAt < next).length
    };
  });

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Workflow Report</p>
          <h1 className="page-title">Produktivitas request</h1>
        </div>
      </header>
      <MetricStrip
        items={[
          { label: "Created 7 hari", value: createdWeek },
          { label: "Completed 7 hari", value: completedWeek },
          { label: "Avg completion", value: formatDuration(avgCompletion) },
          { label: "Overdue", value: overdue },
          { label: "Revision rate", value: requests.length ? `${Math.round((revisionLogs / requests.length) * 100)}%` : "0%" },
          { label: "Total output", value: totalVideo + totalImage },
          { label: "Video", value: totalVideo },
          { label: "Gambar", value: totalImage }
        ]}
      />
      <section className="chart-grid">
        <DonutChart title="Task funnel" center={requests.length} caption="Distribusi status pekerjaan saat ini." data={statusData} />
        <StackedBar
          title="Output mix"
          caption="Komposisi total output dari semua submission."
          data={[
            { label: "Video", value: totalVideo, tone: "blue" },
            { label: "Gambar", value: totalImage, tone: "amber" }
          ]}
        />
        <BarList
          title="7 hari terakhir"
          caption="Request masuk dibanding task selesai."
          data={[
            { label: "Created", value: createdWeek, tone: "blue" },
            { label: "Completed", value: completedWeek, tone: "green" },
            { label: "Revision", value: revisionLogs, tone: "amber" },
            { label: "Overdue", value: overdue, tone: "red" }
          ]}
        />
      </section>
      <section className="chart-grid">
        <TrendBars title="Created per day" caption="Request baru dalam 7 hari terakhir." data={days.map((day) => ({ label: day.label, value: day.created, tone: "blue" }))} />
        <TrendBars title="Completed per day" caption="Task beres dalam 7 hari terakhir." data={days.map((day) => ({ label: day.label, value: day.completed, tone: "green" }))} />
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Produk</th>
              <th>Status</th>
              <th>Revisi</th>
            </tr>
          </thead>
          <tbody>
            {requests.slice(0, 20).map((request) => (
              <tr key={request.id}>
                <td>{request.title}</td>
                <td>{request.productName}</td>
                <td>
                  <StatusBadge status={request.status} deadlineAt={request.deadlineAt} />
                </td>
                <td>{request.reviewLogs.filter((log) => log.decision === "REVISION_REQUESTED").length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
