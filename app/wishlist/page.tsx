"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, Heart, LogIn } from "lucide-react";
import {
  getGuestWishlist,
  removeFromGuestWishlist,
  addToGuestCart,
  GuestWishlistItem,
} from "@/utils/guestStorage";

type WishlistItem = {
  id: number;
  title: string;
  slug: string;
  sell_price: number;
  ebook_sell_price?: number; // Added to support ebook pricing
  main_image: string;
  author?: string;
  product_type: "ebook" | "physical" | "both";
  stock: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ── Normalise image src ── handles both full URLs and relative paths
const imgSrc = (src: string) => (src.startsWith("http") ? src : `${API_URL}${src}`);

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // ── Load wishlist ─────────────────────────────────────────────────────────
  const loadWishlist = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Guest: read from localStorage
      setIsGuest(true);
      const guestItems = getGuestWishlist().map((g: any) => ({
        id: g.id,
        title: g.title,
        slug: g.slug,
        sell_price: g.sell_price,
        ebook_sell_price: g.ebook_sell_price, // Fetch ebook price from guest storage if available
        main_image: g.image,
        author: g.author,
        product_type: g.product_type,
        stock: g.stock,
      }));
      setItems(guestItems);
      return;
    }

    setIsGuest(false);
    fetch(`${API_URL}/api/wishlist/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setItems);
  };

  useEffect(() => {
    loadWishlist();
    window.addEventListener("wishlist-change", loadWishlist);
    window.addEventListener("guest-wishlist-change", loadWishlist);
    return () => {
      window.removeEventListener("wishlist-change", loadWishlist);
      window.removeEventListener("guest-wishlist-change", loadWishlist);
    };
  }, []);

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeItem = async (productId: number) => {
    const token = localStorage.getItem("token");

    if (!token) {
      removeFromGuestWishlist(productId);
      loadWishlist();
      return;
    }

    await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadWishlist();
  };

  // ── Get format ────────────────────────────────────────────────────────────
  const getCartFormat = (item: WishlistItem): "ebook" | "paperback" => {
    if (item.product_type === "ebook") return "ebook";
    if (item.product_type === "physical") return "paperback";
    return item.stock > 0 ? "paperback" : "ebook";
  };

  // ── Add to bag ────────────────────────────────────────────────────────────
  const addToCart = async (item: WishlistItem) => {
    const token = localStorage.getItem("token");
    const format = getCartFormat(item);
    
    // Select the correct price based on format
    const activePrice = format === "ebook" ? (item.ebook_sell_price ?? item.sell_price) : item.sell_price;

    setAddingId(item.id);

    try {
      if (!token) {
        // Guest: add to guest cart
        addToGuestCart({
          product_id: item.id,
          format,
          title: item.title,
          slug: item.slug,
          image: item.main_image,
          price: activePrice,
          stock: item.stock,
        });
        removeFromGuestWishlist(item.id);
        loadWishlist();
        return;
      }

      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: item.id, format, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { if (data.msg === "OUT_OF_STOCK") return; throw new Error(); }
      window.dispatchEvent(new Event("cart-change"));
      removeItem(item.id);
    } catch { console.error("Add to cart failed"); }
    finally { setAddingId(null); }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!items.length) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-6 text-center bg-white text-gray-700">
        <Heart className="mx-auto mb-4 text-gray-300" size={48} />
        <h1 className="text-2xl font-semibold mb-2">My Wishlist</h1>
        <p className="text-gray-500 text-sm">Your wishlist is empty.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-2.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition"
        >
          Browse Books
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl min-h-[100dvh] mx-auto py-8 sm:py-16 px-4 sm:px-6 bg-white text-gray-700">

      {/* ── Guest login nudge ── */}
      {isGuest && (
        <div className="flex items-center justify-between gap-3 mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
          <p className="text-amber-800">
            <span className="font-semibold">You&apos;re browsing as a guest.</span>{" "}
            Log in to save your wishlist across devices.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-1.5 shrink-0 bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <LogIn size={13} /> Log in
          </Link>
        </div>
      )}

      {/* ── Header ── */}
      <div className="text-center mb-6 sm:mb-10">
        <p className="text-xs tracking-widest text-gray-500 uppercase">Updated: {today}</p>
        <h1 className="text-2xl sm:text-3xl font-serif mt-2">My Wishlist</h1>
      </div>

      <p className="text-sm mb-4 text-gray-600">
        {items.length} Item{items.length !== 1 ? "s" : ""}
      </p>

      <div className="border-t border-gray-300">
        {items.map((book) => {
          const format = getCartFormat(book);
          const outOfStock = format === "paperback" && book.stock === 0;
          const isAdding = addingId === book.id;
          
          // Determine price and label based on format
          const displayPrice = format === "ebook" ? (book.ebook_sell_price ?? book.sell_price) : book.sell_price;
          const formatLabel = format === "ebook" ? "Digital E-Book" : "Paperback Edition";

          return (
            <div
              key={book.id}
              className="flex items-center gap-3 sm:gap-6 py-4 sm:py-6 border-b border-gray-200"
            >
              {/* IMAGE */}
              <Link href={`/product/${book.slug}`} className="shrink-0">
                <Image
                  src={imgSrc(book.main_image)}
                  alt={book.title}
                  width={80}
                  height={120}
                  className="object-cover rounded border h-[90px] w-[62px] sm:h-[120px] sm:w-[80px]"
                  unoptimized
                />
              </Link>

              {/* TITLE + AUTHOR + FORMAT */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${book.slug}`}
                  className="font-medium text-sm sm:text-base hover:underline line-clamp-2 leading-snug"
                >
                  {book.title}
                </Link>
                {book.author && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{book.author}</p>
                )}
                {/* Format Label */}
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1 italic">
                  {formatLabel}
                </p>
              </div>

              {/* PRICE */}
              <div className="shrink-0 font-semibold text-red-600 text-sm sm:text-base w-20 sm:w-24 text-right">
                ₹{displayPrice}
              </div>

              {/* ADD TO BAG */}
              <button
                onClick={() => addToCart(book)}
                disabled={outOfStock || isAdding}
                className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded text-xs sm:text-sm font-medium transition whitespace-nowrap
                  ${outOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 active:scale-95 cursor-pointer"
                  }`}
              >
                <ShoppingBag size={14} className="hidden sm:inline" />
                {isAdding ? "Adding…" : outOfStock ? "Out of Stock" : "Add to Bag"}
              </button>

              {/* DELETE */}
              <button
                onClick={() => removeItem(book.id)}
                className="shrink-0 text-gray-400 hover:text-red-500 transition cursor-pointer p-1"
                title="Remove"
              >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}