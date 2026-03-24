import { useCallback, useEffect, useState } from "react";
import { fetchAllUsers, approveUser, rejectUser } from "../api";
import { Header } from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (userId: number) => {
    await approveUser(userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_approved: true } : u))
    );
  };

  const handleReject = async (userId: number) => {
    await rejectUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (!currentUser?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Admin access required.</p>
      </div>
    );
  }

  const pending = users.filter((u) => !u.is_approved);
  const approved = users.filter((u) => u.is_approved);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">User Management</h2>

      {pending.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Pending Approval ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((u) => (
              <div
                key={u.id}
                className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-gray-900">{u.username}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Approved Users ({approved.length})
        </h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : approved.length === 0 ? (
          <p className="text-gray-500">No approved users yet.</p>
        ) : (
          <div className="space-y-2">
            {approved.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-gray-900">{u.username}</span>
                  {u.is_admin && (
                    <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      admin
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
