"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function getToken() {
  return localStorage.getItem("admin_token");
}
function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

/* ─── Types ─── */
interface Review {
  id: number;
  user_name: string;
  user_email: string;
  product_id: number;
  product_title: string;
  rating: number;
  comment: string;
  status: "pending" | "approved";
  created_at: string;
  slug: string;
}

/* ─── Badge ─── */
function StatusBadge({ status }: { status: string }) {
  return status === "approved" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      Approved
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
      Pending
    </span>
  );
}

/* ─── Star display ─── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-base tracking-tight">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

/* ─── Star picker ─── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i + 1)}
          className={`text-2xl transition-colors cursor-pointer ${(hover || value) > i ? "text-yellow-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ─── Edit Modal ─── */
function EditModal({
  review,
  onClose,
  onSave,
}: {
  review: Review;
  onClose: () => void;
  onSave: (updated: Pick<Review, "id" | "rating" | "comment" | "status">) => void;
}) {
  const [rating, setRating]   = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [status, setStatus]   = useState(review.status);
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`${API_URL}/api/admin/reviews/${review.id}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, status }),
    });
    setSaving(false);
    onSave({ id: review.id, rating, comment, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Edit Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* User + Product info (read-only) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-xs">
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Customer</p>
              <p className="text-gray-700 font-medium">{review.user_name}</p>
              <p className="text-gray-400">{review.user_email}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Product</p>
              <p className="text-gray-700 font-medium leading-snug">{review.product_title}</p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Comment</label>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as "pending" | "approved")}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="border cursor-pointer border-gray-200 text-gray-600 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════ */
export default function ReviewTable() {
  const router = useRouter();

  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingReview, setEditing] = useState<Review | null>(null);

  // filters
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");
  const [filterRating, setFilterRating] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");

  /* ── Fetch ── */
  useEffect(() => {
    fetch(`${API_URL}/api/admin/reviews`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  /* ── Quick status toggle ── */
  const toggleStatus = async (review: Review) => {
    const newStatus = review.status === "approved" ? "pending" : "approved";
    await fetch(`${API_URL}/api/admin/reviews/${review.id}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setReviews((r) => r.map((x) => (x.id === review.id ? { ...x, status: newStatus } : x)));
  };

  /* ── Delete ── */
  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`${API_URL}/api/admin/reviews/${id}`, {
      method: "DELETE", headers: authHeaders(),
    });
    setReviews((r) => r.filter((x) => x.id !== id));
  };

  /* ── After edit save ── */
  const handleSaved = (updated: Pick<Review, "id" | "rating" | "comment" | "status">) => {
    setReviews((r) => r.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    setEditing(null);
  };

  /* ── Filtered list ── */
  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.user_name.toLowerCase().includes(q) ||
      r.user_email.toLowerCase().includes(q) ||
      r.product_title.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchRating = filterRating === "all" || r.rating === Number(filterRating);
    return matchSearch && matchStatus && matchRating;
  });

  /* ── Stats ── */
  const total    = reviews.length;
  const pending  = reviews.filter((r) => r.status === "pending").length;
  const approved = reviews.filter((r) => r.status === "approved").length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading reviews…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">

      {/* ── Page title ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reviews", value: total },
          { label: "Pending",       value: pending,  color: "text-yellow-600" },
          { label: "Approved",      value: approved, color: "text-green-600" },
          { label: "Avg. Rating",   value: avgRating, suffix: "/ 5" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <p className={`text-xl font-bold ${(s as any).color ?? "text-gray-800"}`}>
              {s.value}{(s as any).suffix && <span className="text-sm font-normal text-gray-400 ml-1">{(s as any).suffix}</span>}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search customer, product, comment…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>

        {/* Rating filter */}
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value as any)}
        >
          <option value="all">All Ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{"★".repeat(n)} ({n} star{n !== 1 ? "s" : ""})</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No reviews found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Customer", "Review", "Product", "Submitted On", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition align-top">

                    {/* Customer */}
                    <td className="px-4 py-4 min-w-[160px]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {r.user_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-xs leading-tight">{r.user_name}</p>
                          <p className="text-gray-400 text-xs">{r.user_email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Review */}
                    <td className="px-4 py-4 max-w-[340px]">
                      <Stars rating={r.rating} />
                      <p className="text-gray-600 text-xs mt-1.5 leading-relaxed line-clamp-3">{r.comment}</p>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-4 min-w-[160px]">
                      <button
                        onClick={() => router.push(`/product/${r.slug}`)}
                        className="text-blue-600 hover:underline text-xs font-medium text-left leading-snug cursor-pointer"
                      >
                        {r.product_title}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                      <br />
                      <span className="text-gray-300">
                        {new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {r.status === "pending" ? (
                          <button
                            onClick={() => toggleStatus(r)}
                            className="text-xs text-green-600 hover:underline font-medium cursor-pointer"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(r)}
                            className="text-xs text-yellow-600 hover:underline font-medium cursor-pointer"
                          >
                            Unapprove
                          </button>
                        )}
                        <button
                          onClick={() => setEditing(r)}
                          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteReview(r.id)}
                          className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingReview && (
        <EditModal
          review={editingReview}
          onClose={() => setEditing(null)}
          onSave={handleSaved}
        />
      )}
    </div>
  );
}