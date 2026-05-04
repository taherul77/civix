"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, Building2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { useApp } from "@/store/app-store";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac";
import { api, type ApiRole } from "@/server/api";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

interface SuperTenantLite {
  id: string;
  name: string;
  subdomain: string;
}

const PROTECTED_NAMES = new Set(["Super Admin", "Tenant Admin"]);

export default function RoleSetupPage() {
  const tt = useT();
  const canEdit = useCan("security:update");
  const isSuperAdmin = useApp((s) => s.user?.isSuperAdmin ?? false);
  const ownTenant = useApp((s) => s.user?.tenant ?? "");

  // Super Admin company picker — Tenant Admin sees their own tenant.
  const [tenants, setTenants] = useState<SuperTenantLite[]>([]);
  const [tenantId, setTenantId] = useState<string>("");
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    apiFetch<{ items: SuperTenantLite[] }>("/v1/super/tenants")
      .then((out) => {
        if (cancelled) return;
        setTenants(out.items);
        if (out.items.length > 0) setTenantId((cur) => cur || out.items[0].id);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [isSuperAdmin]);

  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isSuperAdmin && !tenantId) return;
    api.roles
      .list(isSuperAdmin ? tenantId : undefined)
      .then((items) => {
        if (cancelled) return;
        // Hide Super Admin from non-super-admin actors.
        const filtered = items.filter((r) => isSuperAdmin || r.name !== SUPER_ADMIN_ROLE);
        setRoles(filtered);
      })
      .catch((e: unknown) => {
        toast.error(`Failed to load roles: ${e instanceof Error ? e.message : String(e)}`);
      });
    return () => { cancelled = true; };
  }, [isSuperAdmin, tenantId, reloadKey]);

  const addRole = async (e: FormEvent) => {
    e.preventDefault();
    const name = newRoleName.trim();
    if (!name) return;
    if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Role "${name}" already exists`);
      return;
    }
    setCreating(true);
    try {
      await api.roles.create({
        name,
        permissions: [],
        tenantId: isSuperAdmin ? tenantId : undefined,
      });
      setNewRoleName("");
      setReloadKey((k) => k + 1);
      toast.success(tt("Role created"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const removeRole = async (role: ApiRole) => {
    if (!confirm(`Remove role "${role.name}"?`)) return;
    try {
      await api.roles.remove(role.id);
      setReloadKey((k) => k + 1);
      toast.success(tt("Role removed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role setup"
        description={
          isSuperAdmin
            ? "Pick a company, then create or remove its roles. Permissions are assigned in Settings → Permissions."
            : `Create or remove roles in ${ownTenant || "your company"}. Permissions are assigned in Settings → Permissions.`
        }
      />

      {/* Super Admin company picker */}
      {isSuperAdmin && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
          <label className="text-sm font-semibold whitespace-nowrap">{tt("Company")}</label>
          <select
            className="input min-w-[260px]"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            {tenants.length === 0 && <option value="">{tt("No companies yet")}</option>}
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.subdomain}.civixlab.com
              </option>
            ))}
          </select>
          <span className="text-xs text-[rgb(var(--muted))]">
            {tt("Roles below belong to the selected company")}
          </span>
        </div>
      )}

      {/* Add role form */}
      {canEdit && (
        <form onSubmit={addRole} className="card p-4 flex flex-wrap items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
          <label className="text-sm font-semibold whitespace-nowrap">{tt("Add role")}</label>
          <input
            className="input flex-1 min-w-[220px]"
            placeholder={tt("Role name")}
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            disabled={creating || (isSuperAdmin && !tenantId)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating || !newRoleName.trim() || (isSuperAdmin && !tenantId)}
          >
            <Plus className="w-4 h-4" /> {creating ? tt("Adding…") : tt("Add")}
          </button>
        </form>
      )}

      {/* Roles table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>{tt("Role")}</th>
                <th>{tt("Type")}</th>
                <th>{tt("Created by")}</th>
                <th>{tt("Created")}</th>
                <th>{tt("Last updated by")}</th>
                <th>{tt("Updated")}</th>
                {canEdit && <th className="text-right">{tt("Actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => {
                const isProtected = PROTECTED_NAMES.has(r.name);
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td>
                      {r.isCustom ? (
                        <span className="badge bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          {tt("Custom")}
                        </span>
                      ) : (
                        <span className="badge bg-slate-500/10 text-slate-600 dark:text-slate-300">
                          {tt("Built-in")}
                        </span>
                      )}
                    </td>
                    <td className="text-sm">{r.createdBy ?? "—"}</td>
                    <td className="text-sm text-[rgb(var(--muted))]">{fmtDate(r.createdAt)}</td>
                    <td className="text-sm">{r.updatedBy ?? "—"}</td>
                    <td className="text-sm text-[rgb(var(--muted))]">{fmtDate(r.updatedAt)}</td>
                    {canEdit && (
                      <td className="text-right">
                        {isProtected ? (
                          <span className="text-[10px] text-[rgb(var(--muted))] uppercase tracking-wider">
                            {tt("Protected")}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeRole(r)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                            aria-label={tt("Remove role")}
                            title={tt("Remove role")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="text-center text-sm text-[rgb(var(--muted))] py-8">
                    {isSuperAdmin && !tenantId
                      ? tt("Pick a company to view its roles.")
                      : tt("No roles yet — add the first one above.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the security:update permission to manage roles.")}
        </div>
      )}
    </div>
  );
}
