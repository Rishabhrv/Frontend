"use client";

import Link from "next/link";

export default function LoginRequired() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">

      <h2 className="text-2xl font-semibold mb-3">
        Please login to continue
      </h2>

      <p className="text-gray-600 mb-6">
        You must be logged in to access your account dashboard.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
        >
          Sign In
        </Link>

        <Link
          href="/register"
          className="border px-6 py-2 rounded hover:bg-gray-100"
        >
          Create Account
        </Link>
      </div>

    </div>
  );
}
