"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserCog, Save, Mail, Phone, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";
import { toast } from "@/components/ui/toast";

export default function ProfileSettingPage() {
  const tt = useT();
  const user = useApp((s) => s.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [iqama, setIqama] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [signatureUrl, setSignatureUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success(tt("Profile saved (local only — backend wiring pending)"));
  };

  if (!user) {
    return (
      <div className="card p-6 text-sm text-[rgb(var(--muted))]">
        {tt("Sign in to view your profile.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile setting"
        description="Your personal information, contact details, and signing preferences."
      />

      <form onSubmit={submit} className="space-y-6">
        <section className="card p-6">
          <header className="flex items-center gap-2 mb-4">
            <UserCog className="w-4 h-4 text-brand-600" />
            <h3 className="font-semibold">{tt("Personal info")}</h3>
          </header>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-white text-2xl font-bold shrink-0">
              {(name || user.email).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-[rgb(var(--muted))]">
                <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {user.tenant}</span>
                <span className="mx-2">·</span>
                <span>{user.role}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={tt("Full name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={tt("Email")}>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
                <input className="input pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </Field>
            <Field label={tt("Phone")}>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
                <input className="input pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5..." />
              </div>
            </Field>
            <Field label={tt("Department")}>
              <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </Field>
            <Field label={tt("Iqama / National ID")}>
              <input className="input font-mono" value={iqama} onChange={(e) => setIqama(e.target.value)} />
            </Field>
            <Field label={tt("Preferred language")}>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value as "en" | "ar")}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="card p-6">
          <header className="mb-4">
            <h3 className="font-semibold">{tt("Signing")}</h3>
            <p className="help mt-1">
              {tt("Your e-signature is appended to reports you approve or sign. Upload a transparent PNG.")}
            </p>
          </header>

          <Field label={tt("Signature image URL")}>
            <div className="flex items-center gap-3">
              <div className="w-32 h-12 rounded-lg bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))] grid place-items-center overflow-hidden shrink-0">
                {signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signatureUrl} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span className="text-xs text-[rgb(var(--muted))]">{tt("No signature")}</span>
                )}
              </div>
              <input className="input" placeholder="https://…" value={signatureUrl} onChange={(e) => setSignatureUrl(e.target.value)} />
            </div>
          </Field>
        </section>

        <div className="flex items-center justify-end pt-2">
          <button type="submit" className="btn btn-primary">
            <Save className="w-4 h-4" /> {tt("Save changes")}
          </button>
        </div>
      </form>
    </div>
  );
}
