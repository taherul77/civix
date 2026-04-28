import { NotificationsHeader } from "./_components/notifications-header";
import { NotificationsList } from "./_components/notifications-list";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <NotificationsHeader />
      <NotificationsList />
    </div>
  );
}
