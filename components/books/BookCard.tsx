"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addToGuestCart,
  isInGuestWishlist,
  toggleGuestWishlist,
} from "@/utils/guestStorage";

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
  forceFormat?: "ebook" | "paperback";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Helper function to ensure the token is actually valid
const isValidToken = (token: string | null) => {
  return token && token !== "null" && token !== "undefined" && token.trim() !== "";
};

const BookCard = ({ book, visibleCount, forceFormat }: BookCardProps) => {
  const [liked, setLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeSale, setActiveSale] = useState<any>(null);

  // ── Fetch Active Sale ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/sales/active/${book.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setActiveSale(data);
      })
      .catch(() => { });
  }, [book.id]);

  // ── Wishlist: check server (logged-in) or localStorage (guest) ────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (isValidToken(token)) {
      fetch(`${API_URL}/api/wishlist/check/${book.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (r.status === 401) {
            // Token is invalid/expired. Clear it so other components stop trying to use it.
            localStorage.removeItem("token");
            window.dispatchEvent(new Event("auth-change"));
            return { liked: false };
          }
          return r.ok ? r.json() : { liked: false };
        })
        .then((d) => setLiked(!!d.liked))
        .catch(() => setLiked(false));
    } else {
      setLiked(isInGuestWishlist(book.id));
    }
  }, [book.id]);

  // Keep guest wishlist icon in sync when updated from another component
  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem("token");
      if (!isValidToken(token)) setLiked(isInGuestWishlist(book.id));
    };
    window.addEventListener("guest-wishlist-change", sync);
    return () => window.removeEventListener("guest-wishlist-change", sync);
  }, [book.id]);

  // ── Toggle wishlist ───────────────────────────────────────────────────────
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (isValidToken(token)) {
      // Logged-in: sync with server
      try {
        const res = await fetch(`${API_URL}/api/wishlist/${book.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth-change"));
          throw new Error("Unauthorized");
        }

        if (!res.ok) throw new Error();
        const data = await res.json();
        setLiked(data.status === "added");
        window.dispatchEvent(new Event("wishlist-change"));
      } catch {
        console.log("Wishlist failed silently");
      }
    } else {
      // Guest: persist to localStorage
      const nowLiked = toggleGuestWishlist({
        id: book.id,
        title: book.title,
        slug: book.slug,
        sell_price: book.sell_price,
        image: book.image,
        author: book.author,
        product_type: book.product_type,
        stock: book.stock,
      });
      setLiked(nowLiked);
    }
  };

  // ── Determine format ──────────────────────────────────────────────────────
  const getCartFormat = (): "ebook" | "paperback" => {
    if (forceFormat) return forceFormat;
    if (book.product_type === "ebook") return "ebook";
    if (book.product_type === "physical") return "paperback";
    return book.stock > 0 ? "paperback" : "ebook";
  };

  // ── Add to cart ───────────────────────────────────────────────────────────
  const addToCart = async () => {
    const token = localStorage.getItem("token");
    const format = getCartFormat();

    if (isValidToken(token)) {
      // Logged-in: sync with server
      try {
        const res = await fetch(`${API_URL}/api/cart/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ product_id: book.id, format, quantity: 1 }),
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth-change"));
          throw new Error("Unauthorized");
        }

        const data = await res.json();
        if (!res.ok) {
          if (data.msg === "OUT_OF_STOCK") return;
          throw new Error();
        }
        window.dispatchEvent(new Event("cart-change"));
      } catch {
        console.error("Add to cart failed");
        return;
      }
    } else {
      // Guest: persist to localStorage
      addToGuestCart({
        product_id: book.id,
        format,
        title: book.title,
        slug: book.slug,
        image: book.image,
        price: format === "ebook" ? (book.ebook_sell_price ?? book.sell_price) : book.sell_price,
        stock: book.stock,
        category_imprints: undefined,
      });
    }

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // ── Derived display values ────────────────────────────────────────────────
  const isEbookOnly = book.product_type === "ebook";
  let displaySellPrice = isEbookOnly ? book.ebook_sell_price ?? book.sell_price : book.sell_price;
  let displayMrp = isEbookOnly ? book.ebook_price ?? book.price : book.price;

  // Apply sale discount if active
  if (activeSale && displaySellPrice) {
    if (!displayMrp || displayMrp <= displaySellPrice) {
      displayMrp = displaySellPrice; // Make the current sell price the MRP
    }
    if (activeSale.discount_type === "percent") {
      displaySellPrice = Math.max(0, displaySellPrice - (displaySellPrice * activeSale.discount_value) / 100);
    } else if (activeSale.discount_type === "flat") {
      displaySellPrice = Math.max(0, displaySellPrice - activeSale.discount_value);
    }
  }

  const showDiscount = displayMrp && displaySellPrice && displayMrp > displaySellPrice;
  const discountPercent = showDiscount
    ? Math.round(((displayMrp - displaySellPrice) / displayMrp) * 100)
    : 0;

  const isOutOfStock = book.product_type === "physical" && book.stock === 0;
  const isDisabled = addedToCart || isOutOfStock;

  return (
    <div className="flex-shrink-0 px-1 my-2" style={{ width: `${100 / visibleCount}%` }}>
      <div className="group relative bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">

        {/* ── COVER IMAGE ── */}
        <Link href={`/product/${book.slug}`} className="block">
          <div
            className="relative bg-gray-100 flex items-center justify-center overflow-hidden"
            style={{ minHeight: 220 }}
          >
            {/* Wishlist button */}
            <button
              onClick={toggleWishlist}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow transition-transform hover:scale-110 cursor-pointer"
            >
              <Heart
                size={14}
                className={liked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}
              />
            </button>

            {/* Badge */}
            {book.badge && (
              <span className="absolute bottom-3 left-2 z-10 bg-indigo-500 text-white text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded shadow-sm">
                {book.badge}
              </span>
            )}

            {/* Sale / Discount Badge */}
            {activeSale ? (
              <div className="absolute top-0 left-2 z-20 flex flex-col items-center justify-center bg-red-600 text-white font-bold rounded-full w-[52px] h-[52px] shadow-md leading-none border-2 border-white">
                {activeSale.discount_type === "percent" ? (
                  <>
                    <span className="text-[9px] uppercase tracking-wide mb-0.5">Sale</span>
                    <span className="text-[11px] font-extrabold whitespace-nowrap">
                      {Number(activeSale.discount_value)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-wide">Flat</span>
                    <span className="text-[10px] font-extrabold whitespace-nowrap my-0.5">
                      ₹{Number(activeSale.discount_value)}
                    </span>
                    <span className="text-[7px] uppercase tracking-wide">Off</span>
                  </>
                )}
              </div>
            ) : discountPercent > 0 ? (
              <div className="absolute top-3 left-3 z-20 flex flex-col items-center justify-center bg-[#00C853] text-white font-bold rounded-full w-[50px] h-[50px] shadow-sm leading-none border-2 border-white">
                <span className="text-[12px] mb-0.5">{discountPercent}%</span>
                <span className="text-[9px] uppercase tracking-wide">OFF</span>
              </div>
            ) : null}



            <Image
              src={book.image}
              alt={book.title}
              width={140}
              height={200}
              className="object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 py-6"
              style={{ maxHeight: 250 }}
              unoptimized
            />
          </div>

          {/* ── TEXT BLOCK ── */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[11px] italic text-gray-400 truncate mb-0.5">
              {book.category ?? (isEbookOnly ? "Digital Edition" : "Paperback")}
            </p>

            <h3 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
              {book.title}
            </h3>

            {book.author && (
              <p className="text-xs font-bold text-gray-800 truncate mb-1">
                {book.author}
              </p>
            )}

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-semibold text-gray-900">
                ₹{displaySellPrice}
              </span>
              {showDiscount && (
                <span className="text-[11px] line-through text-gray-400">
                  ₹{displayMrp}
                </span>
              )}
              {activeSale && (activeSale.end_date || activeSale.timer_duration_hours) && (
                <SaleCountdown
                  endDate={activeSale.end_date}
                  saleId={activeSale.id}
                  timerDurationHours={activeSale.timer_duration_hours}
                />
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

/* ─── Countdown Timer ────────────────────────────────────────────────────── */
function SaleCountdown({ endDate, saleId, timerDurationHours }: { endDate: string; saleId?: number; timerDurationHours?: number }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let finalEndTime = new Date(endDate).getTime();

    if (timerDurationHours && saleId) {
      const storageKey = `sale_timer_${saleId}`;
      const storedTime = localStorage.getItem(storageKey);
      if (storedTime) {
        finalEndTime = parseInt(storedTime, 10);
      } else {
        finalEndTime = new Date().getTime() + timerDurationHours * 60 * 60 * 1000;
        localStorage.setItem(storageKey, finalEndTime.toString());
      }

      const globalEndTime = new Date(endDate).getTime();
      if (finalEndTime > globalEndTime) {
        finalEndTime = globalEndTime;
      }
    }

    const calculateTimeLeft = () => {
      let diff = finalEndTime - new Date().getTime();
      if (diff <= 0) {
        // Restart timer
        const duration = timerDurationHours ? timerDurationHours * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        finalEndTime = new Date().getTime() + duration;
        if (saleId) {
          localStorage.setItem(`sale_timer_${saleId}`, finalEndTime.toString());
        }
        diff = finalEndTime - new Date().getTime();
      }
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, saleId, timerDurationHours]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const d = Math.floor(timeLeft / (3600 * 24));
  const h = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return (
    <div className="flex items-center gap-1 text-[8px] sm:text-[7px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg ml-auto whitespace-nowrap self-center">
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-[11px] sm:text-[11px]">{d}d {h}h {m}m {s}s</span>
    </div>
  );
}

export default BookCard;