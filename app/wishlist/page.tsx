"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, Heart } from "lucide-react";

type WishlistItem = {
  id: number;
  title: string;
  slug: string;
  sell_price: number;
  main_image: string;
  author?: string;
  product_type: "ebook" | "physical" | "both";
  stock: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);

  const loadWishlist = () => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    fetch(`${API_URL}/api/wishlist/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setItems);
  };

  useEffect(() => {
    loadWishlist();
    window.addEventListener("wishlist-change", loadWishlist);
    return () => window.removeEventListener("wishlist-change", loadWishlist);
  }, []);

  const removeItem = async (productId: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadWishlist();
  };

  const getCartFormat = (item: WishlistItem) => {
    if (item.product_type === "ebook") return "ebook";
    if (item.product_type === "physical") return "paperback";
    return item.stock > 0 ? "paperback" : "ebook";
  };

  const addToCart = async (item: WishlistItem) => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    const format = getCartFormat(item);
    setAddingId(item.id);
    try {
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

  if (!items.length)
    return (
      <div className="max-w-5xl mx-auto py-20 px-6 text-center bg-white text-gray-700">
        <Heart className="mx-auto mb-4 text-gray-300" size={48} />
        <h1 className="text-2xl font-semibold mb-2">My Wishlist</h1>
        <p className="text-gray-500 text-sm">Your wishlist is empty.</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">
          Browse Books
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl min-h-[100dvh] mx-auto py-8 sm:py-16 px-4 sm:px-6 bg-white text-gray-700" >

      {/* HEADER */}
      <div className="text-center mb-6 sm:mb-10">
        <p className="text-xs tracking-widest text-gray-500 uppercase">Updated: {today}</p>
        <h1 className="text-2xl sm:text-3xl font-serif mt-2">My Wishlist</h1>
      </div>

      <p className="text-sm mb-4 text-gray-600">{items.length} Item{items.length !== 1 ? "s" : ""}</p>

      <div className="border-t border-gray-300">
        {items.map(book => {
          const outOfStock = book.product_type === "physical" && book.stock === 0;
          const isAdding = addingId === book.id;

          return (
            <div
              key={book.id}
              className="flex items-center gap-3 sm:gap-6 py-4 sm:py-6 border-b border-gray-200"
            >
              {/* IMAGE */}
              <Link href={`/product/${book.slug}`} className="shrink-0">
                <Image
                  src={`${API_URL}${book.main_image}`}
                  alt={book.title}
                  width={80}
                  height={120}
                  className="object-cover rounded border h-[90px] w-[62px] sm:h-[120px] sm:w-[80px]"
                  unoptimized
                />
              </Link>

              {/* TITLE + AUTHOR — grows to fill space */}
              <div className="flex-1 min-w-0">
                <Link href={`/product/${book.slug}`} className="font-medium text-sm sm:text-base hover:underline line-clamp-2 leading-snug">
                  {book.title}
                </Link>
                {book.author && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{book.author}</p>
                )}
              </div>

              {/* PRICE */}
              <div className="shrink-0 font-semibold text-red-600 text-sm sm:text-base w-20 sm:w-24 text-right">
                ₹{book.sell_price}
              </div>

              {/* ADD TO BAG */}
              <button
                onClick={() => addToCart(book)}
                disabled={outOfStock || isAdding}
                className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap
                  ${outOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 active:scale-95"
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