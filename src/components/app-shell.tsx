import {
  Archive,
  BarChart3,
  ClipboardList,
  Home,
  FolderSearch,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  Users,
  CheckSquare
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { canAccess } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "ADVERTISER", "CC"], icon: Home },
  { href: "/requests/new", label: "Request Baru", roles: ["ADMIN", "ADVERTISER"], icon: PlusCircle },
  { href: "/tasks", label: "Task Content", roles: ["ADMIN", "CC"], icon: ClipboardList },
  { href: "/review", label: "Review", roles: ["ADMIN", "ADVERTISER"], icon: CheckSquare },
  { href: "/bank-konten", label: "Bank Konten", roles: ["ADMIN", "ADVERTISER", "CC"], icon: Archive },
  { href: "/materials", label: "Mentahan", roles: ["ADMIN", "ADVERTISER", "CC"], icon: FolderSearch },
  { href: "/products", label: "Produk", roles: ["ADMIN", "ADVERTISER", "CC"], icon: Package },
  { href: "/reports", label: "Report", roles: ["ADMIN", "ADVERTISER", "CC"], icon: BarChart3 },
  { href: "/team", label: "Team", roles: ["ADMIN"], icon: Users },
  { href: "/settings", label: "Settings", roles: ["ADMIN", "ADVERTISER", "CC"], icon: Settings }
];

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { displayName: string; username: string; role: string; darkMode: boolean };
}) {
  const visibleNav = navItems.filter((item) => canAccess(user.role, item.roles));
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
          <nav className="nav-list">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="nav-item" href={item.href} key={item.href}>
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="main-area">
          <header className="topbar">
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
      </div>
    </div>
  );
}
