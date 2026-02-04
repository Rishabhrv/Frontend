"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type SubscriptionRow = {
  subscription_id: number;
  name: string;
  email: string;
  plan_title: string;
  plan_key: string;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: string;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function SubscriptionTable() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch(`${API_URL}/api/admin/subscriptions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    })
      .then(r => r.json())
      .then(setRows);
  }, []);

  /* ================= FILTER + SEARCH ================= */
  const filtered = useMemo(() => {
    return rows.filter(row => {
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase()) ||
        row.plan_title.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1); // reset page on filter/search
  }, [search, statusFilter, pageSize]);

  return (
    <div className="p-2 space-y-5">
      {/* ================= HEADER ================= */}
      <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex gap-3 flex-wrap justify-between">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>


          <input
            type="text"
            placeholder="Search user, email, plan…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
          />
        </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-600">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map(row => (
              <tr
                key={row.subscription_id}
                className="border-t border-gray-200 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-gray-500">{row.email}</p>
                </td>

                <td className="px-4 py-3 capitalize">
                  {row.plan_title}
                </td>

                <td className="px-4 py-3 text-center font-medium">
                  ₹{row.amount_paid}
                </td>

                <td className="px-4 py-3 text-xs text-gray-600">
                  {formatDate(row.start_date)} →{" "}
                  {formatDate(row.end_date)}
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/subscriptions/${row.subscription_id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {!paginated.length && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between">
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
          </select>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  page === i + 1
                    ? "bg-black text-white"
                    : ""
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}


      </div>

    
    </div>
  );
}
