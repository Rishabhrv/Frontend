"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function LoginRequired() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">

      {/* Icon */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black flex items-center justify-center mb-5 shadow-lg">
        <Lock size={24} className="text-white" strokeWidth={2} />
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
        Login Required
      </h2>

      <p className="text-sm sm:text-base text-gray-500 max-w-xs sm:max-w-sm mb-7 leading-relaxed">
        You must be logged in to access your account dashboard.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
        <Link
          href="/login"
          className="flex-1 sm:flex-none text-center bg-black text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-gray-800 active:scale-95 transition-all"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="flex-1 sm:flex-none text-center border border-gray-200 text-gray-700 text-sm font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
        >
          Create Account
        </Link>
      </div>

    </div>
  );
}