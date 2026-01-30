"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Truck, CheckSquare } from "lucide-react";

type Order = {
  id: number;
  user_id: number;
  user_name: string | null;
  total_amount: number | string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled" | "failed";
  payment_status: "pending" | "success" | "failed";
  created_at: string;
};

const STATUS_TABS = [
  "all",
  "pending",
  "completed",
  "cancelled",
  "failed",
  "shipped",
] as const;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });


  const API_URL = process.env.NEXT_PUBLIC_API_URL!;


export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] =
    useState<(typeof STATUS_TABS)[number]>("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Selection state
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* STATUS COUNTS (FOR TABS) */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  /* FILTER + SEARCH */
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toString().includes(search) ||
        (o.user_name || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusTab === "all" || o.status === statusTab;

      return matchSearch && matchStatus;
    });
  }, [orders, search, statusTab]);

  /* PAGINATION */
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const visible = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  /* SELECT ALL */
  const allSelected =
    visible.length > 0 &&
    visible.every((o) => selected.includes(o.id));

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>

      </div>

      {/* STATUS TABS */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusTab(s);
              setPage(1);
              setSelected([]);
            }}
            className={`${
              statusTab === s
                ? "font-semibold text-blue-600"
                : "text-gray-600"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}{" "}
            <span className="text-gray-400">
              ({statusCounts[s] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <select className="rounded border px-2 py-1 text-sm">
            <option>Bulk actions</option>
            <option>Mark completed</option>
            <option>Delete</option>
          </select>
          <button
            className="rounded border border-gray-300 px-3 py-1 text-sm"
            onClick={() => {
              if (selected.length === 0) {
                alert("Select orders first");
                return;
              }
              console.log("Selected order IDs:", selected);
            }}
          >
            Apply
          </button>
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Search orders"
            className="rounded border px-3 py-1 text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded border border-gray-300 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(visible.map((o) => o.id));
                    } else {
                      setSelected([]);
                    }
                  }}
                />
              </th>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Shipping</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center">
                  Loading orders...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center">
                  No orders found
                </td>
              </tr>
            ) : (
              visible.map((o) => (
                <tr key={o.id} className="border-t border-gray-300 hover:bg-gray-50 text-xs">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected([...selected, o.id]);
                        } else {
                          setSelected(
                            selected.filter((id) => id !== o.id)
                          );
                        }
                      }}
                    />
                  </td>

                  <td className="px-3 py-2">
                    <p className="font-medium text-blue-600">
                      #{o.id} {o.user_name || "Guest"}
                    </p>
                  </td>

                  

                  <td className="px-3 py-2">
                    {formatDate(o.created_at)}
                  </td>

                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        o.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : o.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>

                  <td className="px-3 py-2 text-xs text-gray-500">
                    NA <br />
                    <span className="cursor-pointer text-blue-600">
                      Sync now
                    </span>
                  </td>

                  <td className="px-3 py-2 text-right font-medium">
                    ₹{Number(o.total_amount || 0).toFixed(2)}
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Eye
                        size={16}
                        className="cursor-pointer text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          window.location.href = `/admin/orders/${o.id}`;
                        }}
                      />
                      <Truck size={16} className="text-gray-500" />
                      <CheckSquare size={16} className="text-gray-500" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex items-center justify-end gap-2 text-sm">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="rounded border px-2 py-1 disabled:opacity-50"
        >
          ‹
        </button>
        <span>
          {page} of {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded border px-2 py-1 disabled:opacity-50"
        >
          ›
        </button>
      </div>
    </div>
  );
}
