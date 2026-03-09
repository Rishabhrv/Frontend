"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, BookOpen, User, ShoppingBag } from "lucide-react";

const nav = [
  { label: "Home",       href: "/",                icon: Home        },
  { label: "Categories", href: "/category/academic-books",        icon: LayoutGrid  },
  { label: "My Books",   href: "/my-books",        icon: BookOpen    },
  { label: "Account",    href: "/account/menu",    icon: User        },
  { label: "Orders",     href: "/account/orders",  icon: ShoppingBag },
];

export default function MobileBottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
            >
              {/* Active top indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black rounded-full" />
              )}

              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
                className={active ? "text-black" : "text-gray-400"}
              />
              <span
                className={`text-[10px] leading-none font-medium ${
                  active ? "text-black" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for iPhone home indicator */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  );
}