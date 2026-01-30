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


  // 🔐 Protect admin pages
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin");

    if (!token || !adminData) {
      router.push("/admin/login");
      return;
    }

    try {
      setAdmin(JSON.parse(adminData));
    } catch {
      router.push("/admin/login");
    }
  }, []);

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

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search or type command..."
            className="h-11 w-[320px] rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-16 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500">
            ⌘ K
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <button className="rounded-full border border-gray-200 p-2 hover:bg-gray-100">
          <Moon size={18} />
        </button>

        <button className="relative rounded-full border border-gray-200 p-2 hover:bg-gray-100">
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500" />
        </button>

        {/* ADMIN USER */}
        <div className="relative group">
          <div className="flex items-center gap-3 cursor-pointer">
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {admin?.name || "Admin"}
            </span>
            <ChevronDown size={16} className="text-gray-500" />
          </div>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-32 rounded-lg border bg-white shadow-lg hidden group-hover:block">
            <button
              onClick={logout}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
