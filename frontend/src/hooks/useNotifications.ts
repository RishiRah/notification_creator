import { useCallback, useEffect, useState } from "react";
import { fetchNotifications, fetchTags } from "../api";
import type { Notification } from "../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 50;

  const load = useCallback(async () => {
    const [notifRes, tagsRes] = await Promise.all([
      fetchNotifications({ tags: selectedTags.length ? selectedTags : undefined, page, per_page: perPage }),
      fetchTags(),
    ]);
    setNotifications(notifRes.items);
    setTotal(notifRes.total);
    setTags(tagsRes);
  }, [selectedTags, page]);

  useEffect(() => {
    load();
  }, [load]);

  const addNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return {
    notifications,
    tags,
    selectedTags,
    setSelectedTags,
    total,
    page,
    setPage,
    perPage,
    reload: load,
    addNotification,
    removeNotification,
    markAsRead,
  };
}
