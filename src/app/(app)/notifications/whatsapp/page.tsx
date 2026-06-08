import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Send } from "lucide-react";
import { Badge, StatusBadge } from "@/components/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { compactDate, fullDate, waMeHref } from "@/lib/utils";

const eventLabels: Record<string, string> = {
  task_submitted: "Task selesai disubmit",
  revision_requested: "Permintaan revisi",
  acc_completed: "Task ACC / beres",
  revision_returned: "Revisi dikembalikan CC"
};

function appOrigin() {
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "127.0.0.1:3001";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

function latestReviewNote(
  logs: { decision: string; reviewNote: string | null; createdAt: Date }[],
  decision: string
) {
  return logs.find((log) => log.decision === decision)?.reviewNote ?? "-";
}

function canView(user: { id: string; role: string }, task: { requesterId: string; creatorId: string | null }) {
  if (user.role === "ADMIN") return true;
  if (user.role === "ADVERTISER") return task.requesterId === user.id;
  if (user.role === "CC") return task.creatorId === user.id;
  return false;
}

export default async function WhatsAppNotificationPage({
  searchParams
}: {
  searchParams?: { event?: string; task?: string; next?: string };
}) {
  const user = await requireUser();
  const event = searchParams?.event ?? "";
  const taskId = searchParams?.task ?? "";
  const nextUrl = searchParams?.next?.startsWith("/") ? searchParams.next : taskId ? `/tasks/${taskId}` : "/dashboard";

  if (!eventLabels[event] || !taskId) notFound();

  const task = await db.workRequest.findUnique({
    where: { id: taskId },
    include: {
      requester: true,
      creator: true,
      submissions: { orderBy: { version: "desc" }, take: 1 },
      reviewLogs: { orderBy: { createdAt: "desc" }, take: 8, include: { reviewer: true } }
    }
  });

  if (!task) notFound();
  if (!canView(user, task)) redirect("/forbidden");

  const origin = appOrigin();
  const latestSubmission = task.submissions[0];
  const latestRevisionNote = latestReviewNote(task.reviewLogs, "REVISION_REQUESTED");
  const latestReturnNote = latestReviewNote(task.reviewLogs, "REVISION_RETURNED_BY_CC");

  const config = {
    task_submitted: {
      recipient: task.requester,
      actionLabel: "Kirim WA ke Advertiser",
      context: `Output: ${latestSubmission?.submittedVideoAmount ?? 0} video, ${latestSubmission?.submittedImageAmount ?? 0} gambar`,
      message: [
        `Halo ${task.requester.displayName},`,
        "",
        `Task "${task.title}" untuk produk ${task.productName} sudah disubmit oleh ${task.creator?.displayName ?? "CC"}.`,
        `Output: ${latestSubmission?.submittedVideoAmount ?? 0} video, ${latestSubmission?.submittedImageAmount ?? 0} gambar.`,
        latestSubmission?.note ? `Catatan CC: ${latestSubmission.note}` : "",
        "",
        `Silakan review di Al-Fath Flow: ${origin}/review/${task.id}`
      ].filter(Boolean).join("\n")
    },
    revision_requested: {
      recipient: task.creator,
      actionLabel: "Kirim WA ke CC",
      context: `Catatan revisi: ${latestRevisionNote}`,
      message: [
        `Halo ${task.creator?.displayName ?? "CC"},`,
        "",
        `Ada permintaan revisi untuk task "${task.title}" (${task.productName}).`,
        `Catatan revisi: ${latestRevisionNote}`,
        "",
        `Silakan cek dan kerjakan revisinya di Al-Fath Flow: ${origin}/tasks/${task.id}`
      ].join("\n")
    },
    acc_completed: {
      recipient: task.creator,
      actionLabel: "Kirim WA ke CC",
      context: "Task sudah ACC dan asset masuk Bank Konten.",
      message: [
        `Halo ${task.creator?.displayName ?? "CC"},`,
        "",
        `Task "${task.title}" untuk produk ${task.productName} sudah ACC / beres.`,
        "Asset final sudah masuk Bank Konten.",
        "",
        `Detail: ${origin}/tasks/${task.id}`
      ].join("\n")
    },
    revision_returned: {
      recipient: task.requester,
      actionLabel: "Kirim WA ke Advertiser",
      context: `Klarifikasi dibutuhkan: ${latestReturnNote}`,
      message: [
        `Halo ${task.requester.displayName},`,
        "",
        `CC mengembalikan revisi untuk task "${task.title}" (${task.productName}).`,
        `Catatan CC: ${latestReturnNote}`,
        "",
        `Silakan beri klarifikasi di Al-Fath Flow: ${origin}/review/${task.id}`
      ].join("\n")
    }
  }[event];

  if (!config) notFound();

  const waHref = waMeHref(config.recipient?.whatsappNumber, config.message);
  const editHref =
    config.recipient && user.role === "ADMIN"
      ? `/team/${config.recipient.id}`
      : config.recipient?.id === user.id
        ? "/settings"
        : null;

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Notifikasi WhatsApp</p>
          <h1 className="page-title">{eventLabels[event]}</h1>
        </div>
        <div className="button-row">
          <StatusBadge status={task.status} deadlineAt={task.deadlineAt} />
          <Link className="btn" href={nextUrl}>
            Lanjut
          </Link>
        </div>
      </header>

      <section className="two-col">
        <div className="surface surface-pad stack">
          <div className="split-line">
            <Badge label={task.productName} />
            <Badge label={compactDate(task.updatedAt)} tone="blue" />
          </div>
          <h2 className="asset-title">{task.title}</h2>
          <div className="duration-grid">
            <div className="duration-cell">
              <div className="metric-label">Penerima</div>
              <strong className="duration-value">{config.recipient?.displayName ?? "Belum ada penerima"}</strong>
            </div>
            <div className="duration-cell">
              <div className="metric-label">Nomor WA</div>
              <strong className="duration-value">{config.recipient?.whatsappNumber ?? "Belum diisi"}</strong>
            </div>
            <div className="duration-cell">
              <div className="metric-label">Deadline</div>
              <strong className="duration-value">{fullDate(task.deadlineAt)}</strong>
            </div>
            <div className="duration-cell">
              <div className="metric-label">Context</div>
              <strong className="duration-value">{config.context}</strong>
            </div>
          </div>
          <textarea className="textarea" readOnly value={config.message} />
          <div className="button-row">
            {waHref ? (
              <a className="btn primary" href={waHref} target="_blank" rel="noreferrer">
                <Send size={13} />
                {config.actionLabel}
              </a>
            ) : (
              <span className="badge amber">Nomor WhatsApp penerima belum diisi</span>
            )}
            {editHref ? (
              <Link className="btn" href={editHref}>
                Isi Nomor WA
              </Link>
            ) : null}
            <Link className="btn" href={nextUrl}>
              Lewati
            </Link>
          </div>
        </div>

        <aside className="surface surface-pad stack">
          <h2 className="asset-title">Cara kerja</h2>
          <div className="subtle">Status task sudah berubah sebelum halaman ini tampil.</div>
          <div className="subtle">Klik tombol WhatsApp untuk membuka chat dengan pesan otomatis. Pesan tetap dikirim manual dari WhatsApp.</div>
        </aside>
      </section>
    </div>
  );
}
