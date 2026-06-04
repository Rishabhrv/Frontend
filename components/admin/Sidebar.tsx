"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box, Layers, ChevronDown, LibraryBig, Users, ShoppingCart,
  Truck, BadgeCheck, BadgeIndianRupee, BadgePercent,
  Megaphone, UserStar, AlignVerticalDistributeStart, ShieldOff,
  LucideIcon, ChartArea, ChartLine,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type PageKey =
  | "products" | "orders"   | "category" | "subject"
  | "author"   | "users"    | "reviews"  | "shipping"
  | "subscriptions" | "payment" | "coupons" | "ads" 
  | "settings" | "analytics" | "ebook-analytics";

interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  href: string;
  pathPrefix: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "category",            label: "Category",          icon: Layers,                       href: "/admin/category/addcategories",                   pathPrefix: "/admin/category"             },
  { key: "subject",             label: "Subject",           icon: AlignVerticalDistributeStart, href: "/admin/subject/SubjectPage",                      pathPrefix: "/admin/subject"              },
  { key: "author",              label: "Book Authors",      icon: LibraryBig,                   href: "/admin/author/productauthortable",                pathPrefix: "/admin/author"               },
  { key: "users",               label: "Users",             icon: Users,                        href: "/admin/users/UsersPage",                          pathPrefix: "/admin/users"                },
  { key: "reviews",             label: "Review",            icon: UserStar,                     href: "/admin/reviews/ReviewsPage",                      pathPrefix: "/admin/reviews"              },
  { key: "shipping",            label: "Shipping",          icon: Truck,                        href: "/admin/shipping/ShippingZone",                    pathPrefix: "/admin/shipping"             },
  { key: "subscriptions",       label: "Subscription",      icon: BadgeCheck,                   href: "/admin/subscriptions/SubscriptionPage",           pathPrefix: "/admin/subscriptions"        },
  { key: "payment",             label: "Payment",           icon: BadgeIndianRupee,             href: "/admin/payment/PaymentPage",                      pathPrefix: "/admin/payment"              },
  { key: "coupons",             label: "Coupons",           icon: BadgePercent,                 href: "/admin/coupon/CouponPage",                        pathPrefix: "/admin/coupon"               },
  { key: "ads",                 label: "Ads",               icon: Megaphone,                    href: "/admin/ads/AdPage",                               pathPrefix: "/admin/ads"                  },
  { key: "settings",            label: "Settings",          icon: ShieldOff,                    href: "/admin/settings/SettingsPage",                    pathPrefix: "/admin/settings"             },
  { key: "analytics",           label: "Analytics",         icon: ChartArea,                    href: "/admin/analytics/AnalyticsPage",                  pathPrefix: "/admin/analytics"            },
  { key: "ebook-analytics",     label: "EbookAnalytics",    icon: ChartLine,                    href: "/admin/ebook-analytics/EbookAnalyticsPage",       pathPrefix: "/admin/ebook-analytics"      },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";

  const [openMenu, setOpenMenu] = useState<"products" | "orders" | null>(null);
  
  // Badge Counter States
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  
  const { can, loading } = usePermissions();

  // Highlight current category active tabs
  useEffect(() => {
    if (pathname.startsWith("/admin/product")) {
      setOpenMenu("products");
    } 
    else if (pathname.startsWith("/admin/order")) {
      setOpenMenu("orders");
    } 
    else {
      setOpenMenu(null);
    }
  }, [pathname]);

  // Fetch count of items awaiting dispatch
  useEffect(() => {
    if (can("orders")) {
      fetch(`${API_URL}/api/orders/count/new-confirmed`)
        .then(res => res.json())
        .then(data => setNewOrdersCount(data.count || 0))
        .catch(err => console.error("Error fetching order count:", err));
    }
  }, [can, pathname]);

  // Fetch count of pending reviews
  useEffect(() => {
    if (can("reviews")) {
      fetch(`${API_URL}/api/reviews/count/pending`)
        .then(res => res.json())
        .then(data => setPendingReviewsCount(data.count || 0))
        .catch(err => console.error("Error fetching reviews count:", err));
    }
  }, [can, pathname]);

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

  const noAccess = !can("products") && NAV_ITEMS.every(({ key }) => !can(key));

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
            onClick={() => setOpenMenu(openMenu === "products" ? null : "products")}
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

        {/* ORDERS */}
        {can("orders") && (
          <SidebarItem
            icon={<ShoppingCart size={18} />}
            label="Orders"
            isOpen={openMenu === "orders"}
            badge={newOrdersCount > 0 ? newOrdersCount : undefined}
            onClick={() => setOpenMenu(openMenu === "orders" ? null : "orders")}
          >
            <SubItem
              label="Orders List"
              href="/admin/orders/OrdersPage"
              active={pathname === "/admin/orders/OrdersPage"}
              badge={newOrdersCount > 0 ? newOrdersCount : undefined}
            />
            <SubItem
              label="Abandoned Cart"
              href="/admin/orders/AbandonedCartPage"
              active={pathname === "/admin/orders/AbandonedCartPage"}
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
              // Send badge ONLY for reviews if count > 0
              badge={key === "reviews" && pendingReviewsCount > 0 ? pendingReviewsCount : undefined}
            />
          ) : null
        )}

        {/* NO ACCESS STATE */}
        {noAccess && (
          <div className="mt-4 flex flex-col items-center gap-2 px-4 py-6 text-center text-gray-400">
            <ShieldOff size={28} />
            <p className="text-xs">
              No pages assigned.<br />Contact super admin.
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
  badge?: number;
}

function NavLink({ href, active, icon, label, badge }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`mt-1 flex items-center justify-between rounded-xl px-4 py-3 transition
        ${active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  badge?: number;
  onClick: () => void;
  children?: React.ReactNode;
}

function SidebarItem({ icon, label, isOpen, badge, onClick, children }: SidebarItemProps) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition cursor-pointer
          ${isOpen ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon}
          <span className="font-medium truncate">{label}</span>
          {badge !== undefined && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shrink-0">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && <div className="ml-10 mt-1 space-y-1">{children}</div>}
      
    </div>
  );
}

interface SubItemProps {
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}

function SubItem({ label, href, active, badge }: SubItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition
        ${active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}
    >
      <span className="truncate">{label}</span>
      {badge !== undefined && (
        <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}