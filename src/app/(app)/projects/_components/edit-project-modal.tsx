"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { Modal, Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { ClientSelect } from "./client-select";
import { EngineerSelect } from "./engineer-select";
import type { ProjectRecord } from "@/server/contracts";

interface Props {
  open: boolean;
  project: ProjectRecord;
  onClose: () => void;
  onSaved?: (updated: ProjectRecord) => void;
}

export function EditProjectModal({ open, project, onClose, onSaved }: Props) {
  const tt = useT();
  const loc = useLoc();

  const [name, setName] = useState(loc(project.name));
  const [client, setClient] = useState(loc(project.client));
  const [clientEmail, setClientEmail] = useState<string | null>(project.clientEmail ?? null);
  const [city, setCity] = useState(loc(project.city));
  const [engineer, setEngineer] = useState(loc(project.engineer));
  const [status, setStatus] = useState<ProjectRecord["status"]>(project.status);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);
  const [contractValue, setContractValue] = useState(String(project.contractValue ?? ""));
  const [saving, setSaving] = useState(false);

  // Reset whenever a different project is opened.
  useEffect(() => {
    if (!open) return;
    setName(loc(project.name));
    setClient(loc(project.client));
    setClientEmail(project.clientEmail ?? null);
    setCity(loc(project.city));
    setEngineer(loc(project.engineer));
    setStatus(project.status);
    setStartDate(project.startDate);
    setEndDate(project.endDate);
    setContractValue(String(project.contractValue ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project.id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const updated = await mutate(
      () => api.projects.update(project.id, {
        name: name.trim(),
        client: client.trim(),
        clientEmail: clientEmail ?? null,
        city: city.trim(),
        engineer: engineer.trim(),
        status,
        startDate,
        endDate: endDate || startDate,
        contractValue: Number(contractValue) || 0,
      }),
      tt(`Project ${project.code} updated`),
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
      title={tt("Edit project")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="edit-project-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Updating…")}</>
              : <><Save className="w-4 h-4" /> {tt("Update")}</>}
          </button>
        </>
      }
    >
      <form id="edit-project-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={tt("Project")} span={2}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={tt("Status")} span={2}>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ProjectRecord["status"])}>
            <option value="active">{tt("Active")}</option>
            <option value="on_hold">{tt("On hold")}</option>
            <option value="completed">{tt("Completed")}</option>
          </select>
        </Field>
        <Field label={tt("Client")}>
          <ClientSelect
            value={client}
            onChange={(n, e) => { setClient(n); setClientEmail(e); }}
          />
          {clientEmail && (
            <div className="text-[10px] text-[rgb(var(--muted))] mt-1 font-mono">{clientEmail}</div>
          )}
        </Field>
        <Field label={tt("City")}>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label={tt("Engineer")} span={2}>
          <EngineerSelect value={engineer} onChange={setEngineer} />
        </Field>
        <Field label={tt("Date") + " (start)"}>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label={tt("Date") + " (end)"}>
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label={tt("Contract value") + " (SAR)"} span={2}>
          <input
            type="number"
            min={0}
            className="input"
            value={contractValue}
            onChange={(e) => setContractValue(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
