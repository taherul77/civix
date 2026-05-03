"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Building2, Save, Loader2, ImageIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { apiFetch, isBackendActive } from "@/lib/api-client";
import { mutate } from "@/server/mutate";
import { Field } from "@/components/ui/modal";

interface TenantPayload {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  crNumber: string | null;
  vatNumber: string | null;
  subscriptionTier: "starter" | "professional" | "enterprise";
  subscriptionStatus: string;
  limits: { maxUsers: number; maxTestsPerMonth: number; storageLimitGb: number };
  saudiComplianceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const TIERS = ["starter", "professional", "enterprise"] as const;

export function CompanyForm() {
  const tt = useT();
  const canEdit = useCan("settings:update");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [tier, setTier] = useState<TenantPayload["subscriptionTier"]>("starter");
  const [saudiComplianceEnabled, setSaudiComplianceEnabled] = useState(true);

  const hydrate = (t: TenantPayload) => {
    setTenant(t);
    setName(t.name);
    setSubdomain(t.subdomain);
    setLogoUrl(t.logoUrl ?? "");
    setCrNumber(t.crNumber ?? "");
    setVatNumber(t.vatNumber ?? "");
    setTier(t.subscriptionTier);
    setSaudiComplianceEnabled(t.saudiComplianceEnabled);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!isBackendActive()) {
          setError("Backend offline — sign in against the API to load company settings.");
          return;
        }
        const t = await apiFetch<TenantPayload>("/v1/tenant");
        if (!cancelled) hydrate(t);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load tenant");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    const updated = await mutate(
      () => apiFetch<TenantPayload>("/v1/tenant", {
        method: "PATCH",
        body: {
          name: name.trim(),
          subdomain: subdomain.trim(),
          logoUrl: logoUrl.trim() || null,
          crNumber: crNumber.trim() || null,
          vatNumber: vatNumber.trim() || null,
          subscriptionTier: tier,
          saudiComplianceEnabled,
        },
      }),
      tt("Company profile updated")
    );
    setSaving(false);
    if (updated) hydrate(updated);
  };

  if (loading) {
    return (
      <div className="card p-10 grid place-items-center text-sm text-[rgb(var(--muted))]">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        {tt("Loading company profile…")}
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="card p-6 border-rose-500/30">
        <div className="font-semibold text-rose-600 mb-1">{tt("Cannot load company profile")}</div>
        <div className="text-sm text-[rgb(var(--muted))]">{error ?? tt("Unknown error")}</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Identity */}
      <section className="card p-6">
        <header className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-brand-600" />
          <h3 className="font-semibold">{tt("Identity")}</h3>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Company name")}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required disabled={!canEdit} />
          </Field>
          <Field label={tt("Subdomain")}>
            <div className="flex items-center gap-2">
              <input
                className="input"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                disabled={!canEdit}
              />
              <span className="text-xs text-[rgb(var(--muted))] whitespace-nowrap">.civixlab.com</span>
            </div>
          </Field>
          <Field label={tt("Logo URL")} span={2}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))] grid place-items-center overflow-hidden shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[rgb(var(--muted))]" />
                )}
              </div>
              <input
                className="input"
                placeholder="https://…"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Billing identity */}
      <section className="card p-6">
        <header className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold">{tt("Saudi billing identity")}</h3>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Commercial Registration (CR) number")}>
            <input
              className="input font-mono"
              value={crNumber}
              onChange={(e) => setCrNumber(e.target.value)}
              placeholder="1010-700001"
              disabled={!canEdit}
            />
          </Field>
          <Field label={tt("VAT number")}>
            <input
              className="input font-mono"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="300100000000003"
              disabled={!canEdit}
            />
          </Field>
          <Field label={tt("Saudi compliance (SBC / SASO / GSO)")} span={2}>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saudiComplianceEnabled}
                onChange={(e) => setSaudiComplianceEnabled(e.target.checked)}
                disabled={!canEdit}
              />
              <span className="text-sm">{tt("Enforce Saudi-specific compliance rules on tests and reports")}</span>
            </label>
          </Field>
        </div>
      </section>

      {/* Subscription */}
      <section className="card p-6">
        <header className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold">{tt("Subscription")}</h3>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Tier")}>
            <select
              className="input capitalize"
              value={tier}
              onChange={(e) => setTier(e.target.value as TenantPayload["subscriptionTier"])}
              disabled={!canEdit}
            >
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label={tt("Status")}>
            <input className="input capitalize" value={tenant.subscriptionStatus} disabled />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
          <LimitTile label={tt("Max users")}            value={tenant.limits.maxUsers} />
          <LimitTile label={tt("Tests / month")}        value={tenant.limits.maxTestsPerMonth} />
          <LimitTile label={tt("Storage (GB)")}         value={tenant.limits.storageLimitGb} />
        </div>
        <p className="help mt-3">
          {tt("Limits are managed by your account manager — contact billing to upgrade.")}
        </p>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-[rgb(var(--muted))]">
          {tt("Tenant ID")}: <span className="font-mono">{tenant.id}</span>
          <span className="mx-2">·</span>
          {tt("Last updated")} {new Date(tenant.updatedAt).toLocaleString()}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canEdit || saving}
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Saving…")}</>
            : <><Save className="w-4 h-4" /> {tt("Save changes")}</>}
        </button>
      </div>

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the Tenant Admin role to edit this page.")}
        </div>
      )}
    </form>
  );
}

function LimitTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] p-3">
      <div className="text-xs text-[rgb(var(--muted))] uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-2xl font-bold leading-none mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
