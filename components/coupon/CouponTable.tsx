"use client";

import { useEffect, useMemo, useState } from "react";
import CouponForm from "./CouponForm";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function CouponTable() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const [bulkAction, setBulkAction] = useState("none");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  /* ================= FETCH ================= */
  const fetchCoupons = async () => {
    const res = await fetch(`${API_URL}/api/admin/coupons`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setCoupons([]);
      return;
    }

    setCoupons(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  /* ================= FILTER + PAGINATION ================= */
  const filtered = useMemo(() => {
    return coupons.filter((c) =>
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [coupons, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  /* ================= ACTIONS ================= */
  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const deleteCoupon = (id: number) => {
    setConfirmConfig({
      title: "Delete Coupon",
      message: "Are you sure you want to delete this coupon?",
      onConfirm: async () => {
        await fetch(`${API_URL}/api/admin/coupons/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        });
        fetchCoupons();
      },
    });
    setConfirmOpen(true);
  };

  /* ================= BULK DELETE ================= */
  const applyBulkAction = () => {
    if (bulkAction !== "delete") return;
    if (!selected.length) { setToastMsg("No coupons selected."); setToastOpen(true); return; }

    setConfirmConfig({
      title: "Delete Coupons",
      message: `Are you sure you want to delete ${selected.length} coupon(s)?`,
      onConfirm: async () => {
        await Promise.all(
          selected.map((id) =>
            fetch(`${API_URL}/api/admin/coupons/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
            })
          )
        );
        setSelected([]);
        setBulkAction("none");
        fetchCoupons();
      },
    });
    setConfirmOpen(true);
  };

  const editCouponHandler = async (id: number) => {
    const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    });
    const data = await res.json();
    setEditCoupon(data);
    setOpen(true);
  };

  return (
    <div className="min-h-screen p-3 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* PAGE HEADER */}
        <div className="mb-6">
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Coupon Manager
            </h1>
            <button
              onClick={() => {
                setEditCoupon(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Coupon
            </button>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* TOOLBAR */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="none">Bulk actions</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={applyBulkAction}
                className="text-sm cursor-pointer text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors cursor-pointer"
              >
                Apply
              </button>

              {/* Selected count badge */}
              {selected.length > 0 && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {selected.length} selected
                </span>
              )}
            </div>

            {/* SEARCH */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                className="text-sm pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder-gray-400 text-gray-700"
                placeholder="Search coupons…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 accent-gray-700"
                      checked={paginated.length > 0 && paginated.every((c) => selected.includes(c.id))}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? paginated.map((c) => c.id) : []
                        )
                      }
                    />
                  </th>
                  {["Code", "Discount", "Type", "Min Cart", "Expiry", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase ${
                        h === "Code" ? "text-left" : "text-center"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50/60 transition-colors duration-100 ${
                      selected.includes(c.id) ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 accent-gray-700"
                        checked={selected.includes(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                    </td>

                    {/* CODE */}
                    <td className="px-4 py-4">
                      <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs tracking-wider">
                        {c.code}
                      </span>
                    </td>

                    {/* DISCOUNT */}
                    <td className="px-4 py-4 text-center font-semibold text-gray-700">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}%`
                        : `₹${c.discount_value}`}
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block text-xs font-medium capitalize text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {c.discount_type}
                      </span>
                    </td>

                    {/* MIN CART */}
                    <td className="px-4 py-4 text-center text-gray-600">
                      ₹{c.min_cart_value || 0}
                    </td>

                    {/* EXPIRY */}
                    <td className="px-4 py-4 text-center text-gray-500 text-xs tabular-nums">
                      {c.expiry_date
                        ? new Date(c.expiry_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.status === "active"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {c.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => editCouponHandler(c.id)}
                          className="text-xs cursor-pointer font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => deleteCoupon(c.id)}
                          className="text-xs cursor-pointer font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!paginated.length && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-400">No coupons found</p>
                        <p className="text-xs text-gray-300">Try adjusting your search</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPage(1);
                  setPerPage(Number(e.target.value));
                }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
              {filtered.length > 0 && (
                <span className="ml-2 text-gray-400">· {filtered.length} total</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-400 px-1 text-sm">…</span>}
              </div>

              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <CouponForm
          coupon={editCoupon}
          onClose={() => setOpen(false)}
          onSaved={fetchCoupons}
        />
      )}
      {/* ALERT */}
      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />

      {/* CONFIRM */}
      <ConfirmPopup
        open={confirmOpen}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        confirmText="Confirm"
        onCancel={() => { setConfirmOpen(false); setConfirmConfig(null); }}
        onConfirm={() => { confirmConfig?.onConfirm(); setConfirmOpen(false); setConfirmConfig(null); }}
      />
    </div>
  );
}