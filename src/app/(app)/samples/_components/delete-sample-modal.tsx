"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import type { SampleRecord } from "@/server/contracts";

interface Props {
  open: boolean;
  sample: SampleRecord;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteSampleModal({ open, sample, onClose, onDeleted }: Props) {
  const tt = useT();
  const loc = useLoc();
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const expected = sample.code;
  const canDelete = confirm.trim() === expected;

  const submit = async () => {
    if (!canDelete) return;
    setSubmitting(true);
    const out = await mutate(
      () => api.samples.remove(sample.id).then(() => true),
      tt(`Sample ${sample.code} deleted`),
    );
    setSubmitting(false);
    if (out) {
      setConfirm("");
      onDeleted?.();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tt("Delete sample")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button
            type="button"
            className="btn bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
            onClick={submit}
            disabled={!canDelete || submitting}
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Deleting…")}</>
              : <><Trash2 className="w-4 h-4" /> {tt("Delete")}</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            {tt("This will permanently delete the sample and any tests linked to it. This action cannot be undone.")}
          </div>
        </div>

        <div className="text-sm">
          <div className="font-mono text-xs">{sample.code}</div>
          <div className="text-xs text-[rgb(var(--muted))]">{loc(sample.location)}</div>
        </div>

        <label className="block text-sm">
          <span className="block mb-1">
            {tt("Type the sample code")} <span className="font-mono font-semibold">{expected}</span> {tt("to confirm")}
          </span>
          <input
            className="input font-mono"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={expected}
            autoFocus
          />
        </label>
      </div>
    </Modal>
  );
}
