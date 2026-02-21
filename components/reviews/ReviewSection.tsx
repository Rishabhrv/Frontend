"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

/* ─── Types ─── */
type Review = {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  images?: string[];
};

type Props = {
  productId: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ─── Helpers ─── */
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

/* ─── Star display ─── */
function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= value ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

/* ─── Rating breakdown bar ─── */
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-3 text-right shrink-0">{star}</span>
      <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right shrink-0 text-gray-400">{count}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function ReviewSection({ productId }: Props) {
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews/product/${productId}`)
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [productId]);

  /* ── Derived stats ── */
  const total     = reviews.length;
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mt-16">

      {/* ── Heading ── */}
      <div className="flex items-center gap-2 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Reviews</h2>
        <span className="text-sm text-gray-400 mt-0.5">({total})</span>
      </div>

      {/* ── Summary + breakdown ── */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 rounded-2xl p-6 mb-10">

          {/* Big avg */}
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-amber-200 sm:pr-6 shrink-0">
            <span className="text-6xl font-bold text-gray-900 leading-none">{avgRating.toFixed(1)}</span>
            <div className="mt-2"><StarDisplay value={Math.round(avgRating)} size={18} /></div>
            <span className="text-xs text-gray-500 mt-1.5">{total} review{total !== 1 ? "s" : ""}</span>
          </div>

          {/* Bars */}
          <div className="flex-1 flex flex-col justify-center gap-2.5">
            {breakdown.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={total} />
            ))}
          </div>
        </div>
      )}

      {/* ── Review cards ── */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white  rounded-2xl p-5"
          >
            {/* Header row */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(r.user_name)}`}>
                {initials(r.user_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{r.user_name}</span>
                  <time className="text-xs text-gray-400 shrink-0">
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </time>
                </div>
                <div className="mt-0.5"><StarDisplay value={r.rating} size={13} /></div>
              </div>
            </div>

            {/* Comment */}
            <p className="text-sm text-gray-600 leading-relaxed pl-12">{r.comment}</p>

            {/* Images */}
            {r.images && r.images.length > 0 && (
              <div className="flex gap-2 mt-3 pl-12 flex-wrap">
                {r.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setExpandedImg(`${API_URL}${img}`)}
                    className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-amber-400 transition cursor-pointer shrink-0"
                  >
                    <img src={`${API_URL}${img}`} alt="review" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {total === 0 && (
          <div className="text-center py-14 text-gray-400">
            <Star size={36} className="mx-auto mb-3 fill-gray-100 text-gray-200" />
            <p className="text-sm">No reviews yet for this product.</p>
          </div>
        )}
      </div>

      {/* ── Image lightbox ── */}
{expandedImg && (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
    onClick={() => setExpandedImg(null)}
  >
    <div className="relative max-w-5xl w-full flex justify-center">
      <img
        src={expandedImg}
        alt="enlarged"
        className="w-auto h-auto max-h-[90vh] max-w-full rounded-xl shadow-2xl"
      />
      <button
        onClick={() => setExpandedImg(null)}
        className="absolute top-3 right-3 bg-white/80 hover:bg-white text-black rounded-full px-3 py-2 text-sm cursor-pointer transition"
      >
        ✕
      </button>
    </div>
  </div>
)}

    </div>
  );
}