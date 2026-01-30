"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

type Book = {
  id: number;
  title: string;
  price: number;
  sell_price: number;
  image: string;
  slug: string;
  badge?: string;
};

type BookCardProps = {
  book: Book;
  visibleCount: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const BookCard = ({ book, visibleCount }: BookCardProps) => {
  const [liked, setLiked] = useState(false);

  /* CHECK WISHLIST */
 useEffect(() => {
  const token = localStorage.getItem("token");

  // 🔥 NOT LOGGED IN → DO NOTHING
  if (!token) {
    setLiked(false);
    return;
  }

  fetch(
    `${API_URL}/api/wishlist/check/${book.id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )
    .then((r) => {
      if (!r.ok) return { liked: false };
      return r.json();
    })
    .then((d) => setLiked(!!d.liked))
    .catch(() => setLiked(false));
}, [book.id]);


  /* TOGGLE WISHLIST */
 const toggleWishlist = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/api/wishlist/${book.id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error();

    const data = await res.json();
    setLiked(data.status === "added");

    window.dispatchEvent(new Event("wishlist-change"));
  } catch {
    console.log("Wishlist failed silently");
  }
};


  const discount =
    book.price > book.sell_price
      ? Math.round(
          ((book.price - book.sell_price) / book.price) * 100
        )
      : 0;

  return (
    <div
      className="flex-shrink-0 px-2"
      style={{ width: `${100 / visibleCount}%` }} // ✅ MAGIC LINE
    >
      <div className="group relative">

        {/* ❤️ Wishlist */}
        <button
          onClick={toggleWishlist}
          className="absolute right-2 top-2 z-10 rounded-full bg-white p-1 shadow"
        >
          <Heart
            size={16}
            className={
              liked
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            }
          />
        </button>

        <Link href={`/product/${book.slug}`}>
          <div className="relative overflow-hidden rounded bg-white">
            {discount > 0 && (
              <span className="absolute left-2 bottom-2 z-10 bg-green-600 text-white text-[10px] px-2 py-1 rounded">
                {discount}% OFF
              </span>
            )}

            <Image
              src={book.image}
              alt={book.title}
              width={180}
              height={260}
              className="h-70 w-full object-cover group-hover:scale-105 transition"
              unoptimized
            />
          </div>

          <div className="mt-2 text-xs">
            <h3 className="font-medium line-clamp-2">
              {book.title}
            </h3>

            <div className="mt-1 flex gap-2">
              <span className="font-semibold">
                ₹{book.sell_price}
              </span>
              {book.price > book.sell_price && (
                <span className="line-through text-gray-400 text-[11px]">
                  ₹{book.price}
                </span>
              )}
            </div>
          </div>
        </Link>

        <button className=" flex justify-center gap-2 mt-2 w-full bg-black text-white py-2 text-xs rounded">
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default BookCard;
