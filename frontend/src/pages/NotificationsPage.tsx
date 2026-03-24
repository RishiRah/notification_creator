import { Header } from "../components/Header";
import { TagFilter } from "../components/TagFilter";
import { NotificationList } from "../components/NotificationList";
import { useNotifications } from "../hooks/useNotifications";
import { useSSE } from "../hooks/useSSE";
import { markRead, deleteNotification } from "../api";

export function NotificationsPage() {
  const {
    notifications,
    tags,
    selectedTags,
    setSelectedTags,
    reload,
    addNotification,
    removeNotification,
    markAsRead,
  } = useNotifications();

  useSSE({
    onNew: (n) => {
      addNotification(n);
    },
    onDelete: (id) => {
      removeNotification(id);
    },
    onReconnect: () => {
      reload();
    },
  });

  const handleMarkRead = async (id: number) => {
    await markRead(id);
    markAsRead(id);
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    removeNotification(id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <TagFilter tags={tags} selected={selectedTags} onToggle={setSelectedTags} />
      <NotificationList
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onDelete={handleDelete}
      />
    </div>
  );
}
