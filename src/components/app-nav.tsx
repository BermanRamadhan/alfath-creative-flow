"use client";

import {
  Archive,
  BarChart3,
  CheckSquare,
  ClipboardList,
  FolderSearch,
  Home,
  Menu,
  Package,
  PlusCircle,
  Settings,
  Users,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavAlertKey } from "@/lib/nav-types";

export type AppNavItem = {
  id: NavAlertKey;
  href: string;
  label: string;
  icon: string;
  alert: boolean;
};

const icons: Record<string, LucideIcon> = {
  Archive,
  BarChart3,
  CheckSquare,
  ClipboardList,
  FolderSearch,
  Home,
  Package,
  PlusCircle,
  Settings,
  Users
};

const mobilePriority: Record<string, NavAlertKey[]> = {
  ADMIN: ["dashboard", "request", "task", "review", "bank"],
  ADVERTISER: ["dashboard", "request", "review", "bank", "reports"],
  CC: ["dashboard", "task", "materials", "reports", "settings"]
};

const mobileLabels: Partial<Record<NavAlertKey, string>> = {
  bank: "Bank",
  materials: "Bahan",
  products: "Produk",
  reports: "Report",
  settings: "Setting"
};

function itemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/" || pathname.startsWith("/dashboard");
  if (href === "/requests/new") return pathname.startsWith("/requests");
  if (href === "/bank-konten") return pathname.startsWith("/bank-konten");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AlertDot({ active }: { active: boolean }) {
  return active ? <span className="nav-dot" aria-label="Perlu ditindak" /> : null;
}

function NavLink({ item, compact = false, onClick }: { item: AppNavItem; compact?: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const Icon = icons[item.icon] ?? Home;
  const active = itemActive(pathname, item.href);

  return (
    <Link className={`${compact ? "mobile-nav-item" : "nav-item"}${active ? " active" : ""}`} href={item.href} onClick={onClick}>
      <span className="nav-icon-wrap">
        <Icon size={compact ? 18 : 15} />
        <AlertDot active={item.alert} />
      </span>
      <span>{compact ? mobileLabels[item.id] ?? item.label : item.label}</span>
    </Link>
  );
}

export function DesktopNav({ items }: { items: AppNavItem[] }) {
  return (
    <nav className="nav-list">
      {items.map((item) => (
        <NavLink item={item} key={item.id} />
      ))}
    </nav>
  );
}

export function MobileNav({ items, role }: { items: AppNavItem[]; role: string }) {
  const [open, setOpen] = useState(false);
  const priority = mobilePriority[role] ?? mobilePriority.ADMIN;
  const bottomItems = priority.map((id) => items.find((item) => item.id === id)).filter((item): item is AppNavItem => Boolean(item));
  const drawerItems = items.filter((item) => !bottomItems.some((bottom) => bottom.id === item.id));
  const drawerHasAlert = drawerItems.some((item) => item.alert);

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
        {bottomItems.map((item) => (
          <NavLink compact item={item} key={item.id} />
        ))}
        {drawerItems.length ? (
          <button className="mobile-nav-item" type="button" onClick={() => setOpen(true)}>
            <span className="nav-icon-wrap">
              <Menu size={18} />
              <AlertDot active={drawerHasAlert} />
            </span>
            <span>Lainnya</span>
          </button>
        ) : null}
      </nav>
      {open ? (
        <div className="mobile-drawer-layer">
          <button className="mobile-drawer-backdrop" type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <aside className="mobile-drawer" aria-label="Menu lainnya">
            <div className="mobile-drawer-head">
              <strong>Menu</strong>
              <button className="btn icon-only" type="button" onClick={() => setOpen(false)} aria-label="Tutup menu">
                <X size={14} />
              </button>
            </div>
            <div className="mobile-drawer-list">
              {drawerItems.map((item) => (
                <NavLink item={item} key={item.id} onClick={() => setOpen(false)} />
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
