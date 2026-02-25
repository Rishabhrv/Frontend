"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarFold } from "lucide-react";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<number, OrderItem[]>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // 🔹 Fetch grouped orders
    fetch(`${API_URL}/api/orders/by-date`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(async (data: Order[]) => {
        setOrders(data);

        // 🔹 Fetch items for EACH order
        const itemsMap: Record<number, OrderItem[]> = {};

        await Promise.all(
          data.map(async order => {
            const res = await fetch(
              `${API_URL}/api/orders/${order.order_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            itemsMap[order.order_id] = await res.json();
          })
        );

        setOrderItems(itemsMap);
      });
  }, []);

  const grouped = groupByDate(orders);

  return (
    <div className="max-w-6xl mx-auto px-10 py-10">
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      {Object.keys(grouped).length === 0 && (
        <p>No paid orders yet.</p>
      )}

      <div className="space-y-10">
        {Object.entries(grouped).map(([date, ordersForDate]) => {
          const totalAmount = ordersForDate.reduce(
            (sum, o) => sum + Number(o.total_amount),
            0
          );

          const totalItems = ordersForDate.reduce(
            (sum, o) => sum + Number(o.items_count),
            0
          );

          return (
            <div key={date}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarFold /> {new Date(date).toDateString()}
              </h2>

              <div className="space-y-6">
                {ordersForDate.map(order => (
                  <Link
                    key={order.order_id}
                    href={`/account/orders/${order.order_id}`}
                    className="block rounded bg-white hover:shadow-md transition"
                  >
{/* ORDER HEADER */}
                    <div className="p-4 flex justify-between">
                      <div>
                        <p className="font-medium">
                          Order #{order.order_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items_count} items
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">₹{order.total_amount}</p>
                        {Number(order.shipping_cost) > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            incl. ₹{Number(order.shipping_cost).toFixed(2)} shipping
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ORDER ITEMS (ALWAYS VISIBLE) */}
                    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                      {!orderItems[order.order_id] ? (
                        <p className="text-sm text-gray-500">
                          Loading items…
                        </p>
                      ) : (
                        orderItems[order.order_id].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4"
                          >
                            <Image
                              src={`${API_URL}${item.main_image}`}
                              width={60}
                              height={80}
                              alt=""
                              unoptimized
                            />

                            <div className="flex-1">
                              <p className="font-medium">
                                {item.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.format} × {item.quantity}
                              </p>
                            </div>

                            <p className="font-semibold">
                              ₹{item.price}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-sm text-gray-600 mt-3">
                Day total: <strong>₹{totalAmount}</strong> | Items:{" "}
                <strong>{totalItems}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */
function groupByDate(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.order_date]) {
      acc[order.order_date] = [];
    }
    acc[order.order_date].push(order);
    return acc;
  }, {});
}
