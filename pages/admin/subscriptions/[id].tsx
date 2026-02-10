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
    ])
      .then(([detail, paymentRows]) => {
        setData(detail);
        setPayments(paymentRows);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">Subscription not found</div>;

  return (
    <div className="flex min-h-screen p-6">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <div className="p-6 max-w-6xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to subscriptions
          </button>

          <h1 className="text-2xl font-bold">
            Subscription #{data.subscription_id}
          </h1>

          {/* ================= INFO CARD ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-lg p-6">
            <div>
              <h3 className="font-semibold mb-2">User</h3>
              <p className="font-medium">{data.name}</p>
              <p className="text-sm text-gray-500">{data.email}</p>
              <p className="text-sm">{data.phone}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Plan</h3>
              <p>{data.plan_title}</p>
              <p className="text-sm text-gray-500 capitalize">
                {data.plan_key} • {data.duration_months} months
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Payment</h3>
              <p className="text-xl font-bold">₹{data.amount_paid}</p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                  data.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {data.status}
              </span>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Validity</h3>
              <p>
                {formatDate(data.start_date)} →{" "}
                {formatDate(data.end_date)}
              </p>
            </div>
          </div>

          {/* ================= PAYMENTS ================= */}
          <div className="">
            <div className="px-6 py-4 ">
              <h2 className="font-semibold">Payment History</h2>
            </div>

            <table className="w-full text-sm rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2">Gateway</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-left">Transaction</th>
                </tr>
              </thead>

              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-2 text-center capitalize">
                      {p.payment_gateway}
                    </td>
                    <td className="px-4 py-2 text-center font-medium">
                      ₹{p.amount}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          p.status === "success"
                            ? "bg-green-100 text-green-700"
                            : p.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs break-all">
                      {p.gateway_payment_id || "—"}
                    </td>
                  </tr>
                ))}

                {!payments.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-gray-500"
                    >
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
