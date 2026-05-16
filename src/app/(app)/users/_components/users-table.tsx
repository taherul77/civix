"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
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
  const { data: users = [], isLoading, error } = useUsersQuery();
  const mfa = useApp((s) => s.mfa);
  const canUpdate = useCan("user:update");
  const canDelete = useCan("user:delete");
  const isSuperAdmin = useApp((s) => s.user?.isSuperAdmin ?? false);

  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [removing, setRemoving] = useState<UserRecord | null>(null);

  const userRoles = (u: UserRecord) =>
    u.roles && u.roles.length > 0 ? u.roles : (u.role ? [u.role] : []);

  const columns: ColumnDef<UserRecord>[] = [
    {
      key: "name",
      header: tt("Name"),
      cell: (u) => <span className="font-medium">{u.name}</span>,
      sort: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "email",
      header: tt("Email"),
      cell: (u) => <span className="text-sm">{u.email}</span>,
      sort: (a, b) => a.email.localeCompare(b.email),
    },
    {
      key: "phone",
      header: tt("Phone"),
      cell: (u) => <span className="text-sm !whitespace-nowrap">{u.phone ?? "—"}</span>,
    },
    {
      key: "roles",
      header: tt("Role"),
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {userRoles(u).map((r) => (
            <span
              key={r}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]"
            >
              {r}
            </span>
          ))}
        </div>
      ),
      sort: (a, b) => (userRoles(a)[0] ?? "").localeCompare(userRoles(b)[0] ?? ""),
    },
    {
      key: "dept",
      header: tt("Department"),
      cell: (u) => u.dept,
      sort: (a, b) => (a.dept ?? "").localeCompare(b.dept ?? ""),
    },
    {
      key: "mfa",
      header: tt("MFA"),
      cell: (u) => (u.mfa || mfa[u.email])
        ? <span className="badge badge-pass">Enabled</span>
        : <span className="badge badge-warn">Disabled</span>,
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (u) => <StatusBadge value={u.status} />,
      sort: (a, b) => String(a.status).localeCompare(String(b.status)),
    },
    ...((canUpdate || canDelete) ? [{
      key: "actions",
      header: tt("Actions"),
      align: "right" as const,
      cell: (u: UserRecord) => (
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
      ),
    }] : []),
  ];

  return (
    <>
      <DataTable
        rows={users}
        columns={columns}
        getRowId={(u) => u.id}
        loading={isLoading}
        error={error?.message ?? null}
        searchable
        searchPlaceholder={tt("Search users…")}
        searchFilter={(u, q) =>
          [u.name, u.email, u.phone ?? "", u.dept ?? "", ...userRoles(u)]
            .join(" ").toLowerCase().includes(q)
        }
        empty={tt("No users yet — invite the first one.")}
      />

      {editing && (
        <EditUserModal
          user={editing}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); }}
        />
      )}

      {removing && (
        <RemoveUserModal
          user={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setRemoving(null); }}
        />
      )}
    </>
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
  // `selectedRoles` is the membership's full role list — multiple selectable.
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : []),
  );
  const [dept, setDept] = useState(user.dept);
  const [status, setStatus] = useState<UserRecord["status"]>(user.status);
  const [submitting, setSubmitting] = useState(false);

  // Roles fetched from the API so the picker reflects the tenant's catalogue.
  const [allRoles, setAllRoles] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.roles.list()
      .then((items) => {
        if (cancelled) return;
        setAllRoles(items.map((r) => r.name).filter((n) => isSuperAdmin || n !== SUPER_ADMIN_ROLE));
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [isSuperAdmin]);

  // Departments fetched from /v1/departments (active rows only). The user's
  // current value is preserved as a head option so renamed/inactive
  // departments don't silently disappear from the dropdown on edit.
  const [depts, setDepts] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.departments.list()
      .then((items) => {
        if (cancelled) return;
        setDepts(items.filter((d) => d.isActive).map((d) => d.name));
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return;
    setSubmitting(true);
    const out = await mutate(
      () => api.users.update(user.id, { name, roles: selectedRoles, dept, status }),
      tt(`Updated ${user.email}`),
    );
    setSubmitting(false);
    if (out) onSaved();
  };

  const toggleRole = (r: string) => {
    setSelectedRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  };

  // Show the full known catalogue plus any roles the user already has that
  // aren't in it (e.g. a role that was renamed since invite).
  const roleOptions = useMemo(() => {
    const extra = selectedRoles.filter((r) => !allRoles.includes(r));
    return [...extra, ...allRoles];
  }, [allRoles, selectedRoles]);
  const deptOptions = useMemo(
    () => (dept && !depts.includes(dept) ? [dept, ...depts] : depts),
    [depts, dept],
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
        <Field label={tt("Roles")} span={2}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg-soft))]">
            {roleOptions.length === 0 && (
              <span className="text-xs text-[rgb(var(--muted))] italic">{tt("Loading…")}</span>
            )}
            {roleOptions.map((r) => (
              <label key={r} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(r)}
                  onChange={() => toggleRole(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
          <p className="help mt-1">{tt("Select one or more — permissions resolve to the union across all assigned roles.")}</p>
        </Field>
        <Field label={tt("Department")}>
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
            {deptOptions.length === 0 && <option value="">—</option>}
            {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
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
