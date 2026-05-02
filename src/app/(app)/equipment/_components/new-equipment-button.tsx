"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { Modal, Field } from "@/components/ui/modal";
import { useCan } from "@/lib/auth-context";
import type { Equipment } from "@/lib/mock-data";

const autoCode = () => `EQ-NEW-${String(Math.floor(Math.random() * 90) + 10)}`;
const addDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

export function NewEquipmentButton() {
  const tt = useT();
  const canCreate = useCan("equipment:create");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(autoCode());
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [calibrationDue, setCalibrationDue] = useState(addDays(180));
  const [status, setStatus] = useState<Equipment["status"]>("active");
  if (!canCreate) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    const created = await mutate(() => api.equipment.create({
      code: code.trim(),
      name: name.trim(),
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      serial: serial.trim(),
      calibrationDue,
      status,
    }), `Equipment ${code.trim()} registered`);
    if (!created) return;
    setCode(autoCode());
    setName(""); setManufacturer(""); setModel(""); setSerial("");
    setCalibrationDue(addDays(180)); setStatus("active");
    setOpen(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("Register equipment")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("Register equipment")}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>{tt("Cancel")}</button>
            <button type="submit" form="new-equipment-form" className="btn btn-primary">{tt("Save")}</button>
          </>
        }
      >
        <form id="new-equipment-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Code")}>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
          </Field>
          <Field label={tt("Status")}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Equipment["status"])}>
              <option value="active">{tt("Active")}</option>
              <option value="calibration_due">{tt("Cal. due")}</option>
              <option value="out_of_service">{tt("Out of service")}</option>
            </select>
          </Field>
          <Field label={tt("Name")} span={2}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={tt("Manufacturer")}>
            <input className="input" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </Field>
          <Field label={tt("Model")}>
            <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field label={tt("Serial")}>
            <input className="input" value={serial} onChange={(e) => setSerial(e.target.value)} />
          </Field>
          <Field label={tt("Cal. due")}>
            <input type="date" className="input" value={calibrationDue} onChange={(e) => setCalibrationDue(e.target.value)} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
