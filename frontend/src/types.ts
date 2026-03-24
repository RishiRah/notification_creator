export interface Notification {
  id: number;
  title: string;
  body: string;
  source: string;
  priority: "low" | "normal" | "high" | "critical";
  read: boolean;
  created_at: string;
  tags: string[];
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  per_page: number;
}

export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  user: User;
}
