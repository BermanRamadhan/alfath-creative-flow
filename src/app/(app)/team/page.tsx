import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { OFF_REASON_LABELS, ROLE_LABELS } from "@/lib/constants";

export default async function TeamPage() {
  await requireRole(["ADMIN"]);
  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
    include: { statusLogs: { orderBy: { startedAt: "desc" }, take: 1 } }
  });

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Team</p>
          <h1 className="page-title">User dan status CC</h1>
        </div>
        <Link className="btn primary" href="/team/new">
          User Baru
        </Link>
      </header>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>WhatsApp</th>
              <th>Role</th>
              <th>Status</th>
              <th>CC ON/OFF</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.displayName}</strong>
                  <div className="subtle">@{user.username}</div>
                </td>
                <td>{user.whatsappNumber ? <span className="badge green">{user.whatsappNumber}</span> : <span className="badge amber">Belum ada</span>}</td>
                <td>{ROLE_LABELS[user.role] ?? user.role}</td>
                <td>{user.isActive ? <span className="badge green">Aktif</span> : <span className="badge red">Nonaktif</span>}</td>
                <td>
                  {user.role === "CC" ? (
                    user.statusLogs[0]?.status === "OFF" && !user.statusLogs[0].endedAt ? (
                      <span className="badge amber">OFF - {OFF_REASON_LABELS[user.statusLogs[0].reason ?? ""] ?? user.statusLogs[0].reason}</span>
                    ) : (
                      <span className="badge green">ON</span>
                    )
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <Link className="btn" href={`/team/${user.id}`}>
                    Ubah
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
