import type { NotificationListResponse, TokenResponse, User } from "./types";

const BASE = "/api/v1";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  return res;
}

// Auth API

export async function register(username: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function fetchMe(): Promise<User> {
  const res = await authFetch(`${BASE}/auth/me`);
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function fetchPendingUsers(): Promise<User[]> {
  const res = await authFetch(`${BASE}/auth/users/pending`);
  if (!res.ok) throw new Error("Failed to fetch pending users");
  return res.json();
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await authFetch(`${BASE}/auth/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function approveUser(userId: number): Promise<User> {
  const res = await authFetch(`${BASE}/auth/users/${userId}/approve`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to approve user");
  return res.json();
}

export async function rejectUser(userId: number): Promise<void> {
  const res = await authFetch(`${BASE}/auth/users/${userId}/reject`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to reject user");
}

// Notification API

export async function fetchNotifications(params: {
  tags?: string[];
  priority?: string;
  unread?: boolean;
  page?: number;
  per_page?: number;
}): Promise<NotificationListResponse> {
  const sp = new URLSearchParams();
  if (params.tags) params.tags.forEach((t) => sp.append("tags", t));
  if (params.priority) sp.set("priority", params.priority);
  if (params.unread !== undefined) sp.set("unread", String(params.unread));
  if (params.page) sp.set("page", String(params.page));
  if (params.per_page) sp.set("per_page", String(params.per_page));
  const res = await authFetch(`${BASE}/notifications?${sp}`);
  return res.json();
}

export async function fetchTags(): Promise<string[]> {
  const res = await authFetch(`${BASE}/tags`);
  return res.json();
}

export async function markRead(id: number): Promise<void> {
  await authFetch(`${BASE}/notifications/${id}/read`, { method: "PATCH" });
}

export async function markManyRead(ids: number[]): Promise<void> {
  await authFetch(`${BASE}/notifications/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export async function deleteNotification(id: number): Promise<void> {
  await authFetch(`${BASE}/notifications/${id}`, { method: "DELETE" });
}
