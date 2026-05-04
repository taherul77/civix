"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, Eye, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { useApp } from "@/store/app-store";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac";
import { api, type ApiRole } from "@/server/api";
import { apiFetch } from "@/lib/api-client";
import { mutate } from "@/server/mutate";
import { toast } from "@/components/ui/toast";

interface SuperTenantLite {
  id: string;
  name: string;
  subdomain: string;
}

const PROTECTED_NAMES = new Set(["Super Admin", "Tenant Admin"]);

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

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
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<ApiRole | null>(null);
  const [editing, setEditing] = useState<ApiRole | null>(null);
  const [removing, setRemoving] = useState<ApiRole | null>(null);

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

  const refetch = () => setReloadKey((k) => k + 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role setup"
        description={
          isSuperAdmin
            ? "Pick a company, then manage its roles. Permissions are assigned in Settings → Permissions."
            : `Manage roles in ${ownTenant || "your company"}. Permissions are assigned in Settings → Permissions.`
        }
        actions={canEdit && (!isSuperAdmin || !!tenantId) ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-4 h-4" /> {tt("Add role")}
          </button>
        ) : null}
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

      {/* Roles table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>{tt("Role")}</th>
                <th>{tt("Type")}</th>
                <th>{tt("Permissions")}</th>
                <th>{tt("Created")}</th>
                <th>{tt("Updated")}</th>
                <th className="text-right">{tt("Actions")}</th>
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
                    <td className="text-sm font-mono">{r.permissions.length}</td>
                    <td className="text-xs">
                      <div>{formatDateTime(r.createdAt)}</div>
                      {r.createdBy && <div className="text-[rgb(var(--muted))]">{tt("by")} {r.createdBy}</div>}
                    </td>
                    <td className="text-xs">
                      <div>{formatDateTime(r.updatedAt)}</div>
                      {r.updatedBy && <div className="text-[rgb(var(--muted))]">{tt("by")} {r.updatedBy}</div>}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(r)}
                          className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]"
                          title={tt("View")}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && !isProtected && (
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]"
                            title={tt("Edit")}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && !isProtected && (
                          <button
                            type="button"
                            onClick={() => setRemoving(r)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                            title={tt("Delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isProtected && (
                          <span className="text-[10px] text-[rgb(var(--muted))] uppercase tracking-wider px-2">
                            {tt("Protected")}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-[rgb(var(--muted))] py-8">
                    {isSuperAdmin && !tenantId
                      ? tt("Pick a company to view its roles.")
                      : tt("No roles yet — add the first one.")}
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

      {adding && (
        <NewRoleModal
          existing={roles.map((r) => r.name)}
          tenantId={isSuperAdmin ? tenantId : undefined}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); refetch(); }}
        />
      )}
      {viewing && (
        <ViewRoleModal
          role={viewing}
          onClose={() => setViewing(null)}
        />
      )}
      {editing && (
        <EditRoleModal
          role={editing}
          existing={roles.map((r) => r.name)}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
      {removing && (
        <RemoveRoleModal
          role={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setRemoving(null); refetch(); }}
        />
      )}
    </div>
  );
}

function NewRoleModal({
  existing, tenantId, onClose, onSaved,
}: {
  existing: string[];
  tenantId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tt = useT();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    if (existing.some((n) => n.toLowerCase() === v.toLowerCase())) {
      toast.error(`Role "${v}" already exists`);
      return;
    }
    setSubmitting(true);
    const out = await mutate(
      () => api.roles.create({ name: v, permissions: [], tenantId }),
      tt("Role created"),
    );
    setSubmitting(false);
    if (out) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Add role")}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="new-role-form" className="btn btn-primary" disabled={submitting || !name.trim()}>
            {submitting ? tt("Saving…") : tt("Save")}
          </button>
        </>
      }
    >
      <form id="new-role-form" onSubmit={submit} className="grid grid-cols-1 gap-4">
        <Field label={tt("Role name")}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tt("e.g. Lab Engineer")}
            required
            autoFocus
          />
        </Field>
        <p className="help">
          {tt("New roles start with no permissions. Grant capabilities in Settings → Permissions after creating.")}
        </p>
      </form>
    </Modal>
  );
}

function ViewRoleModal({ role, onClose }: { role: ApiRole; onClose: () => void }) {
  const tt = useT();
  const isProtected = PROTECTED_NAMES.has(role.name);
  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Role details")}
      size="lg"
      footer={<button type="button" className="btn btn-outline" onClick={onClose}>{tt("Close")}</button>}
    >
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div><dt className="help">{tt("Name")}</dt><dd className="font-medium">{role.name}</dd></div>
        <div>
          <dt className="help">{tt("Type")}</dt>
          <dd>
            {role.isCustom ? tt("Custom") : tt("Built-in")}
            {isProtected && <span className="ml-2 text-[rgb(var(--muted))]">({tt("protected")})</span>}
          </dd>
        </div>
        <div>
          <dt className="help">{tt("Created")}</dt>
          <dd>{formatDateTime(role.createdAt)}{role.createdBy ? ` ${tt("by")} ${role.createdBy}` : ""}</dd>
        </div>
        <div>
          <dt className="help">{tt("Updated")}</dt>
          <dd>{formatDateTime(role.updatedAt)}{role.updatedBy ? ` ${tt("by")} ${role.updatedBy}` : ""}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="help">{tt("Permissions")} ({role.permissions.length})</dt>
          <dd>
            {role.permissions.length === 0 ? (
              <span className="text-[rgb(var(--muted))] italic">{tt("No permissions assigned — manage in Settings → Permissions.")}</span>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}

function EditRoleModal({
  role, existing, onClose, onSaved,
}: {
  role: ApiRole;
  existing: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const tt = useT();
  const [name, setName] = useState(role.name);
  const [submitting, setSubmitting] = useState(false);

  const otherNames = useMemo(
    () => existing.filter((n) => n !== role.name).map((n) => n.toLowerCase()),
    [existing, role.name],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    if (otherNames.includes(v.toLowerCase())) {
      toast.error(`Role "${v}" already exists`);
      return;
    }
    if (v === role.name) {
      onSaved();
      return;
    }
    setSubmitting(true);
    const out = await mutate(
      () => api.roles.update(role.id, { name: v }),
      tt(`Updated ${role.name}`),
    );
    setSubmitting(false);
    if (out) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Edit role")}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="edit-role-form" className="btn btn-primary" disabled={submitting || !name.trim()}>
            {submitting ? tt("Saving…") : tt("Save")}
          </button>
        </>
      }
    >
      <form id="edit-role-form" onSubmit={submit} className="grid grid-cols-1 gap-4">
        <Field label={tt("Role name")}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <p className="help">
          {tt("Permissions for this role are managed in Settings → Permissions.")}
        </p>
        <div className="text-xs text-[rgb(var(--muted))] grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-[rgb(var(--border))]">
          <div>
            <div className="help">{tt("Created")}</div>
            <div>{formatDateTime(role.createdAt)}{role.createdBy ? ` ${tt("by")} ${role.createdBy}` : ""}</div>
          </div>
          <div>
            <div className="help">{tt("Updated")}</div>
            <div>{formatDateTime(role.updatedAt)}{role.updatedBy ? ` ${tt("by")} ${role.updatedBy}` : ""}</div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function RemoveRoleModal({
  role, onClose, onRemoved,
}: {
  role: ApiRole;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const tt = useT();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const out = await mutate(
      () => api.roles.remove(role.id).then(() => true),
      tt(`Deleted ${role.name}`),
    );
    setSubmitting(false);
    if (out) onRemoved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Delete role")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="button" className="btn bg-rose-600 hover:bg-rose-700 text-white" onClick={submit} disabled={submitting}>
            {submitting ? tt("Deleting…") : tt("Delete")}
          </button>
        </>
      }
    >
      <p className="text-sm">
        {tt(`Delete role "${role.name}"? Users currently assigned this role will keep it on their membership until they are edited, but the role will not appear in pickers anymore.`)}
      </p>
    </Modal>
  );
}
