"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center p-8 ">
        <div className="flex justify-center mb-4">
          <AlertTriangle size={48} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold mb-2">404</h1>
        <h2 className="text-lg font-semibold mb-3">
          Page not found
        </h2>

        <p className="text-gray-600 mb-6">
          Sorry, the page you are looking for doesn’t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Go to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 rounded border border-gray-300 hover:bg-gray-100 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
