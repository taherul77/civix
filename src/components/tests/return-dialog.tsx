"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/lib/i18n";

/**
 * Asks the reviewer what must be corrected. A separate field from any approval note, so a note like
 * "looks good" can never end up as the reason a test was returned.
 */
export function ReturnDialog({
  open, onClose, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  /** Resolves true when the return succeeded (the dialog then closes and clears itself). */
  onConfirm: (reason: string) => Promise<boolean>;
}) {
  const tt = useT();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setReason(""); }, [open]);
  const ok = reason.trim().length >= 3;

  const confirm = async () => {
    setBusy(true);
    try {
      if (await onConfirm(reason.trim())) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tt("Return for correction")}
      size="md"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>{tt("Cancel")}</button>
          <button className="btn btn-primary" onClick={confirm} disabled={busy || !ok}>
            <RotateCcw className="w-4 h-4" /> {tt("Return to technician")}
          </button>
        </>
      }
    >
      <p className="text-sm text-[rgb(var(--muted))] mb-2">{tt("Say what needs to be corrected. The technician sees this on the test.")}</p>
      <textarea
        className="input min-h-[110px]"
        autoFocus
        value={reason}
        maxLength={2000}
        onChange={(e) => setReason(e.target.value)}
        placeholder={tt("e.g. The load reading looks wrong, please re-check the gauge and re-enter it.")}
      />
      {reason.trim().length > 0 && !ok && <p className="text-xs text-rose-600 mt-1">{tt("Please write a few words.")}</p>}
    </Modal>
  );
}
