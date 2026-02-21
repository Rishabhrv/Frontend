"use client";

import { useEffect, useState } from "react";

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

export default function HomeReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews/latest`)
      .then(res => res.json())
      .then(data => setReviews(data.slice(0, 3))) // show 3 cards
      .catch(() => setReviews([]));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-14 px-6">
      <div className="max-w-6xl mx-auto text-center">

        <h2
          className="text-3xl md:text-4xl font-black text-gray-900 leading-tight pl-2 pb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          What Our Happy User's Say!
        </h2>


        <p className="text-gray-500 max-w-2xl mx-auto mb-16">
          Smarter, faster, and way more fun — here’s what makes our bookstore
          the ultimate companion for readers.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {reviews.map((review) => (
            <div
  key={review.id}
  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition duration-300"
>
  {/* Product Image */}


  {/* Stars */}
  <div className="flex gap-1 mb-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        className={`w-5 h-5 ${
          i <= review.rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        }`}
      >
        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
      </svg>
    ))}
  </div>

  {/* Review Text */}
  <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
    {review.comment}
  </p>

  {/* Review Uploaded Images */}
  {review.images?.length > 0 && (
    <div className="flex gap-3 mb-5 overflow-x-auto">
      {review.images.map((img, i) => (
        <img
          key={i}
          src={`${API_URL}${img}`}
          alt="review"
          className="w-16 object-cover rounded-xs"
        />
      ))}
    </div>
  )}

  {/* User Info */}
  <div className="flex items-center gap-4">
    <div className="">
        {review.product_image && (
          <img
            src={`${API_URL}${review.product_image}`}
            alt={review.product_title}
            className="w-30  object-cover rounded-xs"
          />
        )}
    </div>

    <div>
      <p className="font-semibold text-gray-900 text-sm">
        {review.user_name}
      </p>
      <p className="text-gray-400 text-xs">
        {review.product_title}
      </p>
    </div>
  </div>
</div>
          ))}
        </div>

      </div>
    </section>
  );
}