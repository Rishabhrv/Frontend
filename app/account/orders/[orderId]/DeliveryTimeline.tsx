"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type ShippingInfo = {
  status: "confirmed" | "shipped" | "out_for_delivery" | "delivered";
  courier?: string;
  tracking_number?: string;
  confirmed_at?: string;
  shipped_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
};

const STEPS = [
  { key: "confirmed",        label: "Order Confirmed",   field: "confirmed_at"        },
  { key: "shipped",          label: "Shipped",            field: "shipped_at"          },
  { key: "out_for_delivery", label: "Out for Delivery",   field: "out_for_delivery_at" },
  { key: "delivered",        label: "Delivered",          field: "delivered_at"        },
] as const;

const STATUS_ORDER = ["confirmed", "shipped", "out_for_delivery", "delivered"] as const;

const normalizeStatus = (status?: string) =>
  (status || "confirmed").toLowerCase().trim();

export default function DeliveryTimeline({ orderId }: { orderId: number }) {
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/orders/${orderId}/shipping`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) =>
        setShipping({ ...data, status: normalizeStatus(data.status) as ShippingInfo["status"] })
      );
  }, [orderId]);

  const currentIndex = shipping ? STATUS_ORDER.indexOf(shipping.status) : 0;

  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white">
      <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
        Delivery Status
      </h2>

      {/* ── Horizontal progress bar (mobile) ── */}
      <div className="sm:hidden mb-5">
        <div className="relative flex items-center justify-between">
          {/* Track line behind */}
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 -z-0" />
          <div
            className="absolute left-0 top-4 h-0.5 bg-green-500 transition-all duration-500 -z-0"
            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step, i) => {
            const isDone = currentIndex >= i;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                }`}>
                  {isDone
                    ? <CheckCircle size={16} className="text-white" />
                    : <Circle size={14} className="text-gray-300" />
                  }
                </div>
                <span className={`text-[10px] text-center leading-tight max-w-[56px] font-medium ${
                  isDone ? "text-green-700" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current step date + courier info */}
        {shipping && (
          <div className="mt-4 bg-gray-50 rounded-lg px-3 py-2.5 text-xs">
            <p className="font-semibold text-gray-700 capitalize mb-0.5">
              {STATUS_ORDER[currentIndex].replace(/_/g, " ")}
            </p>
            {(() => {
              const step     = STEPS[currentIndex];
              const dateVal  = shipping[step.field as keyof ShippingInfo];
              return dateVal ? (
                <p className="text-gray-500">
                  {new Date(dateVal).toLocaleDateString()} · {new Date(dateVal).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : (
                <p className="text-gray-400">Pending</p>
              );
            })()}
            {shipping.tracking_number && currentIndex >= 1 && (
              <p className="text-gray-500 mt-1">
                {shipping.courier || "Courier"} · <span className="font-mono text-[10px]">{shipping.tracking_number}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Vertical timeline (sm+) ── */}
      <div className="hidden sm:block space-y-0">
        {STEPS.map((step, i) => {
          const isDone   = currentIndex >= i;
          const isLast   = i === STEPS.length - 1;
          const dateVal  = shipping?.[step.field as keyof ShippingInfo];
          const showTracking = step.key === "shipped" && shipping?.tracking_number && isDone;

          return (
            <div key={i} className="flex gap-4">
              {/* Icon + line */}
              <div className="flex flex-col items-center">
                <CheckCircle
                  size={18}
                  className={isDone ? "text-green-600" : "text-gray-300"}
                />
                {!isLast && (
                  <div className={`w-px flex-1 mt-1 min-h-[28px] ${isDone ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-5 ${isDone ? "" : "opacity-60"}`}>
                <p className="text-sm font-medium text-gray-900">{step.label}</p>
                {dateVal ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(dateVal).toLocaleDateString()} · {new Date(dateVal).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                )}
                {showTracking && (
                  <p className="text-xs text-gray-500 mt-1">
                    {shipping.courier || "Courier"} ·{" "}
                    <span className="font-mono">Tracking: {shipping.tracking_number}</span>
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