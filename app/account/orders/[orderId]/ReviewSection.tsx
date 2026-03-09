"use client";

import { useState } from "react";
import { Star, Upload, X, ImagePlus, Send } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";

type Props = {
  productId: number;
  productTitle: string;
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function ReviewSection({ productId, productTitle }: Props) {
  const [rating,     setRating]     = useState(0);
  const [hover,      setHover]      = useState(0);
  const [comment,    setComment]    = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [preview,    setPreview]    = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [toastOpen,  setToastOpen]  = useState(false);
  const [toastMsg,   setToastMsg]   = useState("");

  const toast = (msg: string) => { setToastMsg(msg); setToastOpen(true); };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setImageFiles(files);
    setPreview(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitReview = async () => {
    if (!rating)        return toast("Please select a star rating.");
    if (!comment.trim()) return toast("Please write your review.");

    const token = localStorage.getItem("token");
    if (!token) return toast("Please log in to submit a review.");

    setSubmitting(true);

    const formData = new FormData();
    formData.append("product_id", productId.toString());
    formData.append("rating", rating.toString());
    formData.append("comment", comment);
    imageFiles.forEach((f) => formData.append("images", f));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) return toast("Failed to submit. Please try again.");

    setSubmitted(true);
    setRating(0);
    setComment("");
    setImageFiles([]);
    setPreview([]);
    toast("Review submitted for approval!");
  };

  const active = hover || rating;

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mb-4">
          <Send size={22} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-base mb-1">Review Submitted!</h3>
        <p className="text-sm text-gray-400">It will appear after approval.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-5 text-xs underline text-gray-500 hover:text-black transition"
        >
          Write another review
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Star rating ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Your Rating
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={28}
                className={`transition-colors ${
                  active >= n
                    ? "fill-black text-black"
                    : "fill-transparent text-gray-300"
                }`}
              />
            </button>
          ))}
          {/* Rating label */}
          <span className={`ml-2 text-sm font-medium transition-all ${active ? "text-black" : "text-transparent"}`}>
            {RATING_LABELS[active]}
          </span>
        </div>
      </div>

      {/* ── Comment ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Your Review
        </p>
        <textarea
          rows={4}
          placeholder="Share your thoughts about this book — what you loved, who you'd recommend it to…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition bg-gray-50"
        />
        <p className="text-right text-[10px] text-gray-300 mt-1">{comment.length} characters</p>
      </div>

      {/* ── Image upload ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
          Photos <span className="font-normal normal-case text-gray-400">(optional, up to 4)</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {/* Previews with remove button */}
          {preview.map((p, i) => (
            <div key={i} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-200 group">
              <img src={p} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}

          {/* Upload trigger */}
          {preview.length < 4 && (
            <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition group">
              <ImagePlus size={18} className="text-gray-300 group-hover:text-gray-500 transition mb-1" />
              <span className="text-[9px] text-gray-300 group-hover:text-gray-500 transition">Add photo</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImages}
              />
            </label>
          )}
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        onClick={submitReview}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Submitting…
          </>
        ) : (
          <>
            <Send size={15} />
            Submit Review
          </>
        )}
      </button>

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
  );
}