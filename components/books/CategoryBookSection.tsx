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
  visibleCount: desktopVisible = 6,
}: Props) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [start, setStart] = useState(0);
  const [isAgph, setIsAgph] = useState<boolean | null>(null);
  const [paused, setPaused] = useState(false);

  // ── Responsive visibleCount ──────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(desktopVisible);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(2);
      else if (w < 1024) setVisibleCount(4);
      else setVisibleCount(desktopVisible);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [desktopVisible]);

  // ── Reset start when visibleCount changes to avoid out-of-bounds ────────
  useEffect(() => {
    setStart(0);
  }, [visibleCount]);

  // ── 1️⃣ Check imprint ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data: Category[]) => {
        const match = data.find((c) => c.slug === categorySlug);
        setIsAgph(match?.imprint === "agph");
      })
      .catch(() => setIsAgph(false));
  }, [categorySlug]);

  // ── 2️⃣ Fetch books ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAgph) return;
    fetch(`${API_URL}/api/categories/${categorySlug}/products`)
      .then((res) => res.json())
      .then(async (data) => {
        const candidates = data.slice(0, 30); // grab extra as buffer
      
        const validated = await Promise.all(
          candidates.map(
            (book: Book) =>
              new Promise<Book | null>((resolve) => {
                if (!book.main_image) return resolve(null);
                const img = new window.Image();
                img.onload = () => resolve(book);
                img.onerror = () => resolve(null);
                img.src = `${API_URL}${book.main_image}`;
              })
          )
        );
      
        setBooks(validated.filter(Boolean).slice(0, 12) as Book[]);
      });
  }, [isAgph, categorySlug]);

  // ── 3️⃣ Auto-slide ───────────────────────────────────────────────────────
  useEffect(() => {
  if (books.length <= visibleCount) return;
  if (paused) return;                    // ← stop when hovered
  const interval = setInterval(() => {
    setStart((prev) =>
      prev + 1 > books.length - visibleCount ? 0 : prev + 1
    );
  }, 3000);
  return () => clearInterval(interval);
}, [books, visibleCount, paused]);

  if (!isAgph || !books.length) return null;

  return (
    <section className="mt-10 px-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/product-category/${categorySlug}`}
          className="group text-red-600 cursor-pointer font-semibold flex items-center"
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight pl-2 flex items-center"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {title}
            <ChevronRight className="h-8 w-8 sm:h-11 sm:w-11 translate-x-[-4px] transition-all duration-300 group-hover:pl-2 group-hover:translate-x-0" />
          </h2>
        </Link>
      </div>

      {/* SLIDER */}
      <div className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}   // ← pause
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
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