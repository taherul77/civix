"use client";

import { Pencil, Trash2, HardHat, Mail, Phone } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { EngineerRecord } from "./engineer-modal";

interface Props {
  engineers: EngineerRecord[];
  loading?: boolean;
  error?: string | null;
  canEdit: boolean;
  onEdit: (engineer: EngineerRecord) => void;
  onDelete: (engineer: EngineerRecord) => void;
}

export function EngineersTable({ engineers, loading, error, canEdit, onEdit, onDelete }: Props) {
  const tt = useT();

  const columns: ColumnDef<EngineerRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (e) => <span className="font-mono text-xs">{e.code}</span>,
      sort: (a, b) => a.code.localeCompare(b.code),
    },
    {
      key: "name",
      header: tt("Name"),
      cell: (e) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-gradient grid place-items-center text-white shrink-0">
            <HardHat className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{e.name}</div>
            {e.specialty && (
              <div className="text-[10px] text-[rgb(var(--muted))] truncate">{e.specialty}</div>
            )}
          </div>
        </div>
      ),
      sort: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "contact",
      header: tt("Contact"),
      cell: (e) => (e.email || e.phone) ? (
        <div className="space-y-0.5 text-xs">
          {e.email && (
            <div className="flex items-center gap-1 text-[rgb(var(--muted))]">
              <Mail className="w-3 h-3" /><span className="truncate">{e.email}</span>
            </div>
          )}
          {e.phone && (
            <div className="flex items-center gap-1 text-[rgb(var(--muted))]">
              <Phone className="w-3 h-3" /><span className="font-mono">{e.phone}</span>
            </div>
          )}
        </div>
      ) : <span className="text-[rgb(var(--muted))] italic">—</span>,
    },
    {
      key: "license",
      header: tt("License"),
      cell: (e) => e.licenseNumber
        ? <span className="font-mono text-xs">{e.licenseNumber}</span>
        : <span className="text-[rgb(var(--muted))] italic">—</span>,
      sort: (a, b) => (a.licenseNumber ?? "").localeCompare(b.licenseNumber ?? ""),
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (e) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          e.isActive
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
        }`}>
          {e.isActive ? tt("Active") : tt("Inactive")}
        </span>
      ),
      sort: (a, b) => Number(b.isActive) - Number(a.isActive),
    },
    {
      key: "actions",
      header: tt("Actions"),
      align: "right",
      cell: (e) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(e)}
            className="p-1.5 rounded hover:bg-brand-500/10 text-brand-600"
            aria-label={tt("Edit")}
            title={tt("Edit")}
            disabled={!canEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(e)}
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
      rows={engineers}
      columns={columns}
      getRowId={(e) => e.id}
      loading={loading}
      error={error}
      searchable
      searchPlaceholder={tt("Search engineers…")}
      searchFilter={(e, q) =>
        [e.code, e.name, e.email ?? "", e.phone ?? "", e.licenseNumber ?? "", e.specialty ?? ""]
          .join(" ").toLowerCase().includes(q)
      }
      empty={tt("No engineers yet")}
    />
  );
}
