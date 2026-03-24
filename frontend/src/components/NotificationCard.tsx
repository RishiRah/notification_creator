import type { Notification } from "../types";
import { markRead, deleteNotification } from "../api";

const priorityColors: Record<string, string> = {
  low: "border-l-gray-400",
  normal: "border-l-blue-400",
  high: "border-l-orange-400",
  critical: "border-l-red-500",
};

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

export function NotificationCard({
  notification: n,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const handleMarkRead = async () => {
    await markRead(n.id);
    onMarkRead(n.id);
  };

  const handleDelete = async () => {
    await deleteNotification(n.id);
    onDelete(n.id);
  };

  const time = new Date(n.created_at).toLocaleString();

  return (
    <div
      className={`border-l-4 ${priorityColors[n.priority] || "border-l-blue-400"} ${
        n.read ? "bg-white" : "bg-blue-50"
      } p-4 rounded-r shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 ${n.read ? "font-normal" : ""}`}>
              {n.title}
            </h3>
            {n.priority !== "normal" && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  n.priority === "critical"
                    ? "bg-red-100 text-red-700"
                    : n.priority === "high"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {n.priority}
              </span>
            )}
          </div>
          {n.body && <p className="text-gray-600 text-sm mb-2">{n.body}</p>}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{time}</span>
            {n.source && <span>from {n.source}</span>}
            {n.tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {!n.read && (
            <button
              onClick={handleMarkRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Mark read
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
