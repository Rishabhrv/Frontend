"use client";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= TYPES ================= */

type SubscriptionDetail = {
  subscription_id: number;
  name: string;
  email: string;
  phone: string;
  plan_title: string;
  plan_key: string;
  duration_months: number;
  amount_paid: number;
  status: string;
  start_date: string;
  end_date: string;
  razorpay_subscription_id: string | null; // Added
  autopay_enabled: number;                 // Added (1 = Active, 2 = Paused, 0 = Cancelled)
};

type Payment = {
  id: number;
  payment_gateway: string;
  gateway_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};


type SubscriptionLog = {
  id: number;
  action: string;
  description: string;
  created_at: string;
};

/* ================= HELPERS ================= */

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ================= PAGE ================= */

export default function SubscriptionDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState<SubscriptionDetail | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SubscriptionLog[]>([]);

  useEffect(() => {
    document.title = "Manage Subscription Details | Admin Panel";
  }, []);

  useEffect(() => {
  if (!id) return;

  const token = localStorage.getItem("admin_token");

  Promise.all([
    fetch(`${API_URL}/api/admin/subscriptions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

    fetch(`${API_URL}/api/admin/subscriptions/${id}/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),

    fetch(`${API_URL}/api/admin/subscriptions/${id}/logs`, { // 👈 NEW FETCH
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
  ])
    .then(([detail, paymentRows, logRows]) => {
      setData(detail);
      setPayments(paymentRows);
      setLogs(logRows); // 👈 SET LOGS
    })
    .finally(() => setLoading(false));
}, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">Subscription not found</div>;

  return (
    <div className="flex min-h-screen p-6 bg-white text-gray-700">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <div className="p-6 max-w-6xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            Back to subscriptions
          </button>

          <h1 className="text-2xl font-bold">
            Subscription #{data.subscription_id}
          </h1>

          {/* ================= INFO CARD ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white border border-gray-200 rounded-lg p-6">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">User Details</h3>
              <p className="font-medium">{data.name}</p>
              <p className="text-sm text-gray-500">{data.email}</p>
              <p className="text-sm text-gray-500">{data.phone}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Plan Information</h3>
              <p>{data.plan_title}</p>
              <p className="text-sm text-gray-500 capitalize">
                {data.plan_key} • {data.duration_months} months
              </p>
              <p className="mt-2 text-sm">
                <span className="text-gray-500">Validity: </span><br/>
                {formatDate(data.start_date)} → {formatDate(data.end_date)}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Status & Payment</h3>
              <p className="text-xl font-bold">₹{data.amount_paid}</p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                  data.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {data.status.toUpperCase()}
              </span>
            </div>

            {/* ── NEW AUTO-DEBIT DETAILS BLOCK ── */}
            <div className="md:col-span-2 lg:col-span-3 pt-4 mt-2 border-t border-gray-100">
              <h3 className="font-semibold mb-2 text-gray-900">Auto-Debit & Gateway Details</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12">
                <div>
                  <p className="text-sm text-gray-500">Auto-Renewal Status</p>
                  <p className={`font-medium ${
                    data.autopay_enabled === 1 ? "text-green-600" : 
                    data.autopay_enabled === 2 ? "text-yellow-600" : "text-red-500"
                  }`}>
                    {data.autopay_enabled === 1 ? "Active" : 
                     data.autopay_enabled === 2 ? "Paused" : "Cancelled / Disabled"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Razorpay Subscription ID</p>
                  {data.razorpay_subscription_id ? (
                    <p className="font-mono text-sm text-gray-800 break-all bg-gray-50 px-2 py-1 rounded inline-block border border-gray-200">
                      {data.razorpay_subscription_id}
                    </p>
                  ) : (
                    <p className="font-medium text-gray-800">Manual Activation (No ID)</p>
                  )}
                </div>
              </div>
            </div>
            
          </div>

          {/* ================= PAYMENTS ================= */}
          <div className="pt-4">
            <div className="py-4">
              <h2 className="text-lg font-semibold">Payment History</h2>
            </div>

            <table className="w-full text-sm rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-center font-semibold">Gateway</th>
                  <th className="px-4 py-3 text-center font-semibold">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Transaction ID</th>
                </tr>
              </thead>

              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-t border-gray-200 bg-white">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center capitalize text-gray-600">
                      {p.payment_gateway}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      ₹{p.amount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
                          p.status === "success"
                            ? "bg-green-50 text-green-700"
                            : p.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 break-all">
                      {p.gateway_payment_id || "—"}
                    </td>
                  </tr>
                ))}

                {!payments.length && (
                  <tr className="bg-white">
                    <td
                      colSpan={5}
                      className="text-center py-8 text-gray-500 italic"
                    >
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* ================= ACTIVITY LOGS ================= */}
<div className="pt-8">
  <div className="py-4 border-b border-gray-200 mb-4">
    <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
  </div>

  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    {logs.length > 0 ? (
      <ol className="relative border-l border-gray-200 ml-3">
        {logs.map((log) => (
          <li key={log.id} className="mb-6 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
              <h3 className="flex items-center text-sm font-semibold text-gray-900 capitalize tracking-wide">
                {log.action.replace(/_/g, ' ')}
              </h3>
              <time className="block mb-1 text-xs font-normal leading-none text-gray-400 sm:mb-0">
                {new Date(log.created_at).toLocaleString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric", 
                  hour: "2-digit", minute: "2-digit"
                })}
              </time>
            </div>
            <p className="text-sm font-normal text-gray-500">
              {log.description}
            </p>
          </li>
        ))}
      </ol>
    ) : (
      <p className="text-center text-gray-500 italic py-4">No activity logs found for this subscription.</p>
    )}
  </div>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}