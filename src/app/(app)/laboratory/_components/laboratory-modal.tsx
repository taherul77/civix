"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { Modal, Field } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";

const STANDARD_BODIES = ["ASTM", "SASO", "GSO", "BS", "EN"] as const;

export interface LaboratoryRecord {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  accreditation: string | null;
  accreditationNumber: string | null;
  defaultStandardBody: typeof STANDARD_BODIES[number];
  reportPrefix: string;
  sampleCodePrefix: string;
  departments: string[];
  disciplines: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial?: LaboratoryRecord;
  onClose: () => void;
  onSave: (input: Partial<LaboratoryRecord>) => Promise<void> | void;
}

const blank: Partial<LaboratoryRecord> = {
  code: "", name: "",
  accreditation: "", accreditationNumber: "",
  defaultStandardBody: "ASTM", reportPrefix: "RPT", sampleCodePrefix: "S",
  departments: [], disciplines: [],
  isActive: true,
};

export function LaboratoryModal({ open, mode, initial, onClose, onSave }: Props) {
  const tt = useT();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [accreditation, setAccreditation] = useState("");
  const [accreditationNumber, setAccreditationNumber] = useState("");
  const [defaultStandardBody, setDefaultStandardBody] = useState<typeof STANDARD_BODIES[number]>("ASTM");
  const [reportPrefix, setReportPrefix] = useState("RPT");
  const [sampleCodePrefix, setSampleCodePrefix] = useState("S");
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDept, setNewDept] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [newDiscipline, setNewDiscipline] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = initial ?? blank;
    setCode(src.code ?? "");
    setName(src.name ?? "");
    setAccreditation(src.accreditation ?? "");
    setAccreditationNumber(src.accreditationNumber ?? "");
    setDefaultStandardBody((src.defaultStandardBody ?? "ASTM") as typeof STANDARD_BODIES[number]);
    setReportPrefix(src.reportPrefix ?? "RPT");
    setSampleCodePrefix(src.sampleCodePrefix ?? "S");
    setDepartments(src.departments ?? []);
    setDisciplines(src.disciplines ?? []);
    setIsActive(src.isActive ?? true);
    setNewDept("");
    setNewDiscipline("");
  }, [open, initial]);

  const addDept = () => {
    const v = newDept.trim();
    if (!v || departments.includes(v)) return;
    setDepartments([...departments, v]);
    setNewDept("");
  };
  const removeDept = (d: string) => setDepartments(departments.filter((x) => x !== d));

  const addDiscipline = () => {
    const v = newDiscipline.trim();
    if (!v || disciplines.includes(v)) return;
    setDisciplines([...disciplines, v]);
    setNewDiscipline("");
  };
  const removeDiscipline = (d: string) => setDisciplines(disciplines.filter((x) => x !== d));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        code: code.trim(),
        name: name.trim(),
        accreditation: accreditation.trim() || undefined,
        accreditationNumber: accreditationNumber.trim() || undefined,
        defaultStandardBody,
        reportPrefix:     reportPrefix.trim()     || "RPT",
        sampleCodePrefix: sampleCodePrefix.trim() || "S",
        departments,
        disciplines,
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
      title={mode === "edit" ? tt("Edit laboratory") : tt("New laboratory")}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            {tt("Cancel")}
          </button>
          <button type="submit" form="laboratory-form" className="btn btn-primary" disabled={saving}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Saving…")}</>
              : <><Save className="w-4 h-4" /> {mode === "edit" ? tt("Save changes") : tt("Create laboratory")}</>}
          </button>
        </>
      }
    >
      <form id="laboratory-form" onSubmit={submit} className="space-y-5">
        {/* Identity */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Identity")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={tt("Laboratory code")}>
              <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="LAB-001" />
            </Field>
            <Field label={tt("Laboratory name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Main laboratory" />
            </Field>
            <Field label={tt("Accreditation standard")}>
              <input className="input" value={accreditation} onChange={(e) => setAccreditation(e.target.value)} placeholder="ISO/IEC 17025:2017" />
            </Field>
            <Field label={tt("Accreditation number")}>
              <input className="input font-mono" value={accreditationNumber} onChange={(e) => setAccreditationNumber(e.target.value)} placeholder="SAAC-LAB-1234" />
            </Field>
          </div>
        </section>

        {/* Defaults */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Defaults")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={tt("Default standard body")}>
              <select className="input" value={defaultStandardBody} onChange={(e) => setDefaultStandardBody(e.target.value as typeof STANDARD_BODIES[number])}>
                {STANDARD_BODIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={tt("Report prefix")}>
              <input className="input font-mono" value={reportPrefix} onChange={(e) => setReportPrefix(e.target.value)} />
            </Field>
            <Field label={tt("Sample code prefix")}>
              <input className="input font-mono" value={sampleCodePrefix} onChange={(e) => setSampleCodePrefix(e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Catalogs */}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
            {tt("Catalogs")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChipList
              label={tt("Departments")}
              items={departments}
              newValue={newDept}
              onNewChange={setNewDept}
              onAdd={addDept}
              onRemove={removeDept}
              placeholder={tt("New department")}
            />
            <ChipList
              label={tt("Disciplines")}
              items={disciplines}
              newValue={newDiscipline}
              onNewChange={setNewDiscipline}
              onAdd={addDiscipline}
              onRemove={removeDiscipline}
              placeholder={tt("New discipline")}
            />
          </div>
        </section>

        {/* Status */}
        <section>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm">{tt("Laboratory is active")}</span>
          </label>
        </section>
      </form>
    </Modal>
  );
}

function ChipList({
  label, items, newValue, onNewChange, onAdd, onRemove, placeholder,
}: {
  label: string;
  items: string[];
  newValue: string;
  onNewChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium mb-1">{label}</div>
      <div className="flex items-center gap-2 mb-2">
        <input
          className="input flex-1"
          placeholder={placeholder}
          value={newValue}
          onChange={(e) => onNewChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
        />
        <button type="button" className="btn btn-outline" onClick={onAdd} disabled={!newValue.trim()}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-1">
        {items.length === 0 && (
          <li className="text-sm text-[rgb(var(--muted))] italic">No items</li>
        )}
        {items.map((item) => (
          <li key={item} className="flex items-center justify-between rounded-lg px-3 py-1.5 bg-[rgb(var(--bg-soft))]">
            <span className="text-sm">{item}</span>
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="p-1 rounded hover:bg-rose-500/10 text-rose-500"
              aria-label="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
