"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ShoppingBag,
  Crown,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Calendar,
  CreditCard,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ─────────────────────────── TYPES ─────────────────────────── */
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

/* Row shape returned by GET /api/admin/:orderId  (one row per order item) */
type OrderRow = {
  order_id: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  /* payment */
  transaction_id: string | null;
  payment_method: string | null;
  paid_amount: number | null;
  /* item */
  product_id: number;
  title: string;
  main_image: string;
  format: "ebook" | "paperback";
  quantity: number;
  price: number;
  /* shipping */
  shipping_cost: number;
  /* address */
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  shipping_email: string | null;
};

type SubscriptionDetail = {
  subscription: {
    subscription_id: number;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
    months: number;
    amount_paid: number;
  };
  payments: {
    gateway_payment_id: string;
    amount: number;
    status: string;
    created_at: string;
  }[];
};

/* ─────────────────────────── HELPERS ─────────────────────────── */
const fmt = (d: string) => dayjs(d).format("DD MMM YYYY");
const fmtDT = (d: string) => dayjs(d).format("DD MMM YYYY · hh:mm A");
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

/* ─────────────────────────── STATUS BADGE ─────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    success: {
      label: "Success",
      cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      icon: <CheckCircle size={11} />,
    },
    pending: {
      label: "Pending",
      cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      icon: <Clock size={11} />,
    },
    failed: {
      label: "Failed",
      cls: "bg-red-50 text-red-700 ring-1 ring-red-200",
      icon: <XCircle size={11} />,
    },
  };
  const cfg = map[status] ?? map["pending"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────── TYPE BADGE ─────────────────────────── */
function TypeBadge({ type }: { type: "order" | "subscription" }) {
  return type === "subscription" ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold ring-1 ring-violet-200">
      <Crown size={11} />
      Subscription
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold ring-1 ring-sky-200">
      <ShoppingBag size={11} />
      Order
    </span>
  );
}

/* ─────────────────────────── STAT CARD ─────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────── CUSTOM TOOLTIP ─────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      <p>₹{fmtCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ─────────────────────────── ORDER DETAIL PANEL ─────────────────────────── */
function OrderDetailPanel({ rows }: { rows: OrderRow[] | null }) {
  if (!rows)
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
        <RefreshCw size={14} className="animate-spin" /> Loading items…
      </div>
    );

  if (!rows.length)
    return <p className="text-sm text-gray-400 py-2">No items found.</p>;

  const first = rows[0];
  const hasAddress = first.first_name || first.address;

  return (
    <div className="space-y-4">
      {/* ── Order summary bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Order Status", value: first.status },
          { label: "Payment Status", value: first.payment_status },
          {
            label: "Total Amount",
            value: `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(first.total_amount)}`,
          },
          {
            label: "Shipping Cost",
            value: first.shipping_cost > 0
              ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(first.shipping_cost)}`
              : "Free",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`grid gap-4 ${hasAddress ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* ── Items ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Order Items
          </p>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${row.main_image}`}
                  alt={row.title}
                  className="w-11 h-15 object-cover rounded-lg border border-gray-100 shrink-0"
                  style={{ height: "3.75rem" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{row.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {row.format} × {row.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-800 shrink-0">
                  ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(row.price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Shipping address ── */}
        {hasAddress && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Shipping Address
            </p>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-1 text-sm">
              <p className="font-semibold text-gray-800">
                {first.first_name} {first.last_name}
              </p>
              {first.address && (
                <p className="text-gray-500">{first.address}</p>
              )}
              <p className="text-gray-500">
                {[first.city, first.state, first.pincode].filter(Boolean).join(", ")}
              </p>
              {first.phone && (
                <p className="text-gray-400 text-xs mt-1">📞 {first.phone}</p>
              )}
              {first.shipping_email && (
                <p className="text-gray-400 text-xs">✉ {first.shipping_email}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Payment method ── */}
      {(first.transaction_id || first.payment_method) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap gap-6 text-xs">
          {first.payment_method && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Payment Method
              </p>
              <p className="font-semibold text-gray-700 capitalize">{first.payment_method}</p>
            </div>
          )}
          {first.transaction_id && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Transaction ID
              </p>
              <p className="font-mono text-gray-600">{first.transaction_id}</p>
            </div>
          )}
          {first.paid_amount != null && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Amount Paid
              </p>
              <p className="font-semibold text-gray-700">
                ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(first.paid_amount)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── SUBSCRIPTION DETAIL PANEL ─────────────────────────── */
function SubscriptionDetailPanel({ data }: { data: SubscriptionDetail | null }) {
  if (!data)
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
        <RefreshCw size={14} className="animate-spin" /> Loading details…
      </div>
    );

  const { subscription, payments } = data;

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        Subscription Details
      </p>

      {/* Plan summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Plan", value: subscription.title },
          { label: "Status", value: subscription.status },
          { label: "Duration", value: `${subscription.months} month${subscription.months !== 1 ? "s" : ""}` },
          {
            label: "Amount Paid",
            value: `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(subscription.amount_paid)}`,
          },
          { label: "Start Date", value: fmt(subscription.start_date) },
          { label: "Expiry Date", value: fmt(subscription.end_date) },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Payment history */}
      {payments?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Payment History
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {payments.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 items-center px-4 py-2.5 text-xs"
              >
                <span className="text-gray-500 font-mono truncate">
                  {p.gateway_payment_id || "—"}
                </span>
                <span className="font-semibold text-gray-800 text-center">
                  ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(p.amount)}
                </span>
                <span className="text-center">
                  <StatusBadge status={p.status} />
                </span>
                <span className="text-gray-400 text-right">{fmt(p.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ date: string; total: number }[]>([]);

  /* Filters */
  const [typeFilter, setTypeFilter] = useState<"all" | "order" | "subscription">("all");
  const [userFilter, setUserFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  /* Accordion */
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  /* ── Fetch all payments ── */
  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    Promise.all([
      fetch(`${API_URL}/api/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/payments/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([payments, stats]) => {
        setPayments(Array.isArray(payments) ? payments : []);
        setChartData(
          Array.isArray(stats)
            ? stats.map((s: any) => ({ date: fmt(s.date), total: Number(s.total) }))
            : []
        );
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── User list ── */
  const users = useMemo(() => {
    const map = new Map<number, { id: number; name: string; email: string }>();
    payments.forEach((p) =>
      map.set(p.user_id, { id: p.user_id, name: p.name, email: p.email })
    );
    return Array.from(map.values());
  }, [payments]);

  /* ── Filtered payments ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchType = typeFilter === "all" || p.type === typeFilter;
      const matchUser = userFilter === "all" || Number(p.user_id) === Number(userFilter);
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.payment_id || "").toLowerCase().includes(q);
      return matchType && matchUser && matchSearch;
    });
  }, [payments, typeFilter, userFilter, search]);

  /* ── Stats ── */
  const totalRevenue = filtered
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + Number(p.amount), 0);

  const orderCount = filtered.filter((p) => p.type === "order").length;
  const subscriptionCount = filtered.filter((p) => p.type === "subscription").length;
  const uniqueUsers = new Set(filtered.map((p) => p.user_id)).size;

  /* ── Toggle accordion ── */
  const toggleRow = useCallback(
    async (p: Payment) => {
      const key = `${p.type}-${p.id}`;

      if (expanded === key) {
        setExpanded(null);
        return;
      }

      setExpanded(key);

      if (detailCache[key]) return; // already loaded

      const token = localStorage.getItem("admin_token");
      setDetailLoading(key);

      try {
        if (p.type === "order") {
          /* GET /api/admin/:orderId */
          const res = await fetch(`${API_URL}/api/admin/${p.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          setDetailCache((prev) => ({ ...prev, [key]: data }));
        } else {
          /* GET /api/admin/subscription/:paymentId */
          const res = await fetch(`${API_URL}/api/admin/subscription/${p.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          setDetailCache((prev) => ({ ...prev, [key]: data }));
        }
      } catch (err) {
        console.error("Detail load error:", err);
        // Set empty fallback so spinner doesn't hang
        setDetailCache((prev) => ({ ...prev, [key]: p.type === "order" ? [] : null }));
      } finally {
        setDetailLoading(null);
      }
    },
    [expanded, detailCache]
  );

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div
      className="min-h-screen  p-6 lg:p-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All orders & subscription transactions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white rounded-xl px-3 py-2 border border-gray-100 shadow-sm">
          <Calendar size={13} />
          <span>Last updated: {dayjs().format("DD MMM YYYY, hh:mm A")}</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={`₹${fmtCurrency(totalRevenue)}`}
          sub="Successful payments"
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <StatCard
          label="Order Payments"
          value={String(orderCount)}
          icon={<ShoppingBag size={18} className="text-sky-600" />}
          accent="bg-sky-50"
        />
        <StatCard
          label="Subscriptions"
          value={String(subscriptionCount)}
          icon={<Crown size={18} className="text-violet-600" />}
          accent="bg-violet-50"
        />
        <StatCard
          label="Unique Customers"
          value={String(uniqueUsers)}
          icon={<Users size={18} className="text-rose-500" />}
          accent="bg-rose-50"
        />
      </div>

      {/* ── Chart ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-700">Revenue Trend</p>
            <p className="text-xs text-gray-400">Daily successful payments</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Revenue
          </div>
        </div>
        <div className="h-52">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${fmtCurrency(v)}`}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
          <input
            type="text"
            placeholder="Search name, email or payment ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-gray-50 placeholder:text-gray-300"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-gray-300" />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-600"
          >
            <option value="all">All Types</option>
            <option value="order">Orders</option>
            <option value="subscription">Subscriptions</option>
          </select>

          {/* User filter */}
          <select
            value={userFilter}
            onChange={(e) =>
              setUserFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-600 max-w-[220px]"
          >
            <option value="all">All Customers</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.email}
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-xs text-gray-400 font-medium">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Customer
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Type
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">
                Payment ID
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Amount
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">
                Status
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">
                Date
              </th>
              <th className="px-4 py-3.5 w-10" />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-300 text-sm">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Loading payments…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-300 text-sm">
                  <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
                  No payments found
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const key = `${p.type}-${p.id}`;
                const isOpen = expanded === key;
                const detail = detailCache[key];
                const isLoadingDetail = detailLoading === key;

                return (
                  <>
                    {/* ── Main row ── */}
                    <tr
                      key={key}
                      onClick={() => toggleRow(p)}
                      className={`border-t border-gray-50 cursor-pointer transition-colors duration-150 ${
                        isOpen ? "bg-gray-50/70" : "hover:bg-gray-50/50"
                      }`}
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <TypeBadge type={p.type} />
                      </td>

                      {/* Payment ID */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span
                          className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
                          title={p.payment_id}
                        >
                          {p.payment_id
                            ? p.payment_id.length > 20
                              ? `…${p.payment_id.slice(-14)}`
                              : p.payment_id
                            : "—"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-gray-900">
                          ₹{fmtCurrency(p.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-right hidden lg:table-cell">
                        <span className="text-xs text-gray-400">{fmtDT(p.created_at)}</span>
                      </td>

                      {/* Chevron */}
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                            isOpen
                              ? "bg-gray-200 text-gray-700"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </td>
                    </tr>

                    {/* ── Accordion detail row ── */}
                    {isOpen && (
                      <tr key={`${key}-detail`} className="bg-slate-50/80 border-t border-gray-100">
                        <td colSpan={7} className="px-6 py-5">
                          {isLoadingDetail ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                              <RefreshCw size={14} className="animate-spin" />
                              Loading details…
                            </div>
                          ) : p.type === "order" ? (
                            <OrderDetailPanel rows={detail ?? null} />
                          ) : (
                            <SubscriptionDetailPanel data={detail ?? null} />
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} of {payments.length} payments
            </span>
            <span className="text-xs font-semibold text-gray-600">
              Total Revenue: ₹{fmtCurrency(totalRevenue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}