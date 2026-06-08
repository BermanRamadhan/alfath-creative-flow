import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLATFORM_LABELS, STYLE_LABELS, USE_FRAME_LABELS } from "@/lib/constants";
import { fullDate, waMeHref } from "@/lib/utils";

export default async function RequestSuccessPage({ searchParams }: { searchParams?: { id?: string } }) {
  await requireUser();
  const request = searchParams?.id
    ? await db.workRequest.findUnique({
        where: { id: searchParams.id },
        include: { requester: true }
      })
    : null;
  const setting = await db.appSetting.findUnique({ where: { key: "admin_whatsapp_number" } });
  const adminNumber = setting?.value ?? "";
  const text = request
    ? request.requestType === "LP"
      ? `Halo Admin, ada request pekerjaan baru di Al-Fath Flow.\n\nTipe: LP\nProduk: ${request.productName}\nPlatform: ${PLATFORM_LABELS[request.postPlatform] ?? request.postPlatform}\nStyle: ${request.style ? STYLE_LABELS[request.style] : "-"}\nDeadline: ${fullDate(request.deadlineAt)}\nRequester: ${request.requester.displayName}\n\nMohon dicek.`
      : `Halo Admin, ada request pekerjaan baru di Al-Fath Flow.\n\nTipe: Konten\nProduk: ${request.productName}\nJumlah Video: ${request.videoAmount}\nJumlah Gambar: ${request.imageAmount}\nPlatform: ${PLATFORM_LABELS[request.postPlatform] ?? request.postPlatform}\nPakai Frame: ${request.useFrame ? USE_FRAME_LABELS[request.useFrame] : "-"}\nDeadline: ${fullDate(request.deadlineAt)}\nRequester: ${request.requester.displayName}\n\nMohon dicek.`
    : "";
  const waUrl = waMeHref(adminNumber, text);

  return (
    <div className="stack">
      <section className="surface surface-pad stack">
        <div>
          <p className="page-kicker">Request berhasil dibuat</p>
          <h1 className="page-title">{request?.title ?? "Request baru"}</h1>
          <p className="page-copy">Task sudah masuk ke Task Content dan bisa diklaim oleh CC.</p>
        </div>
        <div className="button-row">
          {waUrl ? (
            <a className="btn primary" href={waUrl} target="_blank" rel="noreferrer">
              Ya, kirim WhatsApp
            </a>
          ) : null}
          <Link className="btn" href="/dashboard">
            Nanti saja
          </Link>
          <Link className="btn" href={`/tasks/${request?.id ?? ""}`}>
            Lihat Task
          </Link>
        </div>
      </section>
    </div>
  );
}
