"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Modal, Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import type { ApiEngineer } from "@/server/api";

export type EngineerRecord = ApiEngineer;

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial?: EngineerRecord;
  onClose: () => void;
  onSave: (input: Partial<EngineerRecord>) => Promise<void> | void;
}

const blank: Partial<EngineerRecord> = {
  code: "", name: "",
  email: "", phone: "",
  licenseNumber: "", specialty: "",
  notes: "",
  isActive: true,
};

export function EngineerModal({ open, mode, initial, onClose, onSave }: Props) {
  const tt = useT();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = initial ?? blank;
    setCode(src.code ?? "");
    setName(src.name ?? "");
    setEmail(src.email ?? "");
    setPhone(src.phone ?? "");
    setLicenseNumber(src.licenseNumber ?? "");
    setSpecialty(src.specialty ?? "");
    setNotes(src.notes ?? "");
    setIsActive(src.isActive ?? true);
  }, [open, initial]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        code: code.trim(),
        name: name.trim(),
        email:         email.trim()         || undefined,
        phone:         phone.trim()         || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        specialty:     specialty.trim()     || undefined,
        notes:         notes.trim()         || undefined,
        isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? tt("Edit engineer") : tt("New engineer")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="engineer-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "edit" ? tt("Updating…") : tt("Saving…")}</>
              : <><Save className="w-4 h-4" /> {mode === "edit" ? tt("Update") : tt("Create engineer")}</>}
          </button>
        </>
      }
    >
      <form id="engineer-form" onSubmit={submit} className="space-y-5">
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Identity")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Engineer code")}>
              <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="ENG-001" />
            </Field>
            <Field label={tt("Full name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Eng. Mohammed Al-Saud" />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Contact")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Email")}>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="engineer@example.com" />
            </Field>
            <Field label={tt("Phone")}>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5..." />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Credentials")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("License / SCE number")}>
              <input className="input font-mono" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="SCE-12345" />
            </Field>
            <Field label={tt("Specialty")}>
              <input className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Structural / Geotechnical / Materials" />
            </Field>
          </div>
        </section>

        <section>
          <Field label={tt("Notes")}>
            <textarea
              className="input min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tt("Anything PMs should know about this engineer")}
            />
          </Field>
        </section>

        <section>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm">{tt("Engineer is active")}</span>
          </label>
        </section>
      </form>
    </Modal>
  );
}
