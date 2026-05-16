"use client";

import { useState } from "react";
import { Download, ShieldCheck, ShieldAlert, QrCode as QrIcon, Send } from "lucide-react";
import { useInvoicesQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useData, type Invoice } from "@/store/data-store";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { ZatcaModal } from "./zatca-modal";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";

export function InvoicesTable() {
  const tt = useT();
  const { data: invoices = [], isLoading, error } = useInvoicesQuery();
  const csid = useData((s) => s.csid);
  const [modalInv, setModalInv] = useState<Invoice | null>(null);

  const onClear = async (id: string) => {
    await mutate(() => api.invoices.clearWithZatca(id), "Invoice cleared with ZATCA");
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      key: "id",
      header: tt("Invoice"),
      cell: (inv) => <span className="font-mono text-xs">{inv.id}</span>,
      sort: (a, b) => a.id.localeCompare(b.id),
    },
    {
      key: "client",
      header: tt("Client"),
      cell: (inv) => inv.client,
      sort: (a, b) => a.client.localeCompare(b.client),
    },
    {
      key: "date",
      header: tt("Date"),
      cell: (inv) => inv.date,
      sort: (a, b) => a.date.localeCompare(b.date),
    },
    {
      key: "amount",
      header: tt("Amount"),
      cell: (inv) => <span className="font-mono text-sm">SAR {inv.amount.toLocaleString()}</span>,
      sort: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      key: "vat",
      header: tt("VAT (15%)"),
      cell: (inv) => <span className="font-mono text-sm">SAR {inv.vat.toLocaleString()}</span>,
      sort: (a, b) => a.vat - b.vat,
      align: "right",
    },
    {
      key: "zatcaUuid",
      header: tt("ZATCA UUID"),
      cell: (inv) => inv.zatcaPayload ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-mono text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          {inv.zatcaPayload.uuid.slice(0, 8)}…
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
          <ShieldAlert className="w-3.5 h-3.5" /> not cleared
        </span>
      ),
      sort: (a, b) => Number(!!b.zatcaPayload) - Number(!!a.zatcaPayload),
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (inv) => (
        <span className={`badge ${inv.status === "paid" ? "badge-pass" : inv.status === "sent" ? "badge-info" : "badge-muted"}`}>
          {inv.status}
        </span>
      ),
      sort: (a, b) => a.status.localeCompare(b.status),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (inv) => {
        const cleared = !!inv.zatcaPayload;
        return (
          <div className="flex items-center gap-1 justify-end">
            {cleared ? (
              <button
                onClick={() => setModalInv(inv)}
                className="btn btn-ghost px-2"
                title="View ZATCA QR + TLV fields"
              >
                <QrIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onClear(inv.id)}
                disabled={!csid}
                className="btn btn-outline px-2 text-xs"
                title={csid ? "Sign and submit to ZATCA" : "Issue a CSID first"}
              >
                <Send className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button className="btn btn-ghost px-2" title="Download PDF">
              <Download className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        rows={invoices}
        columns={columns}
        getRowId={(inv) => inv.id}
        loading={isLoading}
        error={error?.message ?? null}
        searchable
        searchPlaceholder={tt("Search invoices…")}
        searchFilter={(inv, q) =>
          [inv.id, inv.client, inv.date, inv.status].join(" ").toLowerCase().includes(q)
        }
        empty={tt("No invoices")}
      />

      <ZatcaModal
        open={!!modalInv}
        onClose={() => setModalInv(null)}
        invoice={modalInv}
      />
    </>
  );
}
