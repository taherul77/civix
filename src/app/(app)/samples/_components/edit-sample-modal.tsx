"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Modal, Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import type { SampleRecord } from "@/server/contracts";
import type { Sample } from "@/lib/mock-data";

const TYPES = ["concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;

interface Props {
  open: boolean;
  sample: SampleRecord;
  onClose: () => void;
  onSaved?: (updated: SampleRecord) => void;
}

export function EditSampleModal({ open, sample, onClose, onSaved }: Props) {
  const tt = useT();
  const loc = useLoc();

  const [type, setType] = useState<Sample["type"]>(sample.type);
  const [date, setDate] = useState(sample.date);
  const [location, setLocation] = useState(loc(sample.location));
  const [sampledBy, setSampledBy] = useState(loc(sample.sampledBy));
  const [status, setStatus] = useState<Sample["status"]>(
    sample.status === "in_test" || sample.status === "completed" ? "pending" : sample.status,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(sample.type);
    setDate(sample.date);
    setLocation(loc(sample.location));
    setSampledBy(loc(sample.sampledBy));
    setStatus(sample.status === "in_test" || sample.status === "completed" ? "pending" : sample.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sample.id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = await mutate(
      () => api.samples.update(sample.id, {
        type,
        date,
        location: location.trim(),
        sampledBy: sampledBy.trim(),
        status,
      }),
      tt(`Sample ${sample.code} updated`),
    );
    setSaving(false);
    if (updated) {
      onSaved?.(updated);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tt("Edit sample")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="edit-sample-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Updating…")}</>
              : <><Save className="w-4 h-4" /> {tt("Update")}</>}
          </button>
        </>
      }
    >
      <form id="edit-sample-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tt("Type")}>
          <select className="input capitalize" value={type} onChange={(e) => setType(e.target.value as Sample["type"])}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label={tt("Status")}>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Sample["status"])}>
            <option value="pending">{tt("Pending")}</option>
          </select>
        </Field>
        <Field label={tt("Location")} span={2}>
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label={tt("Sampled by")}>
          <input className="input" value={sampledBy} onChange={(e) => setSampledBy(e.target.value)} />
        </Field>
        <Field label={tt("Date")}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
