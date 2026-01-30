"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.orderId as string | undefined;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return; // ✅ guard for null

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

  return (
    <div className="max-w-6xl mx-auto px-10 py-10">
      <h1 className="text-2xl font-semibold mb-6">
        Order #{items[0].order_id}
      </h1>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b pb-4"
          >
            <Image
              src={`${API_URL}${item.main_image}`}
              width={70}
              height={100}
              alt=""
              unoptimized
            />

            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-500">
                Quantity: {item.quantity}
              </p>
            </div>

            <p className="font-semibold">₹{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
