import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Header() {
  const { user, logout } = useAuth();
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold tracking-tight hover:text-gray-300 transition-colors">
        Notifications
      </Link>
      <div className="flex items-center gap-4">
        {permission !== "granted" && (
          <button
            onClick={requestPermission}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Enable Browser Notifications
          </button>
        )}
        {permission === "granted" && (
          <span className="text-green-400 text-sm">Browser notifications on</span>
        )}
        {user?.is_admin && (
          <Link
            to="/admin"
            className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            Admin
          </Link>
        )}
        {user && (
          <>
            <span className="text-gray-400 text-sm">{user.username}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
