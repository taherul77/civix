"use client";

import { PageHeader } from "@/components/ui/page-header";
import { notifications } from "@/lib/mock-extra";
import { useT } from "@/lib/i18n";
import { MarkAllReadButton } from "./mark-all-read-button";

export function NotificationsHeader() {
  const tt = useT();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <PageHeader
      title="Notifications & alerts"
      description={`${unread} ${tt("unread")} · ${tt("escalations route to Quality Manager.")}`}
      actions={<MarkAllReadButton />}
    />
  );
}
