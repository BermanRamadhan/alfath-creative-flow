import Link from "next/link";
import { BarList, DonutChart, StackedBar } from "@/components/charts";
import { MetricStrip } from "@/components/metric-strip";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS_LABELS, TEST_STATUS_LABELS } from "@/lib/constants";

export default async function ReportsPage() {
  await requireUser();
  const [products, creators, requests, bankItems, feedbacks] = await Promise.all([
    db.product.findMany({
      orderBy: { name: "asc" },
      take: 12,
      include: { requests: true, bankItems: true }
    }),
    db.user.findMany({
      where: { role: "CC" },
      orderBy: { displayName: "asc" },
      include: { createdBankItems: true, timeLogs: true }
    }),
    db.workRequest.findMany(),
    db.contentBank.findMany(),
    db.assetFeedback.findMany()
  ]);
  const taskStatusData = ["BELUM", "DIKERJAKAN", "SUDAH", "REVISI", "REVISI_DIKEMBALIKAN", "BERES"].map((status) => ({
    label: STATUS_LABELS[status],
    value: requests.filter((request) => request.status === status).length,
    tone: status === "BERES" ? "green" : status === "REVISI_DIKEMBALIKAN" ? "red" : status === "SUDAH" ? "blue" : "amber"
  })) as { label: string; value: number; tone: "green" | "amber" | "red" | "blue" }[];
  const testStatusData = ["READY_TEST", "WINNER", "LOSER", "BIASA", "ARCHIVED"].map((status) => ({
    label: TEST_STATUS_LABELS[status],
    value: bankItems.filter((item) => item.testStatus === status).length,
    tone: status === "WINNER" ? "green" : status === "LOSER" ? "red" : status === "READY_TEST" ? "blue" : "amber"
  })) as { label: string; value: number; tone: "green" | "amber" | "red" | "blue" }[];
  const totalVideo = bankItems.reduce((sum, item) => sum + item.submittedVideoAmount, 0);
  const totalImage = bankItems.reduce((sum, item) => sum + item.submittedImageAmount, 0);
  const lpCount = bankItems.filter((item) => item.assetKind === "LP").length;
  const productBars = products
    .map((product) => ({
      label: product.name,
      value: product.bankItems.length,
      href: `/reports/products/${product.id}`,
      tone: product.bankItems.some((item) => item.testStatus === "WINNER") ? "green" : "blue"
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6) as { label: string; value: number; href: string; tone: "green" | "blue" }[];
  const creatorBars = creators
    .map((creator) => ({
      label: creator.displayName,
      value: creator.createdBankItems.length,
      href: `/reports/creators/${creator.id}`,
      tone: creator.createdBankItems.some((item) => item.testStatus === "WINNER") ? "green" : "amber"
    }))
    .sort((a, b) => b.value - a.value) as { label: string; value: number; href: string; tone: "green" | "amber" }[];
  const scoredAssets = bankItems.filter((item) => item.scoreTotal != null).length;

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Report</p>
          <h1 className="page-title">Product, creator, dan workflow</h1>
          <p className="page-copy">Money metrics tetap opsional. Report fokus ke request, output, status test, revisi, dan durasi kerja.</p>
        </div>
        <Link className="btn primary" href="/reports/workflow">
          Workflow Report
        </Link>
      </header>

      <MetricStrip
        items={[
          { label: "Total request", value: requests.length },
          { label: "Bank assets", value: bankItems.length },
          { label: "Feedback", value: feedbacks.length },
          { label: "Scored assets", value: scoredAssets },
          { label: "Winner", value: bankItems.filter((item) => item.testStatus === "WINNER").length },
          { label: "Overdue", value: requests.filter((request) => request.status !== "BERES" && request.deadlineAt.getTime() < Date.now()).length }
        ]}
      />

      <section className="chart-grid">
        <DonutChart title="Status task" center={requests.length} caption="Distribusi request dari brief sampai beres." data={taskStatusData} />
        <DonutChart title="Status performa asset" center={bankItems.length} caption="Komposisi Ready Test, Winner, Loser, dan Biasa." data={testStatusData} />
        <StackedBar
          title="Output mix"
          caption="Total asset final yang sudah masuk Bank Konten."
          data={[
            { label: "Video", value: totalVideo, tone: "blue" },
            { label: "Gambar", value: totalImage, tone: "amber" },
            { label: "LP", value: lpCount, tone: "green" }
          ]}
        />
      </section>

      <section className="chart-grid">
        <BarList title="Top produk by asset" caption="Klik bar untuk masuk ke product report." data={productBars} />
        <BarList title="Kontribusi creator" caption="Jumlah asset final yang masuk Bank Konten." data={creatorBars} />
      </section>

      <section className="two-col">
        <div className="surface surface-pad stack">
          <h2 className="asset-title">Product reports</h2>
          {products.map((product) => (
            <Link className="btn" href={`/reports/products/${product.id}`} key={product.id}>
              {product.name}
            </Link>
          ))}
        </div>
        <div className="surface surface-pad stack">
          <h2 className="asset-title">Creator reports</h2>
          {creators.map((creator) => (
            <Link className="btn" href={`/reports/creators/${creator.id}`} key={creator.id}>
              {creator.displayName}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
