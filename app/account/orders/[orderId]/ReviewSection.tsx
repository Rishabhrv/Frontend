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
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
const [preview, setPreview] = useState<string[]>([]);


 const submitReview = async () => {
  if (!rating || !comment.trim()) {
    setToastMsg("Please give rating and review");
    setToastOpen(true);
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    setToastMsg("Please login first");
    setToastOpen(true);
    return;
  }

  const formData = new FormData();
  formData.append("product_id", productId.toString());
  formData.append("rating", rating.toString());
  formData.append("comment", comment);

  if (imageFiles.length > 0) {
    imageFiles.forEach(file => {
      formData.append("images", file);
    });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    setToastMsg("Failed to submit review");
    setToastOpen(true);
    return;
  }

  setToastMsg("Review submitted for approval");
  setToastOpen(true);

  setRating(0);
  setComment("");
  setImageFiles([]);
  setPreview([]);
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
<input
  type="file"
  multiple
  accept="image/*"
  onChange={(e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);

    const previews = files.map(file =>
      URL.createObjectURL(file)
    );
    setPreview(previews);
  }}
/>

<div className="flex gap-2">
  {preview.map((p, i) => (
    <img
      key={i}
      src={p}
      className="w-16 h-16 object-cover rounded border"
    />
  ))}
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
