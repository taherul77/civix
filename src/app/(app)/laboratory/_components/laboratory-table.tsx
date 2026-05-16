"use client";

import { Pencil, Trash2, FlaskConical } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import type { LaboratoryRecord } from "./laboratory-modal";

interface Props {
  labs: LaboratoryRecord[];
  loading?: boolean;
  error?: string | null;
  canEdit: boolean;
  onEdit: (lab: LaboratoryRecord) => void;
  onDelete: (lab: LaboratoryRecord) => void;
}

export function LaboratoryTable({ labs, loading, error, canEdit, onEdit, onDelete }: Props) {
  const tt = useT();

  const columns: ColumnDef<LaboratoryRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (lab) => <span className="font-mono text-xs">{lab.code}</span>,
      sort: (a, b) => a.code.localeCompare(b.code),
    },
    {
      key: "name",
      header: tt("Name"),
      cell: (lab) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-gradient grid place-items-center text-white shrink-0">
            <FlaskConical className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{lab.name}</div>
            {lab.disciplines.length > 0 && (
              <div className="text-[10px] text-[rgb(var(--muted))] truncate">
                {lab.disciplines.join(" · ")}
              </div>
            )}
          </div>
        </div>
      ),
      sort: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "accreditation",
      header: tt("Accreditation"),
      cell: (lab) => lab.accreditation ? (
        <>
          <div className="font-medium">{lab.accreditation}</div>
          {lab.accreditationNumber && (
            <div className="text-[10px] text-[rgb(var(--muted))] font-mono">{lab.accreditationNumber}</div>
          )}
        </>
      ) : <span className="text-[rgb(var(--muted))] italic text-xs">—</span>,
    },
    {
      key: "defaultStandardBody",
      header: tt("Default body"),
      cell: (lab) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
          {lab.defaultStandardBody}
        </span>
      ),
      sort: (a, b) => a.defaultStandardBody.localeCompare(b.defaultStandardBody),
    },
    {
      key: "departments",
      header: tt("Departments"),
      cell: (lab) => lab.departments.length === 0
        ? <span className="text-[rgb(var(--muted))] italic text-xs">—</span>
        : <span className="text-xs text-[rgb(var(--muted))]">
            {lab.departments.length} {lab.departments.length === 1 ? tt("dept") : tt("depts")}
          </span>,
      sort: (a, b) => a.departments.length - b.departments.length,
      align: "right",
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (lab) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          lab.isActive
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
        }`}>
          {lab.isActive ? tt("Active") : tt("Inactive")}
        </span>
      ),
      sort: (a, b) => Number(b.isActive) - Number(a.isActive),
    },
    {
      key: "actions",
      header: tt("Actions"),
      align: "right",
      cell: (lab) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(lab)}
            className="p-1.5 rounded hover:bg-brand-500/10 text-brand-600"
            aria-label={tt("Edit")}
            title={tt("Edit")}
            disabled={!canEdit}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(lab)}
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
      rows={labs}
      columns={columns}
      getRowId={(lab) => lab.id}
      loading={loading}
      error={error}
      searchable
      searchPlaceholder={tt("Search laboratories…")}
      searchFilter={(lab, q) =>
        [lab.code, lab.name, lab.accreditation, lab.accreditationNumber, ...lab.disciplines, ...lab.departments]
          .filter(Boolean).join(" ").toLowerCase().includes(q)
      }
      empty={tt("No laboratories")}
    />
  );
}
