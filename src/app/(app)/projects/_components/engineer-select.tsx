"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useEngineersQuery } from "@/server/queries";

interface Props {
  /** Currently-selected engineer name. */
  value: string;
  onChange: (name: string) => void;
  required?: boolean;
}

/**
 * Engineer picker fed from Engineer setup (/engineers → api.engineers.list).
 * Stores the engineer's `name` so it slots into the existing `engineerName`
 * string field on the Project payload without a schema change. Inactive
 * engineers are filtered out unless the current value matches one (so editing
 * legacy rows keeps working).
 */
export function EngineerSelect({ value, onChange, required }: Props) {
  const tt = useT();
  const { data: engineers = [], isLoading, error } = useEngineersQuery();

  const active = engineers.filter((e) => e.isActive);
  const showInactive = value && !active.some((e) => e.name === value)
    ? engineers.find((e) => e.name === value)
    : null;

  if (isLoading) {
    return <select className="input" disabled><option>{tt("Loading engineers…")}</option></select>;
  }
  if (error) {
    return <div className="text-xs text-rose-600">{tt("Failed to load engineers")}: {error.message}</div>;
  }
  if (engineers.length === 0) {
    return (
      <div className="text-xs text-[rgb(var(--muted))] py-2">
        {tt("No engineers yet —")}{" "}
        <Link href="/engineers" className="text-brand-600 hover:underline">
          {tt("add one in Engineer setup")}
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
      <option value="">{tt("Select an engineer…")}</option>
      {showInactive && (
        <option value={showInactive.name}>{showInactive.name} ({tt("inactive")})</option>
      )}
      {active.map((e) => (
        <option key={e.id} value={e.name}>
          {e.name}{e.specialty ? ` — ${e.specialty}` : ""}
        </option>
      ))}
    </select>
  );
}
