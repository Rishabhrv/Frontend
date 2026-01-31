"use client";

import { useEffect, useState } from "react";
import {
  Book,
  Crown,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
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

/* ================= DATE FORMAT ================= */
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/payment-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  /* ================= LOAD DETAILS ================= */
  const loadDetails = async (p: Payment) => {
    const token = localStorage.getItem("token");
    const key = `${p.payment_type}-${p.ref_id}`;

    if (expanded === key) {
      setExpanded(null);
      setDetails(null);
      return;
    }

    setExpanded(key);
    setDetails(null);

    if (p.payment_type === "subscription") {
      const res = await fetch(
        `${API_URL}/api/payment-history/subscription/${p.ref_id}`,
        {
          headers: { Authorization: `Bearer ${token}` } },
      );
      setDetails(await res.json());
    }

    if (p.payment_type === "product") {
      const res = await fetch(
        `${API_URL}/api/orders/${p.ref_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetails(await res.json());
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center text-gray-500">
        Loading payment history…
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <h1 className="text-2xl font-semibold mb-2">Payment History</h1>
        <p className="text-gray-500">You have not made any payments yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif mb-1">Payment History</h1>
        <p className="text-sm text-gray-500">
          All your product & subscription payments
        </p>
      </div>

      {/* TABLE */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Details</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => {
              const key = `${p.payment_type}-${p.ref_id}`;
              const isOpen = expanded === key;

              return (
                <>
                  {/* MAIN ROW */}
                  <tr
                    key={key}
                    onClick={() => loadDetails(p)}
                    className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {p.payment_type === "subscription" ? (
                          <Crown className="text-purple-600" size={16} />
                        ) : (
                          <Book className="text-blue-600" size={16} />
                        )}
                        <span className="capitalize">
                          {p.payment_type}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">{p.title}</p>
                      {p.payment_id && (
                        <p className="text-xs text-gray-500">
                          Payment ID: {p.payment_id}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold">
                      ₹{p.amount}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {p.status === "success" && (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} /> Success
                        </span>
                      )}
                      {p.status === "failed" && (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle size={14} /> Failed
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="text-yellow-600">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-gray-500">
                      {formatDate(p.date)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </td>
                  </tr>

                  {/* DROPDOWN */}
                  {isOpen && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        {p.payment_type === "subscription" ? (
                          <SubscriptionDetails data={details} />
                        ) : (
                          <OrderDetails items={details} />
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= SUBSCRIPTION DETAILS ================= */
function SubscriptionDetails({ data }: { data: any }) {
  if (!data) return <p className="text-sm">Loading details…</p>;

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-gray-500">Plan</span>
          <p className="font-medium">{data.subscription.title}</p>
        </div>

        <div>
          <span className="text-gray-500">Status</span>
          <p className="font-medium">{data.subscription.status}</p>
        </div>

        <div>
          <span className="text-gray-500">Start Date</span>
          <p>{formatDate(data.subscription.start_date)}</p>
        </div>

        <div>
          <span className="text-gray-500">Expiry Date</span>
          <p>{formatDate(data.subscription.end_date)}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <p className="font-semibold mb-2">Payment History</p>

        {data.payments.map((p: any, i: number) => (
          <div
            key={i}
            className="flex justify-between text-xs py-1"
          >
            <span>{p.gateway_payment_id || "-"}</span>
            <span>₹{p.amount}</span>
            <span className="text-green-600">{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= ORDER DETAILS ================= */
function OrderDetails({ items }: { items: any[] }) {
  if (!items) return <p className="text-sm">Loading items…</p>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-gray-200 pb-3"
        >
          <img
            src={`${API_URL}${item.main_image}`}
            className="w-12 h-16 object-cover rounded"
          />

          <div className="flex-1">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-gray-500">
              {item.format} × {item.quantity}
            </p>
          </div>

          <p className="font-semibold">
            ₹{item.price}
          </p>
        </div>
      ))}
    </div>
  );
}
