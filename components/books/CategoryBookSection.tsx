"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCard from "./BookCard";
import { ChevronRight } from "lucide-react";

type Book = {
  id: number;
  title: string;
  slug: string;
  price: number;
  sell_price: number;
  ebook_price?: number;
  ebook_sell_price?: number;
  stock: number;
  main_image: string;
  product_type: "ebook" | "physical" | "both";
};

type Category = {
  slug: string;
  imprint: "agph";
};

type Props = {
  title: string;
  categorySlug: string;
  visibleCount?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const CategoryBookSection = ({
  title,
  categorySlug,
  visibleCount = 6,
}: Props) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [start, setStart] = useState(0);
  const [isAgph, setIsAgph] = useState<boolean | null>(null); // null = loading

  // ── 1️⃣ Check if this category's imprint is agph ──────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data: Category[]) => {
        const match = data.find((c) => c.slug === categorySlug);
        setIsAgph(match?.imprint === "agph");
      })
      .catch(() => setIsAgph(false));
  }, [categorySlug]);

  // ── 2️⃣ Fetch books only if imprint is confirmed agph ─────────────────────
  useEffect(() => {
    if (!isAgph) return;

    fetch(`${API_URL}/api/categories/${categorySlug}/products`)
      .then((res) => res.json())
      .then((data) => setBooks(data.slice(0, 12)));
  }, [isAgph, categorySlug]);

  // ── 3️⃣ Auto-slide ────────────────────────────────────────────────────────
  useEffect(() => {
    if (books.length <= visibleCount) return;

    const interval = setInterval(() => {
      setStart((prev) =>
        prev + 1 > books.length - visibleCount ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [books, visibleCount]);

  // ── Not agph or still loading or no books → render nothing ───────────────
  if (!isAgph || !books.length) return null;

  return (
    <section className="mt-10 px-5">
      {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/category/${categorySlug}`}
            className="group text-red-600 cursor-pointer font-semibold flex items-center"
          >
            <h2
              className="text-3xl md:text-4xl font-black text-gray-900 leading-tight pl-2 flex items-center "
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {title}
        
              <ChevronRight
                className="h-11 w-11 translate-x-[-4px] transition-all duration-300 group-hover:pl-2 group-hover:translate-x-0"
              />
            </h2>
          </Link>
        </div>

      {/* SLIDER */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-1200 ease-in-out"
          style={{
            transform: `translateX(-${start * (100 / visibleCount)}%)`,
          }}
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={{
                id: book.id,
                title: book.title,
                slug: book.slug,
                image: book.main_image
                  ? `${API_URL}${book.main_image}`
                  : "/images/placeholder-book.png",
                product_type: book.product_type,
                stock: book.stock,
                price: book.price,
                sell_price: book.sell_price,
                ebook_price: book.ebook_price,
                ebook_sell_price: book.ebook_sell_price,
                badge:
                  book.product_type === "physical" && book.stock === 0
                    ? "Out of Stock"
                    : "",
              }}
              visibleCount={visibleCount}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryBookSection;