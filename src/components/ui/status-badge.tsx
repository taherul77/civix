import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "badge-muted" },
  submitted: { label: "In review", cls: "badge-warn" },
  reviewed: { label: "Reviewed", cls: "badge-info" },
  approved: { label: "Approved", cls: "badge-pass" },
  pending: { label: "Pending", cls: "badge-muted" },
  in_test: { label: "In test", cls: "badge-warn" },
  completed: { label: "Completed", cls: "badge-pass" },
  active: { label: "Active", cls: "badge-pass" },
  on_hold: { label: "On hold", cls: "badge-warn" },
  calibration_due: { label: "Cal. due", cls: "badge-warn" },
  out_of_service: { label: "Out of service", cls: "badge-fail" },
  pass: { label: "PASS", cls: "badge-pass" },
  fail: { label: "FAIL", cls: "badge-fail" },
};

export function StatusBadge({ value }: { value: string }) {
  const s = statusMap[value] ?? { label: value, cls: "badge-muted" };
  return <span className={cn("badge", s.cls)}>{s.label}</span>;
}
