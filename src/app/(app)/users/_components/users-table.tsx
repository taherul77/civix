"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUsersQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { useCan } from "@/lib/auth-context";
import { Modal, Field } from "@/components/ui/modal";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac";
import type { UserRecord } from "@/server/contracts";

export function UsersTable() {
  const tt = useT();
  const { data: users = [], refetch } = useUsersQuery();
  const mfa = useApp((s) => s.mfa);
  const canUpdate = useCan("user:update");
  const canDelete = useCan("user:delete");
  const isSuperAdmin = useApp((s) => s.user?.isSuperAdmin ?? false);

  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [removing, setRemoving] = useState<UserRecord | null>(null);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              <th>{tt("Name")}</th>
              <th>{tt("Email")}</th>
              <th>{tt("Phone")}</th>
              <th>{tt("Role")}</th>
              <th>{tt("Department")}</th>
              <th>{tt("MFA")}</th>
              <th>{tt("Status")}</th>
              {(canUpdate || canDelete) && <th className="text-right">{tt("Actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td className="text-sm">{u.email}</td>
                <td className="text-sm">{u.phone ?? "—"}</td>
                <td>{u.role}</td>
                <td>{u.dept}</td>
                <td>
                  {(u.mfa || mfa[u.email])
                    ? <span className="badge badge-pass">Enabled</span>
                    : <span className="badge badge-warn">Disabled</span>}
                </td>
                <td><StatusBadge value={u.status} /></td>
                {(canUpdate || canDelete) && (
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => setEditing(u)}
                          className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]"
                          title={tt("Edit")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setRemoving(u)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                          title={tt("Remove from this company")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-sm text-[rgb(var(--muted))] py-8">
                  {tt("No users yet — invite the first one.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch?.(); }}
        />
      )}

      {removing && (
        <RemoveUserModal
          user={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setRemoving(null); refetch?.(); }}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user, isSuperAdmin, onClose, onSaved,
}: {
  user: UserRecord;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tt = useT();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [dept, setDept] = useState(user.dept);
  const [status, setStatus] = useState<UserRecord["status"]>(user.status);
  const [submitting, setSubmitting] = useState(false);

  // Roles fetched from the API so the picker reflects the tenant's catalogue.
  const [roles, setRoles] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.roles.list()
      .then((items) => {
        if (cancelled) return;
        setRoles(items.map((r) => r.name).filter((n) => isSuperAdmin || n !== SUPER_ADMIN_ROLE));
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [isSuperAdmin]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const out = await mutate(
      () => api.users.update(user.id, { name, role, dept, status }),
      tt(`Updated ${user.email}`),
    );
    setSubmitting(false);
    if (out) onSaved();
  };

  const roleOptions = useMemo(
    () => (roles.includes(role) ? roles : [role, ...roles]),
    [roles, role],
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Edit user")}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="edit-user-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? tt("Saving…") : tt("Save")}
          </button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tt("Name")} span={2}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={tt("Email")} span={2}>
          <input className="input" value={user.email} disabled />
        </Field>
        <Field label={tt("Role")}>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label={tt("Department")}>
          <input className="input" value={dept} onChange={(e) => setDept(e.target.value)} />
        </Field>
        <Field label={tt("Status")} span={2}>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as UserRecord["status"])}>
            <option value="active">{tt("Active")}</option>
            <option value="inactive">{tt("Inactive")}</option>
          </select>
        </Field>
      </form>
    </Modal>
  );
}

function RemoveUserModal({
  user, onClose, onRemoved,
}: {
  user: UserRecord;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const tt = useT();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const out = await mutate(
      () => api.users.remove(user.id).then(() => true),
      tt(`Removed ${user.email} from this company`),
    );
    setSubmitting(false);
    if (out) onRemoved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Remove user")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="button" className="btn bg-rose-600 hover:bg-rose-700 text-white" onClick={submit} disabled={submitting}>
            {submitting ? tt("Removing…") : tt("Remove")}
          </button>
        </>
      }
    >
      <p className="text-sm">
        {tt(`Remove ${user.name} (${user.email}) from this company? Their global account is preserved — they can still belong to other tenants.`)}
      </p>
    </Modal>
  );
}
