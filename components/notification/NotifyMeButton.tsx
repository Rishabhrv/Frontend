"use client";
import { useEffect, useState } from "react";
import { Bell, X, CheckCircle, Loader2 } from "lucide-react";

type Props = {
  productId: number;
  productTitle: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function NotifyMeButton({ productId, productTitle }: Props) {
  const [open, setOpen]         = useState(false);
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null); // logged-in user's email

  /* ── Fetch logged-in user's email on mount ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (data?.email) setUserEmail(data.email); })
      .catch(() => {});
  }, []);

  const submit = async (emailToUse: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/stock-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, email: emailToUse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      setEmail(emailToUse); // so success message shows the right email
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleClick = () => {
    if (userEmail) {
      // Logged in — submit immediately, show result in modal
      setOpen(true);
      submit(userEmail);
    } else {
      // Guest — open modal for manual email entry
      setOpen(true);
    }
  };

  const handleGuestSubmit = () => {
    if (!email.trim())               { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    submit(email);
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    // Reset for re-use (keep done state until unmount)
    setTimeout(() => { setDone(false); setError(""); setEmail(""); }, 300);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading && !open} // prevent double-click before modal opens
        className="flex items-center justify-center gap-2 border-2 border-gray-800 text-gray-800 font-semibold py-3 px-6 rounded-md hover:bg-gray-800 hover:text-white transition-colors cursor-pointer text-sm disabled:opacity-60"
      >
        <Bell size={16} />
        Notify when available
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 z-10">
            <button
              onClick={handleClose}
              disabled={loading}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Loading (logged-in fast submit) ── */}
            {loading && !done && (
              <div className="text-center py-6">
                <Loader2 className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-500">Setting up your alert…</p>
              </div>
            )}

            {/* ── Success ── */}
            {done && (
              <div className="text-center py-2">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">You're on the list!</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We'll email <strong>{userEmail || email}</strong> as soon as{" "}
                  <strong>{productTitle}</strong> is back in stock.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-5 w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* ── Guest form (not logged in, not loading, not done) ── */}
            {!userEmail && !loading && !done && (
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
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleGuestSubmit()}
                    placeholder="you@example.com"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition ${
                      error ? "border-red-400" : "border-gray-300"
                    }`}
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <button
                  onClick={handleGuestSubmit}
                  className="mt-4 w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Notify Me
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}