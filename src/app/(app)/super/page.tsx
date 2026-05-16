"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, ShieldCheck, Loader2, Users as UsersIcon, RefreshCw, LogIn, Eye, Pencil, Trash2, UserCog } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, Field } from "@/components/ui/modal";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { apiFetch, isBackendActive } from "@/lib/api-client";
import { mutate } from "@/server/mutate";
import { api } from "@/server/api";

interface SuperTenant {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  crNumber: string | null;
  vatNumber: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  saudiComplianceEnabled: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminPage() {
  const tt = useT();
  const router = useRouter();
  const user = useApp((s) => s.user);
  const [tenants, setTenants] = useState<SuperTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<SuperTenant | null>(null);
  const [editing, setEditing] = useState<SuperTenant | null>(null);
  const [removing, setRemoving] = useState<SuperTenant | null>(null);
  const [showingMembers, setShowingMembers] = useState<SuperTenant | null>(null);

  // Enter a tenant — Super Admin gets a tenant-scoped JWT and is dropped on
  // the dashboard with full Tenant Admin powers in that company.
  const onEnter = async (t: SuperTenant) => {
    setEnteringId(t.id);
    const result = await mutate(
      () => api.auth.selectTenant(t.id),
      tt(`Now acting as Super Admin in ${t.name}`)
    );
    setEnteringId(null);
    if (result?.kind === "session") router.push("/dashboard");
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isBackendActive()) {
        setError("Backend offline — sign in as Super Admin against the API.");
        return;
      }
      const out = await apiFetch<{ items: SuperTenant[] }>("/v1/super/tenants");
      setTenants(out.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user?.isSuperAdmin) {
    return (
      <div className="card p-6">
        <div className="font-semibold mb-1">{tt("Super Admin only")}</div>
        <div className="text-sm text-[rgb(var(--muted))]">
          {tt("This area is restricted to platform super-admins.")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Manage every company on the platform — create tenants, assign their first admin, and inspect membership counts."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> {tt("Refresh")}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> {tt("Create company")}
            </button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SuperKpi label={tt("Companies")}      value={tenants.length}                           icon={Building2}  />
        <SuperKpi label={tt("Active members")} value={tenants.reduce((t, x) => t + x.memberCount, 0)} icon={UsersIcon} />
        <SuperKpi label={tt("Enterprise tier")}value={tenants.filter((t) => t.subscriptionTier === "enterprise").length} icon={ShieldCheck} />
      </div>

      {/* Tenant list */}
      <DataTable
        rows={tenants}
        getRowId={(t) => t.id}
        loading={loading}
        error={error}
        searchable
        searchPlaceholder={tt("Search companies…")}
        searchFilter={(t, q) =>
          [t.name, t.id, t.subdomain, t.subscriptionTier].join(" ").toLowerCase().includes(q)
        }
        empty={tt("No companies yet. Click \"Create company\" to add the first one.")}
        columns={[
          {
            key: "company",
            header: tt("Company"),
            cell: (t) => (
              <>
                <div className="font-medium">{t.name}</div>
                <div className="text-[10px] text-[rgb(var(--muted))] font-mono">{t.id}</div>
              </>
            ),
            sort: (a, b) => a.name.localeCompare(b.name),
          },
          {
            key: "subdomain",
            header: tt("Subdomain"),
            cell: (t) => <span className="font-mono">{t.subdomain}.civixlab.com</span>,
            sort: (a, b) => a.subdomain.localeCompare(b.subdomain),
          },
          {
            key: "tier",
            header: tt("Tier"),
            cell: (t) => (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize ${
                t.subscriptionTier === "enterprise"   ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" :
                t.subscriptionTier === "professional" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" :
                "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"
              }`}>{t.subscriptionTier}</span>
            ),
            sort: (a, b) => a.subscriptionTier.localeCompare(b.subscriptionTier),
          },
          {
            key: "members",
            header: tt("Members"),
            cell: (t) => (
              <button
                type="button"
                onClick={() => setShowingMembers(t)}
                className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-[rgb(var(--bg-soft))] underline-offset-2 hover:underline font-mono"
                title={tt("Show members")}
              >
                <UsersIcon className="w-3.5 h-3.5 text-[rgb(var(--muted))]" />
                {t.memberCount}
              </button>
            ),
            sort: (a, b) => a.memberCount - b.memberCount,
          },
          {
            key: "createdAt",
            header: tt("Created"),
            cell: (t) => <span className="text-[rgb(var(--muted))]">{new Date(t.createdAt).toLocaleDateString()}</span>,
            sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
          },
          {
            key: "actions",
            header: tt("Action"),
            align: "right",
            cell: (t) => (
              <div className="inline-flex items-center gap-1">
                <button type="button" onClick={() => setViewing(t)} className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]" title={tt("View")}>
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setShowingMembers(t)} className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]" title={tt("Members")}>
                  <UserCog className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-[rgb(var(--bg-soft))]" title={tt("Edit")}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setRemoving(t)} className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500" title={tt("Delete")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void onEnter(t)}
                  disabled={enteringId === t.id}
                  className="btn btn-outline text-xs ml-1"
                  title={tt("Enter this company as Super Admin")}
                >
                  {enteringId === t.id
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {tt("Entering…")}</>
                    : <><LogIn className="w-3.5 h-3.5" /> {tt("Enter")}</>}
                </button>
              </div>
            ),
          },
        ] as ColumnDef<SuperTenant>[]}
      />

      <CreateCompanyModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); void refresh(); }}
      />

      {viewing && (
        <ViewCompanyModal
          tenant={viewing}
          onClose={() => setViewing(null)}
        />
      )}
      {editing && (
        <EditCompanyModal
          tenant={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void refresh(); }}
        />
      )}
      {removing && (
        <DeleteCompanyModal
          tenant={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setRemoving(null); void refresh(); }}
        />
      )}
      {showingMembers && (
        <MembersModal
          tenant={showingMembers}
          onClose={() => setShowingMembers(null)}
        />
      )}
    </div>
  );
}

interface SuperMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string[];
  department: string | null;
  isActive: boolean;
  membershipActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  joinedAt: string;
}

function MembersModal({ tenant, onClose }: { tenant: SuperTenant; onClose: () => void }) {
  const tt = useT();
  const [members, setMembers] = useState<SuperMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<{ items: SuperMember[]; total: number }>(`/v1/super/tenants/${encodeURIComponent(tenant.id)}/members`)
      .then((out) => { if (!cancelled) setMembers(out.items); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tenant.id]);

  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");
  const fullName = (m: SuperMember) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email.split("@")[0];

  return (
    <Modal
      open
      onClose={onClose}
      title={tt(`Members — ${tenant.name}`)}
      size="lg"
      footer={<button type="button" className="btn btn-outline" onClick={onClose}>{tt("Close")}</button>}
    >
      {loading ? (
        <div className="p-8 grid place-items-center text-sm text-[rgb(var(--muted))]">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          {tt("Loading members…")}
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-sm text-[rgb(var(--muted))]">
          {tt("No members in this company yet.")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>{tt("Name")}</th>
                <th>{tt("Email")}</th>
                <th>{tt("Phone")}</th>
                <th>{tt("Roles")}</th>
                <th>{tt("Department")}</th>
                <th>{tt("MFA")}</th>
                <th>{tt("Status")}</th>
                <th>{tt("Last login")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{fullName(m)}</td>
                  <td className="text-sm break-all">{m.email}</td>
                  <td className="text-sm !whitespace-nowrap">{m.phone ?? "—"}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {m.roles.length === 0
                        ? <span className="text-[rgb(var(--muted))]">—</span>
                        : m.roles.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]"
                            >
                              {r}
                            </span>
                          ))}
                    </div>
                  </td>
                  <td className="text-sm">{m.department ?? "—"}</td>
                  <td>
                    {m.mfaEnabled
                      ? <span className="badge badge-pass">{tt("Enabled")}</span>
                      : <span className="badge badge-warn">{tt("Disabled")}</span>}
                  </td>
                  <td>
                    {m.membershipActive
                      ? <span className="badge badge-pass">{tt("Active")}</span>
                      : <span className="badge badge-warn">{tt("Inactive")}</span>}
                  </td>
                  <td className="text-xs text-[rgb(var(--muted))]">{fmt(m.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

function ViewCompanyModal({ tenant, onClose }: { tenant: SuperTenant; onClose: () => void }) {
  const tt = useT();
  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleString() : "—";
  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Company details")}
      size="lg"
      footer={<button type="button" className="btn btn-outline" onClick={onClose}>{tt("Close")}</button>}
    >
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm min-w-0">
        <div className="min-w-0"><dt className="help">{tt("Name")}</dt><dd className="font-medium break-words">{tenant.name}</dd></div>
        <div className="min-w-0"><dt className="help">{tt("Subdomain")}</dt><dd className="font-mono break-all">{tenant.subdomain}.civixlab.com</dd></div>
        <div><dt className="help">{tt("Tier")}</dt><dd className="capitalize">{tenant.subscriptionTier}</dd></div>
        <div><dt className="help">{tt("Status")}</dt><dd className="capitalize">{tenant.subscriptionStatus}</dd></div>
        <div><dt className="help">{tt("CR number")}</dt><dd className="font-mono break-all">{tenant.crNumber ?? "—"}</dd></div>
        <div><dt className="help">{tt("VAT number")}</dt><dd className="font-mono break-all">{tenant.vatNumber ?? "—"}</dd></div>
        <div><dt className="help">{tt("Members")}</dt><dd className="font-mono">{tenant.memberCount}</dd></div>
        <div><dt className="help">{tt("Saudi compliance")}</dt><dd>{tenant.saudiComplianceEnabled ? tt("Enabled") : tt("Disabled")}</dd></div>
        <div><dt className="help">{tt("Created")}</dt><dd>{fmt(tenant.createdAt)}</dd></div>
        <div><dt className="help">{tt("Updated")}</dt><dd>{fmt(tenant.updatedAt)}</dd></div>
        <div className="md:col-span-2 min-w-0"><dt className="help">{tt("Tenant ID")}</dt><dd className="font-mono text-xs break-all">{tenant.id}</dd></div>
      </dl>
    </Modal>
  );
}

function EditCompanyModal({
  tenant, onClose, onSaved,
}: {
  tenant: SuperTenant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tt = useT();
  const [name, setName] = useState(tenant.name);
  const [subdomain, setSubdomain] = useState(tenant.subdomain);
  const [tier, setTier] = useState(tenant.subscriptionTier as "starter" | "professional" | "enterprise");
  const [status, setStatus] = useState(tenant.subscriptionStatus as "active" | "suspended" | "cancelled");
  const [crNumber, setCrNumber] = useState(tenant.crNumber ?? "");
  const [vatNumber, setVatNumber] = useState(tenant.vatNumber ?? "");
  const [saudiCompliance, setSaudiCompliance] = useState(tenant.saudiComplianceEnabled);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subdomain.trim()) return;
    setSubmitting(true);
    const result = await mutate(
      () => apiFetch<SuperTenant>(`/v1/super/tenants/${encodeURIComponent(tenant.id)}`, {
        method: "PUT",
        body: {
          name: name.trim(),
          subdomain: subdomain.trim(),
          subscriptionTier: tier,
          subscriptionStatus: status,
          crNumber: crNumber.trim() || null,
          vatNumber: vatNumber.trim() || null,
          saudiComplianceEnabled: saudiCompliance,
        },
      }),
      tt(`Updated ${tenant.name}`),
    );
    setSubmitting(false);
    if (result) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Edit company")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="edit-company-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Saving…")}</> : tt("Save")}
          </button>
        </>
      }
    >
      <form id="edit-company-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label={tt("Name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={tt("Subdomain")}>
          <div className="flex items-center gap-2">
            <input
              className="input"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
            />
            <span className="text-xs text-[rgb(var(--muted))] whitespace-nowrap">.civixlab.com</span>
          </div>
        </Field>
        <Field label={tt("Tier")}>
          <select className="input capitalize" value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
            <option value="starter">starter</option>
            <option value="professional">professional</option>
            <option value="enterprise">enterprise</option>
          </select>
        </Field>
        <Field label={tt("Status")}>
          <select className="input capitalize" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="cancelled">cancelled</option>
          </select>
        </Field>
        <Field label={tt("CR number")}>
          <input className="input font-mono" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} />
        </Field>
        <Field label={tt("VAT number")}>
          <input className="input font-mono" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
        </Field>
        <Field label={tt("Saudi compliance")} span={2}>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={saudiCompliance} onChange={(e) => setSaudiCompliance(e.target.checked)} />
            <span className="text-sm">{tt("Enabled")}</span>
          </label>
        </Field>
      </form>
    </Modal>
  );
}

function DeleteCompanyModal({
  tenant, onClose, onRemoved,
}: {
  tenant: SuperTenant;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const tt = useT();
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const expected = tenant.subdomain;

  const submit = async () => {
    if (confirm !== expected) return;
    setSubmitting(true);
    const out = await mutate(
      () => apiFetch(`/v1/super/tenants/${encodeURIComponent(tenant.id)}`, { method: "DELETE" }).then(() => true),
      tt(`Deleted ${tenant.name}`),
    );
    setSubmitting(false);
    if (out) onRemoved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={tt("Delete company")}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button
            type="button"
            className="btn bg-rose-600 hover:bg-rose-700 text-white"
            onClick={submit}
            disabled={submitting || confirm !== expected}
          >
            {submitting ? tt("Deleting…") : tt("Delete company")}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-rose-600 dark:text-rose-400 font-medium">
          {tt(`This permanently deletes "${tenant.name}" and ALL of its data — projects, samples, tests, equipment, audit logs, memberships, and roles.`)}
        </p>
        <p>
          {tt("This action cannot be undone. To confirm, type the subdomain:")}
        </p>
        <div className="font-mono text-xs bg-[rgb(var(--bg-soft))] px-2 py-1 rounded inline-block">{expected}</div>
        <input
          className="input font-mono"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={expected}
          autoFocus
        />
      </div>
    </Modal>
  );
}

function SuperKpi({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))] font-semibold">{label}</div>
          <div className="text-3xl font-bold mt-2">{value}</div>
        </div>
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-white bg-brand-gradient shadow-glow">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function CreateCompanyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const tt = useT();
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [tier, setTier] = useState<"starter" | "professional" | "enterprise">("starter");
  const [crNumber, setCrNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subdomain.trim() || !adminEmail.trim() || adminPassword.length < 8) return;
    setSubmitting(true);
    const result = await mutate(
      () =>
        apiFetch<{ tenant: { id: string } }>("/v1/super/tenants", {
          method: "POST",
          body: {
            name: name.trim(),
            subdomain: subdomain.trim(),
            subscriptionTier: tier,
            crNumber:  crNumber.trim()  || undefined,
            vatNumber: vatNumber.trim() || undefined,
            admin: {
              email:     adminEmail.trim(),
              firstName: adminFirstName.trim() || undefined,
              lastName:  adminLastName.trim()  || undefined,
              password:  adminPassword,
            },
          },
        }),
      tt(`Company "${name}" created with admin ${adminEmail}`)
    );
    if (!result) {
      setSubmitting(false);
      return;
    }
    // Auto-enter the brand-new tenant so the super admin's session is now
    // scoped to it — every tenant page will work immediately.
    try {
      await api.auth.selectTenant(result.tenant.id);
    } catch {
      // ignore — they can hit Enter on the row instead
    }
    setSubmitting(false);
    setName(""); setSubdomain(""); setTier("starter"); setCrNumber(""); setVatNumber("");
    setAdminEmail(""); setAdminFirstName(""); setAdminLastName(""); setAdminPassword("");
    onCreated();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tt("Create company")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="create-company-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Creating…")}</> : <>{tt("Create company")}</>}
          </button>
        </>
      }
    >
      <form id="create-company-form" onSubmit={submit} className="space-y-5">
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">{tt("Company")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={tt("Subdomain")}>
              <div className="flex items-center gap-2">
                <input
                  className="input"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                />
                <span className="text-xs text-[rgb(var(--muted))] whitespace-nowrap">.civixlab.com</span>
              </div>
            </Field>
            <Field label={tt("Tier")}>
              <select className="input capitalize" value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
                <option value="starter">starter</option>
                <option value="professional">professional</option>
                <option value="enterprise">enterprise</option>
              </select>
            </Field>
            <Field label={tt("CR number")}>
              <input className="input font-mono" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} />
            </Field>
            <Field label={tt("VAT number")} span={2}>
              <input className="input font-mono" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">{tt("First Tenant Admin")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Admin email")} span={2}>
              <input type="email" className="input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
            </Field>
            <Field label={tt("First name")}>
              <input className="input" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
            </Field>
            <Field label={tt("Last name")}>
              <input className="input" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
            </Field>
            <Field label={tt("Initial password")} span={2}>
              <input type="password" className="input" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} minLength={8} required />
              <p className="help mt-1">{tt("Minimum 8 characters. The admin can change this after their first sign-in.")}</p>
            </Field>
          </div>
        </section>
      </form>
    </Modal>
  );
}
