"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { apiFetch, isBackendActive } from "@/lib/api-client";
import { mutate } from "@/server/mutate";
import { ClientsTable } from "./_components/clients-table";
import { ClientModal, type ClientRecord } from "./_components/client-modal";
import { toast } from "@/components/ui/toast";

export default function ClientsSetupPage() {
  const tt = useT();
  const canEdit = useCan("settings:update");

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isBackendActive()) {
        setError(tt("Backend offline — sign in to load clients."));
        return;
      }
      const out = await apiFetch<{ items: ClientRecord[]; total: number }>("/v1/master-setup/clients");
      setClients(out.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async (input: Partial<ClientRecord>) => {
    const isUpdate = !!editing;
    const result = await mutate(
      () =>
        isUpdate
          ? apiFetch<ClientRecord>(`/v1/master-setup/clients/${editing!.id}`, { method: "PATCH", body: input })
          : apiFetch<ClientRecord>(`/v1/master-setup/clients`,                  { method: "POST",  body: input }),
      isUpdate ? tt(`Client "${editing!.code}" updated`) : tt(`Client "${input.code}" created`)
    );
    if (!result) return;
    setEditing(null);
    setCreating(false);
    void refresh();
  };

  const onDelete = async (client: ClientRecord) => {
    if (!confirm(tt(`Delete client "${client.name}"? This cannot be undone.`))) return;
    try {
      await apiFetch(`/v1/master-setup/clients/${client.id}`, { method: "DELETE" });
      toast.success(tt(`Client "${client.code}" deleted`));
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete client");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client setup"
        description="Manage the customers your laboratory tests samples for — invoices, reports, and project ownership all link back here."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> {tt("Refresh")}
            </button>
            <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!canEdit}>
              <Plus className="w-4 h-4" /> {tt("New client")}
            </button>
          </>
        }
      />

      <ClientsTable
        clients={clients}
        loading={loading}
        error={error}
        canEdit={canEdit}
        onEdit={(c) => setEditing(c)}
        onDelete={onDelete}
      />

      {!loading && !error && clients.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient grid place-items-center text-white mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="font-semibold mb-1">{tt("No clients yet")}</div>
          <div className="text-sm text-[rgb(var(--muted))] mb-4">
            {tt("Add your first client to start linking projects, samples, and invoices to it.")}
          </div>
          <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!canEdit}>
            <Plus className="w-4 h-4" /> {tt("Create first client")}
          </button>
        </div>
      )}

      <ClientModal
        open={creating || !!editing}
        mode={editing ? "edit" : "create"}
        initial={editing ?? undefined}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={onSave}
      />

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the Tenant Admin role to add or edit clients.")}
        </div>
      )}
    </div>
  );
}
