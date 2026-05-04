"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { Modal, Field } from "@/components/ui/modal";
import { api, type ApiDepartment } from "@/server/api";
import { mutate } from "@/server/mutate";

export function DepartmentsTable() {
  const tt = useT();
  const canEdit = useCan("settings:update");
  const [items, setItems] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<ApiDepartment | null>(null);
  const [editing, setEditing] = useState<ApiDepartment | null>(null);
  const [removing, setRemoving] = useState<ApiDepartment | null>(null);

  const refetch = () => {
    setLoading(true);
    api.departments.list()
      .then((rows) => setItems(rows))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refetch(); }, []);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              <th>{tt("Name")}</th>
              <th>{tt("Code")}</th>
              <th>{tt("Manager")}</th>
              <th>{tt("Description")}</th>
              <th>{tt("Status")}</th>
              <th className="text-right">{tt("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td className="font-medium">{d.name}</td>
                <td className="text-sm font-mono">{d.code ?? "—"}</td>
                <td className="text-sm">{d.manager ?? "—"}</td>
                <td className="text-sm text-[rgb(var(--muted))]">{d.description ?? "—"}</td>
                <td>
                  {d.isActive
                    ? <span className="badge badge-pass">{tt("Active")}</span>
                    : <span className="badge badge-warn">{tt("Inactive")}</span>}
                </td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewing(d)}
                      className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]"
                      title={tt("View")}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditing(d)}
                        className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]"
                        title={tt("Edit")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setRemoving(d)}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
                        title={tt("Delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sm text-[rgb(var(--muted))] py-8">
                  {tt("No departments yet — add the first one.")}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="text-center text-sm text-[rgb(var(--muted))] py-8">
                  {tt("Loading…")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <ViewDepartmentModal
          dept={viewing}
          onClose={() => setViewing(null)}
        />
      )}
      {editing && (
        <EditDepartmentModal
          dept={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
      {removing && (
        <RemoveDepartmentModal
          dept={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setRemoving(null); refetch(); }}
        />
      )}
    </div>
  );
}

function ViewDepartmentModal({ dept, onClose }: { dept: ApiDepartment; onClose: () => void }) {
  const tt = useT();
  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Department details")}
      size="md"
      footer={<button type="button" className="btn btn-outline" onClick={onClose}>{tt("Close")}</button>}
    >
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div><dt className="help">{tt("Name")}</dt><dd className="font-medium">{dept.name}</dd></div>
        <div><dt className="help">{tt("Code")}</dt><dd className="font-mono">{dept.code ?? "—"}</dd></div>
        <div><dt className="help">{tt("Manager")}</dt><dd>{dept.manager ?? "—"}</dd></div>
        <div><dt className="help">{tt("Status")}</dt><dd>{dept.isActive ? tt("Active") : tt("Inactive")}</dd></div>
        <div className="md:col-span-2"><dt className="help">{tt("Description")}</dt><dd>{dept.description ?? "—"}</dd></div>
      </dl>
    </Modal>
  );
}

function EditDepartmentModal({
  dept, onClose, onSaved,
}: {
  dept: ApiDepartment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tt = useT();
  const [name, setName] = useState(dept.name);
  const [code, setCode] = useState(dept.code ?? "");
  const [manager, setManager] = useState(dept.manager ?? "");
  const [description, setDescription] = useState(dept.description ?? "");
  const [isActive, setIsActive] = useState(dept.isActive);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const out = await mutate(
      () => api.departments.update(dept.id, {
        name: name.trim(),
        code: code.trim() || undefined,
        manager: manager.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      }),
      tt(`Updated ${dept.name}`),
    );
    setSubmitting(false);
    if (out) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Edit department")}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="edit-dept-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? tt("Saving…") : tt("Save")}
          </button>
        </>
      }
    >
      <form id="edit-dept-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tt("Name")} span={2}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={tt("Code")}>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label={tt("Manager")}>
          <input className="input" value={manager} onChange={(e) => setManager(e.target.value)} />
        </Field>
        <Field label={tt("Description")} span={2}>
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label={tt("Status")} span={2}>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm">{tt("Active")}</span>
          </label>
        </Field>
      </form>
    </Modal>
  );
}

function RemoveDepartmentModal({
  dept, onClose, onRemoved,
}: {
  dept: ApiDepartment;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const tt = useT();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const out = await mutate(
      () => api.departments.remove(dept.id).then(() => true),
      tt(`Deleted ${dept.name}`),
    );
    setSubmitting(false);
    if (out) onRemoved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Delete department")}
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
        {tt(`Delete department "${dept.name}"? Users and tests assigned to this department will keep their existing label, but new records will no longer be able to pick it.`)}
      </p>
    </Modal>
  );
}
