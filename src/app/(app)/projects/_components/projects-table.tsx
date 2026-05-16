"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Send } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useProjectsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { useCan } from "@/lib/auth-context";
import { fmtAny, fmtSAR } from "@/lib/utils";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteProjectModal } from "./delete-project-modal";
import { SendProjectModal } from "./send-project-modal";
import type { ProjectRecord } from "@/server/contracts";

/** Once a project hits one of these, it's locked from edit / delete. */
const SENT_STATES = new Set<ProjectRecord["status"]>(["in_process", "completed"]);

export function ProjectsTable() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const canEdit = useCan("project:update");
  const canDelete = useCan("project:delete");
  const { data: projects = [], isLoading, error } = useProjectsQuery();

  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [removing, setRemoving] = useState<ProjectRecord | null>(null);
  const [sending, setSending] = useState<ProjectRecord | null>(null);

  const columns: ColumnDef<ProjectRecord>[] = [
    {
      key: "code",
      header: tt("Code"),
      cell: (p) => <span className="font-mono text-xs">{fmtAny(p.code, lang)}</span>,
      sort: (a, b) => String(a.code).localeCompare(String(b.code)),
    },
    {
      key: "name",
      header: tt("Project"),
      cell: (p) => (
        <Link href={`/projects/${p.id}`} className="font-medium hover:text-brand-600 hover:underline">
          {loc(p.name)}
        </Link>
      ),
      sort: (a, b) => loc(a.name).localeCompare(loc(b.name)),
    },
    {
      key: "client",
      header: tt("Client"),
      cell: (p) => loc(p.client),
      sort: (a, b) => loc(a.client).localeCompare(loc(b.client)),
    },
    {
      key: "city",
      header: tt("City"),
      cell: (p) => loc(p.city),
      sort: (a, b) => loc(a.city).localeCompare(loc(b.city)),
    },
    {
      key: "engineer",
      header: tt("Engineer"),
      cell: (p) => <span className="text-sm">{loc(p.engineer)}</span>,
      sort: (a, b) => loc(a.engineer).localeCompare(loc(b.engineer)),
    },
    {
      key: "samples",
      header: tt("Samples"),
      cell: (p) => fmtAny(p.sampleCount ?? 0, lang),
      sort: (a, b) => (a.sampleCount ?? 0) - (b.sampleCount ?? 0),
      align: "right",
    },
    {
      key: "tests",
      header: tt("Tests"),
      cell: (p) => fmtAny(p.testCount ?? 0, lang),
      sort: (a, b) => (a.testCount ?? 0) - (b.testCount ?? 0),
      align: "right",
    },
    {
      key: "status",
      header: tt("Status"),
      cell: (p) => <StatusBadge value={p.status} />,
      sort: (a, b) => String(a.status).localeCompare(String(b.status)),
    },
    {
      key: "contractValue",
      header: tt("Contract value"),
      cell: (p) => <span className="font-mono text-sm">{fmtSAR(p.contractValue, lang)}</span>,
      sort: (a, b) => (a.contractValue ?? 0) - (b.contractValue ?? 0),
      align: "right",
    },
    {
      key: "actions",
      header: tt("Actions"),
      align: "right",
      cell: (p) => {
        // Visual affordance only — the actual rules (inactive must reactivate,
        // already-sent can't resend, etc.) live on the backend and surface via
        // toast when the user clicks. Frontend just disables when locked.
        const isLocked = SENT_STATES.has(p.status);
        return (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditing(p); }}
              className="p-1.5 rounded hover:bg-brand-500/10 text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={tt("Edit")}
              title={tt("Edit")}
              disabled={!canEdit || isLocked}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSending(p); }}
              className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={tt("Send")}
              title={tt("Send to samples")}
              disabled={isLocked}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setRemoving(p); }}
              className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={tt("Delete")}
              title={tt("Delete")}
              disabled={!canDelete || isLocked}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        rows={projects}
        columns={columns}
        getRowId={(p) => p.id}
        loading={isLoading}
        error={error?.message ?? null}
        searchable
        searchPlaceholder={tt("Search projects…")}
        searchFilter={(p, q) =>
          [p.code, loc(p.name), loc(p.client), loc(p.city), loc(p.engineer)]
            .join(" ").toLowerCase().includes(q)
        }
      />

      {editing && (
        <EditProjectModal
          open
          project={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {removing && (
        <DeleteProjectModal
          open
          project={removing}
          onClose={() => setRemoving(null)}
        />
      )}

      {sending && (
        <SendProjectModal
          open
          project={sending}
          onClose={() => setSending(null)}
        />
      )}
    </>
  );
}
