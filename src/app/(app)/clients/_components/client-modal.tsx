"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Modal, Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";

export interface ClientRecord {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  vatNumber: string | null;
  crNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial?: ClientRecord;
  onClose: () => void;
  onSave: (input: Partial<ClientRecord>) => Promise<void> | void;
}

const blank: Partial<ClientRecord> = {
  code: "", name: "",
  contactName: "", contactEmail: "", contactPhone: "",
  address: "", city: "", country: "Saudi Arabia",
  vatNumber: "", crNumber: "",
  notes: "",
  isActive: true,
};

export function ClientModal({ open, mode, initial, onClose, onSave }: Props) {
  const tt = useT();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [vatNumber, setVatNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = initial ?? blank;
    setCode(src.code ?? "");
    setName(src.name ?? "");
    setContactName(src.contactName ?? "");
    setContactEmail(src.contactEmail ?? "");
    setContactPhone(src.contactPhone ?? "");
    setAddress(src.address ?? "");
    setCity(src.city ?? "");
    setCountry(src.country ?? "Saudi Arabia");
    setVatNumber(src.vatNumber ?? "");
    setCrNumber(src.crNumber ?? "");
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
        contactName:  contactName.trim()  || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        address:      address.trim()      || undefined,
        city:         city.trim()         || undefined,
        country:      country.trim()      || undefined,
        vatNumber:    vatNumber.trim()    || undefined,
        crNumber:     crNumber.trim()     || undefined,
        notes:        notes.trim()        || undefined,
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
      title={mode === "edit" ? tt("Edit client") : tt("New client")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="client-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Saving…")}</>
              : <><Save className="w-4 h-4" /> {mode === "edit" ? tt("Save changes") : tt("Create client")}</>}
          </button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} className="space-y-5">
        {/* Identity */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Identity")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Client code")}>
              <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="CLI-001" />
            </Field>
            <Field label={tt("Client name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme Construction Co." />
            </Field>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Primary contact")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={tt("Contact name")}>
              <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" />
            </Field>
            <Field label={tt("Email")}>
              <input type="email" className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@example.com" />
            </Field>
            <Field label={tt("Phone")}>
              <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+966 5..." />
            </Field>
          </div>
        </section>

        {/* Address */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Address")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Street / building")} span={2}>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field label={tt("City")}>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label={tt("Country")}>
              <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Tax / registration */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Tax & registration")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("VAT number")}>
              <input className="input font-mono" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="3000000000003" />
            </Field>
            <Field label={tt("Commercial registration (CR)")}>
              <input className="input font-mono" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} placeholder="1010XXXXXX" />
            </Field>
          </div>
        </section>

        {/* Notes */}
        <section>
          <Field label={tt("Notes")}>
            <textarea
              className="input min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tt("Anything sales / lab staff should know about this client")}
            />
          </Field>
        </section>

        {/* Status */}
        <section>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm">{tt("Client is active")}</span>
          </label>
        </section>
      </form>
    </Modal>
  );
}
