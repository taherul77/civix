// Single source of truth for every page in the application — used by:
//   1. /settings/permissions to render the per-role action matrix
//   2. The sidebar to hide leaves the active role has no `view` access for
//
// Add a new page here whenever you add a new route under /(app)/...

export type PageAction = "view" | "create" | "edit" | "delete";
export const PAGE_ACTIONS: PageAction[] = ["view", "create", "edit", "delete"];

export interface PageDef {
  id: string;          // stable identifier — used as the key in role permission maps
  href: string;        // route path (must match the sidebar leaf)
  label: string;       // human label shown in the permissions UI
  module: string;      // grouping for the module tabs
  /** Default actions for a brand-new role — typically `view` only. */
  defaultActions?: Partial<Record<PageAction, boolean>>;
}

export const PAGES: PageDef[] = [
  // Dashboard
  { id: "dashboard",        href: "/dashboard",        label: "Dashboard",        module: "Dashboard" },
  { id: "admin-dashboard",  href: "/admin-dashboard",  label: "Admin dashboard",  module: "Dashboard" },

  // Operations
  { id: "projects",         href: "/projects",         label: "Projects",         module: "Operations" },
  { id: "samples",          href: "/samples",          label: "Samples",          module: "Operations" },
  { id: "tests",            href: "/tests",            label: "Tests",            module: "Operations" },
  { id: "review",           href: "/review",           label: "Review queue",     module: "Operations" },

  // Reports
  { id: "reports",          href: "/reports",          label: "Reports",          module: "Reports" },

  // Visualize
  { id: "calendar",         href: "/calendar",         label: "Calendar",         module: "Visualize" },
  { id: "map",              href: "/map",              label: "Sample map",       module: "Visualize" },
  { id: "notifications",    href: "/notifications",    label: "Alerts",           module: "Visualize" },

  // Lab
  { id: "equipment",        href: "/equipment",        label: "Equipment",        module: "Lab" },
  { id: "field",            href: "/field",            label: "Field (mobile)",   module: "Lab" },
  { id: "audit",            href: "/audit",            label: "Audit log",        module: "Lab" },

  // Master setup
  { id: "company",          href: "/company",          label: "Company setup",    module: "Master setup" },
  { id: "laboratory",       href: "/laboratory",       label: "Laboratory setup", module: "Master setup" },
  { id: "departments",      href: "/departments",      label: "Department setup", module: "Master setup" },
  { id: "clients",          href: "/clients",          label: "Client setup",     module: "Master setup" },

  // Admin
  { id: "users",            href: "/users",            label: "Users",            module: "Admin" },
  { id: "security",         href: "/security",         label: "Security",         module: "Admin" },
  { id: "white-label",      href: "/white-label",      label: "White-label",      module: "Admin" },
  { id: "billing",          href: "/billing",          label: "Billing",          module: "Admin" },

  // Settings
  { id: "settings",             href: "/settings",             label: "General",          module: "Settings" },
  { id: "settings-profile",     href: "/settings/profile",     label: "Profile setting",  module: "Settings" },
  { id: "settings-permissions", href: "/settings/permissions", label: "Page permissions", module: "Settings" },
  { id: "settings-roles",       href: "/settings/roles",       label: "Role management",  module: "Settings" },
];

export const PAGE_BY_HREF = Object.fromEntries(PAGES.map((p) => [p.href, p])) as Record<string, PageDef>;
export const PAGE_BY_ID   = Object.fromEntries(PAGES.map((p) => [p.id,   p])) as Record<string, PageDef>;

export const PAGE_MODULES = Array.from(new Set(PAGES.map((p) => p.module)));

export type RolePagePermissions = Record<string, Record<PageAction, boolean>>;
export type AllRolePermissions  = Record<string, RolePagePermissions>;

/** Build the default permission set for a role — view-only on every page. */
export function defaultRolePermissions(): RolePagePermissions {
  const out: RolePagePermissions = {};
  for (const p of PAGES) {
    out[p.id] = {
      view:   p.defaultActions?.view   ?? true,
      create: p.defaultActions?.create ?? false,
      edit:   p.defaultActions?.edit   ?? false,
      delete: p.defaultActions?.delete ?? false,
    };
  }
  return out;
}

/** Permission set for an admin/owner — every action on every page. */
export function fullRolePermissions(): RolePagePermissions {
  const out: RolePagePermissions = {};
  for (const p of PAGES) {
    out[p.id] = { view: true, create: true, edit: true, delete: true };
  }
  return out;
}
