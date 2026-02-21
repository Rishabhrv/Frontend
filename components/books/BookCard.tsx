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
  price: number;
  sell_price: number;
  ebook_price?: number;
  ebook_sell_price?: number;
  badge?: string;
  category?: string;
  author?: string;
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
    if (!token) { setLiked(false); return; }
    fetch(`${API_URL}/api/wishlist/check/${book.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { liked: false }))
      .then((d) => setLiked(!!d.liked))
      .catch(() => setLiked(false));
  }, [book.id]);

  /* TOGGLE WISHLIST */
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { window.dispatchEvent(new Event("open-account-slider")); return; }
    try {
      const res = await fetch(`${API_URL}/api/wishlist/${book.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.status === "added");
      window.dispatchEvent(new Event("wishlist-change"));
    } catch { console.log("Wishlist failed silently"); }
  };

  const getCartFormat = () => {
    if (book.product_type === "ebook") return "ebook";
    if (book.product_type === "physical") return "paperback";
    return book.stock > 0 ? "paperback" : "ebook";
  };

  const addToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) { window.dispatchEvent(new Event("open-account-slider")); return; }
    const format = getCartFormat();
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: book.id, format, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { if (data.msg === "OUT_OF_STOCK") return; throw new Error(); }
      window.dispatchEvent(new Event("cart-change"));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch { console.error("Add to cart failed"); }
  };

  const isEbookOnly = book.product_type === "ebook";
  const displaySellPrice = isEbookOnly ? book.ebook_sell_price : book.sell_price;
  const displayMrp = isEbookOnly ? book.ebook_price : book.price;
  const showDiscount = displayMrp && displaySellPrice && displayMrp > displaySellPrice;
  const discountPercent = showDiscount
    ? Math.round(((displayMrp - displaySellPrice) / displayMrp) * 100)
    : 0;

  const isOutOfStock = book.product_type === "physical" && book.stock === 0;
  const isDisabled = addedToCart || isOutOfStock;

  return (
    <div className="flex-shrink-0 px-1 my-2" style={{ width: `${100 / visibleCount}%` }}>
      <div className="group relative bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">

        {/* ── COVER IMAGE BLOCK ── */}
        <Link href={`/product/${book.slug}`} className="block">
          <div className="relative bg-gray-100 flex items-center justify-center overflow-hidden" style={{ minHeight: 220 }}>

            {/* Wishlist button */}
            <button
              onClick={toggleWishlist}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow transition-transform hover:scale-110"
            >
              <Heart
                size={14}
                className={liked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}
              />
            </button>

            {/* Badge */}
            {book.badge && (
              <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">
                {book.badge}
              </span>
            )}

            {/* Discount pill */}
            {discountPercent > 0 && (
              <span className="absolute bottom-3 left-3 z-10 bg-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                {discountPercent}% OFF
              </span>
            )}

            <Image
              src={book.image}
              alt={book.title}
              width={140}
              height={200}
              className="object-contain drop-shadow-md group-hover:scale-105 transition-transform  duration-300 py-6"
              style={{ maxHeight: 250 }}
              unoptimized
            />
          </div>

          {/* ── TEXT BLOCK ── */}
          <div className="px-4 pt-3 pb-2">
            {/* Category — italic gray, like the reference image */}
            <p className="text-[11px] italic text-gray-400 truncate mb-0.5">
              {book.category ?? (isEbookOnly ? "Digital Edition" : "Paperback")}
            </p>

            {/* Title */}
            <h3 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
              {book.title}
            </h3>

            {/* Author — bold dark, like reference image */}
            {book.author && (
              <p className="text-xs font-bold text-gray-800 truncate mb-1">
                {book.author}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-semibold text-gray-900">
                ₹{displaySellPrice}
              </span>
              {showDiscount && (
                <span className="text-[11px] line-through text-gray-400">
                  ₹{displayMrp}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* ── ADD TO CART ── */}
        <div className="px-4 pb-4 pt-1 mt-auto">
          <button
            onClick={addToCart}
            disabled={isDisabled}
            className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium rounded-lg transition-all duration-200
              ${isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : addedToCart
                ? "bg-emerald-500 text-white"
                : "bg-gray-900 text-white hover:bg-gray-700 cursor-pointer"
              }
            `}
          >
            {isOutOfStock ? (
              "Out of Stock"
            ) : addedToCart ? (
              <><CircleCheck size={13} /> Added</>
            ) : (
              <><ShoppingCart size={13} /> Add to Cart</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookCard;