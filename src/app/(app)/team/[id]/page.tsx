import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { OFF_REASON_LABELS, ROLES, ROLE_LABELS } from "@/lib/constants";
import { fullDate, formatDuration } from "@/lib/utils";

export default async function TeamUserDetailPage({ params }: { params: { id: string } }) {
  await requireRole(["ADMIN"]);
  const user = await db.user.findUnique({
    where: { id: params.id },
    include: { statusLogs: { orderBy: { startedAt: "desc" }, take: 12 } }
  });
  if (!user) notFound();

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Team Detail</p>
          <h1 className="page-title">{user.displayName}</h1>
          <p className="page-copy">@{user.username}</p>
        </div>
      </header>
      <section className="two-col">
        <div className="stack">
          <form className="surface surface-pad form-grid" action={`/api/team/${user.id}/update`} method="post">
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
              <label>Role</label>
              <select className="select" name="role" defaultValue={user.role}>
                {ROLES.map((role) => (
                  <option value={role} key={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Aktif</label>
              <select className="select" name="isActive" defaultValue={user.isActive ? "true" : "false"}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
            <div className="field full">
              <button className="btn primary" type="submit">
                Simpan
              </button>
            </div>
          </form>
          <form className="surface surface-pad stack" action={`/api/team/${user.id}/reset-password`} method="post">
            <h2 className="asset-title">Reset password</h2>
            <input className="input" name="password" type="password" required placeholder="Password baru" />
            <button className="btn warning" type="submit">
              Reset Password
            </button>
          </form>
        </div>
        <aside className="surface surface-pad stack">
          <h2 className="asset-title">CC status log</h2>
          {user.statusLogs.map((log) => (
            <div className="subtle" key={log.id}>
              <strong>{log.status}</strong> - {OFF_REASON_LABELS[log.reason ?? ""] ?? log.reason ?? "-"} - {fullDate(log.startedAt)} - {formatDuration(log.durationSeconds)}
            </div>
          ))}
        </aside>
      </section>
    </div>
  );
}
