"use client";

import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="We’ll send you a reset link"
    >
      <form className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border rounded px-4 py-2 text-sm"
        />

        <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          Send Reset Link
        </button>
      </form>
    </AuthLayout>
  );
}
