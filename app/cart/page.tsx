"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, AlertCircle, ShoppingCart } from "lucide-react";

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
  category_imprints?: string;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockWarningId, setStockWarningId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch(`${API_URL}/api/cart/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
        return res.json();
      })
      .then((data: CartItem[]) => {
        const filtered = Array.isArray(data)
          ? data.filter((item) => item.category_imprints?.split(",").includes("agph"))
          : [];
        setCart(filtered);
      })
      .catch(() => setCart([]))
      .finally(() => setLoading(false));
  }, []);

  const updateQty = async (id: number, qty: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    if (item.stock && qty > item.stock) { setStockWarningId(id); return; }
    if (qty < 1) return;
    const token = localStorage.getItem("token")!;
    await fetch(`${API_URL}/api/cart/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity: qty }),
    });
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const removeItem = async (id: number) => {
    const token = localStorage.getItem("token")!;
    await fetch(`${API_URL}/api/cart/remove/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCart((prev) => prev.filter((i) => i.id !== id));
    window.dispatchEvent(new Event("cart-change"));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const outOfStockItems   = cart.filter((i) => i.format === "paperback" && i.stock === 0);
  const exceededStockItems = cart.filter((i) => i.format === "paperback" && i.stock > 0 && i.quantity > i.stock);
  const canCheckout = outOfStockItems.length === 0 && exceededStockItems.length === 0;

  if (loading) return <p className="p-10 text-sm text-gray-500">Loading cart…</p>;

  return (
    <div className="max-w-7xl min-h-[100dvh] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-serif mb-6 sm:mb-8">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500 text-sm mb-4">Your cart is empty.</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">

          {/* ================= LEFT: CART ITEMS ================= */}
          <div className="lg:col-span-2">
            <p className="font-medium text-sm mb-4 text-gray-600">Items ({cart.length})</p>

            <div className="space-y-4 sm:space-y-6">
              {cart.map((item) => {
                const isOutOfStock  = item.format === "paperback" && item.stock === 0;
                const isOverStock   = item.format === "paperback" && item.stock > 0 && item.quantity > item.stock;
                const hasStockIssue = isOutOfStock || isOverStock;

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 sm:gap-5 pb-4 sm:pb-6 border-b ${
                      hasStockIssue ? "border-red-200" : "border-gray-200"
                    }`}
                  >
                    {/* IMAGE */}
                    <div className="relative shrink-0">
                      <Image
                        src={`${API_URL}${item.main_image}`}
                        alt={item.title}
                        width={70}
                        height={100}
                        className={`object-cover rounded h-[90px] w-[62px] sm:h-[110px] sm:w-[80px] ${isOutOfStock ? "opacity-50" : ""}`}
                        unoptimized
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded rotate-[-15deg] whitespace-nowrap">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* INFO + CONTROLS */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">

                      {/* Title + delete */}
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/product/${item.slug}`} className="font-medium text-sm sm:text-base hover:underline line-clamp-2 leading-snug">
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 text-gray-400 hover:text-red-600 cursor-pointer transition p-0.5"
                          aria-label="Remove"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        {item.format === "ebook" ? "eBook" : "Paperback"}
                      </p>

                      {/* Stock warnings */}
                      {isOutOfStock && (
                        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle size={11} /> Out of stock
                        </p>
                      )}
                      {isOverStock && (
                        <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle size={11} /> Only {item.stock} {item.stock === 1 ? "copy" : "copies"} available
                        </p>
                      )}
                      {!isOutOfStock && !isOverStock && stockWarningId === item.id && (
                        <p className="text-xs text-red-600">Only {item.stock} copies available</p>
                      )}

                      {/* Price + qty row */}
                      <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                        <span className="font-semibold text-sm sm:text-base">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-400 font-normal ml-1">(₹{item.price} each)</span>
                          )}
                        </span>

                        {/* Qty stepper — paperback only */}
                        {item.format === "paperback" && (
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="px-2.5 py-1.5 hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-3 py-1.5 text-sm min-w-[32px] text-center border-x border-gray-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                if (item.stock > 0 && item.quantity >= item.stock) { setStockWarningId(item.id); return; }
                                updateQty(item.id, item.quantity + 1);
                                setStockWarningId(null);
                              }}
                              disabled={isOutOfStock || item.quantity >= item.stock}
                              className="px-2.5 py-1.5 hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= RIGHT: ORDER SUMMARY ================= */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white">
              <h2 className="text-base font-semibold mb-4 pb-2 border-b border-gray-100">Order Summary</h2>

              {/* eBook notice */}
              {cart.some((i) => i.format === "ebook") && (
                <div className="bg-blue-50 text-xs sm:text-sm text-gray-700 p-3 rounded-lg mb-4">
                  <p className="font-medium mb-0.5">You're buying eBooks</p>
                  <p className="text-gray-500">Available instantly after purchase.</p>
                </div>
              )}

              {/* Stock problem banner */}
              {!canCheckout && (
                <div className="bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 p-3 rounded-lg mb-4 flex gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-0.5">Some items need attention</p>
                    <p className="text-xs text-red-500">
                      {outOfStockItems.length > 0 && `${outOfStockItems.length} item${outOfStockItems.length > 1 ? "s are" : " is"} out of stock. `}
                      {exceededStockItems.length > 0 && `${exceededStockItems.length} item${exceededStockItems.length > 1 ? "s exceed" : " exceeds"} available stock.`}
                      {" "}Remove or adjust to proceed.
                    </p>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
                  <span className="font-medium">₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {canCheckout ? (
                <Link href="/checkout" className="block">
                  <button className="w-full bg-red-600 text-white py-3 rounded-lg cursor-pointer hover:bg-red-700 transition font-medium text-sm">
                    Proceed to Checkout
                  </button>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 py-3 rounded-lg cursor-not-allowed text-sm font-medium"
                >
                  Resolve issues to Checkout
                </button>
              )}

              <Link href="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition">
                ← Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}