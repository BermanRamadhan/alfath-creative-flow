import {
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { DesktopNav, MobileNav, type AppNavItem } from "@/components/app-nav";
import type { NavAlerts, NavAlertKey } from "@/lib/nav-types";

type NavItem = {
  id: NavAlertKey;
  href: string;
  label: string;
  roles: Role[];
  icon: string;
};

const navItems: NavItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "Home" },
  { id: "request", href: "/requests/new", label: "Request", roles: ["ADMIN", "ADVERTISER"], icon: "PlusCircle" },
  { id: "task", href: "/tasks", label: "Task", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "ClipboardList" },
  { id: "review", href: "/review", label: "Review", roles: ["ADMIN", "ADVERTISER"], icon: "CheckSquare" },
  { id: "bank", href: "/bank-konten", label: "Bank Konten", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "Archive" },
  { id: "materials", href: "/materials", label: "Mentahan", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "FolderSearch" },
  { id: "products", href: "/products", label: "Produk", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "Package" },
  { id: "reports", href: "/reports", label: "Report", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "BarChart3" },
  { id: "team", href: "/team", label: "Team", roles: ["ADMIN"], icon: "Users" },
  { id: "settings", href: "/settings", label: "Settings", roles: ["ADMIN", "ADVERTISER", "CC"], icon: "Settings" }
];

function canView(role: string, roles: Role[]) {
  return roles.includes(role as Role);
}

export function AppShell({
  children,
  user,
  alerts
}: {
  children: React.ReactNode;
  user: { displayName: string; username: string; role: string; darkMode: boolean };
  alerts: NavAlerts;
}) {
  const visibleNav: AppNavItem[] = navItems
    .filter((item) => canView(user.role, item.roles))
    .map((item) => ({
      id: item.id,
      href: item.href,
      label: item.label,
      icon: item.icon,
      alert: alerts[item.id]
    }));
  return (
    <div className={user.darkMode ? "dark" : ""}>
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand-lockup" href="/dashboard">
            <span className="brand-mark">AF</span>
            <span>
              <span className="brand-title">Al-Fath Flow</span>
              <span className="brand-subtitle">CreativeOps</span>
            </span>
          </Link>
          <DesktopNav items={visibleNav} />
        </aside>
        <main className="main-area">
          <header className="topbar">
            <Link className="mobile-brand" href="/dashboard">
              <span className="brand-mark">AF</span>
              <span>Flow</span>
            </Link>
            <div className="user-chip">
              <span>
                <strong>{user.displayName}</strong> - {ROLE_LABELS[user.role] ?? user.role}
              </span>
              <form action="/api/auth/logout" method="post">
                <button className="btn" type="submit" title="Logout">
                  <LogOut size={14} />
                </button>
              </form>
            </div>
          </header>
          <div className="content-frame">{children}</div>
        </main>
        <MobileNav items={visibleNav} role={user.role} />
      </div>
    </div>
  );
}
