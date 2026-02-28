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

  product_type: "ebook" | "physical" | "both";
  stock: number;
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

  const getCartFormat = (item: WishlistItem) => {
  if (item.product_type === "ebook") return "ebook";

  if (item.product_type === "physical") return "paperback";

  // both
  if (item.stock > 0) return "paperback";
  return "ebook";
};


  /* ================= ADD TO CART ================= */
  const addToCart = async (item: WishlistItem) => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  const format = getCartFormat(item);

  try {
    const res = await fetch(`${API_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: item.id,
        format,
        quantity: format === "ebook" ? 1 : 1,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.msg === "OUT_OF_STOCK") return;
      throw new Error();
    }

    window.dispatchEvent(new Event("cart-change"));
    removeItem(item.id);
  } catch {
    console.error("Add to cart failed");
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

            </div>

            {/* PRICE */}
            <div className="w-24 text-right font-semibold text-red-600">
              ₹{book.sell_price}
            </div>

            {/* ADD TO BAG */}
            <button
  onClick={() => addToCart(book)}
  disabled={book.product_type === "physical" && book.stock === 0}
  className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 text-sm disabled:bg-gray-300 disabled:text-gray-600 cursor-pointer disabled:cursor-not-allowed transition"
>

              Add to Bag
            </button>

            {/* DELETE */}
            <button
              onClick={() => removeItem(book.id)}
              className="text-gray-500 hover:text-red-600 cursor-pointer transition"
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
