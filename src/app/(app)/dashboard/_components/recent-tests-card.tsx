"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTestsQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useLoc } from "@/lib/i18n-data";
import { useApp } from "@/store/app-store";
import { fmtAny } from "@/lib/utils";

export function RecentTestsCard() {
  const tt = useT();
  const loc = useLoc();
  const lang = useApp((s) => s.lang);
  const { data: tests = [] } = useTestsQuery();
  const recent = tests.slice(0, 6);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tt("Recent tests")}</h3>
        <Link href="/tests" className="text-sm text-brand-600 hover:underline">
          {tt("View all")}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              <th>{tt("Code")}</th>
              <th>{tt("Test")}</th>
              <th>{tt("Standard")}</th>
              <th>{tt("Date")}</th>
              <th>{tt("Result")}</th>
              <th>{tt("Status")}</th>
              <th>{tt("P/F")}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id}>
                <td className="font-mono text-xs">{fmtAny(t.code, lang)}</td>
                <td>
                  <Link href={`/tests/${t.id}`} className="hover:text-brand-600 hover:underline">
                    {loc(t.name)}
                  </Link>
                </td>
                <td className="text-xs text-[rgb(var(--muted))]">{t.standard}</td>
                <td>{fmtAny(t.testDate, lang)}</td>
                <td className="font-medium">
                  {t.primaryResult
                    ? `${fmtAny(t.primaryResult.value, lang)} ${t.primaryResult.unit}`
                    : "—"}
                </td>
                <td><StatusBadge value={t.status} /></td>
                <td><StatusBadge value={t.passFail} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
