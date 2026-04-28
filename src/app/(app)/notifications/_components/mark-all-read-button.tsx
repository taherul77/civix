"use client";

import { useT } from "@/lib/i18n";

export function MarkAllReadButton() {
  const tt = useT();
  return <button className="btn btn-outline">{tt("Mark all read")}</button>;
}
