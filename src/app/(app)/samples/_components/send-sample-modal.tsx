"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
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
  onSent?: () => void;
}

export function SendSampleModal({ open, sample, onClose, onSent }: Props) {
  const tt = useT();
  const loc = useLoc();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const out = await mutate(
      () => api.samples.send(sample.id),
      tt(`Sample ${sample.code} sent to tests`),
    );
    setSubmitting(false);
    if (out) {
      onSent?.();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tt("Send sample to tests")}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {tt("Cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary disabled:opacity-50"
            onClick={submit}
            disabled={submitting}
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {tt("Sending…")}</>
              : <><Send className="w-4 h-4" /> {tt("Send")}</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
          <Send className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            {tt("This sample will move to the test workflow. Once sent, it can no longer be edited or deleted, and tests can be created against it.")}
          </div>
        </div>

        <div className="text-sm">
          <div className="font-mono text-xs">{sample.code}</div>
          <div className="text-xs text-[rgb(var(--muted))] capitalize">{sample.type}</div>
          {sample.location && (
            <div className="text-xs text-[rgb(var(--muted))] mt-1">{loc(sample.location)}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
