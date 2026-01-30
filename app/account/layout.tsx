"use client";

import { useEffect, useState } from "react";
import AccountSidebar from "@/components/account/AccountSidebar";
import LoginRequired from "@/components/auth/LoginRequired";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setAuthorized(true);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setAuthorized(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking login...
      </div>
    );
  }

  // 🚫 NOT LOGGED IN
  if (!authorized) {
    return <LoginRequired />;
  }

  // ✅ LOGGED IN
  return (
    <div className=" bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">

        {/* SIDEBAR */}
        <AccountSidebar />

        {/* CONTENT */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {children}
        </div>

      </div>
    </div>
  );
}
