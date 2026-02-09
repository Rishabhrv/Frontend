"use client";

import { useState } from "react";
import Link from "next/link";
import SocialAuthButtons from "./SocialAuthButtons";
import AlertPopup from "@/components/Popups/AlertPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setToastMsg(data.msg || "Login failed");
      setToastOpen(true);
      return;
    }

    localStorage.setItem("token", data.token);

    // 🔥 NOTIFY HEADER
    window.dispatchEvent(new Event("auth-change"));

    window.location.href = "/";
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full border rounded px-4 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-4 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-between text-xs">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
          Sign In
        </button>
      </form>

      <div className="my-6 text-center text-xs text-gray-500">OR</div>

      <SocialAuthButtons />

      <p className="mt-6 text-sm text-center">
        Don’t have an account?{" "}
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
