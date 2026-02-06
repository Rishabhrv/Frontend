"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= TYPES ================= */
type Payment = {
  id: number;
  type: "order" | "subscription";
  payment_id: string;
  amount: number;
  status: "success" | "pending" | "failed";
  created_at: string;
  user_id: number;
  name: string;
  email: string;
};

/* ================= DATE HELPERS ================= */
const formatChartDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export default function PaymentTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  

  /* ================= FILTER STATES ================= */
  const [typeFilter, setTypeFilter] =
    useState<"all" | "order" | "subscription">("all");

  const [userFilter, setUserFilter] =
    useState<number | "all">("all");

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch(`${API_URL}/api/admin/payments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    })
      .then(r => r.json())
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  /* ================= USER LIST ================= */
  const users = useMemo(() => {
    const map = new Map<number, { id: number; name: string; email: string }>();
    payments.forEach(p => {
      map.set(p.user_id, {
        id: p.user_id,
        name: p.name,
        email: p.email,
      });
    });
    return Array.from(map.values());
  }, [payments]);

  /* ================= FILTER PAYMENTS ================= */
const filteredPayments = useMemo(() => {
  return payments.filter(p => {
    const matchType =
      typeFilter === "all" || p.type === typeFilter;

    const matchUser =
      userFilter === "all" ||
      Number(p.user_id) === Number(userFilter);

    const paymentTime = new Date(p.created_at).getTime();

    const matchStart =
      !startDate ||
      paymentTime >= new Date(startDate).setHours(0, 0, 0, 0);

    const matchEnd =
      !endDate ||
      paymentTime <= new Date(endDate).setHours(23, 59, 59, 999);

    return matchType && matchUser && matchStart && matchEnd;
  });
}, [payments, typeFilter, userFilter, startDate, endDate]);



  /* ================= STATS ================= */
  const totalRevenue = filteredPayments
    .filter(p => p.status === "success")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const orderCount = filteredPayments.filter(
    p => p.type === "order"
  ).length;

  const subscriptionCount = filteredPayments.filter(
    p => p.type === "subscription"
  ).length;

  /* ================= CHART DATA ================= */
  const chartData = useMemo(() => {
    const map: Record<string, number> = {};

    filteredPayments.forEach(p => {
      if (p.status !== "success") return;

      const day = formatChartDate(p.created_at);
      map[day] = (map[day] || 0) + Number(p.amount);
    });

    return Object.entries(map).map(([date, total]) => ({
      date,
      total,
    }));
  }, [filteredPayments]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payments Overview</h1>

      {/* ================= FILTER BAR ================= */}
     <div className="flex flex-wrap gap-3 items-center">
  {/* TYPE */}
  <select
    value={typeFilter}
    onChange={e => setTypeFilter(e.target.value as any)}
    className="border rounded px-3 py-2 text-sm"
  >
    <option value="all">All Payments</option>
    <option value="order">Orders</option>
    <option value="subscription">Subscriptions</option>
  </select>

  {/* USER */}
  <select
    value={userFilter}
    onChange={e =>
      setUserFilter(
        e.target.value === "all" ? "all" : Number(e.target.value)
      )
    }
    className="border rounded px-3 py-2 text-sm"
  >
    <option value="all">All Users</option>
    {users.map(u => (
      <option key={u.id} value={u.id}>
        {u.name} ({u.email})
      </option>
    ))}
  </select>

  {/* FROM DATE */}
  <input
    type="date"
    value={startDate}
    onChange={e => setStartDate(e.target.value)}
    className="border rounded px-3 py-2 text-sm"
  />

  {/* TO DATE */}
  <input
    type="date"
    value={endDate}
    onChange={e => setEndDate(e.target.value)}
    className="border rounded px-3 py-2 text-sm"
  />

  {/* RESET */}
  {(startDate || endDate) && (
    <button
      onClick={() => {
        setStartDate("");
        setEndDate("");
      }}
      className="text-sm text-blue-600 hover:underline"
    >
      Reset dates
    </button>
  )}
</div>


      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">₹{totalRevenue}</p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-sm text-gray-500">Order Payments</p>
          <p className="text-xl font-semibold">{orderCount}</p>
        </div>

        <div className="bg-white border rounded p-4">
          <p className="text-sm text-gray-500">Subscriptions</p>
          <p className="text-xl font-semibold">{subscriptionCount}</p>
        </div>
      </div>

      {/* ================= CHART ================= */}
      <div className="bg-white border rounded p-10 h-72">
        <h2 className="font-semibold mb-2">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#000"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Payment ID</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  Loading payments...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </td>

                  <td className="px-4 py-3 capitalize">{p.type}</td>

                  <td className="px-4 py-3 text-xs break-all">
                    {p.payment_id || "—"}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    ₹{p.amount}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {formatDateTime(p.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
