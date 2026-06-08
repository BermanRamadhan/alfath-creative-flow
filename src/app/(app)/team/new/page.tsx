import { requireRole } from "@/lib/auth";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

export default async function NewTeamUserPage() {
  await requireRole(["ADMIN"]);
  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Team</p>
          <h1 className="page-title">User baru</h1>
        </div>
      </header>
      <form className="surface surface-pad form-grid" action="/api/team/create" method="post">
        <div className="field">
          <label>Username</label>
          <input className="input" name="username" required />
        </div>
        <div className="field">
          <label>Nama tampilan</label>
          <input className="input" name="displayName" required />
        </div>
        <div className="field">
          <label>Nomor WhatsApp</label>
          <input className="input" name="whatsappNumber" placeholder="62812..." />
        </div>
        <div className="field">
          <label>Role</label>
          <select className="select" name="role" defaultValue="CC">
            {ROLES.map((role) => (
              <option value={role} key={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" name="password" type="password" required />
        </div>
        <div className="field full">
          <button className="btn primary" type="submit">
            Buat User
          </button>
        </div>
      </form>
    </div>
  );
}
