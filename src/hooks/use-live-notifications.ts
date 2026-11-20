"use client";

import { useMemo } from "react";
import { useEquipmentQuery, useTestsQuery } from "@/server/queries";
import { useLoc } from "@/lib/i18n-data";
import type { Notification } from "@/lib/mock-extra";

const DAY = 86_400_000;

/**
 * Alerts derived from the company's real data (no stored/seeded notifications):
 * overdue calibrations, failed tests and the review queue. They stay visible
 * for as long as the underlying condition is true.
 */
export function useLiveNotifications(): Notification[] {
  const loc = useLoc();
  const { data: equipment = [] } = useEquipmentQuery();
  const { data: tests = [] } = useTestsQuery({});

  return useMemo(() => {
    const out: Notification[] = [];
    const now = Date.now();

    for (const e of equipment) {
      const due = Date.parse(e.calibrationDue);
      if (Number.isNaN(due) || due >= now) continue;
      const days = Math.max(1, Math.floor((now - due) / DAY));
      out.push({
        id: `cal-${e.id}`,
        level: "error",
        title: "Calibration overdue",
        body: `${e.code} (${loc(e.name)}) calibration is ${days} day${days === 1 ? "" : "s"} overdue. Tests using this equipment cannot be approved.`,
        ts: e.calibrationDue,
        href: "/equipment",
        read: false,
      });
    }

    for (const t of tests) {
      if (t.passFail !== "fail") continue;
      out.push({
        id: `fail-${t.id}`,
        level: "warn",
        title: "Test failed",
        body: `${t.code} — ${loc(t.name)}${t.primaryResult ? `: ${t.primaryResult.value} ${t.primaryResult.unit}` : ""}. Action required.`,
        ts: t.testDate,
        href: `/tests/${t.id}`,
        read: false,
      });
    }

    const pending = tests.filter((t) => t.status === "submitted").length;
    if (pending > 0) {
      out.push({
        id: "pending-review",
        level: "info",
        title: `${pending} test${pending === 1 ? "" : "s"} pending review`,
        body: "Open the review queue to approve or return them.",
        ts: "now",
        href: "/review",
        read: false,
      });
    }
    return out;
  }, [equipment, tests, loc]);
}
