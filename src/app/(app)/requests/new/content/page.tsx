import { requireRole } from "@/lib/auth";
import { ContentRequestFields } from "@/components/request-forms";

export default async function NewContentRequestPage() {
  await requireRole(["ADMIN", "ADVERTISER"]);
  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Request Konten</p>
          <h1 className="page-title">Brief video dan gambar</h1>
          <p className="page-copy">CC boleh submit lebih banyak dari request. Saat ACC, setiap link asset masuk Bank Konten sendiri.</p>
        </div>
      </header>
      <form className="surface surface-pad form-grid" action="/api/requests/content" method="post">
        <ContentRequestFields />
        <div className="field full">
          <div className="button-row">
            <button className="btn primary" type="submit">
              Buat Request Konten
            </button>
            <button className="btn" type="submit" formAction="/api/request-drafts/save" formNoValidate>
              Simpan Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
