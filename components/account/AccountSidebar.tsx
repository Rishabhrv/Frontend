"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, Tag, CreditCard } from "lucide-react";

const menu = [
  { name: "My Account",      href: "/account",                 icon: User        },
  { name: "My Orders",       href: "/account/orders",          icon: ShoppingBag },
  { name: "My Coupons",      href: "/account/coupons",         icon: Tag         },
  { name: "Payment History", href: "/account/payment-history", icon: CreditCard  },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white rounded-xl shadow-sm p-5 lg:p-6 sticky top-24 self-start border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">My Account</h2>
      <nav className="space-y-1 text-sm">
        {menu.map((item) => {
          const active = pathname === item.href;
          const Icon   = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                active
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}