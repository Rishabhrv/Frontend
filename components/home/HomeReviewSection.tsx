"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  product_title: string;
  product_image: string;
  images: string[];
}

// ─── Star Row ─────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`w-4 h-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        >
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Single Card ─────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full select-none">

      {/* Quote icon + Stars */}
      <div className="flex items-start justify-between mb-4">
        <Quote size={28} className="text-gray-100 fill-gray-100 flex-shrink-0" />
        <Stars rating={review.rating} />
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-600 leading-relaxed italic flex-1 line-clamp-4 mb-5">
        "{review.comment}"
      </p>

      {/* Review images */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={`${API_URL}${img}`}
              alt="review"
              className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100"
            />
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 mb-4" />

      {/* User + Product */}
      <div className="flex items-center gap-3">
        {/* Product thumbnail */}
        {review.product_image && (
          <div className="flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
            <img
              src={`${API_URL}${review.product_image}`}
              alt={review.product_title}
              className="w-10 h-14 object-cover"
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{review.user_name}</p>
          <p className="text-xs text-gray-400 truncate">{review.product_title}</p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            {new Date(review.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function HomeReviewSection() {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [current, setCurrent]   = useState(0);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const VISIBLE = 3;
  const total   = reviews.length;

  useEffect(() => {
    fetch(`${API_URL}/api/reviews/latest`)
      .then((res) => res.json())
      .then((data) => setReviews(data.slice(0, 5)))
      .catch(() => setReviews([]));
  }, []);

  // ── Auto-slide ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (total <= VISIBLE) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (total - VISIBLE + 1));
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [total]);

  const goTo = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrent(idx);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (total - VISIBLE + 1));
    }, 3500);
  };

  const prev = () => goTo(current === 0 ? total - VISIBLE : current - 1);
  const next = () => goTo(current >= total - VISIBLE ? 0 : current + 1);

  if (reviews.length === 0) return null;

  const maxIndex = Math.max(0, total - VISIBLE);

  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Customer Reviews
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-gray-900 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What Our Readers Say
            </h2>
          </div>

          {/* Prev / Next */}
          {total > VISIBLE && (
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="w-9 h-9 cursor-pointer rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={next}
                className="w-9 h-9 cursor-pointer rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(calc(-${current} * (100% / ${VISIBLE} + (24px / ${VISIBLE}))))`,
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0"
                style={{ width: `calc((100% - ${(VISIBLE - 1) * 24}px) / ${VISIBLE})` }}
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        {total > VISIBLE && (
          <div className="flex justify-center gap-1.5 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full cursor-pointer transition-all duration-300 ${
                  i === current
                    ? "w-5 h-2 bg-gray-900"
                    : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}

      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>
    </section>
  );
}