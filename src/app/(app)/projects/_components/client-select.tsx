"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useClientsQuery } from "@/server/queries";

interface Props {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

/**
 * Client picker fed from the Client setup page (/clients → api.clients.list).
 * The selected value is the client's `name` so it slots into the existing
 * `clientName` string field on the Project payload without a schema change.
 * Inactive clients are filtered out unless the project's current value matches
 * one (so editing legacy rows keeps working).
 */
export function ClientSelect({ value, onChange, required }: Props) {
  const tt = useT();
  const { data: clients = [], isLoading, error } = useClientsQuery();

  const active = clients.filter((c) => c.isActive);
  // If the current value matches an inactive client, preserve it in the list.
  const showInactive = value && !active.some((c) => c.name === value)
    ? clients.find((c) => c.name === value)
    : null;

  if (isLoading) {
    return <select className="input" disabled><option>{tt("Loading clients…")}</option></select>;
  }
  if (error) {
    return <div className="text-xs text-rose-600">{tt("Failed to load clients")}: {error.message}</div>;
  }
  if (clients.length === 0) {
    return (
      <div className="text-xs text-[rgb(var(--muted))] py-2">
        {tt("No clients yet —")}{" "}
        <Link href="/clients" className="text-brand-600 hover:underline">
          {tt("add one in Client setup")}
        </Link>
      </div>
    );
  }
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      <option value="">{tt("Select a client…")}</option>
      {showInactive && (
        <option value={showInactive.name}>{showInactive.name} ({tt("inactive")})</option>
      )}
      {active.map((c) => (
        <option key={c.id} value={c.name}>{c.name}</option>
      ))}
    </select>
  );
}
