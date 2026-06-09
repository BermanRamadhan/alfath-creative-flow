import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { OFF_REASON_LABELS, OFF_REASONS } from "@/lib/constants";
import { dateInputValue } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser();
  const [adminWa, activeOffLog] = await Promise.all([
    db.appSetting.findUnique({ where: { key: "admin_whatsapp_number" } }),
    db.creatorStatusLog.findFirst({ where: { userId: user.id, status: "OFF", endedAt: null }, orderBy: { startedAt: "desc" } })
  ]);

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Settings</p>
          <h1 className="page-title">Personal dan global</h1>
        </div>
      </header>
      <section className="two-col">
        <div className="stack">
          <form className="surface surface-pad form-grid" action="/api/settings/profile" method="post">
            <div className="field">
              <label>Username</label>
              <input className="input" name="username" defaultValue={user.username} required />
            </div>
            <div className="field">
              <label>Nama tampilan</label>
              <input className="input" name="displayName" defaultValue={user.displayName} required />
            </div>
            <div className="field">
              <label>Nomor WhatsApp</label>
              <input className="input" name="whatsappNumber" defaultValue={user.whatsappNumber ?? ""} placeholder="62812..." />
            </div>
            <div className="field">
              <label>Mode gelap</label>
              <select className="select" name="darkMode" defaultValue={user.darkMode ? "true" : "false"}>
                <option value="false">Off</option>
                <option value="true">On</option>
              </select>
            </div>
            <div className="field">
              <label>Password baru</label>
              <input className="input" name="password" type="password" placeholder="Kosongkan jika tidak diganti" />
            </div>
            <div className="field full">
              <button className="btn primary" type="submit">
                Simpan Profile
              </button>
            </div>
          </form>

          {user.role === "CC" ? (
            <div className="surface surface-pad stack">
              <h2 className="asset-title">Status CC</h2>
              {activeOffLog ? (
                <span className="badge amber">Sedang OFF - {OFF_REASON_LABELS[activeOffLog.reason ?? ""] ?? activeOffLog.reason}</span>
              ) : (
                <span className="badge green">Sedang ON</span>
              )}
              <form className="stack" action="/api/settings/cc-off" method="post">
                <select className="select" name="reason" defaultValue="ISTIRAHAT">
                  {OFF_REASONS.map((reason) => (
                    <option value={reason} key={reason}>
                      {OFF_REASON_LABELS[reason] ?? reason}
                    </option>
                  ))}
                </select>
                <input className="input" name="expectedUntil" type="datetime-local" defaultValue={dateInputValue(new Date())} />
                <textarea className="textarea" name="note" placeholder="Note opsional" />
                <button className="btn warning" type="submit">
                  Set OFF
                </button>
              </form>
              <form action="/api/settings/cc-on" method="post">
                <button className="btn primary" type="submit">
                  Set ON
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {user.role === "ADMIN" ? (
          <form className="surface surface-pad stack" action="/api/settings/global" method="post">
            <h2 className="asset-title">Global settings</h2>
            <label className="field">
              Nomor WhatsApp admin
              <input className="input" name="adminWhatsappNumber" defaultValue={adminWa?.value ?? ""} />
            </label>
            <button className="btn primary" type="submit">
              Simpan Global
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
