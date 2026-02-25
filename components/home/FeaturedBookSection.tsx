"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, StarHalf } from "lucide-react";

type Author = {
  name: string;
  slug: string | null;
};

type Book = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  sell_price: number;
  main_image: string;
  authors: Author[];
  avg_rating: number;
  review_count: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─── Star renderer ────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half   = !filled && rating >= star - 0.5;
        return filled ? (
          <Star key={star} size={14} className="fill-amber-400 text-amber-400" />
        ) : half ? (
          <StarHalf key={star} size={14} className="fill-amber-400 text-amber-400" />
        ) : (
          <Star key={star} size={14} className="text-gray-300" />
        );
      })}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <section className="mx-6 md:mx-10 my-16 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%]">
        <div className="bg-gray-100 min-h-[420px]" />
        <div className="p-10 space-y-4">
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="h-7 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-100 rounded" />
            <div className="h-3 bg-gray-100 rounded" />
            <div className="h-3 bg-gray-100 rounded w-4/5" />
          </div>
          <div className="h-10 bg-gray-100 rounded w-1/3 mt-6" />
        </div>
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const FeaturedBookSection = () => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/products/random/featured`)
      .then((res) => res.json())
      .then((data) => setBook(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!book)   return null;

  const discount = book.price > book.sell_price
    ? Math.round(((book.price - book.sell_price) / book.price) * 100)
    : 0;

  return (
    <section className="mx-6 md:mx-10 my-16 rounded-2xl bg-white  overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%]">

        {/* ── LEFT: Cover ── */}
        <div className="relative flex items-center justify-center bg-gray-50 px-10 py-12 min-h-[420px]">

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}

          {/* Featured label */}
          <span className="absolute top-4 right-4 bg-gray-900 text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
            Featured
          </span>

          <div className="rounded-xl shadow-2xl overflow-hidden bg-white p-2">
            <Image
              src={`${API_URL}${book.main_image}`}
              alt={book.title}
              width={240}
              height={340}
              priority
              className="h-72 w-auto object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* ── RIGHT: Details ── */}
        <div className="flex flex-col justify-center px-10 py-12 bg-white">

          {/* Label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Book of the Day
          </p>

          {/* Title */}
          <h2
            className="text-2xl md:text-3xl font-black text-gray-900 leading-snug mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {book.title}
          </h2>

          {/* Authors — clickable */}
          {book.authors?.length > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              by{" "}
              {book.authors.map((a, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-gray-300 mx-1">,</span>}
                  {a.slug ? (
                    <Link
                      href={`/author/${a.slug}`}
                      className="text-gray-800 font-semibold hover:text-amber-700 underline underline-offset-2 transition-colors"
                    >
                      {a.name}
                    </Link>
                  ) : (
                    <span className="text-gray-800 font-semibold">{a.name}</span>
                  )}
                </span>
              ))}
            </p>
          )}

          {/* Real reviews */}
          <div className="flex items-center gap-2 mb-5">
            <StarRating rating={book.avg_rating} />
            <span className="text-sm font-semibold text-gray-700">{book.avg_rating > 0 ? book.avg_rating.toFixed(1) : "—"}</span>
            <span className="text-xs text-gray-400">
              ({book.review_count} {book.review_count === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-5" />

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 mb-6">
            {book.description}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-7">
            <span className="text-3xl font-black text-gray-900">
              ₹{book.sell_price}
            </span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                ₹{book.price}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href={`/product/${book.slug}`}
              className="inline-block rounded-xl bg-gray-900 px-7 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors duration-200"
            >
              View Book
            </Link>
            <Link
              href={`/product/${book.slug}#reviews`}
              className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Read reviews
            </Link>
          </div>
        </div>

      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>
    </section>
  );
};

export default FeaturedBookSection;