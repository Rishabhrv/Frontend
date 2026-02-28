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

/* ─── STATUS CONFIG ─────────────────────────────────────── */
const STATUS_STEPS: {
  key: ShippingStatus["status"];
  label: string;
  Icon: React.ElementType;
}[] = [
  { key: "confirmed",        label: "Confirmed",        Icon: PackageCheck },
  { key: "shipped",          label: "Shipped",           Icon: Truck        },
  { key: "out_for_delivery", label: "Out for Delivery",  Icon: MapPin       },
  { key: "delivered",        label: "Delivered",         Icon: CheckCircle2 },
];

const STATUS_ORDER: ShippingStatus["status"][] = [
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const STATUS_COLORS: Record<ShippingStatus["status"], string> = {
  confirmed:        "bg-blue-100 text-blue-700 border-blue-200",
  shipped:          "bg-amber-100 text-amber-700 border-amber-200",
  out_for_delivery: "bg-orange-100 text-orange-700 border-orange-200",
  delivered:        "bg-green-100 text-green-700 border-green-200",
};

const STATUS_BADGE_LABEL: Record<ShippingStatus["status"], string> = {
  confirmed:        "Order Confirmed",
  shipped:          "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
};

/* ─── COMPONENT ─────────────────────────────────────────── */
export default function OrdersPage() {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [orderItems,  setOrderItems]  = useState<Record<number, OrderItem[]>>({});
  const [shipping,    setShipping]    = useState<Record<number, ShippingStatus>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch(`${API_URL}/api/orders/by-date`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(async (data: Order[]) => {
        setOrders(data);

        const itemsMap:    Record<number, OrderItem[]>    = {};
        const shippingMap: Record<number, ShippingStatus> = {};

        await Promise.all(
          data.map(async order => {
            /* items */
            const iRes = await fetch(`${API_URL}/api/orders/${order.order_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            itemsMap[order.order_id] = await iRes.json();

            /* shipping status */
            const sRes = await fetch(
              `${API_URL}/api/orders/${order.order_id}/shipping`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            shippingMap[order.order_id] = await sRes.json();
          })
        );

        setOrderItems(itemsMap);
        setShipping(shippingMap);
      });
  }, []);

  const grouped = groupByDate(orders);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-8">My Orders</h1>

      {Object.keys(grouped).length === 0 && (
        <p className="text-gray-500">No paid orders yet.</p>
      )}

      <div className="space-y-12">
        {Object.entries(grouped).map(([date, ordersForDate]) => {
          const totalAmount = ordersForDate.reduce((s, o) => s + Number(o.total_amount), 0);
          const totalItems  = ordersForDate.reduce((s, o) => s + Number(o.items_count),  0);

          return (
            <div key={date}>
              {/* Date heading */}
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-700">
                <CalendarFold size={18} />
                {new Date(date).toDateString()}
              </h2>

              <div className="space-y-6">
                {ordersForDate.map(order => {
                  const ship = shipping[order.order_id];

                  return (
                    <Link
                      key={order.order_id}
                      href={`/account/orders/${order.order_id}`}
                      className="block rounded-xl border border-gray-200 bg-white hover:shadow-md transition overflow-hidden"
                    >
                      {/* ── ORDER HEADER ── */}
                      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            Order #{order.order_id}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {order.items_count} item{order.items_count !== 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Status badge */}
                          {ship && (
                            <span
                              className={`text-xs font-medium px-3 py-1 rounded-full border ${
                                STATUS_COLORS[ship.status]
                              }`}
                            >
                              {STATUS_BADGE_LABEL[ship.status]}
                            </span>
                          )}

                          {/* Price */}
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">
                              ₹{Number(order.total_amount).toFixed(2)}
                            </p>
                            {Number(order.shipping_cost) > 0 && (
                              <p className="text-xs text-gray-400">
                                incl. ₹{Number(order.shipping_cost).toFixed(2)} shipping
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── ITEMS ── */}
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
                        {!orderItems[order.order_id] ? (
                          <p className="text-sm text-gray-400">Loading items…</p>
                        ) : (
                          orderItems[order.order_id].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <Image
                                src={`${API_URL}${item.main_image}`}
                                width={56}
                                height={76}
                                alt=""
                                unoptimized
                                className="rounded object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                  {item.title}
                                </p>
                                <p className="text-sm text-gray-500 capitalize">
                                  {item.format} × {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-800 flex-shrink-0">
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
              <p className="text-sm text-gray-500 mt-3">
                Day total:{" "}
                <strong className="text-gray-700">₹{totalAmount.toFixed(2)}</strong>{" "}
                · Items:{" "}
                <strong className="text-gray-700">{totalItems}</strong>
              </p>
            </div>
          );
        })}
      </div>
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

