"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "customer";
  status: "active" | "blocked";
  provider: "local" | "google";
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // --- Create User State ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer" as "customer" | "admin",
    status: "active" as "active" | "blocked",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const customerCount = useMemo(
    () => users.filter((u) => u.role === "customer").length,
    [users]
  );
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchSearch && u.role === activeTab;
    });
  }, [users, search, activeTab]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const askDeleteUser = (user: User) => {
    setUserToDelete(user);
    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const res = await fetch(`${API_URL}/api/admin/users/${userToDelete.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    });
    if (!res.ok) {
      setToastMsg("Failed to delete user");
      setToastOpen(true);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setConfirmOpen(false);
    setUserToDelete(null);
    setToastMsg("User deleted successfully");
    setToastOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to create user");
      }

      setToastMsg("User created successfully");
      setToastOpen(true);
      setCreateModalOpen(false);
      setNewUser({ name: "", email: "", phone: "", password: "", role: "customer", status: "active" });
      fetchUsers(); // Refresh the table
    } catch (error: any) {
      setToastMsg(error.message);
      setToastOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Users</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {users.length} total &middot; {customerCount} customers &middot; {adminCount} admins
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="13" height="13" viewBox="0 0 20 20" fill="none"
              >
                <path
                  d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search name or email…"
                className="h-9 pl-8 pr-3 rounded-lg border border-gray-200 text-sm w-full sm:w-52 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            {/* Create User Button */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="h-9 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
            >
              + New User
            </button>
          </div>
        </div>

        {/* ── Tabs + Table Card ── */}
        <div>
          {/* Tab Strip */}
          <div className="flex gap-0.5 rounded-t-xl pt-1">
            {(["customer", "admin"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === "customer" ? customerCount : adminCount;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer border border-gray-200
                    ${isActive
                      ? "bg-white text-gray-900 border-b-transparent"
                      : "text-gray-500 hover:text-gray-800 bg-gray-50/50"
                    }`}
                >
                  {tab === "customer" ? "Customers" : "Admins"}
                  <span
                    className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full leading-tight transition-colors
                      ${tab === "customer"
                        ? isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                        : isActive ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Card */}
          <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl overflow-hidden -mt-[1px]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* ── Loading Skeleton ── */}
                  {loading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                            <div className="space-y-1.5 flex-1">
                              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
                              <div className="h-2.5 w-44 bg-gray-100 animate-pulse rounded" />
                            </div>
                          </div>
                        </td>
                        {[1, 2, 3, 4].map((j) => (
                          <td key={j} className="px-4 py-3 text-center">
                            <div className="h-5 w-16 bg-gray-100 animate-pulse rounded-full mx-auto" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {/* ── Empty State ── */}
                  {!loading && paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <div className="text-3xl mb-2">
                          {activeTab === "customer" ? "👥" : "🛡️"}
                        </div>
                        <p className="text-sm font-medium text-gray-400">
                          {search
                            ? `No ${activeTab}s match "${search}"`
                            : `No ${activeTab}s yet`}
                        </p>
                      </td>
                    </tr>
                  )}

                  {/* ── Rows ── */}
                  {!loading &&
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                ${user.role === "admin"
                                  ? "bg-violet-100 text-violet-700"
                                  : "bg-indigo-100 text-indigo-700"
                                }`}
                            >
                              {getInitials(user.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 text-[13px]">
                                  {user.name}
                                </span>
                                {user.id === 1 && (
                                  <span className="text-[9.5px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                    Super Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                              ${user.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0
                                ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`}
                            />
                            {user.status}
                          </span>
                        </td>

                        {/* Provider */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0
                                ${user.provider === "google" ? "bg-blue-400" : "bg-gray-400"}`}
                            />
                            {user.provider === "google" ? "Google" : "Local"}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-500">
                            {new Date(user.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/users/EditUser?id=${user.id}`}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              Edit
                            </Link>
                            {user.id !== 1 && (
                              <button
                                onClick={() => askDeleteUser(user)}
                                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page</span>
                <select
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {filteredUsers.length === 0
                    ? "0 of 0"
                    : `${(page - 1) * rowsPerPage + 1}–${Math.min(
                        page * rowsPerPage,
                        filteredUsers.length
                      )} of ${filteredUsers.length}`}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-2 py-1 rounded border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-2 py-1 rounded border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create User Modal ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as "customer" | "admin"})}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newUser.status}
                    onChange={(e) => setNewUser({...newUser, status: e.target.value as "active" | "blocked"})}
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition"
                >
                  {isCreating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popups */}
      <AlertPopup
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
      <ConfirmPopup
        open={confirmOpen}
        title="Delete user?"
        message="This user will be permanently removed. This action cannot be undone."
        confirmText="Delete"
        onCancel={() => { setConfirmOpen(false); setUserToDelete(null); }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}