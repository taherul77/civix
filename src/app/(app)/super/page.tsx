"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, ShieldCheck, Loader2, Users as UsersIcon, RefreshCw, LogIn } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal, Field } from "@/components/ui/modal";
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
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-sm text-[rgb(var(--muted))]">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            {tt("Loading companies…")}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">{error}</div>
        ) : tenants.length === 0 ? (
          <div className="p-10 text-center text-sm text-[rgb(var(--muted))]">
            {tt("No companies yet. Click \"Create company\" to add the first one.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--bg-soft))]">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">{tt("Company")}</th>
                  <th className="text-left px-4 py-2 font-semibold">{tt("Subdomain")}</th>
                  <th className="text-left px-4 py-2 font-semibold">{tt("Tier")}</th>
                  <th className="text-left px-4 py-2 font-semibold">{tt("Members")}</th>
                  <th className="text-left px-4 py-2 font-semibold">{tt("Created")}</th>
                  <th className="text-right px-4 py-2 font-semibold">{tt("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-soft))]">
                    <td className="px-4 py-2">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-[10px] text-[rgb(var(--muted))] font-mono">{t.id}</div>
                    </td>
                    <td className="px-4 py-2 font-mono">{t.subdomain}.civixlab.com</td>
                    <td className="px-4 py-2 capitalize">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        t.subscriptionTier === "enterprise"   ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" :
                        t.subscriptionTier === "professional" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"
                      }`}>{t.subscriptionTier}</span>
                    </td>
                    <td className="px-4 py-2 font-mono">{t.memberCount}</td>
                    <td className="px-4 py-2 text-[rgb(var(--muted))]">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void onEnter(t)}
                        disabled={enteringId === t.id}
                        className="btn btn-outline text-xs"
                        title={tt("Enter this company as Super Admin")}
                      >
                        {enteringId === t.id
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {tt("Entering…")}</>
                          : <><LogIn className="w-3.5 h-3.5" /> {tt("Enter")}</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCompanyModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); void refresh(); }}
      />
    </div>
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
