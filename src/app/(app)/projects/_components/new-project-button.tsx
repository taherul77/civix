"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { Modal, Field } from "@/components/ui/modal";
import { useCan } from "@/lib/auth-context";
import { ClientSelect } from "./client-select";
import { EngineerSelect } from "./engineer-select";

const today = () => new Date().toISOString().slice(0, 10);

export function NewProjectButton() {
  const tt = useT();
  const canCreate = useCan("project:create");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [engineer, setEngineer] = useState("");
  // Create flow only allows active/inactive. on_hold is a paused-after-creation
  // state (Edit only); in_process / completed are workflow-driven.
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [contractValue, setContractValue] = useState("");
  if (!canCreate) return null;

  const reset = () => {
    setName(""); setClient(""); setClientEmail(null); setCity(""); setEngineer("");
    setStatus("active"); setStartDate(today()); setEndDate(""); setContractValue("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Code is omitted — the backend assigns the next PRJ-YYYY-NNN per tenant.
    const created = await mutate(() => api.projects.create({
      name: name.trim(),
      client: client.trim(),
      clientEmail: clientEmail ?? null,
      city: city.trim(),
      engineer: engineer.trim(),
      status,
      startDate,
      endDate: endDate || startDate,
      contractValue: Number(contractValue) || 0,
    }), tt("Project created"));
    if (!created) return;
    reset();
    setOpen(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("New project")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("New project")}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>{tt("Cancel")}</button>
            <button type="submit" form="new-project-form" className="btn btn-primary">{tt("Save")}</button>
          </>
        }
      >
        <form id="new-project-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Project")} span={2}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={tt("Status")} span={2}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as never)}>
              <option value="active">{tt("Active")}</option>
              <option value="inactive">{tt("Inactive")}</option>
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
    </>
  );
}
