"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { name: "My Account", href: "/account" },
  { name: "My Orders", href: "/account/orders" },
  { name: "My Coupons", href: "/account/coupons" },
  { name: "Payment History", href: "/account/payment-history" },
];

const AccountSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">My Account</h2>

      <nav className="space-y-2 text-sm">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-md transition ${
                active
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AccountSidebar;
