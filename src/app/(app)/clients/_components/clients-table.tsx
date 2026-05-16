"use client";

import { Pencil, Trash2, Briefcase, Mail, Phone } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { ClientRecord } from "./client-modal";

interface Props {
  clients: ClientRecord[];
  loading?: boolean;
  error?: string | null;
  canEdit: boolean;
  onEdit: (client: ClientRecord) => void;
  onDelete: (client: ClientRecord) => void;
}

export function ClientsTable({ clients, loading, error, canEdit, onEdit, onDelete }: Props) {
  const tt = useT();

  const columns: ColumnDef<ClientRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (c) => <span className="font-mono text-xs">{c.code}</span>,
      sort: (a, b) => a.code.localeCompare(b.code),
    },
    {
      key: "name",
      header: tt("Name"),
      cell: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-gradient grid place-items-center text-white shrink-0">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{c.name}</div>
            {c.contactName && (
              <div className="text-[10px] text-[rgb(var(--muted))] truncate">{c.contactName}</div>
            )}
          </div>
        </div>
      ),
      sort: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "contact",
      header: tt("Contact"),
      cell: (c) => (c.contactEmail || c.contactPhone) ? (
        <div className="space-y-0.5 text-xs">
          {c.contactEmail && (
            <div className="flex items-center gap-1 text-[rgb(var(--muted))]">
              <Mail className="w-3 h-3" /><span className="truncate">{c.contactEmail}</span>
            </div>
          )}
          {c.contactPhone && (
            <div className="flex items-center gap-1 text-[rgb(var(--muted))]">
              <Phone className="w-3 h-3" /><span className="font-mono">{c.contactPhone}</span>
            </div>
          )}
        </div>
      ) : <span className="text-[rgb(var(--muted))] italic">—</span>,
    },
    {
      key: "location",
      header: tt("Location"),
      cell: (c) => (c.city || c.country) ? (
        <span className="text-xs text-[rgb(var(--muted))]">
          {[c.city, c.country].filter(Boolean).join(", ")}
        </span>
      ) : <span className="text-[rgb(var(--muted))] italic">—</span>,
      sort: (a, b) => `${a.country ?? ""}${a.city ?? ""}`.localeCompare(`${b.country ?? ""}${b.city ?? ""}`),
    },
    {
      key: "tax",
      header: tt("VAT / CR"),
      cell: (c) => (c.vatNumber || c.crNumber) ? (
        <div className="space-y-0.5 text-xs font-mono">
          {c.vatNumber && <div>{tt("VAT")} {c.vatNumber}</div>}
          {c.crNumber  && <div>{tt("CR")} {c.crNumber}</div>}
        </div>
      ) : <span className="text-[rgb(var(--muted))] italic">—</span>,
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (c) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          c.isActive
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
        }`}>
          {c.isActive ? tt("Active") : tt("Inactive")}
        </span>
      ),
      sort: (a, b) => Number(b.isActive) - Number(a.isActive),
    },
    {
      key: "actions",
      header: tt("Actions"),
      align: "right",
      cell: (c) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="p-1.5 rounded hover:bg-brand-500/10 text-brand-600"
            aria-label={tt("Edit")}
            title={tt("Edit")}
            disabled={!canEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(c)}
            className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
            aria-label={tt("Delete")}
            title={tt("Delete")}
            disabled={!canEdit}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      rows={clients}
      columns={columns}
      getRowId={(c) => c.id}
      loading={loading}
      error={error}
      searchable
      searchPlaceholder={tt("Search clients…")}
      searchFilter={(c, q) =>
        [c.code, c.name, c.contactName, c.contactEmail, c.contactPhone, c.city, c.country, c.vatNumber, c.crNumber]
          .filter(Boolean).join(" ").toLowerCase().includes(q)
      }
      empty={tt("No clients yet")}
    />
  );
}
