import { requireRole } from "@/lib/auth";
import { LpRequestFields } from "@/components/request-forms";

export default async function NewLpRequestPage() {
  await requireRole(["ADMIN", "ADVERTISER"]);
  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Request LP</p>
          <h1 className="page-title">Brief landing page</h1>
          <p className="page-copy">LP dihitung sebagai satu output. Referensi bisa banyak, tapi tetap disimpan sebagai link.</p>
        </div>
      </header>
      <form className="surface surface-pad form-grid" action="/api/requests/lp" method="post">
        <LpRequestFields />
        <div className="field full">
          <div className="button-row">
            <button className="btn primary" type="submit">
              Buat Request LP
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
