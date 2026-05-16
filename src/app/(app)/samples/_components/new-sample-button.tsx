"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useProjectsQuery } from "@/server/queries";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { Modal, Field } from "@/components/ui/modal";
import { useActor, useCan } from "@/lib/auth-context";
import type { Sample } from "@/lib/mock-data";

const TYPES = ["concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;
const today = () => new Date().toISOString().slice(0, 10);

export function NewSampleButton() {
  const tt = useT();
  const loc = useLoc();
  // Samples can only be attached to projects that have been sent into the
  // sample workflow (status === "in_process"). Active / on_hold / inactive
  // are intentionally hidden so users can't bypass the Send step.
  const { data: allProjects = [] } = useProjectsQuery();
  const projects = allProjects.filter((p) => p.status === "in_process");
  const actor = useActor();
  const canCreate = useCan("sample:create");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Sample["type"]>("concrete");
  const [projectId, setProjectId] = useState("");
  const [location, setLocation] = useState("");
  const [sampledBy, setSampledBy] = useState("");
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState<Sample["status"]>("pending");
  if (!canCreate) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const useProject = projectId || projects[0]?.id || "";
    if (!useProject) return;
    const created = await mutate(() => api.samples.create({
      // Empty code → backend auto-generates SMP-YYYY-NNN per tenant.
      code: "",
      type,
      projectId: useProject,
      date,
      location: location.trim(),
      sampledBy: sampledBy.trim() || actor?.name || "—",
      status,
    }), tt(`Sample created`));
    if (!created) return;
    setLocation(""); setSampledBy(""); setStatus("pending");
    setOpen(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("New sample")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("New sample")}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>{tt("Cancel")}</button>
            <button type="submit" form="new-sample-form" className="btn btn-primary">{tt("Save")}</button>
          </>
        }
      >
        <form id="new-sample-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Type")} span={2}>
            <select className="input capitalize" value={type} onChange={(e) => setType(e.target.value as Sample["type"])}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label={tt("Project")} span={2}>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {loc(p.name)}</option>
              ))}
            </select>
            {projects.length === 0 && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                {tt("No projects available — send a project to samples first from the Projects page.")}
              </p>
            )}
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
          <Field label={tt("Status")} span={2}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Sample["status"])}>
              <option value="pending">{tt("Pending")}</option>
              <option value="in_test">{tt("In test")}</option>
              <option value="completed">{tt("Completed")}</option>
            </select>
          </Field>
        </form>
      </Modal>
    </>
  );
}
