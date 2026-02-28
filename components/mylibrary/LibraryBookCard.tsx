"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

type Book = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
};

type Props = {
  book: Book;
  visibleCount: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function LibraryBookCard({
  book,
  visibleCount,
}: Props) {
  const [favorite, setFavorite] = useState(false);

  /* 🔐 CHECK FAVORITE STATUS */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/my-books/${book.slug}/favorite`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setFavorite(d.favorite))
      .catch(() => {});
  }, [book.slug]);

  /* ❤️ TOGGLE FAVORITE */
  const toggleFavorite = async (
    e: React.MouseEvent
  ) => {
    e.preventDefault(); // ⛔ prevent navigation
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) return;

    if (favorite) {
      await fetch(
        `${API_URL}/api/my-books/${book.slug}/favorite`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorite(false);
    } else {
      await fetch(
        `${API_URL}/api/my-books/${book.slug}/favorite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorite(true);
    }
  };

  return (
    <div
      className="flex-shrink-0 px-2 mt-4"
      style={{ width: `${100 / visibleCount}%` }}
    >
      <Link href={`/my-books/${book.slug}`}>
        <div className="group cursor-pointer">
          <div className="relative overflow-hidden rounded-sm bg-slate-900">

            {/* ❤️ FAVORITE BUTTON */}
            <button
              onClick={toggleFavorite}
              className="absolute top-2 left-2 z-10
                         rounded-full bg-white/90 p-1
                         hover:bg-white transition cursor-pointer"
            >
              <Heart
                size={16}
                className={
                  favorite
                    ? "fill-red-500 text-red-500"
                    : "text-gray-500"
                }
              />
            </button>

            {/* BOOK IMAGE */}
            <Image
              src={
                book.main_image
                  ? `${API_URL}${book.main_image}`
                  : "/images/placeholder-book.png"
              }
              alt={book.title}
              width={180}
              height={260}
              className="object-cover group-hover:scale-105 transition"
              unoptimized
            />

            {/* READ BADGE */}
            <span className="absolute bottom-2 right-2
                             bg-blue-600 text-white
                             text-xs px-2 py-1 rounded">
              Read
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            <h3 className="line-clamp-2">
              {book.title}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  );
}
