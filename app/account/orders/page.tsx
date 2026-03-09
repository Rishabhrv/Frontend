"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarFold,
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";

type Order = {
  order_id: number;
  total_amount: number;
  order_date: string;
  items_count: number;
  shipping_cost: number;
};

type OrderItem = {
  product_id: number;
  title: string;
  main_image: string;
  price: number;
  quantity: number;
  format: "ebook" | "paperback";
};

type ShippingStatus = {
  status: "confirmed" | "shipped" | "out_for_delivery" | "delivered";
  courier?: string;
  tracking_number?: string;
  confirmed_at?: string;
  shipped_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const STATUS_COLORS: Record<ShippingStatus["status"], string> = {
  confirmed:        "bg-blue-100 text-blue-700 border-blue-200",
  shipped:          "bg-amber-100 text-amber-700 border-amber-200",
  out_for_delivery: "bg-orange-100 text-orange-700 border-orange-200",
  delivered:        "bg-green-100 text-green-700 border-green-200",
};

const STATUS_DOT: Record<ShippingStatus["status"], string> = {
  confirmed:        "bg-blue-500",
  shipped:          "bg-amber-500",
  out_for_delivery: "bg-orange-500",
  delivered:        "bg-green-500",
};

const STATUS_BADGE_LABEL: Record<ShippingStatus["status"], string> = {
  confirmed:        "Confirmed",
  shipped:          "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
};

/* ─── Skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="px-4 py-4 flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 flex gap-3">
        <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ─── COMPONENT ─────────────────────────────────────────── */
export default function OrdersPage() {
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<number, OrderItem[]>>({});
  const [shipping,   setShipping]   = useState<Record<number, ShippingStatus>>({});
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch(`${API_URL}/api/orders/by-date`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(async (data: Order[]) => {
        setOrders(data);

        const itemsMap:    Record<number, OrderItem[]>    = {};
        const shippingMap: Record<number, ShippingStatus> = {};

        await Promise.all(
          data.map(async (order) => {
            const [iRes, sRes] = await Promise.all([
              fetch(`${API_URL}/api/orders/${order.order_id}`,          { headers: { Authorization: `Bearer ${token}` } }),
              fetch(`${API_URL}/api/orders/${order.order_id}/shipping`,  { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            itemsMap[order.order_id]    = await iRes.json();
            shippingMap[order.order_id] = await sRes.json();
          })
        );

        setOrderItems(itemsMap);
        setShipping(shippingMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = groupByDate(orders);

  /* ── Empty state ── */
  if (!loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ShoppingBag size={28} className="text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-700 mb-1">No orders yet</h2>
        <p className="text-sm text-gray-400 mb-6">Your paid orders will show up here.</p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition"
        >
          Browse Books
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-xl sm:text-2xl font-semibold mb-5 sm:mb-8">My Orders</h1>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && (
        <div className="space-y-8 sm:space-y-12">
          {Object.entries(grouped).map(([date, ordersForDate]) => {
            const totalAmount = ordersForDate.reduce((s, o) => s + Number(o.total_amount), 0);
            const totalItems  = ordersForDate.reduce((s, o) => s + Number(o.items_count),  0);

            return (
              <div key={date}>
                {/* Date heading */}
                <h2 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-600">
                  <CalendarFold size={16} className="shrink-0" />
                  {new Date(date).toDateString()}
                </h2>

                <div className="space-y-3 sm:space-y-5">
                  {ordersForDate.map((order) => {
                    const ship  = shipping[order.order_id];
                    const items = orderItems[order.order_id];

                    return (
                      <Link
                        key={order.order_id}
                        href={`/account/orders/${order.order_id}`}
                        className="block rounded-xl border border-gray-200 bg-white hover:shadow-md active:shadow-sm transition overflow-hidden"
                      >
                        {/* ── ORDER HEADER ── */}
                        <div className="px-4 sm:px-5 py-3 sm:py-4">
                          <div className="flex items-start justify-between gap-2">
                            {/* Left: order id + item count */}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                Order #{order.order_id}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {order.items_count} item{order.items_count !== 1 ? "s" : ""}
                              </p>
                            </div>

                            {/* Right: price + status badge */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                ₹{Number(order.total_amount).toFixed(2)}
                              </p>
                              {Number(order.shipping_cost) > 0 && (
                                <p className="text-[10px] text-gray-400 leading-none">
                                  + ₹{Number(order.shipping_cost).toFixed(0)} shipping
                                </p>
                              )}
                              {/* Status badge */}
                              {ship && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[ship.status]}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[ship.status]}`} />
                                  {STATUS_BADGE_LABEL[ship.status]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── ITEMS ── */}
                        <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-5 py-3 sm:py-4 space-y-3">
                          {!items ? (
                            /* per-item skeleton while loading */
                            <div className="flex items-center gap-3 animate-pulse">
                              <div className="w-10 h-14 bg-gray-200 rounded flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                                <div className="h-2 w-1/2 bg-gray-100 rounded" />
                              </div>
                            </div>
                          ) : (
                            items.map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <Image
                                  src={`${API_URL}${item.main_image}`}
                                  width={44}
                                  height={60}
                                  alt=""
                                  unoptimized
                                  className="rounded object-cover flex-shrink-0 w-10 h-14 sm:w-14 sm:h-[76px]"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-xs sm:text-sm truncate leading-tight">
                                    {item.title}
                                  </p>
                                  <p className="text-[11px] sm:text-xs text-gray-400 capitalize mt-0.5">
                                    {item.format} × {item.quantity}
                                  </p>
                                </div>
                                <p className="font-semibold text-gray-800 text-xs sm:text-sm flex-shrink-0">
                                  ₹{item.price}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Day summary */}
                <div className="mt-3 flex items-center gap-3 text-xs sm:text-sm text-gray-400">
                  <span>
                    Day total: <strong className="text-gray-600">₹{totalAmount.toFixed(2)}</strong>
                  </span>
                  <span className="text-gray-200">|</span>
                  <span>
                    Items: <strong className="text-gray-600">{totalItems}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── HELPERS ────────────────────────────────────────────── */
function groupByDate(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.order_date]) acc[order.order_date] = [];
    acc[order.order_date].push(order);
    return acc;
  }, {});
}