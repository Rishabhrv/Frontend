"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

/* ================= TYPES ================= */

type Review = {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type Props = {
  productId: number;
};


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= STAR RATING ================= */

const StarRating = ({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) => (
  <div className="flex gap-1 text-yellow-500">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={18}
        className={
          i <= value
            ? "fill-yellow-500 cursor-pointer"
            : "text-gray-300 cursor-pointer"
        }
        onClick={() => !readonly && onChange?.(i)}
      />
    ))}
  </div>
);

/* ================= MAIN COMPONENT ================= */

export default function ReviewSection({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  /* CHECK LOGIN */
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
  }, []);

  /* FETCH REVIEWS */
  useEffect(() => {
    fetch(`${API_URL}/api/reviews/product/${productId}`)
      .then((res) => res.json())
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [productId]);

  /* SUBMIT REVIEW */
  const submitReview = async () => {
    if (!rating || !comment.trim()) {
      alert("Please add rating and comment");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    await fetch(`${API_URL}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment,
      }),
    });

    alert("Review submitted for approval");
    setRating(0);
    setComment("");

    // Refresh reviews
    fetch(`${API_URL}/api/reviews/product/${productId}`)
      .then((res) => res.json())
      .then(setReviews);
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="mt-14">
      <h2 className="text-xl font-semibold mb-2">Customer Reviews</h2>

      {/* AVG RATING */}
      <div className="flex items-center gap-2 mb-4">
        <StarRating value={Math.round(Number(avgRating))} readonly />
        <span className="text-sm text-gray-600">
          {avgRating} ({reviews.length} reviews)
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Review your best experience.
      </p>

      {/* ADD REVIEW */}
      <div className="mb-6">
        {!loggedIn ? (
          <div className="border rounded-md p-4 text-sm text-gray-600">
            <a
              href="/login"
              className="underline font-medium text-black"
            >
              Login
            </a>{" "}
            to submit a review.
          </div>
        ) : (
          <>
            <StarRating value={rating} onChange={setRating} />

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-3 w-full border rounded-md p-3 text-sm"
              placeholder="Write your review"
            />

            <button
              onClick={submitReview}
              className="mt-3 bg-black text-white px-6 py-2 rounded"
            >
              Submit Review
            </button>
          </>
        )}
      </div>

      {/* REVIEW LIST */}
      <div className="space-y-6">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-gray-300 pb-4">
            <div className="flex justify-between">
              <span className="font-medium">{r.user_name}</span>
              <StarRating value={r.rating} readonly />
            </div>

            <p className="text-sm text-gray-600 mt-1">{r.comment}</p>

            <span className="text-xs text-gray-400">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
