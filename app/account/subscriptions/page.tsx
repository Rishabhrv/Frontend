"use client";

import { useEffect, useState } from "react";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function AccountSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/subscription-payment/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

      fetch(`${API_URL}/api/subscription-payment/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]).then(([subRes, payRes]) => {
      setSubscription(subRes.subscription);
      setPayments(payRes);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">My Subscription</h1>

      {/* ================= SUBSCRIPTION INFO ================= */}
      {subscription ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="font-medium">{subscription.title}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                subscription.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {subscription.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Start Date</span>
            <span>{formatDate(subscription.start_date)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Expiry Date</span>
            <span>{formatDate(subscription.end_date)}</span>
          </div>

          <div className="flex justify-between font-semibold">
            <span>Total Paid</span>
            <span>₹{subscription.amount_paid}</span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded">
          You don’t have an active subscription.
        </div>
      )}

      {/* ================= PAYMENT HISTORY ================= */}
      <div className="bg-white">
        <h2 className="font-semibold p-4 ">
          Payment History
        </h2>

        {payments.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No payments found.
          </p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Payment ID</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-right">Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-4 py-2">
                    {p.gateway_payment_id || "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ₹{p.amount}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-green-600 font-medium">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
