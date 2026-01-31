"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";

type WishlistItem = {
  id: number;
  title: string;
  slug: string;
  sell_price: number;
  main_image: string;
  author?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const loadWishlist = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/wishlist/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setItems);
  };

  useEffect(() => {
    loadWishlist();
    window.addEventListener("wishlist-change", loadWishlist);
    return () =>
      window.removeEventListener("wishlist-change", loadWishlist);
  }, []);

  const removeItem = async (productId: number) => {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadWishlist();
  };

  /* ================= ADD TO CART ================= */
  const addToCart = async (productId: number) => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          format: "paperback",
          quantity: 1,
        }),
      });

      if (!res.ok) throw new Error("Add to cart failed");

      // 🔔 update cart UI
      window.dispatchEvent(new Event("cart-change"));

      // 🧹 OPTIONAL: remove from wishlist after adding
      removeItem(productId);

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!items.length)
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <h1 className="text-2xl font-semibold mb-2">My List</h1>
        <p className="text-gray-500">Your wishlist is empty ❤️</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">

      {/* HEADER */}
      <div className="text-center mb-10">
        <p className="text-xs tracking-widest text-gray-500 uppercase">
          Updated: {today}
        </p>
        <h1 className="text-3xl font-serif mt-2">My Wishlist</h1>
      </div>

      <p className="text-sm mb-4">{items.length} Item(s)</p>

      <div className="border-t border-gray-300">
        {items.map(book => (
          <div
            key={book.id}
            className="flex items-center justify-between gap-6 py-6 border-b border-gray-300"
          >
            {/* IMAGE */}
            <Link href={`/product/${book.slug}`}>
              <Image
                src={`${API_URL}${book.main_image}`}
                alt={book.title}
                width={80}
                height={120}
                className="object-cover rounded border"
                unoptimized
              />
            </Link>

            {/* INFO */}
            <div className="flex-1">
              <Link
                href={`/product/${book.slug}`}
                className="font-medium hover:underline"
              >
                {book.title}
              </Link>

              {book.author && (
                <p className="text-sm text-gray-600">{book.author}</p>
              )}

              <p className="text-sm text-gray-500">Paperback</p>
            </div>

            {/* PRICE */}
            <div className="w-24 text-right font-semibold text-red-600">
              ₹{book.sell_price}
            </div>

            {/* ADD TO BAG */}
            <button
              onClick={() => addToCart(book.id)}
              className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 text-sm"
            >
              Add to Bag
            </button>

            {/* DELETE */}
            <button
              onClick={() => removeItem(book.id)}
              className="text-gray-500 hover:text-red-600"
              title="Remove"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
