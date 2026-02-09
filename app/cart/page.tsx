"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type CartItem = {
  id: number;
  product_id: number;
  format: "ebook" | "paperback";
  quantity: number;
  title: string;
  slug: string;
  main_image: string;
  price: number;
  stock: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockWarningId, setStockWarningId] = useState<number | null>(null);

  /* 🔐 AUTH CHECK + FETCH CART */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
  
    fetch(`${API_URL}/api/cart/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        setCart(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCart([]);
      })
      .finally(() => setLoading(false));
  }, []);


  /* ➕➖ UPDATE QUANTITY */
const updateQty = async (id: number, qty: number) => {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  if (item.stock && qty > item.stock) {
    setStockWarningId(id);
    return;
  }

  if (qty < 1) return;

  const token = localStorage.getItem("token")!;
  await fetch(`${API_URL}/api/cart/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity: qty }),
  });

  setCart((prev) =>
    prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
  );
};


  /* ❌ REMOVE ITEM */
  const removeItem = async (id: number) => {
    const token = localStorage.getItem("token")!;
    await fetch(`${API_URL}/api/cart/remove/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setCart((prev) => prev.filter((i) => i.id !== id));
    window.dispatchEvent(new Event("cart-change"));
  };

  /* 💰 TOTAL */
  const total = Array.isArray(cart)
  ? cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  : 0;


  if (loading) return <p className="p-10">Loading cart…</p>;






 return (
  <div className="max-w-7xl mx-auto px-20 py-10">
    <h1 className="text-3xl font-serif mb-8">Shopping Cart</h1>

    {cart.length === 0 ? (
      <p className="text-gray-500">
        Your cart is empty.{" "}
        <Link href="/" className="underline">
          Continue shopping
        </Link>
      </p>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ================= LEFT: CART ITEMS ================= */}
        <div className="lg:col-span-2">

          <div className="flex justify-between items-center mb-4">
            <p className="font-medium">
              Items ({cart.length})
            </p>
          </div>

          <div className="space-y-6 pt-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-6 border-b border-gray-300 pb-6"
              >
                {/* IMAGE */}
                <Image
                  src={`${API_URL}${item.main_image}`}
                  alt={item.title}
                  width={80}
                  height={110}
                  className="object-cover rounded"
                  unoptimized
                />

                {/* INFO */}
                <div className="flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>

                  <p className="text-sm text-gray-500">
                    Format: {item.format === "ebook" ? "eBook" : "Paperback"}
                  </p>
                  {item.format === "paperback" &&
                    stockWarningId === item.id && (
                      <p className="text-xs text-red-600 mt-1">
                        Only {item.stock} copies available
                      </p>
                  )}

                  <p className="font-semibold mt-2">
                    ₹{item.price}
                  </p>
                </div>

                {/* QUANTITY */}
                {item.format === "paperback" ? (
                  <div className="flex items-center  rounded">
                    <button
                      onClick={() =>
                        updateQty(item.id, item.quantity - 1)
                      }
                      className="px-3 py-2 cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="px-4">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => {
                        // 👇 USER TRIED TO INCREASE BEYOND STOCK
                        if (item.stock > 0 && item.quantity >= item.stock) {
                          setStockWarningId(item.id);
                          return;
                        }
                    
                        // 👇 VALID INCREASE
                        updateQty(item.id, item.quantity + 1);
                        setStockWarningId(null);
                      }}
                      className={`px-3 py-2 ${
                        item.stock > 0 && item.quantity >= item.stock
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <Plus size={14} />
                    </button>



                  </div>
                ) : (
                    ''
                )}

                {/* REMOVE */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT: ORDER SUMMARY ================= */}
        <div className="lg:sticky lg:top-20 h-fit  rounded-lg p-6">

          {/* INFO BOX (EBOOK NOTICE) */}
          {cart.some((i) => i.format === "ebook") && (
            <div className="bg-blue-50 text-sm text-gray-700 p-4 rounded mb-6">
              <p className="font-medium mb-1">
                You’re buying eBooks
              </p>
              <p>
                Digital products will be available after purchase.
                Read on supported devices.
              </p>
            </div>
          )}

          {/* SUMMARY */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">
                ₹{total.toFixed(2)}
              </span>
            </div>

            <Link href="/checkout">
              <button className="w-full bg-red-600 text-white py-3 rounded">
                Checkout
              </button>
            </Link>

          </div>

        </div>
      </div>
    )}
  </div>
);

}
