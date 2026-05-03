"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { UsersRound, Save, Plus, Trash2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { useApp } from "@/store/app-store";
import { ALL_PERMISSIONS, rolePermissions, SUPER_ADMIN_ROLE, type Permission } from "@/lib/rbac";
import { api } from "@/server/api";
import { toast } from "@/components/ui/toast";

// Each section keeps the standard CRUD order (create, read, update, delete)
// followed by any contextual actions specific to that resource.
const PERM_GROUPS: { title: string; perms: Permission[] }[] = [
  { title: "Tests",      perms: ["test:create","test:read","test:update","test:delete","test:submit","test:review","test:approve","test:sign"] },
  { title: "Samples",    perms: ["sample:create","sample:read","sample:update","sample:delete"] },
  { title: "Projects",   perms: ["project:create","project:read","project:update","project:delete"] },
  { title: "Equipment",  perms: ["equipment:create","equipment:read","equipment:update","equipment:delete","equipment:calibrate"] },
  { title: "Users",      perms: ["user:create","user:read","user:update","user:delete","user:invite"] },
  { title: "Reports",    perms: ["report:create","report:read","report:update","report:delete","report:export"] },
  { title: "Audit",      perms: ["audit:read","audit:export"] },
  { title: "Billing",    perms: ["billing:create","billing:read","billing:update","billing:delete"] },
  { title: "Settings",   perms: ["settings:read","settings:update"] },
  { title: "Whitelabel", perms: ["whitelabel:read","whitelabel:update"] },
  { title: "Security",   perms: ["security:read","security:update"] },
];

export default function RoleManagementPage() {
  const tt = useT();
  const canEdit = useCan("security:update");
  const isSuperAdmin = useApp((s) => s.user?.isSuperAdmin ?? false);

  const storedMatrix = useApp((s) => s.roleMatrix);
  const customRoles = useApp((s) => s.customRoles);
  const setRoleMatrix = useApp((s) => s.setRoleMatrix);
  const addCustomRoleAction = useApp((s) => s.addCustomRole);
  const removeCustomRoleAction = useApp((s) => s.removeCustomRole);

  // Roles fetched from /v1/roles on mount. Each entry knows whether it is
  // tenant-defined custom or a (now editable) starter template.
  const [serverRoles, setServerRoles] = useState<Array<{ name: string; isCustom: boolean }>>([]);

  // Resolve a role's effective permission set: server/tenant override → rbac default.
  const resolvePerms = (role: string): Set<Permission> =>
    new Set((storedMatrix[role] as Permission[] | undefined) ?? rolePermissions(role));

  // Hide Super Admin from non-super-admin actors. Every other role is the
  // tenant's own data, so we surface them all.
  const visibleRoles = useMemo<string[]>(
    () => serverRoles
      .map((r) => r.name)
      .filter((n) => isSuperAdmin || n !== SUPER_ADMIN_ROLE),
    [serverRoles, isSuperAdmin],
  );

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [newRoleName, setNewRoleName] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch the tenant's roles from the backend on mount and hydrate state.
  useEffect(() => {
    let cancelled = false;
    api.roles
      .list()
      .then((items) => {
        if (cancelled) return;
        for (const r of items) {
          setRoleMatrix(r.name, r.permissions);
          if (r.isCustom) addCustomRoleAction(r.name);
        }
        setServerRoles(items.map((r) => ({ name: r.name, isCustom: r.isCustom })));
        // Pick the first visible role as the initial selection.
        const first = items
          .map((r) => r.name)
          .find((n) => isSuperAdmin || n !== SUPER_ADMIN_ROLE);
        if (first) setSelectedRole((cur) => cur || first);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`Failed to load roles: ${msg}`);
      });
    return () => {
      cancelled = true;
    };
  }, [setRoleMatrix, addCustomRoleAction, isSuperAdmin]);

  const allRoleNames = [...serverRoles.map((r) => r.name), ...customRoles.map((r) => r.name)];

  const togglePerm = (role: string, perm: Permission) => {
    if (!canEdit) return;
    const set = resolvePerms(role);
    if (set.has(perm)) set.delete(perm);
    else set.add(perm);
    setRoleMatrix(role, Array.from(set));
  };

  const addCustomRole = async () => {
    const name = newRoleName.trim();
    if (!name || allRoleNames.includes(name)) return;
    try {
      await api.roles.create({ name, permissions: [] });
      addCustomRoleAction(name);
      setRoleMatrix(name, []);
      setServerRoles((prev) => [...prev, { name, isCustom: true }]);
      setNewRoleName("");
      setSelectedRole(name);
      toast.success(tt("Role created"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  const removeCustomRole = async (name: string) => {
    try {
      await api.roles.remove(name);
      removeCustomRoleAction(name);
      setServerRoles((prev) => prev.filter((r) => r.name !== name));
      if (selectedRole === name) setSelectedRole(visibleRoles.find((n) => n !== name) ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      await api.roles.update(selectedRole, Array.from(currentSet));
      toast.success(tt("Role permissions saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const isCustom = (name: string) => customRoles.some((r) => r.name === name);
  const currentSet = resolvePerms(selectedRole);
  const sizeOf = (name: string) => resolvePerms(name).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role management"
        description="Built-in roles plus tenant-defined custom roles, each with a permission set."
      />

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Role list */}
        <aside className="card p-4 space-y-1 self-start">
          <header className="flex items-center gap-2 mb-3">
            <UsersRound className="w-4 h-4 text-brand-600" />
            <h3 className="font-semibold text-sm">{tt("Roles")}</h3>
          </header>

          {visibleRoles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center justify-between ${
                selectedRole === r
                  ? "bg-brand-600/10 text-brand-700 dark:text-brand-300 font-semibold"
                  : "hover:bg-[rgb(var(--bg-soft))]"
              }`}
            >
              <span>{r}</span>
              <span className="text-[10px] text-[rgb(var(--muted))] font-mono">
                {sizeOf(r)}
              </span>
            </button>
          ))}

          {customRoles.length > 0 && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))] mt-3 mb-1 px-3">
                {tt("Custom")}
              </div>
              {customRoles.map((r) => (
                <div key={r.name} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(r.name)}
                    className={`flex-1 text-left px-3 py-1.5 rounded-lg text-sm flex items-center justify-between ${
                      selectedRole === r.name
                        ? "bg-brand-600/10 text-brand-700 dark:text-brand-300 font-semibold"
                        : "hover:bg-[rgb(var(--bg-soft))]"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-[rgb(var(--muted))] font-mono">
                      {sizeOf(r.name)}
                    </span>
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => removeCustomRole(r.name)}
                      className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                      aria-label="Remove role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          <div className="border-t border-[rgb(var(--border))] mt-3 pt-3">
            <Field label={tt("Add custom role")}>
              <div className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder={tt("Role name")}
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomRole())}
                  disabled={!canEdit}
                />
                <button type="button" className="btn btn-outline" onClick={addCustomRole} disabled={!canEdit || !newRoleName.trim()}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Field>
          </div>
        </aside>

        {/* Permission matrix for the selected role */}
        <section className="card p-6">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                {selectedRole}
                {isCustom(selectedRole) && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    {tt("custom")}
                  </span>
                )}
              </h3>
              <p className="help mt-1">
                {currentSet.size} / {ALL_PERMISSIONS.length} {tt("permissions granted")}
              </p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!canEdit || saving}>
              <Save className="w-4 h-4" /> {saving ? tt("Saving…") : tt("Save")}
            </button>
          </header>

          <div className="space-y-5">
            {PERM_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
                  {group.title}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.perms.map((perm) => {
                    const checked = currentSet.has(perm);
                    return (
                      <label
                        key={perm}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-mono ${
                          checked
                            ? "border-brand-500/50 bg-brand-500/5"
                            : "border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-soft))]"
                        } ${!canEdit ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePerm(selectedRole, perm)}
                          disabled={!canEdit}
                        />
                        <span>{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the security:update permission to edit roles.")}
        </div>
      )}
    </div>
  );
}
