import Link from "next/link";
import { notFound } from "next/navigation";
import { BarList, DonutChart, StackedBar } from "@/components/charts";
import { MetricStrip } from "@/components/metric-strip";
import { TestStatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEST_STATUS_LABELS } from "@/lib/constants";
import { formatDuration, productSlug, scoreLabel } from "@/lib/utils";

export default async function ProductReportPage({ params }: { params: { id: string } }) {
  await requireUser();
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      requests: { include: { timeLogs: true, reviewLogs: true } },
      bankItems: { include: { creator: true, feedbacks: true } }
    }
  });
  if (!product) notFound();
  const totalRequestedVideos = product.requests.reduce((sum, request) => sum + request.videoAmount, 0);
  const totalRequestedImages = product.requests.reduce((sum, request) => sum + request.imageAmount, 0);
  const totalSubmittedVideos = product.bankItems.reduce((sum, item) => sum + item.submittedVideoAmount, 0);
  const totalSubmittedImages = product.bankItems.reduce((sum, item) => sum + item.submittedImageAmount, 0);
  const scored = product.bankItems.filter((item) => item.scoreTotal != null);
  const avgScore = scored.length ? Math.round(scored.reduce((sum, item) => sum + (item.scoreTotal ?? 0), 0) / scored.length) : null;
  const durations = product.requests.flatMap((request) => request.timeLogs).map((log) => log.durationSeconds ?? 0).filter(Boolean);
  const avgDuration = durations.length ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length) : 0;
  const revisionCount = product.requests.flatMap((request) => request.reviewLogs).filter((log) => log.decision === "REVISION_REQUESTED").length;
  const slug = productSlug(product.name);
  const statusData = ["READY_TEST", "WINNER", "LOSER", "BIASA", "ARCHIVED"].map((status) => ({
    label: TEST_STATUS_LABELS[status],
    value: product.bankItems.filter((item) => item.testStatus === status).length,
    tone: status === "WINNER" ? "green" : status === "LOSER" ? "red" : status === "READY_TEST" ? "blue" : "amber"
  })) as { label: string; value: number; tone: "green" | "red" | "blue" | "amber" }[];
  const scoreBands = [
    { label: "21-25", value: product.bankItems.filter((item) => (item.scoreTotal ?? 0) >= 21).length, tone: "green" },
    { label: "16-20", value: product.bankItems.filter((item) => (item.scoreTotal ?? 0) >= 16 && (item.scoreTotal ?? 0) <= 20).length, tone: "blue" },
    { label: "1-15", value: product.bankItems.filter((item) => (item.scoreTotal ?? 0) >= 1 && (item.scoreTotal ?? 0) <= 15).length, tone: "amber" },
    { label: "Unscored", value: product.bankItems.filter((item) => item.scoreTotal == null).length, tone: "neutral" }
  ] as { label: string; value: number; tone: "green" | "blue" | "amber" | "neutral" }[];
  const creatorMap = new Map<string, number>();
  for (const item of product.bankItems) {
    const name = item.creator?.displayName ?? "Tanpa creator";
    creatorMap.set(name, (creatorMap.get(name) ?? 0) + 1);
  }
  const creatorData = Array.from(creatorMap.entries())
    .map(([label, value]) => ({ label, value, tone: "green" as const }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Product Report</p>
          <h1 className="page-title">{product.name}</h1>
        </div>
        <div className="button-row">
          <Link className="btn" href={`/products/${product.id}`}>
            Product
          </Link>
          <Link className="btn" href={`/bank-konten?product=${slug}`}>
            Related Bank Konten
          </Link>
          <Link className="btn" href={`/tasks?product=${slug}`}>
            Task History
          </Link>
        </div>
      </header>
      <MetricStrip
        items={[
          { label: "Requests", value: product.requests.length },
          { label: "LP", value: product.requests.filter((request) => request.requestType === "LP").length },
          { label: "Content", value: product.requests.filter((request) => request.requestType === "CONTENT").length },
          { label: "Req video", value: totalRequestedVideos },
          { label: "Req gambar", value: totalRequestedImages },
          { label: "Sub video", value: totalSubmittedVideos },
          { label: "Sub gambar", value: totalSubmittedImages },
          { label: "Avg score", value: avgScore ?? "Unscored" },
          { label: "Revision", value: revisionCount },
          { label: "Avg durasi", value: formatDuration(avgDuration) }
        ]}
      />
      <section className="chart-grid">
        <DonutChart title="Performa asset" center={product.bankItems.length} caption="Status test untuk semua asset produk ini." data={statusData} />
        <StackedBar title="Score bands" caption="Seberapa banyak asset yang sudah punya nilai detail." data={scoreBands} />
        <BarList
          title="Requested vs submitted"
          caption="Membandingkan brief dan asset yang masuk Bank Konten."
          data={[
            { label: "Requested video", value: totalRequestedVideos, tone: "blue" },
            { label: "Submitted video", value: totalSubmittedVideos, tone: "green" },
            { label: "Requested gambar", value: totalRequestedImages, tone: "amber" },
            { label: "Submitted gambar", value: totalSubmittedImages, tone: "green" }
          ]}
        />
      </section>
      <section className="chart-grid">
        <BarList title="Creator contribution" caption="Jumlah asset final per creator untuk produk ini." data={creatorData} />
        <DonutChart
          title="Request type split"
          center={product.requests.length}
          caption="Komposisi request LP dan content."
          data={[
            { label: "LP", value: product.requests.filter((request) => request.requestType === "LP").length, tone: "green" },
            { label: "Content", value: product.requests.filter((request) => request.requestType === "CONTENT").length, tone: "blue" }
          ]}
        />
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Status</th>
              <th>Score</th>
              <th>Creator</th>
              <th>Feedback</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {product.bankItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>
                  <TestStatusBadge status={item.testStatus} />
                </td>
                <td>{scoreLabel(item.scoreTotal)}</td>
                <td>{item.creator?.displayName ?? "-"}</td>
                <td>{item.feedbacks.length}</td>
                <td>
                  <Link className="btn" href={`/bank-konten/${item.id}`}>
                    Asset
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
