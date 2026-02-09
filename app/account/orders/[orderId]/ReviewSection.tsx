"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";


type Props = {
  productId: number;
  productTitle: string;
};

export default function ReviewSection({ productId, productTitle }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const submitReview = () => {
    if (!rating || !comment.trim()) {
      setToastMsg("Please give rating and review");
      setToastOpen(true);
      return;
    }

    // 🔗 connect backend later
    console.log({
      productId,
      rating,
      comment,
      image,
    });

    setToastMsg("Review submitted (demo)");
    setToastOpen(true);
    setRating(0);
    setComment("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="border border-gray-200 rounded-md p-5 bg-white mt-4">


      {/* ⭐ STAR RATING */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            size={22}
            className={`cursor-pointer ${
              (hover || rating) >= n
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          />
        ))}
      </div>

      {/* 📝 COMMENT */}
      <textarea
        className="w-full border border-gray-300 rounded-md p-2 text-sm mb-3"
        rows={3}
        placeholder="Write your review..."
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      {/* 🖼 IMAGE UPLOAD */}
      <div className="flex items-center gap-3 mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              setImage(file);
              setPreview(URL.createObjectURL(file));
            }
          }}
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-16 h-16 object-cover rounded border"
          />
        )}
      </div>

      {/* 🚀 SUBMIT */}
      <button
        onClick={submitReview}
        className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
      >
        Submit review
      </button>

                            <AlertPopup
                              open={toastOpen}
                              message={toastMsg}
                              onClose={() => setToastOpen(false)}
                            />
    </div>
  );
}
