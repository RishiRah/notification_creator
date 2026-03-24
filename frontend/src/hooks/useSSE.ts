import { useEffect, useRef } from "react";
import type { Notification } from "../types";

interface UseSSECallbacks {
  onNew: (n: Notification) => void;
  onDelete: (id: number) => void;
  onReconnect: () => void;
}

export function useSSE({ onNew, onDelete, onReconnect }: UseSSECallbacks) {
  const cbRef = useRef({ onNew, onDelete, onReconnect });
  cbRef.current = { onNew, onDelete, onReconnect };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const url = token ? `/api/v1/sse?token=${encodeURIComponent(token)}` : "/api/v1/sse";
    const es = new EventSource(url);
    let wasDisconnected = false;

    es.addEventListener("notification", (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new" && data.notification) {
        const n: Notification = data.notification;
        cbRef.current.onNew(n);

        if (Notification.permission === "granted") {
          new Notification(n.title, {
            body: n.body || undefined,
            tag: `notif-${n.id}`,
          });
        }
      } else if (data.type === "delete" && data.id) {
        cbRef.current.onDelete(data.id);
      }
    });

    es.addEventListener("open", () => {
      if (wasDisconnected) {
        cbRef.current.onReconnect();
      }
    });

    es.addEventListener("error", () => {
      wasDisconnected = true;
    });

    return () => es.close();
  }, []);
}
