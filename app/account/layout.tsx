"use client";

import { useEffect, useState } from "react";
import AccountSidebar from "@/components/account/AccountSidebar";
import LoginRequired from "@/components/auth/LoginRequired";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, User, ShoppingBag, Tag, CreditCard, ChevronRight, LogOut } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const menu = [
  { name: "My Account",      href: "/account",                 icon: User,        desc: "Profile, address & password" },
  { name: "My Orders",       href: "/account/orders",          icon: ShoppingBag, desc: "Track, return or buy again"  },
  { name: "My Coupons",      href: "/account/coupons",         icon: Tag,         desc: "View your saved coupons"     },
  { name: "Payment History", href: "/account/payment-history", icon: CreditCard,  desc: "Transactions & receipts"     },
];

const pageTitles: Record<string, string> = {
  "/account":                 "My Account",
  "/account/orders":          "My Orders",
  "/account/coupons":         "My Coupons",
  "/account/payment-history": "Payment History",
};

type Profile = { name: string; email: string };

/* ── Mobile menu landing ── */
function MobileAccountMenu({ profile }: { profile: Profile | null }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-base font-bold text-gray-900">Account</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white mx-3 mt-3 rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
        <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg leading-none">
            {profile?.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{profile?.name ?? "User"}</p>
          <p className="text-xs text-gray-500 truncate">{profile?.email ?? ""}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-100">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Icon size={17} className="text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <LogOut size={17} className="text-red-500" />
          </div>
          <span className="text-sm font-medium">Log Out</span>
          <ChevronRight size={16} className="text-red-300 shrink-0 ml-auto" />
        </button>
      </div>
    </div>
  );
}

/* ── Mobile sub-page shell ── */
function MobileSubPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Sticky back header */}
      <div className="bg-white border-b border-gray-100 px-3 py-3 flex items-center gap-2 sticky top-0 z-20">
        <Link
          href="/account/menu"
          className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">{title}</h1>
      </div>

      <div className="p-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 min-w-0 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ LAYOUT ═══════════════════════ */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const [loading,    setLoading]    = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profile,    setProfile]    = useState<Profile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setAuthorized(false); setLoading(false); return; }

    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => { setAuthorized(true); setProfile({ name: data.name, email: data.email }); setLoading(false); })
      .catch(() => { localStorage.removeItem("token"); setAuthorized(false); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin w-5 h-5 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <span className="text-sm text-gray-500">Checking login…</span>
      </div>
    );
  }

  if (!authorized) return <LoginRequired />;

  // On mobile /account/menu shows the menu list
  // All other /account/* routes show the content with a back button
  const isMenuPage = pathname === "/account/menu";
  const pageTitle = pathname ? pageTitles[pathname] ?? "Account" : "Account";

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="md:hidden">
        {isMenuPage
          ? <MobileAccountMenu profile={profile} />
          : <MobileSubPage title={pageTitle}>{children}</MobileSubPage>
        }
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="grid grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-6 md:gap-8">
            <AccountSidebar />
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}