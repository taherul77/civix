"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import type { ProjectRecord } from "@/server/contracts";

interface Props {
  open: boolean;
  project: ProjectRecord;
  onClose: () => void;
  onSent?: () => void;
}

export function SendProjectModal({ open, project, onClose, onSent }: Props) {
  const tt = useT();
  const loc = useLoc();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const out = await mutate(
      () => api.projects.send(project.id),
      tt(`Project ${project.code} sent to samples`),
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
      title={tt("Send project to samples")}
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
            {tt("This project will move to the sample workflow. Once sent, it can no longer be edited or deleted, and samples can be created against it.")}
          </div>
        </div>

        <div className="text-sm">
          <div className="font-medium">{loc(project.name)}</div>
          <div className="font-mono text-xs text-[rgb(var(--muted))]">{project.code}</div>
          <div className="text-xs text-[rgb(var(--muted))] mt-1">
            {tt("Client")}: {loc(project.client)}
          </div>
        </div>
      </div>
    </Modal>
  );
}
