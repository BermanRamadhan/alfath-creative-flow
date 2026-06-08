import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/badge";
import { ContentRequestFields, LpRequestFields } from "@/components/request-forms";
import { requireRole } from "@/lib/auth";
import { PLATFORM_LABELS, REQUEST_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { fullDate } from "@/lib/utils";

export default async function EditRequestPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const request = await db.workRequest.findUnique({
    where: { id: params.id },
    include: { requester: true }
  });

  if (!request) notFound();
  if (user.role !== "ADMIN" && request.requesterId !== user.id) redirect("/forbidden");

  const canEdit = request.status === "BELUM";

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Edit Request</p>
          <h1 className="page-title">{request.title}</h1>
          <p className="page-copy">
            {REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType} - {PLATFORM_LABELS[request.postPlatform] ?? request.postPlatform} - Deadline{" "}
            {fullDate(request.deadlineAt)}
          </p>
        </div>
        <div className="button-row">
          <StatusBadge status={request.status} deadlineAt={request.deadlineAt} />
          <Link className="btn" href={`/tasks/${request.id}`}>
            Detail
          </Link>
        </div>
      </header>

      {searchParams?.error ? <span className="badge red">{searchParams.error}</span> : null}

      {!canEdit ? (
        <div className="surface surface-pad stack">
          <h2 className="asset-title">Request sudah mulai dikerjakan</h2>
          <Link className="btn primary" href={`/tasks/${request.id}`}>
            Buka Detail
          </Link>
        </div>
      ) : (
        <form className="surface surface-pad form-grid" action={`/api/requests/${request.id}/update`} method="post">
          {request.requestType === "LP" ? <LpRequestFields defaults={request} /> : <ContentRequestFields defaults={request} />}
          <div className="field full">
            <div className="button-row">
              <button className="btn primary" type="submit">
                Simpan Perubahan
              </button>
              <Link className="btn" href={`/tasks/${request.id}`}>
                Batal
              </Link>
            </div>
          </div>
        </form>
      )}

      {canEdit ? (
        <form className="surface surface-pad stack" action={`/api/requests/${request.id}/delete`} method="post">
          <h2 className="asset-title">Hapus Request</h2>
          <button className="btn danger" type="submit">
            Hapus Request
          </button>
        </form>
      ) : null}
    </div>
  );
}
