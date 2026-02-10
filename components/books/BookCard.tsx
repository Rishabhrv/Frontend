"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Book = {
  id: number;
  title: string;
  slug: string;
  image: string;

  product_type: "ebook" | "physical" | "both";
  stock: number;

  // paperback
  price: number;
  sell_price: number;

  // ebook
  ebook_price?: number;
  ebook_sell_price?: number;

  badge?: string;
};


type BookCardProps = {
  book: Book;
  visibleCount: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const BookCard = ({ book, visibleCount }: BookCardProps) => {
  const [liked, setLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);


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

const getCartFormat = () => {
  // ebook only
  if (book.product_type === "ebook") return "ebook";

  // physical only
  if (book.product_type === "physical") return "paperback";

  // both
  if (book.stock > 0) return "paperback"; // prefer paperback
  return "ebook"; // paperback out of stock → ebook
};



const addToCart = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const format = getCartFormat();

  try {
    const res = await fetch(`${API_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: book.id,
        format,
        quantity: format === "ebook" ? 1 : 1,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // ⛔ paperback OOS handled silently
      if (data.msg === "OUT_OF_STOCK") return;
      throw new Error();
    }

    window.dispatchEvent(new Event("cart-change"));
    setAddedToCart(true);

    setTimeout(() => setAddedToCart(false), 2000);
  } catch {
    console.error("Add to cart failed");
  }
};





  const discount =
    book.price > book.sell_price
      ? Math.round(
          ((book.price - book.sell_price) / book.price) * 100
        )
      : 0;

      const isDisabled =
  addedToCart ||
  (book.product_type === "physical" && book.stock === 0);

  const isEbookOnly = book.product_type === "ebook";

const displaySellPrice = isEbookOnly
  ? book.ebook_sell_price
  : book.sell_price;

const displayMrp = isEbookOnly
  ? book.ebook_price
  : book.price;

const showDiscount =
  displayMrp && displaySellPrice && displayMrp > displaySellPrice;

const discountPercent =
  showDiscount
    ? Math.round(((displayMrp - displaySellPrice) / displayMrp) * 100)
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
          className="absolute right-2 top-2 z-10 rounded-full bg-white p-1 shadow cursor-pointer"
        >
          <Heart
            size={16}
            className={
              liked
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500 "
            }
          />
        </button>

        <Link href={`/product/${book.slug}`}>
          <div className="relative overflow-hidden rounded bg-white">
            {/* 🔴 BADGE */}
    {book.badge && (
      <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] px-2 py-1 rounded">
        {book.badge}
      </span>
    )}
            {discountPercent > 0 && (
  <span className="absolute left-2 bottom-2 z-10 bg-green-600 text-white text-[10px] px-2 py-1 rounded">
    {discountPercent}% OFF
  </span>
)}

            <Image
              src={book.image}
              alt={book.title}
              width={180}
              height={260}
              className="h-70 w-full object-cover group-hover:scale-105 transition cursor-pointer"
              unoptimized
            />
          </div>

          <div className="mt-2 text-xs">
            <h3 className="font-medium line-clamp-2">
              {book.title}
            </h3>

            <div className="mt-1 flex gap-2">
              <div className="mt-1 flex gap-2 items-center">
                <span className="font-semibold">
                  ₹{displaySellPrice}
                </span>
              
                {showDiscount && (
                  <span className="line-through text-gray-400 text-[11px]">
                    ₹{displayMrp}
                  </span>
                )}
              </div>

            </div>
          </div>
        </Link>

        <button
  onClick={addToCart}
  disabled={isDisabled}
  className={`flex justify-center gap-2 mt-2 w-full py-2 text-xs rounded cursor-pointer
    ${
      isDisabled
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : addedToCart
        ? "bg-green-600 text-white"
        : "bg-black text-white hover:bg-gray-800"
    }
  `}
>
  {book.product_type === "both" && book.stock === 0 ? (
    <>
      <ShoppingCart size={14} />
      Add to Cart
    </>
  ) : book.product_type === "physical" && book.stock === 0 ? (
    "Out of Stock"
  ) : addedToCart ? (
    <>
      <CircleCheck size={14} />
      Added
    </>
  ) : (
    <>
      <ShoppingCart size={14} />
      Add to Cart
    </>
  )}
</button>



      </div>
    </div>
  );
};

export default BookCard;
