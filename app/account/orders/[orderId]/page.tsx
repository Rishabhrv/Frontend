"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, ChevronLeft, Package } from "lucide-react";
import DeliveryTimeline from "./DeliveryTimeline";
import ReviewSection from "./ReviewSection";
import InvoiceButton from "@/components/invoice/InvoiceButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type OrderItem = {
  order_id: number;
  product_id: number;
  title: string;
  main_image: string;
  price: number;
  quantity: number;
  format: "ebook" | "paperback";
  total_amount: number;
  payment_status: "pending" | "success" | "failed";
  payment_method?: string;
  transaction_id?: string;
  paid_amount?: number;
  created_at: string;
  shipping_cost: number;
  first_name?: string;
  last_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  shipping_email?: string;
};

export default function OrderDetailsPage() {
  const params  = useParams();
  const orderId = params?.orderId as string | undefined;

  const [items,          setItems]          = useState<OrderItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [reviewItem,     setReviewItem]     = useState<{ product_id: number; title: string } | null>(null);
  const [shippingStatus, setShippingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch(`${API_URL}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/api/orders/${orderId}/shipping`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setShippingStatus(data?.status?.toLowerCase().trim() || "confirmed"));
  }, [orderId]);

  if (!orderId)    return <p className="p-6 text-sm text-gray-500">Invalid order</p>;
  if (loading)     return (
    <div className="flex items-center justify-center py-20 gap-2 text-sm text-gray-400">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading order…
    </div>
  );
  if (!items.length) return <p className="p-6 text-sm text-gray-500">Order not found</p>;

  const order          = items[0];
  const numericOrderId = Number(orderId);
  const hasPaperback   = items.some((i) => i.format === "paperback");

  const paymentIcon =
    order.payment_status === "success" ? <CheckCircle className="text-green-600" size={16} /> :
    order.payment_status === "failed"  ? <XCircle     className="text-red-600"   size={16} /> :
                                         <Clock       className="text-yellow-500" size={16} />;

  const paymentColor =
    order.payment_status === "success" ? "bg-green-50 border-green-200 text-green-700" :
    order.payment_status === "failed"  ? "bg-red-50 border-red-200 text-red-700"       :
                                         "bg-yellow-50 border-yellow-200 text-yellow-700";

  return (
    <div className="w-full space-y-4 sm:space-y-6">

      {/* ── HEADER ── */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition mb-3"
        >
          <ChevronLeft size={15} />
          Back to orders
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold">Order #{order.order_id}</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString()}{" "}
              at {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Payment status pill */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${paymentColor}`}>
            {paymentIcon}
            <span className="capitalize">{order.payment_status}</span>
          </span>
        </div>
      </div>

      {/* ── DELIVERY TIMELINE ── */}
      {hasPaperback && <DeliveryTimeline orderId={numericOrderId} />}

      {/* ── ORDER ITEMS ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-gray-200">
          <Package size={15} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">
            {items.length} item{items.length !== 1 ? "s" : ""} in this order
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <div key={i} className="px-4 sm:px-5 py-4">
              <div className="flex gap-3 sm:gap-4">
                {/* Book cover */}
                <div className="flex-shrink-0">
                  <Image
                    src={`${API_URL}${item.main_image}`}
                    width={56}
                    height={80}
                    alt=""
                    unoptimized
                    className="rounded object-cover w-12 h-16 sm:w-16 sm:h-[88px] border border-gray-100"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 capitalize mt-1">
                    {item.format} × {item.quantity}
                  </p>

                  {/* Ebook badge */}
                  {item.format === "ebook" && (
                    <span className="inline-block mt-2 text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Available in My Books
                    </span>
                  )}

                  {/* Review buttons */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shippingStatus === "delivered" && item.format === "paperback" && (
                      <button
                        onClick={() => setReviewItem({ product_id: item.product_id, title: item.title })}
                        className="text-xs text-white px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 cursor-pointer transition"
                      >
                        Write a review
                      </button>
                    )}
                    {item.format === "ebook" && (
                      <button
                        onClick={() => setReviewItem({ product_id: item.product_id, title: item.title })}
                        className="text-xs text-white px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 cursor-pointer transition"
                      >
                        Write a review
                      </button>
                    )}
                  </div>
                </div>

                {/* Price — right aligned */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">₹{item.price}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                    × {item.quantity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAYMENT + TOTAL (stacked on mobile, side by side on md+) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Payment details */}
        <div className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
            Payment Details
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-xs">Status</span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${paymentColor}`}>
                {paymentIcon}
                <span className="capitalize">{order.payment_status}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">Method</span>
              <span className="font-medium text-xs">{order.payment_method || "Razorpay"}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <span className="text-gray-500 text-xs">Amount Paid</span>
              <span className="font-bold text-base sm:text-lg text-gray-900">
                ₹{order.paid_amount || order.total_amount}
              </span>
            </div>
          </div>
        </div>

        {/* Order total */}
        <div className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
            Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">Subtotal</span>
              <span className="font-medium text-xs">
                ₹{(order.total_amount - Number(order.shipping_cost)).toFixed(2)}
              </span>
            </div>
            {Number(order.shipping_cost) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Shipping</span>
                <span className="font-medium text-xs">₹{Number(order.shipping_cost).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-semibold text-sm">Total</span>
              <span className="font-bold text-base sm:text-lg text-gray-900">₹{order.total_amount}</span>
            </div>
          </div>
          <div className="mt-4">
            <InvoiceButton orderId={order.order_id} />
          </div>
        </div>
      </div>

      {/* ── SHIPPING ADDRESS ── */}
      {order.address && (
        <div className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
            Shipping Address
          </h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-0.5">
            <p className="font-medium text-gray-900">
              {order.first_name} {order.last_name}
            </p>
            <p className="text-xs sm:text-sm">{order.address}</p>
            <p className="text-xs sm:text-sm">
              {order.city}, {order.state} – {order.pincode}
            </p>
            {order.phone && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">📞 {order.phone}</p>
            )}
            {order.shipping_email && (
              <p className="text-xs sm:text-sm text-gray-500">✉ {order.shipping_email}</p>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW POPUP ── */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setReviewItem(null)} />

          {/* Sheet — slides from bottom on mobile, centered modal on sm+ */}
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base sm:text-lg font-semibold leading-tight line-clamp-1 pr-4">
                {reviewItem.title}
              </h2>
              <button
                onClick={() => setReviewItem(null)}
                className="text-gray-400 hover:text-black text-xl cursor-pointer transition p-1 -mr-1"
              >
                ✕
              </button>
            </div>
            <ReviewSection productId={reviewItem.product_id} productTitle={reviewItem.title} />
          </div>
        </div>
      )}
    </div>
  );
}