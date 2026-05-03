"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Save, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { useUsersQuery } from "@/server/queries";
import { api } from "@/server/api";
import { toast } from "@/components/ui/toast";

const PASSWORD_POLICIES = ["minimum 8 chars", "minimum 12 chars", "minimum 12 chars + symbol"] as const;

export default function UserSetupPage() {
  const tt = useT();
  const canEdit = useCan("settings:update");
  const { data: users = [] } = useUsersQuery();

  // Built-in role names for this tenant — fetched from /v1/roles so the
  // catalogue reflects whatever the tenant has defined in Role Management.
  const [builtInRoles, setBuiltInRoles] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.roles
      .list()
      .then((items) => {
        if (cancelled) return;
        const names = items.filter((r) => !r.isCustom).map((r) => r.name);
        setBuiltInRoles(names);
        setDefaultRole((cur) => cur || names[0] || "");
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  // Onboarding defaults
  const [defaultRole, setDefaultRole] = useState<string>("");
  const [defaultDept, setDefaultDept] = useState("Concrete");
  const [requireMfa, setRequireMfa] = useState(true);
  const [autoExpireInactiveDays, setAutoExpireInactiveDays] = useState(90);

  // Password policy
  const [passwordPolicy, setPasswordPolicy] = useState<typeof PASSWORD_POLICIES[number]>("minimum 12 chars");
  const [passwordRotationDays, setPasswordRotationDays] = useState(180);

  // Custom roles (in addition to built-in templates)
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");

  // Per-role distribution (read-only summary from current users)
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const addRole = () => {
    const v = newRole.trim();
    if (!v || builtInRoles.includes(v) || customRoles.includes(v)) return;
    setCustomRoles([...customRoles, v]);
    setNewRole("");
  };
  const removeRole = (r: string) => setCustomRoles(customRoles.filter((x) => x !== r));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success(tt("User setup saved (local only — backend wiring pending)"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User setup"
        description="Default onboarding rules, password policy, and custom roles for this tenant."
      />

      <form onSubmit={submit} className="space-y-6">
        {/* Onboarding defaults */}
        <section className="card p-6">
          <header className="flex items-center gap-2 mb-4">
            <UsersIcon className="w-4 h-4 text-brand-600" />
            <h3 className="font-semibold">{tt("Onboarding defaults")}</h3>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={tt("Default role for new users")}>
              <select className="input" value={defaultRole} onChange={(e) => setDefaultRole(e.target.value)} disabled={!canEdit}>
                {[...builtInRoles, ...customRoles].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label={tt("Default department")}>
              <input className="input" value={defaultDept} onChange={(e) => setDefaultDept(e.target.value)} disabled={!canEdit} />
            </Field>
            <Field label={tt("Require MFA at first sign-in")} span={2}>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireMfa}
                  onChange={(e) => setRequireMfa(e.target.checked)}
                  disabled={!canEdit}
                />
                <span className="text-sm">{tt("Force every new user to enrol an authenticator before first session.")}</span>
              </label>
            </Field>
            <Field label={tt("Auto-deactivate after inactivity (days)")} span={2}>
              <input
                type="number"
                min={0}
                max={3650}
                className="input w-32"
                value={autoExpireInactiveDays}
                onChange={(e) => setAutoExpireInactiveDays(Number(e.target.value) || 0)}
                disabled={!canEdit}
              />
              <p className="help mt-1">{tt("0 disables automatic deactivation.")}</p>
            </Field>
          </div>
        </section>

        {/* Password policy */}
        <section className="card p-6">
          <header className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <h3 className="font-semibold">{tt("Password policy")}</h3>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={tt("Strength requirement")}>
              <select
                className="input"
                value={passwordPolicy}
                onChange={(e) => setPasswordPolicy(e.target.value as typeof passwordPolicy)}
                disabled={!canEdit}
              >
                {PASSWORD_POLICIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label={tt("Rotation interval (days)")}>
              <input
                type="number"
                min={0}
                max={365}
                className="input w-32"
                value={passwordRotationDays}
                onChange={(e) => setPasswordRotationDays(Number(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </Field>
          </div>
        </section>

        {/* Custom roles */}
        <section className="card p-6">
          <header className="mb-3">
            <h3 className="font-semibold">{tt("Custom roles")}</h3>
            <p className="help mt-1">
              {tt("Add tenant-specific roles in addition to the built-in catalog. Permissions are configured under Admin → Security.")}
            </p>
          </header>

          <div className="flex items-center gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder={tt("New role name")}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
              disabled={!canEdit}
            />
            <button type="button" className="btn btn-outline" onClick={addRole} disabled={!canEdit || !newRole.trim()}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <ul className="space-y-1 mb-4">
            {customRoles.length === 0 && (
              <li className="text-sm text-[rgb(var(--muted))] italic">{tt("No custom roles yet")}</li>
            )}
            {customRoles.map((r) => (
              <li key={r} className="flex items-center justify-between rounded-lg px-3 py-1.5 bg-[rgb(var(--bg-soft))]">
                <span className="text-sm">{r}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeRole(r)}
                    className="p-1 rounded hover:bg-rose-500/10 text-rose-500"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="border-t border-[rgb(var(--border))] pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
              {tt("Built-in roles in use")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {builtInRoles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]"
                >
                  {r}
                  <span className="font-mono text-[10px] text-[rgb(var(--muted))]">
                    {roleCounts[r] ?? 0}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end pt-2">
          <button type="submit" className="btn btn-primary" disabled={!canEdit}>
            <Save className="w-4 h-4" /> {tt("Save changes")}
          </button>
        </div>

        {!canEdit && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            {tt("Read-only — you need the Tenant Admin role to edit this page.")}
          </div>
        )}
      </form>
    </div>
  );
}
