"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AlertPopup from "@/components/Popups/AlertPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showError = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
  };

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return showError("Please enter your email.");
    setLoading(true);

    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return showError(data.msg || "Failed to send OTP.");
    setStep("otp");
  };

  /* ── OTP input handling ── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) return showError("Please enter the complete 6-digit OTP.");
    setLoading(true);

    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otpValue }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return showError(data.msg || "OTP verification failed.");
    setStep("reset");
  };

  /* ── Step 3: Reset Password ── */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return showError("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return showError("Passwords do not match.");
    setLoading(true);

    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otp.join(""), newPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) return showError(data.msg || "Failed to reset password.");
    setStep("done");
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return showError(data.msg || "Failed to resend OTP.");
    setOtp(["", "", "", "", "", ""]);
    setToastMsg("A new OTP has been sent.");
    setToastOpen(true);
  };

  return (
    <AuthLayout
      title={
        step === "email" ? "Forgot Password" :
        step === "otp"   ? "Enter OTP" :
        step === "reset" ? "Set New Password" :
        "Password Reset!"
      }
      subtitle={
        step === "email" ? "We'll send a 6-digit code to your email" :
        step === "otp"   ? `Code sent to ${email}` :
        step === "reset" ? "Choose a strong new password" :
        "Your password has been changed successfully"
      }
    >
      {/* ── Step 1: Email ── */}
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-60 transition"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
          <p className="text-sm text-center mt-2">
            <Link href="/login" className="text-blue-600 hover:underline">
              ← Back to Login
            </Link>
          </p>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {/* OTP boxes */}
          <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:border-black transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-60 transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="text-center text-sm text-gray-500">
            Didn't receive it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>

          <p className="text-sm text-center">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-gray-500 hover:underline"
            >
              ← Change email
            </button>
          </p>
        </form>
      )}

      {/* ── Step 3: New Password ── */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="New password"
              className="w-full border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full border rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Password match indicator */}
          {confirmPassword && (
            <p className={`text-xs ${newPassword === confirmPassword ? "text-green-600" : "text-red-500"}`}>
              {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-60 transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <p className="text-gray-600 text-sm">
            Your password has been reset. You can now log in with your new password.
          </p>
          <Link
            href="/login"
            className="block w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition text-center"
          >
            Go to Login
          </Link>
        </div>
      )}

      <AlertPopup
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </AuthLayout>
  );
}