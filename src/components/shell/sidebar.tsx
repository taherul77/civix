"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
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
  Building2,
  Cog,
  ChevronDown,
  ChevronRight,
  UserCog,
  ShieldHalf,
  UsersRound,
  Crown,
  Briefcase,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { t, useT, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PAGE_BY_HREF } from "@/lib/page-catalog";

type IconType = typeof LayoutDashboard;

interface LeafItem {
  href: string;
  key: DictKey | string;
  label?: string;
  icon: IconType;
  badge?: string;
  badgeTone?: "rose" | "cyan" | "amber";
}
interface BranchItem {
  key: string;
  label: string;
  icon: IconType;
  children: NavItem[];
}
type NavItem = LeafItem | BranchItem;
const isBranch = (it: NavItem): it is BranchItem =>
  (it as BranchItem).children !== undefined;

// Marker key — branches with this key only render when the active session
// is a Super Admin.
const SUPER_ONLY_KEY = "super";

// All top-level entries are collapsible branches (no group section titles).
// The Super Admin branch is appended to the END of the list further down so
// it renders at the bottom of the sidebar (above the footer chip).
const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "",
    items: [
      {
        key: "dashboard-group",
        label: "Dashboard",
        icon: LayoutDashboard,
        children: [
          { href: "/dashboard",       key: "dashboard",       icon: LayoutDashboard, badge: "9+", badgeTone: "rose" },
          { href: "/admin-dashboard", key: "admin-dashboard", label: "Admin dashboard", icon: ShieldCheck },
        ],
      },
      {
        key: "operations",
        label: "Operations",
        icon: FolderKanban,
        children: [
          { href: "/projects",  key: "projects",  icon: FolderKanban },
          { href: "/samples",   key: "samples",   icon: Beaker },
          { href: "/tests",     key: "tests",     icon: TestTube2 },
          { href: "/review",    key: "review",    label: "Review queue", icon: ClipboardCheck, badge: "3", badgeTone: "amber" },
        ],
      },
      {
        key: "reports-group",
        label: "Reports",
        icon: FileBarChart2,
        children: [
          { href: "/reports", key: "reports", icon: FileBarChart2 },
        ],
      },
      {
        key: "visualize",
        label: "Visualize",
        icon: Map,
        children: [
          { href: "/calendar",      key: "calendar",      label: "Calendar",    icon: CalendarDays },
          { href: "/map",           key: "map",           label: "Sample map",  icon: Map },
          // { href: "/notifications", key: "notifications", label: "Alerts",      icon: Bell },
        ],
      },
      {
        key: "lab",
        label: "Lab",
        icon: FlaskConical,
        children: [
          { href: "/equipment", key: "equipment", icon: Wrench },
          // { href: "/field",     key: "field",     label: "Field (mobile)", icon: Smartphone },
          // { href: "/audit",     key: "audit",     label: "Audit log",      icon: ShieldCheck },
        ],
      },
      {
        key: "master-setup",
        label: "Master setup",
        icon: Cog,
        children: [
          { href: "/company",    key: "company",    label: "Company setup",    icon: Building2 },
          { href: "/laboratory", key: "laboratory", label: "Laboratory setup", icon: FlaskConical },
          { href: "/departments", key: "departments", label: "Department setup", icon: UsersRound },
          { href: "/clients",    key: "clients",    label: "Client setup",     icon: Briefcase },
        ],
      },
      {
        key: "admin",
        label: "Admin",
        icon: ShieldCheck,
        children: [
          { href: "/users",       key: "users",       icon: Users },
          // { href: "/security",    key: "security",    label: "Security",    icon: KeyRound },
          // { href: "/white-label", key: "white-label", label: "White-label", icon: Palette },
          // { href: "/billing",     key: "billing",     label: "Billing",     icon: Receipt },
        ],
      },
      // Settings as its own top-level branch, separate from Admin.
      {
        key: "settings",
        label: "Settings",
        icon: Settings,
        children: [
          { href: "/settings",             key: "settings-general", label: "General",          icon: Settings },
          { href: "/settings/profile",     key: "profile-setting",  label: "Profile setting",  icon: UserCog },
          { href: "/settings/permissions", key: "page-permissions", label: "Page permissions", icon: ShieldHalf },
          { href: "/settings/roles",       key: "role-management",  label: "Role management",  icon: UsersRound },
        ],
      },
      // Super Admin branch — last item in the menu so it sits at the bottom
      // of the sidebar (just above the footer chip). Hidden from non-super
      // users by the visibleGroups filter below.
      {
        key: SUPER_ONLY_KEY,
        label: "Super Admin",
        icon: Crown,
        children: [
          { href: "/super", key: "super-tenants", label: "Companies", icon: Building2 },
        ],
      },
    ],
  },
];

const badgeToneMap = {
  rose:  "bg-rose-500 text-white",
  cyan:  "bg-cyan2-500 text-white",
  amber: "bg-amber-500 text-white",
} as const;

function branchContainsActive(branch: BranchItem, pathname: string): boolean {
  for (const child of branch.children) {
    if (isBranch(child)) {
      if (branchContainsActive(child, pathname)) return true;
    } else if (pathname === child.href || pathname.startsWith(child.href + "/")) {
      return true;
    }
  }
  return false;
}

function collectBranchKeysContainingActive(items: NavItem[], pathname: string): string[] {
  const out: string[] = [];
  for (const it of items) {
    if (isBranch(it) && branchContainsActive(it, pathname)) {
      out.push(it.key);
      out.push(...collectBranchKeysContainingActive(it.children, pathname));
    }
  }
  return out;
}

// Apply per-role page-permission visibility:
//  - Leaf: hidden if the role has no `view` access for that page.
//          Pages not in the catalog default to visible.
//  - Branch: hidden if all children get filtered out.
function filterByViewAccess(
  items: NavItem[],
  canSee: (pageId: string) => boolean
): NavItem[] {
  const out: NavItem[] = [];
  for (const it of items) {
    if (isBranch(it)) {
      const filteredChildren = filterByViewAccess(it.children, canSee);
      if (filteredChildren.length > 0) {
        out.push({ ...it, children: filteredChildren });
      }
    } else {
      const def = PAGE_BY_HREF[it.href];
      if (!def || canSee(def.id)) out.push(it);
    }
  }
  return out;
}

export function Sidebar() {
  const pathname = usePathname();
  const { lang, sidebarCollapsed } = useApp();
  const user = useApp((s) => s.user);
  const hasPageAction = useApp((s) => s.hasPageAction);
  const pagePermissions = useApp((s) => s.pagePermissions);
  const tt = useT();
  const collapsed = sidebarCollapsed;

  // Filter the entire menu by:
  //   1. Super Admin gating — the Super branch only appears for super admins.
  //   2. Per-role page-view permissions from the matrix. Super Admin bypasses
  //      this entirely (hasPageAction returns true for "Super Admin"), so they
  //      see every menu and can enter any tenant via /super.
  // Pages missing from the catalog default to visible. Branches with no
  // remaining visible children are dropped entirely.
  const visibleGroups = useMemo(() => {
    const role = user?.role ?? null;
    const isSuper = !!user?.isSuperAdmin;
    const canSee = (pageId: string) => hasPageAction(role, pageId, "view");
    return groups.map((g) => ({
      ...g,
      items: g.items
        .filter((item) => {
          // Super branch — super admins only.
          if (isBranch(item) && item.key === SUPER_ONLY_KEY) return isSuper;
          return true;
        })
        .map((item) => {
          // Super branch is shown as-is; everything else passes through the
          // view-permission filter. Super Admin always passes.
          if (isBranch(item) && item.key === SUPER_ONLY_KEY) return item;
          const filtered = filterByViewAccess([item], canSee);
          return filtered[0];
        })
        .filter((item): item is NavItem => item !== undefined),
    }));
    // pagePermissions in deps so toggling perms in /settings/permissions
    // re-renders the sidebar live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.isSuperAdmin, pagePermissions, hasPageAction]);

  // Auto-open any branch that contains the active route on first render.
  const initialOpen = useMemo(() => {
    const set = new Set<string>();
    for (const g of visibleGroups) {
      collectBranchKeysContainingActive(g.items, pathname).forEach((k) => set.add(k));
    }
    return set;
  }, [pathname, visibleGroups]);
  const [expanded, setExpanded] = useState<Set<string>>(initialOpen);
  const toggle = (k: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const renderItem = (item: NavItem, depth: number): React.ReactNode => {
    if (isBranch(item)) {
      const containsActive = branchContainsActive(item, pathname);
      const open = expanded.has(item.key) || containsActive;
      if (collapsed) {
        // Collapsed sidebar — branches render as a static icon-only button
        // with a tooltip; children are hidden until the sidebar is expanded.
        return (
          <div key={item.key} className="nav-item group relative justify-center px-2.5 py-2.5">
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="tooltip">{tt(item.label)}</span>
          </div>
        );
      }
      return (
        <div key={item.key}>
          <button
            type="button"
            onClick={() => toggle(item.key)}
            className={cn("nav-item w-full text-left", containsActive && "nav-item-active")}
            style={{ paddingLeft: `${0.75 + depth * 0.875}rem` }}
            aria-expanded={open}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="sidebar-label flex-1 truncate">{tt(item.label)}</span>
            {open
              ? <ChevronDown  className="w-4 h-4 shrink-0 opacity-70" />
              : <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />}
          </button>
          {open && (
            <div className="space-y-0.5 mt-0.5">
              {item.children.map((c) => renderItem(c, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    const baseLabel = item.label ?? t(lang, item.key as DictKey);
    const text = tt(baseLabel);
    const Icon = item.icon;
    const badgeTone = item.badgeTone ?? "rose";
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "nav-item group relative",
          active && "nav-item-active",
          collapsed && "justify-center px-2.5 py-2.5"
        )}
        style={!collapsed ? { paddingLeft: `${0.75 + depth * 0.875}rem` } : undefined}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="sidebar-label flex-1 truncate">{text}</span>
            {item.badge && (
              <span className={cn(
                "sidebar-label inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold",
                badgeToneMap[badgeTone]
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && (
          <>
            {item.badge && (
              <span className={cn(
                "absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[rgb(var(--sidebar))] dark:ring-[#0a1322]",
                badgeTone === "rose" && "bg-rose-500",
                badgeTone === "cyan" && "bg-cyan2-500",
                badgeTone === "amber" && "bg-amber-500"
              )} />
            )}
            <span className="tooltip">{text}{item.badge ? ` (${item.badge})` : ""}</span>
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "sidebar hidden md:flex shrink-0 flex-col bg-[rgb(var(--sidebar))] dark:bg-sidebar-dark border-r border-[rgb(var(--border))] sticky top-0 h-screen z-20",
        collapsed ? "w-[80px] sidebar-collapsed" : "w-[260px]"
      )}
    >
      {/* Brand */}
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
            <div className="text-xl font-bold tracking-tight gradient-text">{tt(t(lang, "appName"))}</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[rgb(var(--muted))] -mt-0.5">
              {tt("ISO 17025 · SAAC")}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4", collapsed ? "px-2.5" : "px-4")}>
        {visibleGroups.map((g, gi) => (
          <div key={g.title || `group-${gi}`} className="mb-4">
            {g.title && (
              <div className={cn(
                "sidebar-section-title px-3 mb-1.5 text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--muted))] font-bold",
                collapsed && "h-0 mb-0 overflow-hidden"
              )}>
                {tt(g.title)}
              </div>
            )}
            <div className="space-y-0.5">
              {g.items.map((item) => renderItem(item, 0))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-label mx-4 mb-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan2-500/10 border border-emerald-500/20 dark:border-emerald-500/15 p-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-gradient grid place-items-center text-white shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">{tt("SBC 304 Compliant")}</div>
                <div className="text-[10px] text-[rgb(var(--muted))]">{tt("SASO · GSO · ASTM")}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
