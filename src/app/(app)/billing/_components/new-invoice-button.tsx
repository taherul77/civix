"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useData, type Invoice } from "@/store/data-store";
import { Modal, Field } from "@/components/ui/modal";

const today = () => new Date().toISOString().slice(0, 10);
const autoId = () => `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

export function NewInvoiceButton() {
  const tt = useT();
  const addInvoice = useData((s) => s.addInvoice);
  const [open, setOpen] = useState(false);

  const [id, setId] = useState(autoId());
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState<Invoice["status"]>("draft");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !client.trim()) return;
    const amt = Number(amount) || 0;
    addInvoice({
      id: id.trim(),
      client: client.trim(),
      amount: amt,
      vat: Math.round(amt * 0.15),
      status,
      date,
      zatca: status === "draft" ? "—" : `ZX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });
    setId(autoId()); setClient(""); setAmount(""); setStatus("draft");
    setOpen(false);
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> {tt("New invoice")}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tt("New invoice")}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>{tt("Cancel")}</button>
            <button type="submit" form="new-invoice-form" className="btn btn-primary">{tt("Save")}</button>
          </>
        }
      >
        <form id="new-invoice-form" onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tt("Invoice")}>
            <input className="input" value={id} onChange={(e) => setId(e.target.value)} required />
          </Field>
          <Field label={tt("Date")}>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={tt("Client")} span={2}>
            <input className="input" value={client} onChange={(e) => setClient(e.target.value)} required />
          </Field>
          <Field label={tt("Amount") + " (SAR)"}>
            <input type="number" min={0} step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label={tt("Status")}>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Invoice["status"])}>
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="paid">paid</option>
            </select>
          </Field>
        </form>
      </Modal>
    </>
  );
}
