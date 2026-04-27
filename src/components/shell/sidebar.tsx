"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  TestTube2,
  FlaskConical,
  FileBarChart2,
  Wrench,
  Users,
  Settings,
  Beaker,
  CalendarDays,
  Map,
  ShieldCheck,
  Smartphone,
  Palette,
  Receipt,
  KeyRound,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { t, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Item { href: string; key: DictKey | string; label?: string; icon: typeof LayoutDashboard; badge?: string; badgeTone?: "rose" | "cyan" | "amber" }

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard",     key: "dashboard",     icon: LayoutDashboard, badge: "9+", badgeTone: "rose" },
      { href: "/projects",      key: "projects",      icon: FolderKanban },
      { href: "/samples",       key: "samples",       icon: Beaker },
      { href: "/tests",         key: "tests",         icon: TestTube2 },
      { href: "/review",        key: "review",        label: "Review queue", icon: ClipboardCheck, badge: "3", badgeTone: "amber" },
      { href: "/reports",       key: "reports",       icon: FileBarChart2 },
    ],
  },
  {
    title: "Visualize",
    items: [
      { href: "/calendar",      key: "calendar",      label: "Calendar",    icon: CalendarDays },
      { href: "/map",           key: "map",           label: "Sample map",  icon: Map },
      { href: "/notifications", key: "notifications", label: "Alerts",      icon: Bell },
    ],
  },
  {
    title: "Lab",
    items: [
      { href: "/equipment",     key: "equipment",     icon: Wrench },
      { href: "/field",         key: "field",         label: "Field (mobile)", icon: Smartphone },
      { href: "/audit",         key: "audit",         label: "Audit log",   icon: ShieldCheck },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/users",         key: "users",         icon: Users },
      { href: "/security",      key: "security",      label: "Security",    icon: KeyRound },
      { href: "/white-label",   key: "white-label",   label: "White-label", icon: Palette },
      { href: "/billing",       key: "billing",       label: "Billing",     icon: Receipt },
      { href: "/settings",      key: "settings",      icon: Settings },
    ],
  },
];

const badgeToneMap = {
  rose:  "bg-rose-500 text-white",
  cyan:  "bg-cyan2-500 text-white",
  amber: "bg-amber-500 text-white",
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { lang, sidebarCollapsed } = useApp();
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        "sidebar hidden md:flex shrink-0 flex-col bg-[rgb(var(--sidebar))] dark:bg-sidebar-dark border-r border-[rgb(var(--border))] sticky top-0 h-screen z-20",
        collapsed ? "w-[80px] sidebar-collapsed" : "w-[260px]"
      )}
    >
      {/* Brand — fixed, same height as topbar (72px), shares its bottom border */}
      <div className={cn(
        "h-[72px] flex items-center gap-2.5 px-5 shrink-0 border-b border-[rgb(var(--border))]",
        collapsed && "justify-center px-2"
      )}>
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center text-white shadow-glow">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-brand-gradient blur-lg opacity-40 -z-10" />
        </div>
        {!collapsed && (
          <div className="sidebar-label">
            <div className="text-xl font-bold tracking-tight gradient-text">{t(lang, "appName")}</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--muted))] -mt-0.5">
              ISO 17025 · SAAC
            </div>
          </div>
        )}
      </div>

      {/* Nav (only this scrolls) */}
      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4", collapsed ? "px-2.5" : "px-4")}>
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <div className={cn(
              "sidebar-section-title px-3 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--muted))] font-bold",
              collapsed && "h-0 mb-0 overflow-hidden"
            )}>
              {g.title}
            </div>
            <div className="space-y-0.5">
              {g.items.map(({ href, key, label, icon: Icon, badge, badgeTone = "rose" }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                const text = label ?? t(lang, key as DictKey);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "nav-item group relative",
                      active && "nav-item-active",
                      collapsed && "justify-center px-2.5 py-2.5"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="sidebar-label flex-1 truncate">{text}</span>
                        {badge && (
                          <span className={cn(
                            "sidebar-label inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold",
                            badgeToneMap[badgeTone]
                          )}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && (
                      <>
                        {badge && (
                          <span className={cn(
                            "absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[rgb(var(--sidebar))] dark:ring-[#0a1322]",
                            badgeTone === "rose" && "bg-rose-500",
                            badgeTone === "cyan" && "bg-cyan2-500",
                            badgeTone === "amber" && "bg-amber-500"
                          )} />
                        )}
                        <span className="tooltip">{text}{badge ? ` (${badge})` : ""}</span>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer compliance chip */}
      {!collapsed && (
        <div className="sidebar-label mx-4 mb-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan2-500/10 border border-emerald-500/20 dark:border-emerald-500/15 p-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-gradient grid place-items-center text-white shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">SBC 304 Compliant</div>
                <div className="text-[10px] text-[rgb(var(--muted))]">SASO · GSO · ASTM</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
