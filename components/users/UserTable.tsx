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

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<"all" | "admin" | "customer">("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);


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

  /* FILTER + SEARCH */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  /* PAGINATION */
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

    const res = await fetch(
      `${API_URL}/api/admin/users/${userToDelete.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      }
    );

    if (!res.ok) {
      setToastMsg("Failed to delete user");
      setToastOpen(true);
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userToDelete.id));

    setConfirmOpen(false);
    setUserToDelete(null);

    setToastMsg("User deleted successfully");
    setToastOpen(true);
  };



  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>

        <input
          type="text"
          placeholder="Search name or email"
          className="h-9 rounded-md border px-3 text-sm w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-sm border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  Loading users…
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-200 hover:bg-gray-50 transition"
                >
                  {/* USER COLUMN */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      {user.id === 1 && (
                        <span className="text-[10px] font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>

                  {/* ROLE */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* PROVIDER */}
                  <td className="px-4 py-3 text-center capitalize">
                    {user.provider}
                  </td>

                  {/* DATE */}
                  <td className="px-4 py-3 text-center text-xs">
                    {new Date(user.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3 text-right flex justify-end items-center gap-3">
                    <Link
                      href={`/admin/users/EditUser?id=${user.id}`}
                      className="text-blue-600 hover:underline text-xs cursor-pointer"
                    >
                      Edit
                    </Link>

                    {/* Delete hidden for superadmin (id === 1) */}
                    {user.id !== 1 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => askDeleteUser(user)}
                          className="text-red-600 hover:underline text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center">
        <select
          className="rounded border px-2 py-1 text-sm cursor-pointer"
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 text-xs cursor-pointer"
          >
            Prev
          </button>

          <span className="text-sm font-medium p-1">{page}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50 text-xs cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

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
        onCancel={() => {
          setConfirmOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}