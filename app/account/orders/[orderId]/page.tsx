"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import DeliveryTimeline from "./DeliveryTimeline";
import ReviewSection from "./ReviewSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= TYPES ================= */

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
};

/* ================= COMPONENT ================= */

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.orderId as string | undefined;

  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState<{
  product_id: number;
  title: string;
} | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setItems(data))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!orderId) {
    return <p className="p-10">Invalid order</p>;
  }

  if (loading) {
    return <p className="p-10">Loading order…</p>;
  }

  if (!items.length) {
    return <p className="p-10">Order not found</p>;
  }

  const order = items[0];

  const paymentIcon =
    order.payment_status === "success" ? (
      <CheckCircle className="text-green-600" size={18} />
    ) : order.payment_status === "failed" ? (
      <XCircle className="text-red-600" size={18} />
    ) : (
      <Clock className="text-yellow-500" size={18} />
    );

    const numericOrderId = Number(orderId);
    const hasPaperback = items.some(
  (item) => item.format === "paperback"
);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      {/* ================= HEADER ================= */}
      <div>
        <Link
          href="/account/orders"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to orders
        </Link>

        <h1 className="text-2xl font-semibold mt-2">
          Order #{order.order_id}
        </h1>

        <p className="text-sm text-gray-500">
          Placed on{" "}
          {new Date(order.created_at).toLocaleDateString()}{" "}
          {new Date(order.created_at).toLocaleTimeString()}
        </p>
      </div>

      {/* ================= PAYMENT SUMMARY ================= */}
      <div className="border border-gray-200 rounded-md p-6 bg-gray-50">
        <h2 className="font-semibold mb-4">Payment details</h2>

        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div className="text-gray-500">Payment status</div>
          <div className="flex items-center gap-2 font-medium capitalize">
            {paymentIcon}
            {order.payment_status}
          </div>

          <div className="text-gray-500">Payment method</div>
          <div className="font-medium">
            {order.payment_method || "Razorpay"}
          </div>


          <div className="text-gray-500">Amount paid</div>
          <div className="font-semibold text-lg">
            ₹{order.paid_amount || order.total_amount}
          </div>
        </div>
      </div>

      {/* ================= DELIVERY STATUS ================= */}
      {hasPaperback && (
        <DeliveryTimeline orderId={numericOrderId} />
      )}      



      {/* ================= ORDER ITEMS ================= */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-100 px-6 py-3 font-medium">
          Items in this order
        </div>

        <div className="divide-y divide-gray-200 px-3">
          {items.map((item, i) => (
            <div
              key={i}
              
            >
              <div className="flex items-center gap-5 px-6 py-4">

             
              <Image
                src={`${API_URL}${item.main_image}`}
                width={70}
                height={100}
                alt=""
                unoptimized
                className="rounded border"
              />

              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-500">
                  {item.format.toUpperCase()} × {item.quantity}
                </p>
                <button
                  onClick={() =>
                    setReviewItem({
                      product_id: item.product_id,
                      title: item.title,
                    })
                  }
                  className="text-xs m-2 ml-0 text-white px-4 py-1.5 rounded-sm bg-black hover:bg-gray-800 cursor-pointer"
                >
                  Write a review
                </button>

                {item.format === "ebook" && (
                  <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    E-Book will be available in your my books.
                  </span>
                )}
              </div>

              <div className="text-right">
                <p className="font-semibold">₹{item.price}</p>
                <p className="text-xs text-gray-500">
                  ₹{item.price} × {item.quantity}
                </p>
                
              </div>
               </div>
            </div>
            
          ))}
        </div>
      </div>

      {/* ================= ORDER TOTAL ================= */}
      <div className="flex justify-end">
        <div className="w-80 border border-gray-200 rounded-md p-5 bg-white">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Order total</span>
            <span className="font-semibold">
              ₹{order.total_amount}
            </span>
          </div>

          <button
            className="mt-4 w-full border border-gray-300 rounded py-2 text-sm hover:bg-gray-50"
            onClick={() => window.print()}
          >
            Download invoice
          </button>
        </div>
      </div>

      {/* ================= REVIEW POPUP ================= */}
{reviewItem && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setReviewItem(null)}
    />

    {/* POPUP */}
    <div className="relative bg-white w-full max-w-lg rounded-lg shadow-lg p-6 z-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Review: {reviewItem.title}
        </h2>
        <button
          onClick={() => setReviewItem(null)}
          className="text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>

      {/* REVIEW FORM */}
      <ReviewSection
        productId={reviewItem.product_id}
        productTitle={reviewItem.title}
      />
    </div>
  </div>
)}

    </div>
  );
}
