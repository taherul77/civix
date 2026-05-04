"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { Modal, Field } from "@/components/ui/modal";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";

export function NewDepartmentButton() {
  const tt = useT();
  const canCreate = useCan("settings:update");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [manager, setManager] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!canCreate) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const created = await mutate(
      () => api.departments.create({
        name: name.trim(),
        code: code.trim() || undefined,
        manager: manager.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      }),
      tt(`Added ${name.trim()}`),
    );
    setSubmitting(false);
    if (!created) return;
    setName(""); setCode(""); setManager(""); setDescription(""); setIsActive(true);
    setOpen(false);
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("Add department")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("Add department")}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} disabled={submitting}>
              {tt("Cancel")}
            </button>
            <button type="submit" form="new-dept-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? tt("Saving…") : tt("Save")}
            </button>
          </>
        }
      >
        <form id="new-dept-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Name")} span={2}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={tt("Code")}>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CONC" />
          </Field>
          <Field label={tt("Manager")}>
            <input className="input" value={manager} onChange={(e) => setManager(e.target.value)} />
          </Field>
          <Field label={tt("Description")} span={2}>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label={tt("Status")} span={2}>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm">{tt("Active")}</span>
            </label>
          </Field>
        </form>
      </Modal>
    </>
  );
}
