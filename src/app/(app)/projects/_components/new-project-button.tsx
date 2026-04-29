"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { Modal, Field } from "@/components/ui/modal";
import { useCan } from "@/lib/auth-context";

const today = () => new Date().toISOString().slice(0, 10);
const autoCode = () => `PRJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

export function NewProjectButton() {
  const tt = useT();
  const canCreate = useCan("project:create");
  const [open, setOpen] = useState(false);
  if (!canCreate) return null;

  const [code, setCode] = useState(autoCode());
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [city, setCity] = useState("");
  const [engineer, setEngineer] = useState("");
  const [status, setStatus] = useState<"active" | "on_hold" | "completed">("active");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [contractValue, setContractValue] = useState("");

  const reset = () => {
    setCode(autoCode());
    setName(""); setClient(""); setCity(""); setEngineer("");
    setStatus("active"); setStartDate(today()); setEndDate(""); setContractValue("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    const created = await mutate(() => api.projects.create({
      code: code.trim(),
      name: name.trim(),
      client: client.trim(),
      city: city.trim(),
      engineer: engineer.trim(),
      status,
      startDate,
      endDate: endDate || startDate,
      contractValue: Number(contractValue) || 0,
    }), `Project ${code.trim()} created`);
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
          <Field label={tt("Code")}>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
          </Field>
          <Field label={tt("Status")}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as never)}>
              <option value="active">{tt("Active")}</option>
              <option value="on_hold">{tt("On hold")}</option>
              <option value="completed">{tt("Completed")}</option>
            </select>
          </Field>
          <Field label={tt("Project")} span={2}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={tt("Client")}>
            <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
          </Field>
          <Field label={tt("City")}>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label={tt("Engineer")} span={2}>
            <input className="input" value={engineer} onChange={(e) => setEngineer(e.target.value)} />
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
