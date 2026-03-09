"use client";

import { useEffect, useState } from "react";
import {
  Book, Crown, CheckCircle, XCircle, ChevronDown, ChevronUp,
  CreditCard,
} from "lucide-react";

type Payment = {
  ref_id: number;
  payment_type: "product" | "subscription";
  title: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending";
  date: string;
  payment_id: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STYLE = {
  success: "bg-green-100 text-green-700 border-green-200",
  failed:  "bg-red-100 text-red-700 border-red-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STATUS_DOT = {
  success: "bg-green-500",
  failed:  "bg-red-500",
  pending: "bg-yellow-500",
};

/* ─── Skeleton ─── */
function SkeletonRow() {
  return (
    <div className="border border-gray-200 rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-3 w-24 bg-gray-100 rounded" />
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-4 w-14 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function PaymentHistoryPage() {
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [details,   setDetails]   = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch(`${API_URL}/api/payment-history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const loadDetails = async (p: Payment) => {
    const token = localStorage.getItem("token");
    const key   = `${p.payment_type}-${p.ref_id}`;

    if (expanded === key) { setExpanded(null); setDetails(null); return; }

    setExpanded(key);
    setDetails(null);
    setDetailLoading(true);

    const url =
      p.payment_type === "subscription"
        ? `${API_URL}/api/payment-history/subscription/${p.ref_id}`
        : `${API_URL}/api/orders/${p.ref_id}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    setDetails(await res.json());
    setDetailLoading(false);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="w-full space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  /* ── Empty ── */
  if (!payments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <CreditCard size={26} className="text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-700 mb-1">No payments yet</h2>
        <p className="text-sm text-gray-400">Your product and subscription payments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Payment History</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">All your product & subscription payments</p>
      </div>

      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => {
              const key    = `${p.payment_type}-${p.ref_id}`;
              const isOpen = expanded === key;

              return (
                <>
                  <tr
                    key={key}
                    onClick={() => loadDetails(p)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {p.payment_type === "subscription"
                          ? <Crown size={15} className="text-purple-600" />
                          : <Book  size={15} className="text-blue-600" />}
                        <span className="capitalize text-sm text-gray-700">{p.payment_type}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 max-w-[200px]">
                      <p className="font-medium text-gray-900 truncate">{p.title}</p>
                      {p.payment_id && (
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">{p.payment_id}</p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-gray-900">₹{p.amount}</td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[p.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                        <span className="capitalize">{p.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right text-xs text-gray-500 whitespace-nowrap">{formatDate(p.date)}</td>

                    <td className="px-4 py-4 text-right text-gray-400">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={6} className="px-6 py-5">
                        {detailLoading
                          ? <p className="text-sm text-gray-400 animate-pulse">Loading details…</p>
                          : p.payment_type === "subscription"
                            ? <SubscriptionDetails data={details} />
                            : <OrderDetails items={details} />
                        }
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile/tablet cards (< md) ── */}
      <div className="md:hidden space-y-3">
        {payments.map((p) => {
          const key    = `${p.payment_type}-${p.ref_id}`;
          const isOpen = expanded === key;

          return (
            <div key={key} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Card header — tap to expand */}
              <button
                onClick={() => loadDetails(p)}
                className="w-full text-left px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      p.payment_type === "subscription" ? "bg-purple-100" : "bg-blue-100"
                    }`}>
                      {p.payment_type === "subscription"
                        ? <Crown size={15} className="text-purple-600" />
                        : <Book  size={15} className="text-blue-600" />}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 leading-tight truncate">{p.title}</p>
                      <p className="text-[11px] text-gray-400 capitalize mt-0.5">{p.payment_type}</p>
                      {p.payment_id && (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{p.payment_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="font-bold text-gray-900 text-sm">₹{p.amount}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[p.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                      <span className="capitalize">{p.status}</span>
                    </span>
                    <p className="text-[11px] text-gray-400">{formatDate(p.date)}</p>
                  </div>
                </div>

                {/* Expand indicator */}
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100 gap-1 text-xs text-gray-400">
                  {isOpen ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> View details</>}
                </div>
              </button>

              {/* Expanded detail panel */}
              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                  {detailLoading
                    ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3 w-3/4 bg-gray-200 rounded" />
                        <div className="h-3 w-1/2 bg-gray-100 rounded" />
                      </div>
                    )
                    : p.payment_type === "subscription"
                      ? <SubscriptionDetails data={details} />
                      : <OrderDetails items={details} />
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Subscription details ─── */
function SubscriptionDetails({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Plan",        value: data.subscription?.title },
          { label: "Status",      value: data.subscription?.status },
          { label: "Start Date",  value: formatDate(data.subscription?.start_date) },
          { label: "Expiry Date", value: formatDate(data.subscription?.end_date) },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg p-2.5 border border-gray-200">
            <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">{item.label}</p>
            <p className="font-semibold text-gray-800 text-xs">{item.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-semibold text-xs text-gray-700 mb-2">Payment Records</p>
        <div className="space-y-1.5">
          {data.payments?.map((p: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-[11px] bg-white rounded-lg px-3 py-2 border border-gray-200">
              <span className="font-mono text-gray-500 truncate mr-2">{p.gateway_payment_id || "—"}</span>
              <span className="font-semibold text-gray-800 shrink-0">₹{p.amount}</span>
              <span className="text-green-600 shrink-0 ml-2 capitalize">{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Order details ─── */
function OrderDetails({ items }: { items: any[] }) {
  if (!items) return null;
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
          <img
            src={`${API_URL}${item.main_image}`}
            className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded shrink-0"
            alt=""
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs sm:text-sm text-gray-900 leading-tight line-clamp-2">{item.title}</p>
            <p className="text-[11px] text-gray-400 capitalize mt-1">{item.format} × {item.quantity}</p>
          </div>
          <p className="font-bold text-sm text-gray-900 shrink-0">₹{item.price}</p>
        </div>
      ))}
    </div>
  );
}