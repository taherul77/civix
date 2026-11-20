"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useLiveNotifications } from "@/hooks/use-live-notifications";
import { useT } from "@/lib/i18n";

export function NotificationsHeader() {
  const tt = useT();
  const count = useLiveNotifications().length;
  return (
    <PageHeader
      title="Notifications & alerts"
      description={`${count} ${tt("active")} · ${tt("escalations route to Quality Manager.")}`}
    />
  );
}
