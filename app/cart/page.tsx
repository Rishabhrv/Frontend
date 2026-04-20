"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, AlertCircle, ShoppingCart, LogIn } from "lucide-react";
import {
  getGuestCart,
  updateGuestCartQty,
  removeFromGuestCart,
  GuestCartItem,
} from "@/utils/guestStorage";   // ← adjust to your import path

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Normalise image src — handles full URLs and /uploads/... paths
const imgSrc = (src: string) => (src.startsWith("http") ? src : `${API_URL}${src}`);

// ── Types ─────────────────────────────────────────────────────────────────────

type CartItem = {
  id:                 number;   // cart row id  (0 for guest items)
  product_id:         number;
  format:             "ebook" | "paperback";
  quantity:           number;
  title:              string;
  slug:               string;
  main_image:         string;
  price:              number;
  stock:              number;
  category_imprints?: string;
  _guest?:            boolean;  // true for localStorage-backed items
};

// ─────────────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const [cart,           setCart]           = useState<CartItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [stockWarningId, setStockWarningId] = useState<number | null>(null);
  const [isGuest,        setIsGuest]        = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ── Load cart ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Guest mode
      setIsGuest(true);
      const guestItems: CartItem[] = getGuestCart()
        .filter((i: GuestCartItem) =>
          !i.category_imprints || i.category_imprints.split(",").includes("agph")
        )
        .map((i: GuestCartItem, idx: number) => ({
          id:                idx,          // synthetic id
          product_id:        i.product_id,
          format:            i.format,
          quantity:          i.quantity,
          title:             i.title,
          slug:              i.slug,
          main_image:        i.image,
          price:             i.price,
          stock:             i.stock,
          category_imprints: i.category_imprints,
          _guest:            true,
        }));
      setCart(guestItems);
      setLoading(false);
      return;
    }

    setIsGuest(false);
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

  // Re-sync guest cart on storage events
  useEffect(() => {
    const sync = () => {
      if (!localStorage.getItem("token")) {
        const guestItems: CartItem[] = getGuestCart().map(
          (i: GuestCartItem, idx: number) => ({
            id:         idx,
            product_id: i.product_id,
            format:     i.format,
            quantity:   i.quantity,
            title:      i.title,
            slug:       i.slug,
            main_image: i.image,
            price:      i.price,
            stock:      i.stock,
            _guest:     true,
          })
        );
        setCart(guestItems);
      }
    };
    window.addEventListener("guest-cart-change", sync);
    return () => window.removeEventListener("guest-cart-change", sync);
  }, []);

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateQty = async (item: CartItem, qty: number) => {
    if (qty < 1) return;
    if (item.stock && qty > item.stock) { setStockWarningId(item.product_id); return; }

    if (item._guest) {
      updateGuestCartQty(item.product_id, item.format, qty);
      setCart((prev) =>
        prev.map((i) =>
          i.product_id === item.product_id && i.format === item.format
            ? { ...i, quantity: qty }
            : i
        )
      );
      return;
    }

    const token = localStorage.getItem("token")!;
    await fetch(`${API_URL}/api/cart/update/${item.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ quantity: qty }),
    });
    setCart((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity: qty } : i)));
  };

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItem = async (item: CartItem) => {
    if (item._guest) {
      removeFromGuestCart(item.product_id, item.format);
      setCart((prev) =>
        prev.filter((i) => !(i.product_id === item.product_id && i.format === item.format))
      );
      return;
    }

    const token = localStorage.getItem("token")!;
    await fetch(`${API_URL}/api/cart/remove/${item.id}`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setCart((prev) => prev.filter((i) => i.id !== item.id));
    window.dispatchEvent(new Event("cart-change"));
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (isGuest) { setShowLoginModal(true); return; }
    window.location.href = "/checkout";
  };

  // ── Derived totals ────────────────────────────────────────────────────────
  const total              = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const outOfStockItems    = cart.filter((i) => i.format === "paperback" && i.stock === 0);
  const exceededStockItems = cart.filter((i) => i.format === "paperback" && i.stock > 0 && i.quantity > i.stock);
  const canCheckout        = outOfStockItems.length === 0 && exceededStockItems.length === 0;

  if (loading) return <p className="p-10 text-sm text-gray-500">Loading cart…</p>;

  return (
    <div className="max-w-7xl min-h-[100dvh] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-serif mb-6 sm:mb-8">Shopping Cart</h1>

      {/* ── Login-required modal ── */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <LogIn className="mx-auto mb-4 text-gray-700" size={36} />
            <h2 className="text-lg font-semibold mb-2">Sign in to Checkout</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your cart is saved! Log in or create an account to complete your order.
              Your items will be waiting for you.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/login?redirect=/checkout"
                className="block w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Log in
              </Link>
              <Link
                href="/register?redirect=/checkout"
                className="block w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Create account
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition mt-1 cursor-pointer"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* ═══ LEFT: ITEMS ═══════════════════════════════════════════════════ */}
          <div className="lg:col-span-2">

            {/* Guest nudge banner */}
            {isGuest && (
              <div className="flex items-center justify-between gap-3 mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                <p className="text-amber-800">
                  <span className="font-semibold">Browsing as guest</span> — log in to sync your cart across devices.
                </p>
                <Link
                  href="/login?redirect=/cart"
                  className="flex items-center gap-1.5 shrink-0 bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  <LogIn size={13} /> Log in
                </Link>
              </div>
            )}

            <p className="font-medium text-sm mb-4 text-gray-600">
              Items ({cart.length})
            </p>

            <div className="space-y-4 sm:space-y-6">
              {cart.map((item) => {
                const isOutOfStock  = item.format === "paperback" && item.stock === 0;
                const isOverStock   = item.format === "paperback" && item.stock > 0 && item.quantity > item.stock;
                const hasStockIssue = isOutOfStock || isOverStock;

                return (
                  <div
                    key={`${item.product_id}-${item.format}`}
                    className={`flex gap-3 sm:gap-5 pb-4 sm:pb-6 border-b ${
                      hasStockIssue ? "border-red-200" : "border-gray-200"
                    }`}
                  >
                    {/* IMAGE */}
                    <div className="relative shrink-0">
                      <Image
                        src={imgSrc(item.main_image)}
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
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-medium text-sm sm:text-base hover:underline line-clamp-2 leading-snug"
                        >
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item)}
                          className="shrink-0 text-gray-400 hover:text-red-600 cursor-pointer transition p-0.5"
                          aria-label="Remove"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        {item.format === "ebook" ? "eBook" : "Paperback"}
                      </p>

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
                      {!isOutOfStock && !isOverStock && stockWarningId === item.product_id && (
                        <p className="text-xs text-red-600">Only {item.stock} copies available</p>
                      )}

                      {/* Price + qty row */}
                      <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
                        <span className="font-semibold text-sm sm:text-base">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-400 font-normal ml-1">
                              (₹{item.price} each)
                            </span>
                          )}
                        </span>

                        {/* Qty stepper — paperback only */}
                        {item.format === "paperback" && (
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQty(item, item.quantity - 1)}
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
                                if (item.stock > 0 && item.quantity >= item.stock) {
                                  setStockWarningId(item.product_id);
                                  return;
                                }
                                updateQty(item, item.quantity + 1);
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

          {/* ═══ RIGHT: ORDER SUMMARY ══════════════════════════════════════════ */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white">
              <h2 className="text-base font-semibold mb-4 pb-2 border-b border-gray-100">
                Order Summary
              </h2>

              {/* eBook notice */}
              {cart.some((i) => i.format === "ebook") && (
                <div className="bg-blue-50 text-xs sm:text-sm text-gray-700 p-3 rounded-lg mb-4">
                  <p className="font-medium mb-0.5">You&apos;re buying eBooks</p>
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
                      {outOfStockItems.length > 0 &&
                        `${outOfStockItems.length} item${outOfStockItems.length > 1 ? "s are" : " is"} out of stock. `}
                      {exceededStockItems.length > 0 &&
                        `${exceededStockItems.length} item${exceededStockItems.length > 1 ? "s exceed" : " exceeds"} available stock.`}{" "}
                      Remove or adjust to proceed.
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

              {/* CTA */}
              {canCheckout ? (
                <button
                  onClick={handleCheckout}
                  className="w-full bg-red-600 text-white py-3 rounded-lg cursor-pointer hover:bg-red-700 transition font-medium text-sm flex items-center justify-center gap-2"
                >
                  {isGuest && <LogIn size={15} />}
                  {isGuest ? "Sign in to Checkout" : "Proceed to Checkout"}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 py-3 rounded-lg cursor-not-allowed text-sm font-medium"
                >
                  Resolve issues to Checkout
                </button>
              )}

              <Link
                href="/"
                className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}