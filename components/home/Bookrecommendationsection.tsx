"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import BookCard from "../books/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Book = {
  id: number;
  title: string;
  slug: string;
  image: string;
  main_image?: string;
  product_type: "ebook" | "physical" | "both";
  stock: number;
  price: number;
  sell_price: number;
  ebook_price?: number;
  ebook_sell_price?: number;
  badge?: string;
  category?: string;
  author?: string;
};

type CategoryTab = {
  id: number;
  title: string;
  shortLabel: string;
  slug: string;
  description: string;
  accentColor: string;
  tiltClass: string;
  featuredBookSlug: string; 
};

const CATEGORIES: CategoryTab[] = [
  {
    id: 1, title: "Academic Books", shortLabel: "Academic Books", slug: "agph",
    description: "Enduring foundational works and timeless literature from our premier collection.",
    accentColor: "#2563EB", tiltClass: "-rotate-6",
    featuredBookSlug: "machine-learning-for-skill-development-models-tools-and-applications",
  },
  {
    id: 2, title: "Fiction Books", shortLabel: "Fiction Books", slug: "fiction",
    description: "Imaginative stories, thrilling narratives, and worlds waiting to be explored.",
    accentColor: "#0891B2", tiltClass: "rotate-6",
    featuredBookSlug: "ehsaason-ki-dor",
  },
  {
    id: 3, title: "Non-Fiction Books", shortLabel: "Non-Fiction Books", slug: "non-fiction",
    description: "Real-world knowledge, biographies, and deep dives into history and science.",
    accentColor: "#059669", tiltClass: "-rotate-3",
    featuredBookSlug: "philosophy-of-wittgenstein-language-logic-and-mind",
  },
  {
    id: 4, title: "Authority Books", shortLabel: "Authority Books", slug: "authority-book",
    description: "Expert guidance, professional development, and industry-leading insights.",
    accentColor: "#D97706", tiltClass: "rotate-6",
    featuredBookSlug: "the-business-growth-trilogy-digital-strategies-psychology-of-consumer-behaviour-festive-marketing",
  },
];

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-gray-100">
      <div className="h-48 w-full" style={{
        background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "bch-shimmer 1.5s infinite",
      }} />
      <div className="p-3 space-y-2">
        <div className="h-2.5 rounded-full w-3/4" style={{
          background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)",
          backgroundSize: "200% 100%",
          animation: "bch-shimmer 1.5s infinite",
        }} />
        <div className="h-2.5 rounded-full w-1/2" style={{
          background: "linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)",
          backgroundSize: "200% 100%",
          animation: "bch-shimmer 1.5s infinite 0.2s",
        }} />
      </div>
    </div>
  );
}

export default function BookCategoriesHero() {
  const [booksByCat, setBooksByCat] = useState<Record<string, Book[]>>({});
  const [loadingCats, setLoadingCats] = useState<Record<string, boolean>>({});
  const [activeHover, setActiveHover] = useState<string | null>("fiction-book");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [booksVisible, setBooksVisible] = useState(false);

  useEffect(() => {
    const fetchCategoryBooks = async (slug: string) => {
      setLoadingCats((prev) => ({ ...prev, [slug]: true }));
      try {
        const res = await fetch(`${API_URL}/api/categories/${slug}/products`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const validated = await Promise.all(
          data.slice(0, 30).map(
            (book: Book) =>
              new Promise<Book | null>((resolve) => {
                if (!book.main_image) return resolve(null);
                const img = new window.Image();
                img.onload = () => resolve({ ...book, image: `${API_URL}${book.main_image}` });
                img.onerror = () => resolve(null);
                img.src = `${API_URL}${book.main_image}`;
              })
          )
        );
        return { slug, books: validated.filter(Boolean) as Book[] };
      } catch {
        return { slug, books: [] };
      } finally {
        setLoadingCats((prev) => ({ ...prev, [slug]: false }));
      }
    };
    Promise.all(CATEGORIES.map((cat) => fetchCategoryBooks(cat.slug))).then((results) => {
      const map: Record<string, Book[]> = {};
      results.forEach((r) => (map[r.slug] = r.books));
      setBooksByCat(map);
    });
  }, []);

  useEffect(() => {
    if (expandedCategory) {
      setBooksVisible(false);
      const t = setTimeout(() => setBooksVisible(true), 350);
      return () => clearTimeout(t);
    } else {
      setBooksVisible(false);
    }
  }, [expandedCategory]);

  const activeCat = CATEGORIES.find((c) => c.slug === expandedCategory);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&display=swap');

        @keyframes bch-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes bch-fadein {
          from { opacity:0; } to { opacity:1; }
        }
        @keyframes bch-slide-in {
          from { opacity:0; transform:translateX(-16px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .bch-panel {
          transition: flex 0.65s cubic-bezier(0.25,1,0.5,1), background 0.3s ease;
        }
        .bch-cover {
          transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1), filter 0.4s ease;
        }
        .bch-underline {
          height: 2px; width: 0; border-radius: 9999px;
          transition: width 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s;
        }
        .bch-panel:hover .bch-underline { width: 2.5rem; }

        .bch-desc {
          opacity: 0; transform: translateY(8px);
          transition: opacity 0.4s ease 0.12s, transform 0.4s ease 0.12s;
        }
        .bch-panel:hover .bch-desc { opacity:1; transform:translateY(0); }

        .bch-expanded { animation: bch-fadein 0.25s ease both; }
        .bch-info     { animation: bch-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) 0.08s both; }

        .bch-item {
          opacity:0; transform:translateY(14px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .bch-item.in { opacity:1; transform:translateY(0); }
        .bch-item:nth-child(1){ transition-delay:0.04s; }
        .bch-item:nth-child(2){ transition-delay:0.10s; }
        .bch-item:nth-child(3){ transition-delay:0.16s; }
        .bch-item:nth-child(4){ transition-delay:0.22s; }
        .bch-item:nth-child(5){ transition-delay:0.28s; }
        .bch-item:nth-child(6){ transition-delay:0.34s; }

        .bch-scroll::-webkit-scrollbar { width: 4px; }
        .bch-scroll::-webkit-scrollbar-track { background: transparent; }
        .bch-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 9999px; }

        .bch-cat-btn { transition: background 0.18s ease, color 0.18s ease; }
        .bch-cat-btn:hover { background: #f3f4f6; color: #111827; }
      `}</style>

      {/* Adjust height dynamically for mobile and desktop */}
      <div className={`relative w-full flex flex-col md:flex-row overflow-hidden bg-white transition-[height] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        expandedCategory ? "h-[850px] md:h-[680px]" : "h-[600px] md:h-[560px]"
      }`}>

        {/* ════════════════════════════════════════════ */}
        {/* COLLAPSED PANELS                             */}
        {/* ════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 flex flex-wrap md:flex-nowrap transition-opacity duration-300 ${
            expandedCategory ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {CATEGORIES.map((cat) => {
            const categoryBooks = booksByCat[cat.slug] || [];
            const featuredBook = categoryBooks.find((b) => b.slug === cat.featuredBookSlug) || categoryBooks[0];
            const coverImg = featuredBook?.image;
            const isHov = activeHover === cat.slug;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveHover(cat.slug)}
                onMouseLeave={() => setActiveHover(null)}
                onClick={() => setExpandedCategory(cat.slug)}
                // Mobile: w-1/2 h-1/2 for 2x2 grid. Desktop: auto width, flex sizing.
                className={`bch-panel relative w-1/2 h-1/2 md:w-auto md:h-full cursor-pointer overflow-hidden select-none flex flex-col border-gray-100 border-b odd:border-r md:odd:border-r-0 md:border-b-0 md:border-r ${
                  isHov ? "md:flex-[1.3]" : "md:flex-1"
                }`}
                style={{ background: isHov ? "#FAFAFA" : "#FFFFFF" }}
              >
                {/* Number + Text */}
                <div className="p-4 sm:p-5 md:px-7 md:pt-8 md:pb-0 z-20 flex flex-col justify-start">
                  <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-gray-300 mb-1.5 md:mb-4">
                    0{cat.id}
                  </div>
                  <h2
                    className="text-[15px] sm:text-lg md:text-[clamp(1.3rem,2vw,1.55rem)] font-bold text-gray-900 leading-snug mb-2 md:mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {cat.shortLabel}
                  </h2>
                  <div className="bch-underline hidden md:block" style={{ background: cat.accentColor }} />
                  
                  {/* Hide detailed description on mobile to save vertical space */}
                  <div className="mt-2 md:mt-3 space-y-2">
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 md:line-clamp-none">{cat.description}</p>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: cat.accentColor }}
                    >
                      Browse <ChevronRight size={12} strokeWidth={2.5} />
                    </span>
                  </div>
                </div>

                {/* Cover image area */}
                <div className="flex-1 w-full flex items-end justify-center pb-3 md:pb-5 pointer-events-none z-10 relative">
                  {coverImg ? (
                    <img
                      src={coverImg}
                      alt={cat.title}
                      className={`bch-cover w-[70%] max-w-[100px] sm:max-w-[130px] md:max-w-[275px] max-h-[120px] md:max-h-[270px] object-contain origin-bottom ${
                        isHov ? "rotate-0 scale-[1.08] md:-translate-y-3 md:scale-[1.06]" : cat.tiltClass
                      }`}
                      style={{
                        filter: isHov
                          ? `drop-shadow(0 20px 32px ${cat.accentColor}35)`
                          : "drop-shadow(0 8px 18px rgba(0,0,0,0.13))"
                      }}
                    />
                  ) : (
                    <BookOpen size={48} strokeWidth={0.8} color={cat.accentColor} className="opacity-10 md:mb-6" />
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* EXPANDED VIEW                                */}
        {/* ════════════════════════════════════════════ */}
        {expandedCategory && activeCat && (
          <div className="bch-expanded absolute inset-0 flex flex-col md:flex-row z-40 bg-white">

            {/* Left/Top info panel */}
            <div className="bch-info w-full md:w-[270px] shrink-0 flex flex-col bg-white border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto bch-scroll">

              {/* Back button */}
              <div className="px-5 md:px-6 pt-5 md:pt-7 pb-4 md:pb-5 border-b border-gray-100">
                <button
                  onClick={() => setExpandedCategory(null)}
                  className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 hover:text-gray-900 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} /> All Categories
                </button>
              </div>

              {/* Info */}
              <div className="px-5 md:px-6 py-5 md:py-7 flex-1">
                <span
                  className="text-[10px] font-bold tracking-[0.18em] uppercase block mb-2"
                  style={{ color: activeCat.accentColor }}
                >
                  Category 0{activeCat.id}
                </span>
                <h2
                  className="text-2xl md:text-[1.6rem] font-bold text-gray-900 leading-tight mb-3 md:mb-4"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {activeCat.title}
                </h2>
                <div
                  className="h-0.5 w-8 rounded-full mb-4 md:mb-5"
                  style={{ background: activeCat.accentColor }}
                />
                <p className="text-gray-500 text-sm leading-relaxed mb-2 md:mb-7">
                  {activeCat.description} Explore our curated selection for this genre.
                </p>

                {/* Other categories - Hidden on Mobile to save vertical space */}
                <div className="hidden md:block">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 mb-2">
                    Other Categories
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {CATEGORIES.filter((c) => c.slug !== expandedCategory).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setExpandedCategory(c.slug)}
                        className="bch-cat-btn flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-600 text-left cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: c.accentColor }}
                        />
                        {c.shortLabel}
                        <ChevronRight size={11} className="ml-auto text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right/Bottom: grid */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/60">

              {/* Top bar */}
              <div className="flex-shrink-0 px-5 md:px-8 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: activeCat.accentColor }}
                  />
                  <span className="text-sm font-semibold text-gray-800">{activeCat.title}</span>
                </div>
                <Link
                  href={`/product-category/${activeCat.slug}`}
                  className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color: activeCat.accentColor }}
                >
                  View all <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Books grid */}
              <div className="flex-1 overflow-y-auto bch-scroll p-4 md:p-7">
                {loadingCats[activeCat.slug] ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : !booksByCat[activeCat.slug]?.length ? (
                  <div className="h-72 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                    <BookOpen size={32} strokeWidth={1} className="text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm">No books available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {(booksByCat[activeCat.slug] || []).slice(0, 6).map((book) => (
                      <div key={book.id} className={`bch-item ${booksVisible ? "in" : ""}`}>
                        <BookCard book={book} visibleCount={1} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}