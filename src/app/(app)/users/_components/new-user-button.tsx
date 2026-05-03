"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { type User } from "@/store/data-store";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { Modal, Field } from "@/components/ui/modal";
import { useCan } from "@/lib/auth-context";
import { useApp } from "@/store/app-store";
import { SUPER_ADMIN_ROLE } from "@/lib/rbac";

const DEPTS = ["Concrete", "Soil", "Aggregate", "Asphalt", "Steel", "Cement", "Quality", "Field"];

export function NewUserButton() {
  const tt = useT();
  const canInvite = useCan("user:invite");
  const isSuperAdmin = useApp((s) => s.user?.isSuperAdmin ?? false);

  // Roles fetched from /v1/roles for this tenant. Super Admin is platform-only,
  // so we hide it from non-super-admin actors.
  const [allRoles, setAllRoles] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.roles
      .list()
      .then((items) => {
        if (cancelled) return;
        setAllRoles(items.map((r) => r.name));
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);
  const ROLES = useMemo(
    () => allRoles.filter((n) => isSuperAdmin || n !== SUPER_ADMIN_ROLE),
    [allRoles, isSuperAdmin],
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState(DEPTS[0]);
  const [status, setStatus] = useState<User["status"]>("active");
  const [mfa, setMfa] = useState(true);
  if (!canInvite) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const created = await mutate(
      () => api.users.invite({ name: name.trim(), email: email.trim(), role, dept, status, mfa }),
      `Invited ${name.trim()}`
    );
    if (!created) return;
    setName(""); setEmail(""); setRole(ROLES[0]); setDept(DEPTS[0]);
    setStatus("active"); setMfa(true);
    setOpen(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("Invite user")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("Invite user")}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>{tt("Cancel")}</button>
            <button type="submit" form="new-user-form" className="btn btn-primary">{tt("Save")}</button>
          </>
        }
      >
        <form id="new-user-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Name")} span={2}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={tt("Email")} span={2}>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label={tt("Role")}>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label={tt("Department")}>
            <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
              {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label={tt("Status")}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as User["status"])}>
              <option value="active">{tt("Active")}</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="MFA">
            <label className="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" checked={mfa} onChange={(e) => setMfa(e.target.checked)} />
              <span className="text-sm">Enabled</span>
            </label>
          </Field>
        </form>
      </Modal>
    </>
  );
}
