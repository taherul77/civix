"use client";

import { ShieldCheck, ShieldAlert, KeyRound, RotateCw } from "lucide-react";
import { useData } from "@/store/data-store";
import { api } from "@/server/api";
import { mutate } from "@/server/mutate";
import { useCan } from "@/lib/auth-context";

function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function CsidCard() {
  const csid = useData((s) => s.csid);
  const canRotate = useCan("settings:write");

  const issue = async () => {
    await mutate(() => api.zatca.issueCsid(), "CSID issued");
  };

  if (!csid) {
    return (
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-600" /> ZATCA CSID — not yet issued
        </h3>
        <p className="text-sm text-[rgb(var(--muted))] mb-4">
          The Cryptographic Stamp Identifier (CSID) is the ECDSA P-256 keypair ZATCA mints
          for your tenant. Every invoice cleared in Phase 2 must be signed with the active CSID.
        </p>
        <button onClick={issue} disabled={!canRotate} className="btn btn-primary">
          <KeyRound className="w-4 h-4" /> Issue CSID
        </button>
      </div>
    );
  }

  const days = daysUntil(csid.expiresAt);
  const expired = days < 0;
  const expiringSoon = days >= 0 && days <= 30;

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        {expired ? (
          <ShieldAlert className="w-4 h-4 text-rose-600" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        )}
        ZATCA Phase 2 — Cryptographic Stamp Identifier
      </h3>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-[rgb(var(--muted))]">Serial</dt>
        <dd className="font-mono text-xs">{csid.serial}</dd>
        <dt className="text-[rgb(var(--muted))]">Status</dt>
        <dd>
          {expired ? (
            <span className="badge badge-fail">Expired</span>
          ) : expiringSoon ? (
            <span className="badge badge-warn">Expires in {days} d</span>
          ) : (
            <span className="badge badge-pass">Active · {days} d remaining</span>
          )}
        </dd>
        <dt className="text-[rgb(var(--muted))]">Issued</dt>
        <dd>{csid.issuedAt.replace("T", " ").slice(0, 19)}</dd>
        <dt className="text-[rgb(var(--muted))]">Expires</dt>
        <dd>{csid.expiresAt.replace("T", " ").slice(0, 19)}</dd>
        <dt className="text-[rgb(var(--muted))]">Public key</dt>
        <dd className="font-mono text-[10px] break-all">{csid.publicKeySpkiB64.slice(0, 64)}…</dd>
      </dl>

      <button
        onClick={issue}
        disabled={!canRotate}
        className="btn btn-outline w-full mt-4"
        title={canRotate ? "" : "Tenant Admin role required"}
      >
        <RotateCw className="w-4 h-4" /> Rotate CSID (issue new keypair)
      </button>
    </div>
  );
}
