"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SocialAuthButtons from "./SocialAuthButtons";
import AlertPopup from "@/components/Popups/AlertPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Step = "details" | "otp";

const RegisterForm = () => {
  const [step,     setStep]     = useState<Step>("details");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);
  const [loading,  setLoading]  = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg,  setToastMsg]  = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* countdown for resend button */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res  = await fetch(`${API_URL}/api/auth/send-register-otp`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setToastMsg(data.msg);
      setToastOpen(true);
      return;
    }

    setStep("otp");
    setResendTimer(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  /* ── OTP input handling ── */
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx]  = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ── Step 2: Verify OTP + Register ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setToastMsg("Please enter the complete 6-digit code.");
      setToastOpen(true);
      return;
    }

    setLoading(true);
    const res  = await fetch(`${API_URL}/api/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password, otp: otpString }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setToastMsg(data.msg);
      setToastOpen(true);
      return;
    }

    setToastMsg("Account created! Redirecting to login…");
    setToastOpen(true);
    setTimeout(() => (window.location.href = "/login"), 1500);
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    const res  = await fetch(`${API_URL}/api/auth/send-register-otp`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    setToastMsg(res.ok ? "New OTP sent!" : data.msg);
    setToastOpen(true);
    if (res.ok) {
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const inputCls =
    "w-110 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 " +
    "focus:border-gray-400 transition bg-white";

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <>
      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors
          ${step === "details" ? "text-black" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold
            ${step === "details" ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
            1
          </span>
          Your Details
        </div>

        <div className={`flex-1 h-px ${step === "otp" ? "bg-black" : "bg-gray-200"} transition-colors`} />

        <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors
          ${step === "otp" ? "text-black" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold
            ${step === "otp" ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
            2
          </span>
          Verify Email
        </div>
      </div>

      {/* ── STEP 1: Details ── */}
      {step === "details" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className={inputCls}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className={inputCls}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              className={inputCls}
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-semibold
                       hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sending code…
              </>
            ) : (
              "Send Verification Code →"
            )}
          </button>
        </form>
      )}

      {/* ── STEP 2: OTP ── */}
      {step === "otp" && (
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-gray-900">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => { setStep("details"); setOtp(["","","","","",""]); }}
              className="text-xs text-blue-600 hover:underline mt-1 cursor-pointer"
            >
              Change email
            </button>
          </div>

          {/* OTP boxes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3">Enter verification code</label>
            <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  className={`w-11 h-12 text-center text-lg font-bold border rounded-lg
                    transition focus:outline-none focus:ring-2
                    ${digit
                      ? "border-black ring-0 bg-black text-white"
                      : "border-gray-200 focus:ring-black/10 focus:border-gray-400 bg-white text-gray-800"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Resend */}
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-xs text-gray-400">
                Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50 cursor-pointer"
              >
                Didn't receive it? Resend code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length < 6}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-semibold
                       hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating account…
              </>
            ) : (
              "Verify & Create Account"
            )}
          </button>
        </form>
      )}

      {/* Divider + social – only on step 1 */}
      {step === "details" && (
        <>
          <div className="my-6 text-center text-xs text-gray-400 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            OR
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <SocialAuthButtons />
        </>
      )}

      <p className="mt-6 text-sm text-center text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-black font-medium hover:underline">
          Sign in
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

export default RegisterForm;