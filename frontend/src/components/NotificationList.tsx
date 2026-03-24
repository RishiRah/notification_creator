import type { Notification } from "../types";
import { NotificationCard } from "./NotificationCard";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationList({
  notifications,
  onMarkRead,
  onDelete,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No notifications yet</p>
        <p className="text-sm mt-1">POST to /api/v1/notifications to create one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-6">
      {notifications.map((n) => (
        <NotificationCard
          key={n.id}
          notification={n}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
