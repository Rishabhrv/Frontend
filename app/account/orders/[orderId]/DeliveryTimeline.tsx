"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= TYPES ================= */

type ShippingInfo = {
  status: "confirmed" | "shipped" | "out_for_delivery" | "delivered";
  courier?: string;
  tracking_number?: string;

  confirmed_at?: string;
  shipped_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
};

/* ================= CONSTANTS ================= */

const STEPS = [
  { key: "confirmed", label: "Order Confirmed", field: "confirmed_at" },
  { key: "shipped", label: "Shipped", field: "shipped_at" },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    field: "out_for_delivery_at",
  },
  { key: "delivered", label: "Delivered", field: "delivered_at" },
];

const STATUS_ORDER = [
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

/* ================= HELPERS ================= */

const normalizeStatus = (status?: string) =>
  (status || "confirmed").toLowerCase().trim();

/* ================= COMPONENT ================= */

export default function DeliveryTimeline({ orderId }: { orderId: number }) {
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/orders/${orderId}/shipping`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(res => res.json())
      .then(data => {
        setShipping({
          ...data,
          status: normalizeStatus(data.status) as ShippingInfo["status"],
        });
      });
  }, [orderId]);

  const currentIndex = shipping
    ? STATUS_ORDER.indexOf(shipping.status)
    : 0;

  return (
    <div className="border border-gray-200 rounded-md p-5 bg-white">
      <h2 className="font-semibold mb-4">Delivery status</h2>

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const stepIndex = STATUS_ORDER.indexOf(step.key as any);
          const isDone = currentIndex >= stepIndex;
          const isLast = i === STEPS.length - 1;

          const dateValue =
            shipping?.[step.field as keyof ShippingInfo];

          const showTracking =
            step.key === "shipped" &&
            shipping?.tracking_number &&
            isDone;

          return (
            <div key={i} className="flex gap-4">
              {/* LEFT ICON + LINE */}
              <div className="flex flex-col items-center">
                <CheckCircle
                  size={18}
                  className={isDone ? "text-green-600" : "text-gray-300"}
                />

                {!isLast && (
                  <div
                    className={`w-px flex-1 mt-1 ${
                      isDone ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>

              {/* RIGHT CONTENT */}
              <div className={`pb-6 ${isDone ? "" : "opacity-70"}`}>
                <p className="font-medium">{step.label}</p>

                {dateValue ? (
                  <p className="text-sm text-gray-500">
                    {new Date(dateValue).toLocaleDateString()} •{" "}
                    {new Date(dateValue).toLocaleTimeString()}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Pending</p>
                )}

                {/* 🚚 COURIER + TRACKING INLINE */}
                {showTracking && (
                  <p className="text-sm mt-1 text-gray-600">
                    {shipping.courier || "Courier"} •{" "}
                    <span className="font-mono">
                      Tracking: {shipping.tracking_number}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
