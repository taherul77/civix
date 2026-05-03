"use client";

import { Pencil, Trash2, FlaskConical } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { LaboratoryRecord } from "./laboratory-modal";

interface Props {
  labs: LaboratoryRecord[];
  canEdit: boolean;
  onEdit: (lab: LaboratoryRecord) => void;
  onDelete: (lab: LaboratoryRecord) => void;
}

export function LaboratoryTable({ labs, canEdit, onEdit, onDelete }: Props) {
  const tt = useT();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[rgb(var(--bg-soft))]">
          <tr>
            <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">{tt("Code")}</th>
            <th className="text-left px-4 py-2 font-semibold">{tt("Name")}</th>
            <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">{tt("Accreditation")}</th>
            <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">{tt("Default body")}</th>
            <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">{tt("Departments")}</th>
            <th className="text-left px-4 py-2 font-semibold whitespace-nowrap">{tt("Status")}</th>
            <th className="text-right px-4 py-2 font-semibold whitespace-nowrap">{tt("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {labs.map((lab) => (
            <tr
              key={lab.id}
              className="border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-soft))]"
            >
              <td className="px-4 py-2 font-mono text-xs">{lab.code}</td>
              <td className="px-4 py-2">
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
              </td>
              <td className="px-4 py-2">
                {lab.accreditation ? (
                  <>
                    <div className="font-medium">{lab.accreditation}</div>
                    {lab.accreditationNumber && (
                      <div className="text-[10px] text-[rgb(var(--muted))] font-mono">{lab.accreditationNumber}</div>
                    )}
                  </>
                ) : (
                  <span className="text-[rgb(var(--muted))] italic text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                  {lab.defaultStandardBody}
                </span>
              </td>
              <td className="px-4 py-2 text-xs">
                {lab.departments.length === 0 ? (
                  <span className="text-[rgb(var(--muted))] italic">—</span>
                ) : (
                  <span className="text-[rgb(var(--muted))]">
                    {lab.departments.length} {lab.departments.length === 1 ? tt("dept") : tt("depts")}
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    lab.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
                  }`}
                >
                  {lab.isActive ? tt("Active") : tt("Inactive")}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
