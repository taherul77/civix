"use client";

import { useState } from "react";
import { Download, ShieldCheck, ShieldAlert, QrCode as QrIcon, Send } from "lucide-react";
import { useInvoicesQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useData, type Invoice } from "@/store/data-store";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { ZatcaModal } from "./zatca-modal";

export function InvoicesTable() {
  const tt = useT();
  const { data: invoices = [] } = useInvoicesQuery();
  const csid = useData((s) => s.csid);
  const [modalInv, setModalInv] = useState<Invoice | null>(null);

  const onClear = async (id: string) => {
    await mutate(() => api.invoices.clearWithZatca(id), "Invoice cleared with ZATCA");
  };

  return (
    <>
      <div className="card overflow-hidden">
        <h3 className="font-semibold p-4 border-b border-[rgb(var(--border))]">{tt("Recent invoices")}</h3>
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr>
                <th>{tt("Invoice")}</th>
                <th>{tt("Client")}</th>
                <th>{tt("Date")}</th>
                <th>{tt("Amount")}</th>
                <th>{tt("VAT (15%)")}</th>
                <th>{tt("ZATCA UUID")}</th>
                <th>{tt("Status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const cleared = !!inv.zatcaPayload;
                return (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs">{inv.id}</td>
                    <td>{inv.client}</td>
                    <td>{inv.date}</td>
                    <td className="font-mono text-sm">SAR {inv.amount.toLocaleString()}</td>
                    <td className="font-mono text-sm">SAR {inv.vat.toLocaleString()}</td>
                    <td className="font-mono text-xs">
                      {cleared ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {inv.zatcaPayload!.uuid.slice(0, 8)}…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <ShieldAlert className="w-3.5 h-3.5" /> not cleared
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${inv.status === "paid" ? "badge-pass" : inv.status === "sent" ? "badge-info" : "badge-muted"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ZatcaModal
        open={!!modalInv}
        onClose={() => setModalInv(null)}
        invoice={modalInv}
      />
    </>
  );
}
