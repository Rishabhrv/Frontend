"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Moon, Bell, ChevronDown } from "lucide-react";
import "../../app/globals.css";

type Admin = {
  id: number;
  name: string;
  email: string;
};

export default function Header() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);


useEffect(() => {
  const token = localStorage.getItem("admin_token");

  if (!token) {
    router.replace("/admin/login");
    return;
  }

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then((admin) => {
      setAdmin(admin); // ✅ verified admin
    })
    .catch(() => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin");
      router.replace("/admin/login");
    });
}, [router]);



  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin");
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100">
          <Menu size={18} />
        </button>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">


        <button className="relative rounded-full border border-gray-200 p-2 hover:bg-gray-100">
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500" />
        </button>

        {/* ADMIN USER */}
        {/* ADMIN USER */}
<div className="relative">
  <button
    onClick={() => setUserMenuOpen(v => !v)}
    className="flex items-center gap-3 cursor-pointer"
  >
    <span className="hidden md:block text-sm font-medium text-gray-700">
      {admin?.name || "Admin"}
    </span>
    <ChevronDown size={16} className="text-gray-500" />
  </button>

  {userMenuOpen && (
    <div className="absolute right-0 mt-2 w-32 rounded-lg border bg-white shadow-lg">
      <button
        onClick={logout}
        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
      >
        Logout
      </button>
    </div>
  )}
</div>

      </div>
    </header>
  );
}
