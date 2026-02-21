"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function getToken() {
  return localStorage.getItem("admin_token");
}
function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

type Step = "idle" | "sending" | "otp" | "verifying" | "done";

interface Props {
  adminEmail: string;
  onClose: () => void;
  onVerified: () => void; // called when OTP is confirmed — parent unlocks the form
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

export default function SuperAdminOtpModal({
  adminEmail,
  onClose,
  onVerified,
  onError,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [otp, setOtp]   = useState(["", "", "", "", "", ""]);

  /* ── Send OTP ── */
  const sendOtp = async () => {
    setStep("sending");
    try {
      const res = await fetch(`${API_URL}/api/admin/send-change-password-otp`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      if (!res.ok) { onError(data.msg || "Failed to send OTP"); setStep("idle"); return; }
      setStep("otp");
    } catch {
      onError("Network error"); setStep("idle");
    }
  };

  /* ── OTP helpers ── */
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const updated = [...otp];
    updated[i] = val;
    setOtp(updated);
    if (val && i < 5) document.getElementById(`sa-otp-${i + 1}`)?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      document.getElementById(`sa-otp-${i - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) { setOtp(paste.split("")); document.getElementById("sa-otp-5")?.focus(); }
  };

  /* ── Verify OTP ── */
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { onError("Please enter the complete 6-digit OTP"); return; }
    setStep("verifying");
    try {
      const res = await fetch(`${API_URL}/api/admin/verify-change-password-otp`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { onError(data.msg || "Invalid OTP"); setStep("otp"); return; }
      // OTP verified — notify parent, close modal
      onVerified();
      onClose();
    } catch {
      onError("Network error"); setStep("otp");
    }
  };

  /* ── Resend ── */
  const resendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    setStep("sending");
    const res = await fetch(`${API_URL}/api/admin/send-change-password-otp`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail }),
    });
    const data = await res.json();
    if (!res.ok) { onError(data.msg || "Failed to resend"); setStep("otp"); return; }
    setStep("otp");
    onSuccess("New OTP sent to your email");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 relative">

        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-xl font-light cursor-pointer"
          aria-label="Close">✕</button>

        {/* idle */}
        {step === "idle" && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Verify Your Identity</h3>
            <p className="text-sm text-gray-500 mb-2">
              To edit the Super Admin profile, verify via OTP.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A 6-digit code will be sent to<br />
              <span className="font-medium text-gray-700">{adminEmail}</span>
            </p>
            <button onClick={sendOtp}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2.5 rounded-lg transition cursor-pointer">
              Send Verification OTP
            </button>
          </div>
        )}

        {/* sending spinner */}
        {step === "sending" && (
          <div className="text-center py-8">
            <svg className="animate-spin w-8 h-8 text-yellow-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm text-gray-500">Sending OTP to your email…</p>
          </div>
        )}

        {/* OTP input */}
        {(step === "otp" || step === "verifying") && (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1 text-center">Enter OTP</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Code sent to <span className="font-medium text-gray-700">{adminEmail}</span>
            </p>
            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input key={i} id={`sa-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={step === "verifying"}
                  className="w-11 h-12 text-center text-xl font-semibold border-2 rounded-xl focus:outline-none focus:border-yellow-500 transition disabled:opacity-50"
                />
              ))}
            </div>
            <button onClick={verifyOtp} disabled={step === "verifying"}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition cursor-pointer mb-3">
              {step === "verifying" ? "Verifying…" : "Verify & Unlock Profile"}
            </button>
            <div className="text-center text-sm text-gray-500">
              Didn't receive it?{" "}
              <button onClick={resendOtp} disabled={step === "verifying"}
                className="text-yellow-600 hover:underline disabled:opacity-50 cursor-pointer">
                Resend OTP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}