"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Clock,
  Heart,
  Bookmark,
} from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function LibrarySidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const pathname = usePathname() ?? ""; // ✅ CURRENT ROUTE

 const [loaded, setLoaded] = useState(false);

useEffect(() => {
  if (loaded) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`${API_URL}/api/mylibrary/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(r => r.json())
    .then(data => {
      setCategories(data);
      setLoaded(true);
    });
}, [loaded]);


  return (
    <aside className="w-56 bg-gray-100 min-h-screen hidden md:block">

      {/* LOGO */}
      <div className="h-16 flex items-center justify-center mt-5">
        <Link href="/">
          <Image
            src="/images/logo/AGPH-Logo-Black-600x290.webp"
            alt="My Library"
            width={120}
            height={32}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* CONTENT */}
      <div className="p-4 text-sm text-gray-600 space-y-6">

        



        {/* 📘 LIBRARY LINKS */}
        <div className="space-y-1">
          <SidebarLink
            icon={<BookOpen size={16} />}
            label="All Books"
            href="/library/MyLibrary"
            active={pathname === "/library/MyLibrary"}
          />
          <SidebarLink
            icon={<Clock size={16} />}
            label="Continue Reading"
            href="/library/ContinueReadingPage"
            active={pathname === "/library/ContinueReadingPage"}
          />
          <SidebarLink
            icon={<Bookmark size={16} />}
            label="Bookmarks"
            href="/library/BookmarksPage"
            active={pathname === "/library/BookmarksPage"}
          />
          <SidebarLink
            icon={<Heart size={16} />}
            label="Favorites"
            href="/library/FavoritesPage"
            active={pathname === "/library/FavoritesPage"}
          />
        </div>

                {/* DIVIDER */}
        <div className="border-t border-gray-300" />

        {/* 📂 CATEGORIES */}
        {categories.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Categories
            </h4>

            <div className="space-y-1">
              {categories.map((cat) => (
                <SidebarLink
                  key={cat.id}
                  label={cat.name}
                  href={`/library/category/${cat.slug}`}
                  active={pathname.startsWith(`/library/category/${cat.slug}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* =============================
   🔗 SIDEBAR LINK
============================= */
function SidebarLink({
  icon,
  label,
  href,
  active,
}: {
  icon?: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded transition
        ${
          active
            ? "bg-black text-white font-medium"
            : "hover:bg-gray-200 text-gray-700"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
