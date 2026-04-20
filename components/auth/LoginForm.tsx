"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SocialAuthButtons from "./SocialAuthButtons";
import AlertPopup from "@/components/Popups/AlertPopup";
import { mergeGuestDataOnLogin } from "@/utils/guestStorage"; // ← add this

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const LOCKOUT_MINUTES = 15;

const LoginForm = () => {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg,  setToastMsg]  = useState("");
  const [error,     setError]     = useState("");
  const [locked,    setLocked]    = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setLocked(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || loading) return;

    setError("");
    setRemaining(null);
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.locked) {
          setLocked(true);
          setCountdown((data.minutesLeft ?? LOCKOUT_MINUTES) * 60);
        } else {
          setRemaining(data.remaining ?? null);
        }
        setError(data.msg || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);

      // ── Merge guest cart & wishlist into the newly logged-in account ──
      await mergeGuestDataOnLogin(data.token);

      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/";

    } catch {
      setToastMsg("Network error. Please try again.");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full border rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          disabled={locked}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          disabled={locked}
        />

        <div className="flex justify-between text-xs">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            locked
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}>
            <p className="font-medium">{error}</p>

            {locked && countdown > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-xs">
                  Try again in{" "}
                  <span className="font-mono font-bold text-sm">{fmt(countdown)}</span>
                </span>
              </div>
            )}

            {!locked && remaining !== null && remaining > 0 && (
              <p className="mt-1 text-xs">
                ⚠️ {remaining} attempt{remaining !== 1 ? "s" : ""} remaining before your account is temporarily locked.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={locked || loading}
          className={`w-full p-3 rounded font-semibold text-sm transition-all ${
            locked
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              : loading
              ? "bg-gray-800 text-white cursor-wait opacity-75"
              : "bg-black text-white hover:bg-gray-800 cursor-pointer"
          }`}
        >
          {locked
            ? `🔒 Locked — try again in ${fmt(countdown)}`
            : loading
            ? "Signing in…"
            : "Sign In"}
        </button>
      </form>

      <div className="my-6 text-center text-xs text-gray-500">OR</div>

      <SocialAuthButtons />

      <p className="mt-6 text-sm text-center">
        Don't have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Create one
        </Link>
      </p>

      <AlertPopup
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
};

export default LoginForm;