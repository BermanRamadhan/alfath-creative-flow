import { notFound } from "next/navigation";
import Link from "next/link";
import { BarList, DonutChart, StackedBar } from "@/components/charts";
import { MetricStrip } from "@/components/metric-strip";
import { StatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS, TEST_STATUS_LABELS } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";

export default async function CreatorReportPage({ params }: { params: { id: string } }) {
  await requireUser();
  const creator = await db.user.findUnique({
    where: { id: params.id },
    include: {
      claimedRequests: { include: { timeLogs: true, reviewLogs: true } },
      createdBankItems: true,
      timeLogs: true
    }
  });
  if (!creator) notFound();
  const completed = creator.claimedRequests.filter((request) => request.status === "BERES");
  const totalVideo = creator.createdBankItems.reduce((sum, item) => sum + item.submittedVideoAmount, 0);
  const totalImage = creator.createdBankItems.reduce((sum, item) => sum + item.submittedImageAmount, 0);
  const revisionCount = creator.claimedRequests.flatMap((request) => request.reviewLogs).filter((log) => log.decision === "REVISION_REQUESTED").length;
  const overdue = creator.claimedRequests.filter((request) => request.status !== "BERES" && request.deadlineAt.getTime() < Date.now()).length;
  const initialLogs = creator.timeLogs.filter((log) => log.logType === "INITIAL_WORK" && log.durationSeconds);
  const revisionLogs = creator.timeLogs.filter((log) => log.logType.startsWith("REVISION_") && log.durationSeconds);
  const avgInitial = initialLogs.length ? Math.round(initialLogs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0) / initialLogs.length) : 0;
  const avgRevision = revisionLogs.length ? Math.round(revisionLogs.reduce((sum, log) => sum + (log.durationSeconds ?? 0), 0) / revisionLogs.length) : 0;
  const taskStatusData = ["BELUM", "DIKERJAKAN", "SUDAH", "REVISI", "REVISI_DIKEMBALIKAN", "BERES"].map((status) => ({
    label: STATUS_LABELS[status],
    value: creator.claimedRequests.filter((request) => request.status === status).length,
    tone: status === "BERES" ? "green" : status === "REVISI_DIKEMBALIKAN" ? "red" : status === "SUDAH" ? "blue" : "amber"
  })) as { label: string; value: number; tone: "green" | "red" | "blue" | "amber" }[];
  const assetStatusData = ["READY_TEST", "WINNER", "LOSER", "BIASA", "ARCHIVED"].map((status) => ({
    label: TEST_STATUS_LABELS[status],
    value: creator.createdBankItems.filter((item) => item.testStatus === status).length,
    tone: status === "WINNER" ? "green" : status === "LOSER" ? "red" : status === "READY_TEST" ? "blue" : "amber"
  })) as { label: string; value: number; tone: "green" | "red" | "blue" | "amber" }[];

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Creator Report</p>
          <h1 className="page-title">{creator.displayName}</h1>
        </div>
        <Link className="btn" href={`/bank-konten?creator=${creator.id}`}>
          Creator Assets
        </Link>
      </header>
      <MetricStrip
        items={[
          { label: "Completed", value: completed.length },
          { label: "Video", value: totalVideo },
          { label: "Gambar", value: totalImage },
          { label: "Avg initial", value: formatDuration(avgInitial) },
          { label: "Avg revisi", value: formatDuration(avgRevision) },
          { label: "Revision", value: revisionCount },
          { label: "Overdue", value: overdue },
          { label: "Winner", value: creator.createdBankItems.filter((item) => item.testStatus === "WINNER").length },
          { label: "Loser", value: creator.createdBankItems.filter((item) => item.testStatus === "LOSER").length }
        ]}
      />
      <section className="chart-grid">
        <DonutChart title="Asset performance" center={creator.createdBankItems.length} caption="Status test asset yang dibuat creator ini." data={assetStatusData} />
        <DonutChart title="Task status" center={creator.claimedRequests.length} caption="Posisi task yang pernah diklaim." data={taskStatusData} />
        <StackedBar
          title="Output mix"
          caption="Komposisi output final di Bank Konten."
          data={[
            { label: "Video", value: totalVideo, tone: "blue" },
            { label: "Gambar", value: totalImage, tone: "amber" },
            { label: "LP", value: creator.createdBankItems.filter((item) => item.assetKind === "LP").length, tone: "green" }
          ]}
        />
      </section>
      <section className="chart-grid">
        <BarList
          title="Durasi rata-rata"
          caption="Perbandingan waktu kerja awal dan revisi."
          data={[
            { label: "Initial work menit", value: Math.round(avgInitial / 60), tone: "green" },
            { label: "Revision menit", value: Math.round(avgRevision / 60), tone: "amber" }
          ]}
        />
        <BarList
          title="Outcome asset"
          caption="Jumlah asset yang sudah dinilai secara performa."
          data={[
            { label: "Winner", value: creator.createdBankItems.filter((item) => item.testStatus === "WINNER").length, tone: "green" },
            { label: "Biasa", value: creator.createdBankItems.filter((item) => item.testStatus === "BIASA").length, tone: "amber" },
            { label: "Loser", value: creator.createdBankItems.filter((item) => item.testStatus === "LOSER").length, tone: "red" },
            { label: "Ready Test", value: creator.createdBankItems.filter((item) => item.testStatus === "READY_TEST").length, tone: "blue" }
          ]}
        />
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
              <th>Output</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {creator.claimedRequests.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>
                  <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
                </td>
                <td>
                  {task.videoAmount} video · {task.imageAmount} gambar
                </td>
                <td>
                  <Link className="btn" href={`/tasks/${task.id}`}>
                    Task
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
