import Link from "next/link";
import { notFound } from "next/navigation";
import { TestStatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ASSET_KIND_LABELS, PLATFORM_LABELS, TEST_STATUSES, TEST_STATUS_LABELS } from "@/lib/constants";
import { dateOnlyInputValue, deserializeLinks, externalHref, fullDate, money, scoreLabel } from "@/lib/utils";

export default async function BankKontenDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const item = await db.contentBank.findUnique({
    where: { id: params.id },
    include: {
      creator: true,
      requester: true,
      product: true,
      request: true,
      feedbacks: { orderBy: { createdAt: "desc" }, include: { reviewer: true } }
    }
  });
  if (!item) notFound();
  const additionalLinks = deserializeLinks(item.additionalLinks);
  const canEdit = ["ADMIN", "ADVERTISER"].includes(user.role);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Bank Konten Detail</p>
          <h1 className="page-title">{item.title}</h1>
          <p className="page-copy">
            {item.productName} · {ASSET_KIND_LABELS[item.assetKind] ?? item.assetKind} · {PLATFORM_LABELS[item.platform] ?? item.platform}
          </p>
        </div>
        <div className="button-row">
          <TestStatusBadge status={item.testStatus} />
          <a className="btn primary" href={externalHref(item.mainLink)} target="_blank" rel="noreferrer">
            Open Link
          </a>
        </div>
      </header>

      <section className="two-col">
        <div className="stack">
          <div className="surface surface-pad stack">
            <h2 className="asset-title">Metadata</h2>
            <div className="form-grid">
              <div>
                <div className="metric-label">Creator</div>
                <strong>{item.creator?.displayName ?? "-"}</strong>
              </div>
              <div>
                <div className="metric-label">Requester</div>
                <strong>{item.requester.displayName}</strong>
              </div>
              <div>
                <div className="metric-label">Score</div>
                <strong>{scoreLabel(item.scoreTotal)}</strong>
              </div>
              <div>
                <div className="metric-label">ACC date</div>
                <strong>{fullDate(item.createdAt)}</strong>
              </div>
            </div>
            {item.angle ? <p className="subtle">Angle: {item.angle}</p> : null}
            {item.hook ? <p className="subtle">Hook: {item.hook}</p> : null}
            <div className="button-row">
              {additionalLinks.map((link, index) => (
                <a className="btn" href={externalHref(link)} target="_blank" rel="noreferrer" key={link}>
                  Additional {index + 1}
                </a>
              ))}
            </div>
            <div className="button-row">
              {item.product ? (
                <Link className="btn" href={`/products/${item.product.id}`}>
                  View Product
                </Link>
              ) : null}
              {item.product ? (
                <Link className="btn" href={`/reports/products/${item.product.id}`}>
                  Product Report
                </Link>
              ) : null}
              <Link className="btn" href={`/tasks/${item.requestId}`}>
                Task Origin
              </Link>
            </div>
          </div>

          <div className="surface surface-pad stack">
            <h2 className="asset-title">Feedback history</h2>
            {item.feedbacks.map((feedback) => (
              <div className="asset-card" key={feedback.id}>
                <div className="split-line">
                  {feedback.testStatus ? <TestStatusBadge status={feedback.testStatus} /> : null}
                  <span className="badge">{feedback.totalScore == null ? "Unscored" : `${feedback.totalScore}/25`}</span>
                  <span className="badge">{feedback.reviewer.displayName}</span>
                </div>
                <p className="subtle">
                  {fullDate(feedback.createdAt)} · Spend {money(feedback.spend)} · ROAS {feedback.roas ?? "-"}
                </p>
                {feedback.feedbackNote ? <p>{feedback.feedbackNote}</p> : null}
                {feedback.suggestionForCreator ? <p className="subtle">Saran: {feedback.suggestionForCreator}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <aside className="stack">
          {canEdit ? (
            <form className="surface surface-pad stack" action={`/api/bank-konten/${item.id}/status`} method="post">
              <h2 className="asset-title">Update status</h2>
              <select className="select" name="testStatus" defaultValue={item.testStatus}>
                {TEST_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {TEST_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button className="btn primary" type="submit">
                Simpan Status
              </button>
            </form>
          ) : null}

          {canEdit ? (
            <form className="surface surface-pad stack" action={`/api/bank-konten/${item.id}/feedback`} method="post">
              <h2 className="asset-title">Tambah feedback</h2>
              <select className="select" name="testStatus" defaultValue={item.testStatus}>
                {TEST_STATUSES.map((status) => (
                  <option value={status} key={status}>
                    {TEST_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <select className="select" name="testedPlatform" defaultValue={item.platform}>
                <option value="">Platform test</option>
                {["META", "TIKTOK", "ORGANIC", "WEBSITE", "SHOPEE", "LAINNYA"].map((platform) => (
                  <option value={platform} key={platform}>
                    {PLATFORM_LABELS[platform] ?? platform}
                  </option>
                ))}
              </select>
              <input className="input" name="testDate" type="date" defaultValue={dateOnlyInputValue(new Date())} />
              <input className="input" name="testResult" placeholder="Bagus / Biasa / Jelek" />
              <div className="form-grid">
                {[1, 2, 3, 4, 5].map((score) => (
                  <div className="field" key={score}>
                    <label>Score {score}</label>
                    <input className="input" name={`score${score}`} type="number" min="1" max="5" />
                  </div>
                ))}
              </div>
              <div className="form-grid">
                <input className="input" name="spend" type="number" placeholder="Spend" />
                <input className="input" name="roas" type="number" step="0.01" placeholder="ROAS" />
                <input className="input" name="sales" type="number" placeholder="Sales" />
                <input className="input" name="profit" type="number" placeholder="Profit" />
              </div>
              <textarea className="textarea" name="feedbackNote" placeholder="Feedback umum" />
              <textarea className="textarea" name="suggestionForCreator" placeholder="Saran untuk creator" />
              <button className="btn primary" type="submit">
                Simpan Feedback
              </button>
            </form>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
