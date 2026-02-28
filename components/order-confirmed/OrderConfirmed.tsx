"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

/* ── Types matching DB schema ─────────────────────────────────── */
type OrderItem = {
  product_id: number;
  title: string;
  main_image: string | null;
  format: "ebook" | "paperback";
  price: number;
  quantity: number;
};

type OrderAddress = {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  payment_status: string;
  razorpay_payment_id: string | null;
  coupon_code: string | null;
  coupon_discount: number;
  created_at: string;
  // from shipping table
  shipping_status: "confirmed" | "shipped" | "out_for_delivery" | "delivered" | null;
  shipping_cost: number;
  courier: string | null;
  tracking_number: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  // joined
  items: OrderItem[];
  address: OrderAddress | null;
};

/* ── Confetti ─────────────────────────────────────────────────── */
type Particle = { id: number; x: number; color: string; size: number; delay: number; duration: number };
const COLORS = ["#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ── Shipping steps ───────────────────────────────────────────── */
const STEPS = [
  { key: null,               label: "Order Placed"      },
  { key: "confirmed",        label: "Confirmed"          },
  { key: "shipped",          label: "Shipped"            },
  { key: "out_for_delivery", label: "Out for Delivery"   },
  { key: "delivered",        label: "Delivered"          },
] as const;

const STATUS_ORDER = ["confirmed","shipped","out_for_delivery","delivered"] as const;

function getStepIndex(status: string | null) {
  if (!status) return 0;
  const idx = STATUS_ORDER.indexOf(status as any);
  return idx === -1 ? 0 : idx + 1;
}

/* ─────────────────────────────────────────────────────────────── */
export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const orderId      = searchParams?.get("order_id");

  const [order,     setOrder]     = useState<Order | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [particles, setParticles] = useState<Particle[]>([]);

  /* ── Fetch ── */
  useEffect(() => {
    if (!orderId) { setError("No order ID provided"); setLoading(false); return; }

    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/order-confirmed/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => { if (!res.ok) throw new Error("Failed to load order"); return res.json(); })
      .then((data: Order) => {
        setOrder(data);
        setLoading(false);
        if (data.payment_status === "success") {
          setParticles(Array.from({ length: 55 }, (_, i) => ({
            id: i, x: Math.random() * 100, color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: Math.random() * 8 + 4, delay: Math.random() * 1.2, duration: Math.random() * 2 + 2,
          })));
        }
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [orderId]);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-stone-500 italic" style={{ fontFamily: "Georgia, serif" }}>Loading your order…</p>
      </div>
    </div>
  );

if (error || !order) {
  notFound();
}

  const items     = order.items ?? [];
  const subtotal  = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const stepIndex = getStepIndex(order.shipping_status);

  const tsMap: Record<string, string | null> = {
    confirmed:        order.confirmed_at,
    shipped:          order.shipped_at,
    out_for_delivery: order.out_for_delivery_at,
    delivered:        order.delivered_at,
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ fontFamily: "'Lora', Georgia, serif" }}>

      {/* Confetti */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {particles.map(p => (
          <span key={p.id} className="absolute top-0 block rounded-sm opacity-0"
            style={{ left: `${p.x}%`, width: p.size, height: p.size * 1.4, background: p.color,
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards` }} />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .display { font-family: 'Playfair Display', Georgia, serif; }
        .anim-check { animation: checkPop 0.6s 0.3s cubic-bezier(.34,1.56,.64,1) both; }
        .anim-s1    { animation: slideUp 0.6s 0.5s ease both; }
        .anim-s2    { animation: slideUp 0.6s 0.65s ease both; }
        .anim-s3    { animation: slideUp 0.6s 0.8s ease both; }
        .anim-s4    { animation: slideUp 0.6s 0.95s ease both; }
        .anim-s5    { animation: slideUp 0.6s 1.1s ease both; }

        .card-shadow { box-shadow: 0 2px 0 0 #d6cfc4, 0 8px 32px -4px rgba(0,0,0,0.10); }

        .shimmer-btn {
          background: linear-gradient(90deg,#1c1917 0%,#44403c 40%,#1c1917 60%,#44403c 100%);
          background-size: 200% auto;
        }
        .shimmer-btn:hover { animation: shimmer 1.5s linear infinite; }
      `}</style>

      {/* Top stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400" />

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* ── Hero ── */}
        <div className="text-center mb-10">
          <div className="anim-check inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 mb-6">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="anim-s1 display text-4xl md:text-5xl font-bold text-stone-800 mb-3 leading-tight">
            Order Confirmed!
          </h1>
          <p className="anim-s2 text-stone-500 text-lg italic mb-5">
            Thank you for your purchase — your books are on their way.
          </p>

          {/* Order ID + date pill */}
          <div className="anim-s3 inline-flex flex-wrap justify-center items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">ORD-{String(order.id).padStart(5, "0")}</span>
            <span className="text-amber-300">·</span>
            <span className="text-amber-600">{fmtDate(order.created_at)}</span>
          </div>
        </div>

        {/* ── Shipping Timeline ── */}
        <div className="anim-s4 bg-white card-shadow rounded-2xl p-6 mb-6 border border-stone-100">
          <div className="relative flex items-start justify-between">
            {/* track bg */}
            <div className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-stone-100 z-0" />
            {/* track fill */}
            <div className="absolute left-[10%] top-5 h-0.5 bg-emerald-400 z-0 transition-all duration-700"
              style={{ width: `calc(${(stepIndex / (STEPS.length - 1)) * 80}%)` }} />

            {STEPS.map((step, i) => {
              // FIX: done=green tick for completed steps (i<=stepIndex), active=amber for next pending
              const done   = i <= stepIndex;
              const active = !done && i === stepIndex + 1;
              const ts     = step.key ? tsMap[step.key] : order.created_at;

              return (
                <div key={i} className="flex flex-col items-center gap-1 z-10 flex-1 px-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs border-2 transition-all
                    ${done   ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100" :
                      active ? "bg-white border-amber-400 text-amber-600 shadow-md ring-4 ring-amber-50" :
                               "bg-white border-stone-200 text-stone-300"}`}>
                    {done ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : <span className="font-medium">{i + 1}</span>}
                  </div>
                  <span className={`text-xs text-center leading-tight mt-0.5
                    ${done ? "text-emerald-600 font-semibold" : active ? "text-amber-600 font-semibold" : "text-stone-400"}`}>
                    {step.label}
                  </span>
                  {(done || active) && ts && (
                    <span className="text-[10px] text-stone-400">{fmtDate(ts)}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Courier info */}
          {order.tracking_number ? (
            <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-500">
              <span>Courier: <span className="font-medium text-stone-700">{order.courier || "DTDC"}</span></span>
              <span>Tracking: <span className="font-mono font-medium text-stone-700">{order.tracking_number}</span></span>
            </div>
          ) : (
            <p className="text-center text-xs text-stone-400 mt-5 italic">
              Your order is being processed. Shipping info will appear here soon.
            </p>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="grid md:grid-cols-5 gap-6 mb-6">

          {/* Items — left 3 cols */}
          <div className="md:col-span-3 bg-white card-shadow rounded-2xl border border-stone-100 overflow-hidden anim-s4">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="display font-semibold text-stone-700 text-lg">Your Items</h2>
              <span className="text-xs text-stone-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="divide-y divide-stone-50">
              {items.map((item, i) => (
                <div key={i} className="flex gap-4 px-6 py-4 hover:bg-stone-50/60 transition-colors">
                  {/* Cover */}
                  <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-amber-50 border border-amber-100 shadow-sm">
                    {item.main_image
                      ? <img src={`${API_URL}${item.main_image}`} alt={item.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl text-amber-300">📖</div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="display font-semibold text-stone-800 text-sm leading-tight line-clamp-2 mb-1">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border
                        ${item.format === "ebook"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                        {item.format === "ebook" ? "E-book" : "Paperback"}
                      </span>
                      {item.quantity > 1 && <span className="text-xs text-stone-400">Qty {item.quantity}</span>}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="display font-bold text-stone-800">
                      ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-stone-400">₹{Number(item.price).toLocaleString("en-IN")} ea.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-stone-50/80 border-t border-stone-100 space-y-1.5">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Shipping</span>
                {Number(order.shipping_cost) > 0
                  ? <span>₹{Number(order.shipping_cost).toLocaleString("en-IN")}</span>
                  : <span className="text-emerald-600 font-medium">Free</span>}
              </div>
              {Number(order.coupon_discount) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    Discount
                    {order.coupon_code && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">{order.coupon_code}</span>
                    )}
                  </span>
                  <span>−₹{Number(order.coupon_discount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-stone-800 pt-2 border-t border-stone-200">
                <span className="display text-base">Total Paid</span>
                <span className="display text-base">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Right sidebar — 2 cols */}
          <div className="md:col-span-2 flex flex-col gap-4">

            {/* Address */}
            {order.address && (
              <div className="bg-white card-shadow rounded-2xl border border-stone-100 p-5 anim-s4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <h3 className="display font-semibold text-stone-700 text-sm">Delivery Address</h3>
                </div>
                <div className="text-sm text-stone-600 space-y-0.5 pl-10">
                  <p className="font-semibold text-stone-800">
                    {order.address.first_name} {order.address.last_name}
                  </p>
                  <p>{order.address.address}</p>
                  <p>{order.address.city}, {order.address.state} – {order.address.pincode}</p>
                  {order.address.phone && <p className="text-stone-400 text-xs pt-0.5">{order.address.phone}</p>}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white card-shadow rounded-2xl border border-stone-100 p-5 anim-s5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <h3 className="display font-semibold text-stone-700 text-sm">Payment</h3>
              </div>
              <div className="pl-10 space-y-1">
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  Payment successful
                </p>
                {order.razorpay_payment_id && (
                  <p className="text-[11px] text-stone-400 font-mono break-all leading-relaxed">
                    {order.razorpay_payment_id}
                  </p>
                )}
                <p className="text-xs text-stone-400">via Razorpay · INR</p>
              </div>
            </div>

            {/* Help */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 anim-s5">
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">Need help?</span>{" "}
                Email{" "}
                <a href="mailto:editor@agphbooks.com" className="underline underline-offset-2">
                  editor@agphbooks.com
                </a>
                {" "}or call <span className="font-semibold">+91-9981933372</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center anim-s5">
          <Link href="/orders"
            className="shimmer-btn text-white px-8 py-3.5 rounded-xl text-sm font-medium text-center tracking-wide hover:shadow-lg transition-shadow">
            View All Orders
          </Link>
          <Link href="/"
            className="bg-white border-2 border-stone-200 text-stone-700 px-8 py-3.5 rounded-xl text-sm font-medium text-center tracking-wide hover:border-stone-300 hover:bg-stone-50 transition-all">
            Continue Shopping
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400 mt-8 italic">
          A confirmation has been sent to{" "}
          <span className="text-stone-500">{order.address?.email || "your email"}</span>.
        </p>
      </div>
    </div>
  );
}