import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContentRequestFields, LpRequestFields } from "@/components/request-forms";
import { requireRole } from "@/lib/auth";
import { REQUEST_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { fullDate } from "@/lib/utils";

export default async function RequestDraftDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const user = await requireRole(["ADMIN", "ADVERTISER"]);
  const draft = await db.requestDraft.findUnique({
    where: { id: params.id },
    include: { requester: true }
  });

  if (!draft) notFound();
  if (user.role !== "ADMIN" && draft.requesterId !== user.id) redirect("/forbidden");

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Draft Request</p>
          <h1 className="page-title">{draft.productName || REQUEST_TYPE_LABELS[draft.requestType] || "Draft"}</h1>
          <p className="page-copy">
            {REQUEST_TYPE_LABELS[draft.requestType] ?? draft.requestType} - {draft.requester.displayName} - Update {fullDate(draft.updatedAt)}
          </p>
        </div>
        <div className="button-row">
          <Link className="btn" href="/requests/drafts">
            Semua Draft
          </Link>
          <form action={`/api/request-drafts/${draft.id}/delete`} method="post">
            <button className="btn danger" type="submit">
              Hapus Draft
            </button>
          </form>
        </div>
      </header>

      {searchParams?.saved ? <span className="badge green">Draft tersimpan</span> : null}
      {searchParams?.error ? <span className="badge red">{searchParams.error}</span> : null}

      <form className="surface surface-pad form-grid" action={`/api/request-drafts/${draft.id}/submit`} method="post">
        <input type="hidden" name="draftId" value={draft.id} />
        {draft.requestType === "LP" ? (
          <LpRequestFields defaults={draft} useDeadlineFallback={false} />
        ) : (
          <ContentRequestFields defaults={draft} useDeadlineFallback={false} />
        )}
        <div className="field full">
          <div className="button-row">
            <button className="btn primary" type="submit">
              Kirim Request
            </button>
            <button className="btn" type="submit" formAction="/api/request-drafts/save" formNoValidate>
              Simpan Draft
            </button>
            <Link className="btn" href="/requests/new">
              Request Baru
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
