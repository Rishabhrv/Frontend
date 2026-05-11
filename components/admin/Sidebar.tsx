"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box, Layers, ChevronDown, LibraryBig, Users, ShoppingCart,
  Truck, BadgeCheck, BadgeIndianRupee, BadgePercent,
  Megaphone, UserStar, AlignVerticalDistributeStart, ShieldOff,
  LucideIcon,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";


type PageKey =
  | "products" | "orders"   | "category" | "subject"
  | "author"   | "users"    | "reviews"  | "shipping"
  | "subscriptions" | "payment" | "coupons" | "ads" 
  | "settings";

interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  href: string;
  pathPrefix: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "orders",        label: "Orders",       icon: ShoppingCart,                 href: "/admin/orders/OrdersPage",             pathPrefix: "/admin/orders"         },
  { key: "category",      label: "Category",     icon: Layers,                       href: "/admin/category/addcategories",        pathPrefix: "/admin/category"       },
  { key: "subject",       label: "Subject",      icon: AlignVerticalDistributeStart, href: "/admin/subject/SubjectPage",           pathPrefix: "/admin/subject"        },
  { key: "author",        label: "Book Authors", icon: LibraryBig,                   href: "/admin/author/productauthortable",     pathPrefix: "/admin/author"         },
  { key: "users",         label: "Users",        icon: Users,                        href: "/admin/users/UsersPage",               pathPrefix: "/admin/users"          },
  { key: "reviews",       label: "Review",       icon: UserStar,                     href: "/admin/reviews/ReviewsPage",           pathPrefix: "/admin/reviews"        },
  { key: "shipping",      label: "Shipping",     icon: Truck,                        href: "/admin/shipping/ShippingZone",         pathPrefix: "/admin/shipping"       },
  { key: "subscriptions", label: "Subscription", icon: BadgeCheck,                   href: "/admin/subscriptions/SubscriptionPage",pathPrefix: "/admin/subscriptions" },
  { key: "payment",       label: "Payment",      icon: BadgeIndianRupee,             href: "/admin/payment/PaymentPage",           pathPrefix: "/admin/payment"        },
  { key: "coupons",       label: "Coupons",      icon: BadgePercent,                 href: "/admin/coupon/CouponPage",             pathPrefix: "/admin/coupon"         },
  { key: "ads",           label: "Ads",          icon: Megaphone,                    href: "/admin/ads/AdPage",                    pathPrefix: "/admin/ads"            },
  { key: "settings",      label: "Settings",     icon: ShieldOff,                    href: "/admin/settings/SettingsPage",         pathPrefix: "/admin/settings"       },

];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [openMenu, setOpenMenu] = useState<"products" | null>(null);
  const { can, loading } = usePermissions();

  useEffect(() => {
    if (pathname.startsWith("/admin/product")) setOpenMenu("products");
    else setOpenMenu(null);
  }, [pathname]);

  if (loading) {
    return (
      <aside className="hidden w-55 border-r border-gray-200 bg-white lg:block min-h-screen">
        <div className="flex items-center px-4 py-6 text-xl font-bold">AGPH</div>
        <div className="space-y-2 px-4 pt-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </aside>
    );
  }

  const noAccess =
    !can("products") && NAV_ITEMS.every(({ key }) => !can(key));

  return (
    <aside className="hidden w-55 bg-white border-r border-gray-200 lg:block min-h-screen">
      {/* LOGO */}
      <div className="flex items-center px-4 py-6 text-xl font-bold">AGPH</div>

      <nav className="px-3 text-sm">
        <p className="px-3 py-2 text-xs text-gray-400 uppercase">Menu</p>

        {/* PRODUCTS */}
        {can("products") && (
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
        )}

        {/* DYNAMIC NAV ITEMS */}
        {NAV_ITEMS.map(({ key, label, icon: Icon, href, pathPrefix }) =>
          can(key) ? (
            <NavLink
              key={key}
              href={href}
              active={pathname.startsWith(pathPrefix)}
              icon={<Icon size={18} />}
              label={label}
            />
          ) : null
        )}

        {/* NO ACCESS STATE */}
        {noAccess && (
          <div className="mt-4 flex flex-col items-center gap-2 px-4 py-6 text-center text-gray-400">
            <ShieldOff size={28} />
            <p className="text-xs">
              No pages assigned.
              <br />
              Contact super admin.
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}

/* ── Helpers ─────────────────────────────────────────── */

interface NavLinkProps {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}

function NavLink({ href, active, icon, label }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition
        ${active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-100"
        }`}
    >
      {icon}
      {label}
    </Link>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

function SidebarItem({ icon, label, isOpen, onClick, children }: SidebarItemProps) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition cursor-pointer
          ${isOpen
            ? "bg-blue-50 text-blue-600"
            : "text-gray-700 hover:bg-gray-100"
          }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="ml-10 mt-1 space-y-1">{children}</div>
      )}
    </div>
  );
}

interface SubItemProps {
  label: string;
  href: string;
  active?: boolean;
}

function SubItem({ label, href, active }: SubItemProps) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition
        ${active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
        }`}
    >
      {label}
    </Link>
  );
}