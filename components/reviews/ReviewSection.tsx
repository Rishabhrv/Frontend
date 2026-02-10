"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";


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
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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
      setToastMsg("Please add rating and comment");
      setToastOpen(true);
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

      setToastMsg("Review submitted for approval");
      setToastOpen(true);
    
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
                            <AlertPopup
                              open={toastOpen}
                              message={toastMsg}
                              onClose={() => setToastOpen(false)}
                            />
    </div>
  );
}
