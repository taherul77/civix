"use client";

import { Download } from "lucide-react";
import { useInvoicesQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";

export function InvoicesTable() {
  const tt = useT();
  const { data: invoices = [] } = useInvoicesQuery();

  return (
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
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-xs">{inv.id}</td>
                <td>{inv.client}</td>
                <td>{inv.date}</td>
                <td className="font-mono text-sm">SAR {inv.amount.toLocaleString()}</td>
                <td className="font-mono text-sm">SAR {inv.vat.toLocaleString()}</td>
                <td className="font-mono text-xs">{inv.zatca}</td>
                <td>
                  <span className={`badge ${inv.status === "paid" ? "badge-pass" : inv.status === "sent" ? "badge-info" : "badge-muted"}`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost px-2"><Download className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
