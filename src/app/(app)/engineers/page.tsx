"use client";

import { useEffect, useState } from "react";
import { HardHat, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { api } from "@/server/api";
import { isBackendActive } from "@/lib/api-client";
import { mutate } from "@/server/mutate";
import { EngineersTable } from "./_components/engineers-table";
import { EngineerModal, type EngineerRecord } from "./_components/engineer-modal";
import { toast } from "@/components/ui/toast";

export default function EngineersSetupPage() {
  const tt = useT();
  const canEdit = useCan("settings:update");

  const [engineers, setEngineers] = useState<EngineerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EngineerRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isBackendActive()) {
        setError(tt("Backend offline — sign in to load engineers."));
        return;
      }
      const items = await api.engineers.list();
      setEngineers(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load engineers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async (input: Partial<EngineerRecord>) => {
    const isUpdate = !!editing;
    const result = await mutate(
      () =>
        isUpdate
          ? api.engineers.update(editing!.id, input)
          : api.engineers.create(input as EngineerRecord),
      isUpdate
        ? tt(`Engineer "${editing!.code}" updated`)
        : tt(`Engineer "${input.code}" created`),
    );
    if (!result) return;
    setEditing(null);
    setCreating(false);
    void refresh();
  };

  const onDelete = async (engineer: EngineerRecord) => {
    if (!confirm(tt(`Delete engineer "${engineer.name}"? This cannot be undone.`))) return;
    try {
      await api.engineers.remove(engineer.id);
      toast.success(tt(`Engineer "${engineer.code}" deleted`));
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete engineer");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineer setup"
        description="Manage the engineers on staff — projects link to one of these via the engineer picker."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> {tt("Refresh")}
            </button>
            <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!canEdit}>
              <Plus className="w-4 h-4" /> {tt("New engineer")}
            </button>
          </>
        }
      />

      <EngineersTable
        engineers={engineers}
        loading={loading}
        error={error}
        canEdit={canEdit}
        onEdit={(e) => setEditing(e)}
        onDelete={onDelete}
      />

      {!loading && !error && engineers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient grid place-items-center text-white mx-auto mb-3">
            <HardHat className="w-6 h-6" />
          </div>
          <div className="font-semibold mb-1">{tt("No engineers yet")}</div>
          <div className="text-sm text-[rgb(var(--muted))] mb-4">
            {tt("Add your first engineer to start assigning them to projects.")}
          </div>
          <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!canEdit}>
            <Plus className="w-4 h-4" /> {tt("Create first engineer")}
          </button>
        </div>
      )}

      <EngineerModal
        open={creating || !!editing}
        mode={editing ? "edit" : "create"}
        initial={editing ?? undefined}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={onSave}
      />

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the Tenant Admin role to add or edit engineers.")}
        </div>
      )}
    </div>
  );
}
