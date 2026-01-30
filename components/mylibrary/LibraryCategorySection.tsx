"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LibraryBookCard from "./LibraryBookCard";

type Book = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
};

type Props = {
  title: string;
  categorySlug: string;
  visibleCount?: number;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function LibraryCategorySection({
  title,
  categorySlug,
  visibleCount = 6,
}: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [start, setStart] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(
      `${API_URL}/api/mylibrary/category/${categorySlug}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((r) => r.json())
      .then((d) => setBooks(d.slice(0, 12)));
  }, [categorySlug]);

  useEffect(() => {
    if (books.length <= visibleCount) return;

    const interval = setInterval(() => {
      setStart((prev) =>
        prev + 1 > books.length - visibleCount ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [books, visibleCount]);

  if (!books.length) return null;

  return (
    <section className="mt-10 px-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-600">
          {title}
        </h2>

        <Link
          href={`/library/category/${categorySlug}`}
          className="text-xs text-blue-400 hover:underline"
        >
          See All
        </Link>
      </div>

      {/* SLIDER */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${start * (100 / visibleCount)}%)`,
          }}
        >
          {books.map((book) => (
            <LibraryBookCard
              key={book.id}
              book={book}
              visibleCount={visibleCount}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
