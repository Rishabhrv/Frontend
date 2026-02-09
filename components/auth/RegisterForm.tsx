"use client";

import { useState } from "react";
import Link from "next/link";
import SocialAuthButtons from "./SocialAuthButtons";
import AlertPopup from "@/components/Popups/AlertPopup";


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setToastMsg(data.msg);
      setToastOpen(true);
      return;
    }

      setToastMsg("Account created successfully. Please login.");
      setToastOpen(true);

    // redirect to login
    window.location.href = "/login";
  };

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Full name"
          className="w-full border rounded px-4 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
          className="w-full border rounded px-4 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-4 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <div className="my-6 text-center text-xs text-gray-500">OR</div>

      <SocialAuthButtons />

      <p className="mt-6 text-sm text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
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
