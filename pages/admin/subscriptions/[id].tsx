"use client";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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

export default function SubscriptionDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // ✅ CORRECT
  const [data, setData] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return; // ⛔ wait until router is ready

    fetch(`${API_URL}/api/admin/subscriptions/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    })
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading subscription…</div>;
  }

  if (!data) {
    return <div className="p-6">Subscription not found</div>;
  }

  return (
    <div className="flex p-6">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <div className="p-6 max-w-5xl">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm mb-4"
          >
            ← Back to subscriptions
          </button>

          <h1 className="text-2xl font-bold mb-6">
            Subscription #{data.subscription_id}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-300 rounded p-6">
            {/* USER */}
            <div>
              <h3 className="font-semibold mb-2">User</h3>
              <p className="font-medium">{data.name}</p>
              <p className="text-sm text-gray-500">{data.email}</p>
              <p className="text-sm">{data.phone}</p>
            </div>

            {/* PLAN */}
            <div>
              <h3 className="font-semibold mb-2">Plan</h3>
              <p>{data.plan_title}</p>
              <p className="text-sm text-gray-500 capitalize">
                {data.plan_key} • {data.duration_months} months
              </p>
            </div>

            {/* PAYMENT */}
            <div>
              <h3 className="font-semibold mb-2">Payment</h3>
              <p className="text-lg font-semibold">
                ₹{data.amount_paid}
              </p>
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

            {/* VALIDITY */}
            <div>
              <h3 className="font-semibold mb-2">Validity</h3>
              <p>
                {data.start_date} → {data.end_date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
