"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AlertPopup from "@/components/Popups/AlertPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ─── Unified status config ─── */
const UNIFIED_STATUSES = [
  { value: "pending",          label: "Pending",            color: "bg-yellow-100 text-yellow-700",  emailSent: false },
  { value: "paid",             label: "Paid",               color: "bg-green-100 text-green-700",    emailSent: false },
  { value: "confirmed",        label: "Order Confirmed",    color: "bg-blue-100 text-blue-700",      emailSent: true  },
  { value: "shipped",          label: "Shipped",            color: "bg-purple-100 text-purple-700",  emailSent: true  },
  { value: "out_for_delivery", label: "Out for Delivery",   color: "bg-orange-100 text-orange-700",  emailSent: true  },
  { value: "delivered",        label: "Delivered",          color: "bg-emerald-100 text-emerald-700",emailSent: true  },
  { value: "cancelled",        label: "Cancelled",          color: "bg-red-100 text-red-600",        emailSent: true },
];

/* Derive unified status from order + shipping data */
function deriveUnifiedStatus(orderStatus: string, shippingStatus?: string): string {
  if (shippingStatus === "delivered")        return "delivered";
  if (shippingStatus === "out_for_delivery") return "out_for_delivery";
  if (shippingStatus === "shipped")          return "shipped";
  if (shippingStatus === "confirmed")        return "confirmed";
  return orderStatus || "pending";
}

/* Whether this status needs courier + tracking */
const NEEDS_SHIPPING_FIELDS = new Set(["shipped", "out_for_delivery", "delivered"]);

/* ─── Badge ─── */
function Badge({ value }: { value: string }) {
  const cfg = UNIFIED_STATUSES.find(s => s.value === value);
  const cls = cfg?.color ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Shipping step tracker ─── */
const STEPS = [
  { key: "confirmed",        label: "Order Confirmed" },
  { key: "shipped",          label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered",        label: "Delivered" },
];

function ShippingTracker({ current }: { current: string }) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center w-full mt-2">
      {STEPS.map((step, idx) => {
        const done   = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-300"}
                ${active ? "ring-2 ring-blue-200" : ""}`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px]
                ${done ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${idx < currentIdx ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function OrderDetailPage() {
  const { query, back } = useRouter();

  const [data, setData]               = useState<any>(null);
  const [unifiedStatus, setUnifiedStatus] = useState("pending");
  const [courier, setCourier]         = useState("");
  const [tracking, setTracking]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [toastOpen, setToastOpen]     = useState(false);
  const [toastMsg, setToastMsg]       = useState("");
        useEffect(() => {
          document.title = "Manage Orders | Admin Panel";
        }, []);

  useEffect(() => {
    if (!query.id) return;
    fetch(`${API_URL}/api/admin/orders/${query.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setUnifiedStatus(deriveUnifiedStatus(d.order.status, d.shipping?.status));
        setCourier(d.shipping?.courier || "");
        setTracking(d.shipping?.tracking_number || "");
      });
  }, [query.id]);

  const selectedMeta = UNIFIED_STATUSES.find(s => s.value === unifiedStatus)!;
  const needsShipping = NEEDS_SHIPPING_FIELDS.has(unifiedStatus);

  const handleUpdate = async () => {
    setSaving(true);
    const res = await fetch(`${API_URL}/api/admin/orders/${data.order.id}/unified-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify({
        unifiedStatus,
        courier:         needsShipping ? courier : "",
        tracking_number: needsShipping ? tracking : "",
      }),
    });
    setSaving(false);
    const json = await res.json();
    setToastMsg(res.ok
      ? (selectedMeta.emailSent ? "Status updated & email sent to customer." : "Status updated.")
      : (json.msg || "Update failed."));
    setToastOpen(true);

    // refresh local data so tracker updates
    if (res.ok) {
      setData((prev: any) => ({
        ...prev,
        order: {
          ...prev.order,
          status: unifiedStatus,
        },
        shipping: needsShipping ? {
          ...prev.shipping,
          status:          unifiedStatus === "out_for_delivery" ? "out_for_delivery" : unifiedStatus,
          courier:         needsShipping ? courier : prev.shipping?.courier,
          tracking_number: needsShipping ? tracking : prev.shipping?.tracking_number,
        } : prev.shipping,
      }));
    }
  };

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading order…
      </div>
    );
  }

  const { order, customer, billing, shipping, items } = data;
  const ebookItems     = items.filter((i: any) => i.format === "ebook");
  const paperbackItems = items.filter((i: any) => i.format === "paperback");

  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="p-6 max-w-7xl mx-auto w-full">

          {/* Page header */}
          <div className="mb-5">
            <button onClick={back} className="cursor-pointer text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition mb-3">
              ← Back to Orders
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">Order #{order.id}</h1>
              <Badge value={unifiedStatus} />

              <span className="text-xs text-gray-400 ml-auto">
                Placed {formatDateTime(order.created_at)}
              </span>
            </div>
            {order.razorpay_payment_id && (
              <p className="text-xs text-gray-400 mt-1">
                Payment ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{order.razorpay_payment_id}</code>
              </p>
            )}
          </div>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── LEFT (2/3) ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Customer + Billing */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-3">Customer</h2>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {customer.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{customer.phone}</p>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-3">Shipping Address</h2>
                  {billing?.address ? (
                    <address className="not-italic text-sm text-gray-600 leading-relaxed">
                      {billing.address}<br />
                      {billing.city}, {billing.state} – {billing.pincode}<br />
                      <span className="text-gray-400">{billing.country}</span>
                    </address>
                  ) : (
                    <p className="text-sm text-gray-400">No address on file.</p>
                  )}
                </div>
              </div>

              {/* Ebook items */}
              {ebookItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">E-Books</span>
                    <span className="bg-purple-100 text-purple-600 text-xs font-medium px-2 py-0.5 rounded-full">{ebookItems.length}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ebookItems.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img src={`${API_URL}${item.main_image}`} alt={item.title}
                                className="w-10 h-14 object-cover rounded border border-gray-200 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-800 leading-snug">{item.title}</p>
                                <span className="inline-block mt-1 bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">ebook</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paperback items */}
              {paperbackItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Paperbacks</span>
                    <span className="bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">{paperbackItems.length}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paperbackItems.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img src={`${API_URL}${item.main_image}`} alt={item.title}
                                className="w-10 h-14 object-cover rounded border border-gray-200 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-800 leading-snug">{item.title}</p>
                                <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">paperback</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order total */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Payment Status: </span>
                  <Badge value={order.payment_status} />
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                  <span>Subtotal</span>
                  <span>₹{items.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                </div>
                {order.coupon_code && (
                  <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                    <span>Coupon <code className="bg-green-50 px-1.5 rounded text-xs">{order.coupon_code}</code></span>
                    <span>−₹{order.coupon_discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <span>Shipping</span>
                  <span>{shipping?.shipping_cost ? `₹${shipping.shipping_cost}` : "Free"}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
                  <span>Order Total</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR (1/3) ── */}
            <div className="space-y-5">

              {/* Shipping tracker — only when shipping has started */}
              {shipping?.status && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Shipment Progress</h3>
                  <ShippingTracker current={shipping.status} />

                  {shipping.courier && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Courier</span>
                        <span className="text-gray-700 font-medium">{shipping.courier}</span>
                      </div>
                      {shipping.tracking_number && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Tracking</span>
                          <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{shipping.tracking_number}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── UNIFIED STATUS PANEL ── */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Update Order Status</h3>

                {/* Single status selector */}
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={unifiedStatus} onChange={e => setUnifiedStatus(e.target.value)}>
                    {UNIFIED_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Courier + Tracking — only shown when relevant */}
                {needsShipping && (
                  <>
                    <div>
                      <label className={labelCls}>Courier</label>
                      <select className={inputCls} value={courier} onChange={e => setCourier(e.target.value)}>
                        <option value="">Select courier</option>
                        <option value="DTDC">DTDC</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="Bluedart">Bluedart</option>
                        <option value="India Post">India Post</option>
                        <option value="Ekart">Ekart</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Tracking ID</label>
                      <input
                        className={inputCls}
                        value={tracking}
                        onChange={e => setTracking(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                  </>
                )}

                {/* Email notice */}
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  {selectedMeta.emailSent ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      Customer will be notified by email.
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      No email sent for this status.
                    </>
                  )}
                </p>

                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Updating…
                    </>
                  ) : selectedMeta.emailSent ? "Update & Notify Customer" : "Update Status"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
  );
}