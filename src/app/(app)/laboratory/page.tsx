"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Plus, RefreshCw, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useT } from "@/lib/i18n";
import { useCan } from "@/lib/auth-context";
import { apiFetch, isBackendActive } from "@/lib/api-client";
import { mutate } from "@/server/mutate";
import { LaboratoryTable } from "./_components/laboratory-table";
import { LaboratoryModal, type LaboratoryRecord } from "./_components/laboratory-modal";
import { toast } from "@/components/ui/toast";

export default function LaboratorySetupPage() {
  const tt = useT();
  const canEdit = useCan("settings:update");

  const [labs, setLabs] = useState<LaboratoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LaboratoryRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isBackendActive()) {
        setError(tt("Backend offline — sign in to load laboratories."));
        return;
      }
      const out = await apiFetch<{ items: LaboratoryRecord[]; total: number }>("/v1/laboratories");
      setLabs(out.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load laboratories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async (input: Partial<LaboratoryRecord>) => {
    const isUpdate = !!editing;
    const result = await mutate(
      () =>
        isUpdate
          ? apiFetch<LaboratoryRecord>(`/v1/laboratories/${editing!.id}`, { method: "PATCH", body: input })
          : apiFetch<LaboratoryRecord>(`/v1/laboratories`,                  { method: "POST",  body: input }),
      isUpdate ? tt(`Laboratory "${editing!.code}" updated`) : tt(`Laboratory "${input.code}" created`)
    );
    if (!result) return;
    setEditing(null);
    setCreating(false);
    void refresh();
  };

  const onDelete = async (lab: LaboratoryRecord) => {
    if (!confirm(tt(`Delete laboratory "${lab.name}"? This cannot be undone.`))) return;
    try {
      await apiFetch(`/v1/laboratories/${lab.id}`, { method: "DELETE" });
      toast.success(tt(`Laboratory "${lab.code}" deleted`));
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete laboratory");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory setup"
        description="Each laboratory is isolated to your company. Add as many as you operate (e.g. main lab + branch labs)."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} /> {tt("Refresh")}
            </button>
            <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!canEdit}>
              <Plus className="w-4 h-4" /> {tt("New laboratory")}
            </button>
          </>
        }
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-sm text-[rgb(var(--muted))]">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            {tt("Loading laboratories…")}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">{error}</div>
        ) : labs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-gradient grid place-items-center text-white mx-auto mb-3">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div className="font-semibold mb-1">{tt("No laboratories yet")}</div>
            <div className="text-sm text-[rgb(var(--muted))] mb-4">
              {tt("Add your first lab to start linking tests, samples, and reports to it.")}
            </div>
            <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={!canEdit}>
              <Plus className="w-4 h-4" /> {tt("Create first laboratory")}
            </button>
          </div>
        ) : (
          <LaboratoryTable
            labs={labs}
            canEdit={canEdit}
            onEdit={(lab) => setEditing(lab)}
            onDelete={onDelete}
          />
        )}
      </div>

      <LaboratoryModal
        open={creating || !!editing}
        mode={editing ? "edit" : "create"}
        initial={editing ?? undefined}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={onSave}
      />

      {!canEdit && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          {tt("Read-only — you need the Tenant Admin role to add or edit laboratories.")}
        </div>
      )}
    </div>
  );
}
