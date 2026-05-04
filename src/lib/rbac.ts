// RBAC permissions per the spec §5.
// Permission strings follow `resource:action` convention.

// Roles are now fully tenant-defined — the only fixed names are
//  - "Super Admin": platform-level, gated by users.is_super_admin
//  - "Tenant Admin": auto-created per tenant, cannot be deleted
// Everything else is a starter template each tenant can keep, edit, or drop.
// `Role` therefore aliases to plain string; the list below is seed data only.
export type Role = string;
export const SUPER_ADMIN_ROLE = "Super Admin";
export const TENANT_ADMIN_ROLE = "Tenant Admin";

// Built-in role NAMES used to seed each new tenant on first /v1/roles read.
// They are not enforced anywhere — a tenant can rename or delete any of them
// (except Tenant Admin / Super Admin).
// Auto-seeded into the `roles` table for every new tenant. "Super Admin"
// and "Tenant Admin" are platform-protected (rename / delete blocked).
export const BUILT_IN_ROLE_TEMPLATES = [
  "Super Admin",
  "Tenant Admin",
] as const;

// Standard CRUD on every resource (`<resource>:read|create|update|delete`)
// plus contextual actions where the workflow requires them
// (test:submit/review/approve/sign, equipment:calibrate, report:export,
// audit:export, user:invite). The Settings group exposes
// settings/whitelabel/security as their own resources so each can be
// granted independently.
export type Permission =
  | "test:create" | "test:read" | "test:update" | "test:delete"
  | "test:submit" | "test:review" | "test:approve" | "test:sign"
  | "sample:create" | "sample:read" | "sample:update" | "sample:delete"
  | "project:create" | "project:read" | "project:update" | "project:delete"
  | "equipment:create" | "equipment:read" | "equipment:update" | "equipment:delete" | "equipment:calibrate"
  | "user:create" | "user:read" | "user:update" | "user:delete" | "user:invite"
  | "report:create" | "report:read" | "report:update" | "report:delete" | "report:export"
  | "audit:read" | "audit:export"
  | "billing:create" | "billing:read" | "billing:update" | "billing:delete"
  | "settings:read" | "settings:update"
  | "whitelabel:read" | "whitelabel:update"
  | "security:read" | "security:update";

// Full permission set — used for "Super Admin" and as the source-of-truth
// list every other role pulls from. Keep this in sync with the Permission
// union above and with DEFAULTS in civixlab-backend/src/routes/roles.ts.
const ALL_PERMS_LIST: Permission[] = [
  "test:create","test:read","test:update","test:delete",
  "test:submit","test:review","test:approve","test:sign",
  "sample:create","sample:read","sample:update","sample:delete",
  "project:create","project:read","project:update","project:delete",
  "equipment:create","equipment:read","equipment:update","equipment:delete","equipment:calibrate",
  "user:create","user:read","user:update","user:delete","user:invite",
  "report:create","report:read","report:update","report:delete","report:export",
  "audit:read","audit:export",
  "billing:create","billing:read","billing:update","billing:delete",
  "settings:read","settings:update",
  "whitelabel:read","whitelabel:update",
  "security:read","security:update",
];

// Super Admin is the only role with a hardcoded permission set.
// Tenant Admin is handled by rolePermissions() below (always full perms).
// Every other role lives in the tenant_roles table and is created at
// runtime by the tenant's admin via Role Management.
const PERMS: Record<string, Permission[]> = {
  "Super Admin": ALL_PERMS_LIST,
};

export const ALL_PERMISSIONS: Permission[] = ALL_PERMS_LIST;

// @deprecated — use BUILT_IN_ROLE_TEMPLATES; kept as an alias during the
// dynamic-roles rollout so older imports still resolve.
export const ALL_ROLES: readonly string[] = BUILT_IN_ROLE_TEMPLATES;

export function rolePermissions(role: string | undefined | null): Permission[] {
  if (!role) return [];
  // Tenant Admin always gets every permission, regardless of seed.
  if (role === TENANT_ADMIN_ROLE) return ALL_PERMS_LIST;
  return PERMS[role] ?? [];
}

export function hasPermission(role: string | undefined | null, perm: Permission): boolean {
  // Routed through rolePermissions so the Tenant Admin short-circuit is
  // honored even when "Tenant Admin" isn't in the PERMS map.
  return rolePermissions(role).includes(perm);
}
