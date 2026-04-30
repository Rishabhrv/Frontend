"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";

type Order = {
  id: number;
  user_id: number;
  user_name: string | null;
  total_amount: number | string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled" | "failed";
  payment_status: "pending" | "success" | "failed";
  created_at: string;
  courier?: string;
  tracking_number?: string;
  shipping_status?: "confirmed" | "shipped" | "out_for_delivery" | "delivered";
  imprints: string[];
};

const STATUS_TABS = ["all", "pending", "paid", "shipped", "completed", "cancelled", "failed"] as const;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const statusStyles: Record<string, string> = {
  completed:  "bg-green-50  text-green-700  border border-green-200",
  paid:       "bg-blue-50   text-blue-700   border border-blue-200",
  shipped:    "bg-violet-50 text-violet-700 border border-violet-200",
  pending:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  cancelled:  "bg-red-50    text-red-700    border border-red-200",
  failed:     "bg-red-50    text-red-700    border border-red-200",
};

const shippingStyles: Record<string, string> = {
  delivered:        "bg-green-50  text-green-700",
  out_for_delivery: "bg-yellow-50 text-yellow-700",
  shipped:          "bg-blue-50   text-blue-700",
  confirmed:        "bg-gray-100  text-gray-600",
};

export default function OrdersTable() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [imprint,   setImprint]   = useState("");
  const [page,      setPage]      = useState(1);
  const rowsPerPage = 15;

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg,  setToastMsg]  = useState("");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.map((o: any) => ({
        ...o,
        imprints: o.imprints || [],
      })) : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    orders.forEach(o => {
      // count after imprint filter for accurate tab numbers
      const imprintOk = !imprint || o.imprints.includes(imprint);
      if (!imprintOk) return;
      counts.all = (counts.all || 0) + 1;
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders, imprint]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusTab !== "all" && o.status !== statusTab) return false;
      if (imprint && !o.imprints.includes(imprint)) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchId   = o.id.toString().includes(q);
        const matchName = (o.user_name || "").toLowerCase().includes(q);
        if (!matchId && !matchName) return false;
      }
      return true;
    });
  }, [orders, search, statusTab, imprint]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const visible    = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="min-h-screen bg-white p-6">

      {/* ── HEADER ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} total orders</p>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusTab(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusTab === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={`ml-1.5 text-[10px] ${statusTab === s ? "text-gray-300" : "text-gray-400"}`}>
                {statusCounts[s] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Imprint filter */}
          <select
            value={imprint}
            onChange={e => { setImprint(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="">All Imprints</option>
            <option value="agph">AGPH</option>
            <option value="agclassics">AG Classics</option>
          </select>

          {/* Search */}
          <div className="relative">
            <input
              placeholder="Search by order ID or name…"
              className="rounded-lg border border-gray-200 pl-3 pr-4 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-400 w-52"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Shipping</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Imprint</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                    <span className="text-xs text-gray-400">Loading orders…</span>
                  </div>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <p className="text-gray-400 text-sm">No orders found</p>
                </td>
              </tr>
            ) : visible.map(o => (
              <tr
                key={o.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/admin/orders/${o.id}`}
              >
                {/* Order ID */}
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-gray-800">#{o.id}</span>
                </td>

                {/* Customer */}
                <td className="px-4 py-3">
                  <span className="text-gray-700 font-medium">{o.user_name || "Guest"}</span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {formatDate(o.created_at)}
                </td>

                {/* Order status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusStyles[o.status] || "bg-gray-100 text-gray-600"}`}>
                    {o.status}
                  </span>
                </td>

{/* Shipping */}
<td className="px-4 py-3">
  {o.shipping_status && !["pending", "cancelled"].includes(o.status) ? (
    <div className="space-y-0.5">
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${shippingStyles[o.shipping_status] || "bg-gray-100 text-gray-600"}`}>
        {o.shipping_status.replace(/_/g, " ")}
      </span>
      {o.courier && <p className="text-gray-400 text-[11px]">{o.courier}</p>}
      {o.tracking_number && (
        <p className="font-mono text-[11px] text-blue-500">{o.tracking_number}</p>
      )}
    </div>
  ) : (
    <span className="text-gray-300 text-[11px]">—</span>
  )}
</td>

                {/* Imprint badges */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {o.imprints.length > 0 ? o.imprints.filter((v, i, a) => a.indexOf(v) === i).map(imp => (
                      <span
                        key={imp}
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          imp === "agph"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-amber-50 text-amber-600 border border-amber-200"
                        }`}
                      >
                        {imp === "agclassics" ? "AG Classics" : imp.toUpperCase()}
                      </span>
                    )) : (
                      <span className="text-gray-300 text-[11px]">—</span>
                    )}
                  </div>
                </td>

                {/* Total */}
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  ₹{Number(o.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => window.location.href = `/admin/orders/${o.id}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => goTo(page - 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={i} className="px-1 text-gray-300">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goTo(Number(p))}
                    className={`h-7 w-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      p === page
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              disabled={page === totalPages}
              onClick={() => goTo(page + 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
  );
}