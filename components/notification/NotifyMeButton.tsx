"use client";
import { useState } from "react";
import { Bell, X, CheckCircle } from "lucide-react";

type Props = {
  productId: number;
  productTitle: string;
};

export default function NotifyMeButton({ productId, productTitle }: Props) {
  const [open, setOpen]       = useState(false);
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!email.trim())              { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stock-notifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 border-2 border-gray-800 text-gray-800 font-semibold py-3 px-6 rounded-md hover:bg-gray-800 hover:text-white transition-colors cursor-pointer text-sm"
      >
        <Bell size={16} />
        Notify when available
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 z-10">
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {done ? (
              /* ── Success ── */
              <div className="text-center py-2">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">You're on the list!</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We'll email <strong>{email}</strong> as soon as{" "}
                  <strong>{productTitle}</strong> is back in stock.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-5 w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="mb-5">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">Notify me when available</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    We'll send you one email the moment{" "}
                    <strong>{productTitle}</strong> is back in stock.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="you@example.com"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition ${
                      error ? "border-red-400" : "border-gray-300"
                    }`}
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-4 w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? "Submitting…" : "Notify Me"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}