"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCard from "./BookCard";

type Book = {
  id: number;
  title: string;
  slug: string;
  price: number;          // paperback MRP
  sell_price: number;     // paperback selling
  ebook_price?: number;   // ebook MRP
  ebook_sell_price?: number;
  stock: number;
  main_image: string;
  product_type: "ebook" | "physical" | "both";
};


type Props = {
  title: string;
  categorySlug: string;
  visibleCount?: number; // ✅ NEW
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const CategoryBookSection = ({
  title,
  categorySlug,
  visibleCount = 6, // ✅ DEFAULT = 6
}: Props) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [start, setStart] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/categories/${categorySlug}/products`)
      .then((res) => res.json())
      .then((data) => setBooks(data.slice(0, 12))); // fetch more for slider
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
    <section className="mt-10 px-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">

        <Link
          href={`/category/${categorySlug}`}
          className="text-sm text-red-600 cursor-pointer font-semibold flex items-center"
        >
        <h2
          className="text-3xl md:text-4xl font-black text-gray-900 leading-tight pl-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
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
            
                // paperback prices
                price: book.price,
                sell_price: book.sell_price,
            
                // ebook prices (may be undefined)
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
