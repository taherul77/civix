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

  // Departments fetched from /v1/departments for this tenant. Inactive
  // departments are hidden from the picker so new users can only land on
  // an active one.
  const [DEPTS, setDepts] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.departments
      .list()
      .then((items) => {
        if (cancelled) return;
        setDepts(items.filter((d) => d.isActive).map((d) => d.name));
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState<User["status"]>("active");
  const [mfa, setMfa] = useState(true);
  if (!canInvite) return null;

  const toggleRole = (r: string) => {
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || roles.length === 0) return;
    const created = await mutate(
      () => api.users.invite({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role: roles[0] ?? "",
        roles,
        dept,
        status,
        mfa,
      }),
      `Added ${name.trim()}`
    );
    if (!created) return;
    setName(""); setEmail(""); setPhone("");
    setRoles(ROLES.length > 0 ? [ROLES[0]!] : []);
    setDept(DEPTS[0] ?? "");
    setStatus("active"); setMfa(true);
    setOpen(false);
  };

  // Default to the first role and department once their lists load.
  useEffect(() => {
    if (roles.length === 0 && ROLES.length > 0) setRoles([ROLES[0]!]);
  }, [roles, ROLES]);
  useEffect(() => {
    if (!dept && DEPTS.length > 0) setDept(DEPTS[0]);
  }, [dept, DEPTS]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("Add user")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("Add user")}
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
          <Field label={tt("Phone")} span={2}>
            <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5XX XXX XXXX" />
          </Field>
          <Field label={tt("Roles")} span={2}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg-soft))]">
              {ROLES.length === 0 && (
                <span className="text-xs text-[rgb(var(--muted))] italic">{tt("Loading…")}</span>
              )}
              {ROLES.map((r) => (
                <label key={r} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={roles.includes(r)}
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
