"use client";

import Link from "next/link";
import { useState, useMemo, type FormEvent } from "react";
import { Plus, ListPlus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useData } from "@/store/data-store";
import { Modal, Field } from "@/components/ui/modal";
import type { Test } from "@/lib/mock-data";

const CATS = ["concrete", "soil", "aggregate", "asphalt", "steel", "cement", "masonry", "water"] as const;
const today = () => new Date().toISOString().slice(0, 10);

function autoTestCode() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `T-${yy}-${mm}-${n}`;
}

export function NewTestActions() {
  const tt = useT();
  return (
    <>
      <QuickAddTest />
      <Link href="/tests/new" className="btn btn-primary">
        <Plus className="w-4 h-4" /> {tt("New test")}
      </Link>
    </>
  );
}

function QuickAddTest() {
  const tt = useT();
  const loc = useLoc();
  const projects = useData((s) => s.projects);
  const samples = useData((s) => s.samples);
  const addTest = useData((s) => s.addTest);
  const [open, setOpen] = useState(false);

  const [code, setCode] = useState(autoTestCode());
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Test["category"]>("concrete");
  const [standard, setStandard] = useState("");
  const [projectId, setProjectId] = useState("");
  const projectSamples = useMemo(
    () => samples.filter((s) => s.projectId === projectId),
    [samples, projectId]
  );
  const [sampleId, setSampleId] = useState("");
  const [technician, setTechnician] = useState("");
  const [testDate, setTestDate] = useState(today());
  const [status, setStatus] = useState<Test["status"]>("draft");
  const [passFail, setPassFail] = useState<Test["passFail"]>("pending");
  const [resultValue, setResultValue] = useState("");
  const [resultUnit, setResultUnit] = useState("");
  const [resultLabel, setResultLabel] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const useProject = projectId || projects[0]?.id || "";
    if (!code.trim() || !name.trim() || !useProject) return;
    const useSample = sampleId
      || samples.find((s) => s.projectId === useProject)?.id
      || samples[0]?.id
      || "";
    const primaryResult = resultValue.trim()
      ? {
          value: Number(resultValue),
          unit: resultUnit.trim() || "",
          label: resultLabel.trim() || name.trim(),
        }
      : undefined;
    addTest({
      code: code.trim(),
      name: name.trim(),
      category,
      standard: standard.trim(),
      sampleId: useSample,
      projectId: useProject,
      testDate,
      technician: technician.trim(),
      status,
      passFail,
      primaryResult,
    });
    setCode(autoTestCode()); setName(""); setStandard("");
    setTechnician(""); setStatus("draft"); setPassFail("pending");
    setResultValue(""); setResultUnit(""); setResultLabel("");
    setOpen(false);
  };

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        <ListPlus className="w-4 h-4" /> {tt("Add")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("New test")}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>{tt("Cancel")}</button>
            <button type="submit" form="quick-add-test-form" className="btn btn-primary">{tt("Save")}</button>
          </>
        }
      >
        <form id="quick-add-test-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Code")}>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
          </Field>
          <Field label={tt("Type")}>
            <select className="input capitalize" value={category} onChange={(e) => setCategory(e.target.value as Test["category"])}>
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={tt("Test")} span={2}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={tt("Standard")} span={2}>
            <input className="input" value={standard} onChange={(e) => setStandard(e.target.value)} placeholder="e.g. ASTM C39" />
          </Field>
          <Field label={tt("Project")}>
            <select className="input" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSampleId(""); }} required>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {loc(p.name)}</option>
              ))}
            </select>
          </Field>
          <Field label={tt("Sample")}>
            <select className="input" value={sampleId} onChange={(e) => setSampleId(e.target.value)}>
              <option value="">—</option>
              {projectSamples.map((s) => (
                <option key={s.id} value={s.id}>{s.code}</option>
              ))}
            </select>
          </Field>
          <Field label={tt("Engineer") + " / " + tt("Tested by")}>
            <input className="input" value={technician} onChange={(e) => setTechnician(e.target.value)} />
          </Field>
          <Field label={tt("Date")}>
            <input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </Field>
          <Field label={tt("Status")}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Test["status"])}>
              <option value="draft">{tt("Draft")}</option>
              <option value="submitted">{tt("Submitted")}</option>
              <option value="reviewed">{tt("Reviewed")}</option>
              <option value="approved">{tt("Approved")}</option>
            </select>
          </Field>
          <Field label={tt("P/F")}>
            <select className="input" value={passFail} onChange={(e) => setPassFail(e.target.value as Test["passFail"])}>
              <option value="pending">{tt("Pending")}</option>
              <option value="pass">{tt("PASS")}</option>
              <option value="fail">{tt("FAIL")}</option>
            </select>
          </Field>
          <Field label={tt("Result") + " — " + tt("value")}>
            <input type="number" step="any" className="input" value={resultValue} onChange={(e) => setResultValue(e.target.value)} />
          </Field>
          <Field label={tt("Result") + " — unit"}>
            <input className="input" value={resultUnit} onChange={(e) => setResultUnit(e.target.value)} placeholder="MPa, °C, %" />
          </Field>
          <Field label={tt("Result") + " — label"} span={2}>
            <input className="input" value={resultLabel} onChange={(e) => setResultLabel(e.target.value)} placeholder="f'c @ 28d" />
          </Field>
        </form>
      </Modal>
    </>
  );
}
