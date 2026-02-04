"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Layers, ChevronDown, LibraryBig, Users, ShoppingCart, Truck, BadgeCheck } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname() ?? "";

  const [openMenu, setOpenMenu] = useState<"products" | null>(null);

  /* AUTO OPEN PRODUCTS BASED ON URL */
  useEffect(() => {
    if (pathname.startsWith("/admin/product")) {
      setOpenMenu("products");
    } else {
      setOpenMenu(null);
    }
  }, [pathname]);

  return (
    <aside className="hidden w-55 bg-white border-r border-gray-200 lg:block">
      {/* LOGO */}
      <div className="flex items-center px-4 py-6 text-xl font-bold">
        AGPH
      </div>

      <nav className="px-3 text-sm">
        <p className="px-3 py-2 text-xs text-gray-400 uppercase">
          Menu
        </p>

        {/* PRODUCTS (WITH SUBMENU) */}
        <SidebarItem
          icon={<Box size={18} />}
          label="Products"
          isOpen={openMenu === "products"}
          onClick={() =>
            setOpenMenu(openMenu === "products" ? null : "products")
          }
        >
          <SubItem
            label="Product List"
            href="/admin/product/ProductsPage"
            active={pathname === "/admin/product/ProductsPage"}
          />
          <SubItem
            label="Add Product"
            href="/admin/product/AddProduct"
            active={pathname === "/admin/product/AddProduct"}
          />
        </SidebarItem>

        {/* CATEGORY (NO SUBMENU) */}
        <Link
          href="/admin/category/addcategories"
          className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
            ${
              pathname.startsWith("/admin/category")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <Layers size={18} />
          Category
        </Link>

        {/* AUTHOR (NO SUBMENU) */}
        <Link
          href="/admin/author/productauthortable"
          className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
            ${
              pathname.startsWith("/admin/author")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <LibraryBig  size={18} />
          Book Authors
        </Link>

        {/* USERS (NO SUBMENU) */}
        <Link
          href="/admin/users/UsersPage"
          className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
            ${
              pathname.startsWith("/admin/users")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <Users size={18} />
          Users
        </Link>

        {/* ORDERS (NO SUBMENU) */}
        <Link
          href="/admin/orders/OrdersPage"
          className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
            ${
              pathname.startsWith("/admin/orders")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <ShoppingCart size={18} />
          Orders
        </Link>

        {/* Shipping (NO SUBMENU) */}
        <Link
          href="/admin/shipping/ShippingZone"
          className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
            ${
              pathname.startsWith("/admin/shipping")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <Truck size={18} />
          Shipping
        </Link>

        {/* Subscription (NO SUBMENU) */}
        <Link
          href="/admin/subscriptions/SubscriptionPage"
          className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
            ${
              pathname.startsWith("/admin/subscriptions")
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <BadgeCheck size={18} />
          Subscription
        </Link>


      </nav>
    </aside>
  );
}

/* ---------- HELPERS ---------- */

function SidebarItem({
  icon,
  label,
  isOpen,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition
          ${
            isOpen
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100"
          }
        `}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </div>

        <ChevronDown
          size={16}
          className={`transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="ml-10 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function SubItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition
        ${
          active
            ? "bg-blue-50 text-blue-600 font-medium"
            : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
        }
      `}
    >
      {label}
    </Link>
  );
}
