"use client";

import { Modal } from "@/components/ui/modal";
import { QrCode } from "@/components/ui/qr-code";
import { decodeZatcaQr } from "@/lib/zatca";
import type { Invoice } from "@/store/data-store";

const verifyOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "https://civixlab.sa";

export function ZatcaModal({
  open, onClose, invoice,
}: {
  open: boolean; onClose: () => void; invoice: Invoice | null;
}) {
  const z = invoice?.zatcaPayload;
  const decoded = z ? safeDecode(z.qrBase64) : null;
  // The QR painted on screen / printed on the invoice points at the public
  // verifier; the TLV payload (`z.qrBase64`) remains the canonical ZATCA
  // record stored on the invoice for protocol fidelity.
  const scanUrl = z ? `${verifyOrigin()}/verify/invoice/${z.uuid}` : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={invoice ? `ZATCA clearance · ${invoice.id}` : "ZATCA clearance"}
      size="lg"
    >
      {!z && (
        <p className="text-sm text-[rgb(var(--muted))]">This invoice has not been cleared yet.</p>
      )}
      {z && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 items-start">
            <div className="p-2 rounded-lg bg-white border border-[rgb(var(--border))] grid place-items-center">
              <QrCode value={scanUrl} size={160} />
            </div>
            <dl className="grid grid-cols-[140px_1fr] text-sm gap-y-2">
              <dt className="text-[rgb(var(--muted))]">UUID</dt>
              <dd className="font-mono text-xs break-all">{z.uuid}</dd>
              <dt className="text-[rgb(var(--muted))]">Cleared at</dt>
              <dd>{z.clearedAt.replace("T", " ").slice(0, 19)}</dd>
              <dt className="text-[rgb(var(--muted))]">CSID serial</dt>
              <dd className="font-mono text-xs">{z.csidSerial}</dd>
              <dt className="text-[rgb(var(--muted))]">Invoice hash</dt>
              <dd className="font-mono text-[10px] break-all">{z.invoiceHash}</dd>
            </dl>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">
              TLV-decoded QR fields
            </h4>
            <dl className="grid grid-cols-[180px_1fr] text-xs gap-y-1.5">
              {decoded && (
                <>
                  <dt className="text-[rgb(var(--muted))]">Tag 1 · Seller name</dt>
                  <dd>{decoded.sellerName}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 2 · VAT number</dt>
                  <dd className="font-mono">{decoded.vatNumber}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 3 · Timestamp</dt>
                  <dd className="font-mono">{decoded.timestamp}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 4 · Total (with VAT)</dt>
                  <dd className="font-mono">SAR {decoded.invoiceTotal}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 5 · VAT amount</dt>
                  <dd className="font-mono">SAR {decoded.vatTotal}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 6 · Invoice hash</dt>
                  <dd className="font-mono text-[10px] break-all">{decoded.invoiceHash}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 7 · Signature</dt>
                  <dd className="font-mono text-[10px] break-all">{decoded.signature}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 8 · Public key</dt>
                  <dd className="font-mono text-[10px] break-all">{decoded.publicKey}</dd>
                  <dt className="text-[rgb(var(--muted))]">Tag 9 · ZATCA stamp</dt>
                  <dd className="font-mono text-[10px] break-all">{decoded.stamp}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="text-[10px] text-[rgb(var(--muted))]">
            ZATCA Phase 2 standard B2B clearance. The QR encodes nine TLV fields per ZATCA Annex 4.
            Each cleared invoice is signed with the active CSID; rotating the CSID does not
            invalidate previously cleared invoices.
          </div>
        </div>
      )}
    </Modal>
  );
}

function safeDecode(b64: string) {
  try { return decodeZatcaQr(b64); } catch { return null; }
}
