"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  slug: string; // ← NEW
  image: string | null;
  sku: string;
  stock: number;
  price: number;
  sell_price: number;
  status: string;
  date: string;
  categories: string[];
}

interface Category {
  id: number;
  name: string;
  imprint: "agph";
}

// Tilt angles for the ribbon
const TILTS = [-6, -3, 0, 4, -2, 5, -4, -5, 3, -1];

// ─── Resolve image URL ────────────────────────────────────────────────────────
function resolveImage(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_BASE}${image.startsWith("/") ? "" : "/"}${image}`;
}

// ─── Marquee strip ────────────────────────────────────────────────────────────
function BookStrip({ books }: { books: Product[] }) {
  const items = [...books, ...books];

  return (
    <div className="relative w-full overflow-x-hidden overflow-y-visible select-none">
      {/* Fade edges */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-32 z-10"
        style={{ background: "linear-gradient(to right, #f5f0e8, transparent)" }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-32 z-10"
        style={{ background: "linear-gradient(to left, #f5f0e8, transparent)" }}
      />

      <div
        className="flex gap-5 items-end my-13"
        style={{
          width: "max-content",
          animation: "bookScroll 32s linear infinite",
          paddingLeft: 40,
        }}
      >
        {items.map((book, i) => {
          const tilt = TILTS[i % TILTS.length];
          const isHighlighted = i % books.length === Math.floor(books.length / 2);
          const imgSrc = resolveImage(book.image);

          return (
            <Link
              key={`${book.id}-${i}`}
              href={`/product/${book.slug}`}
              className="group relative flex-shrink-0 cursor-pointer"
              style={{
                transform: `rotate(${tilt}deg)`,
                transition: "transform 0.35s ease",
                marginBottom: isHighlighted ? 24 : 0,
              }}
            >
              {/* Book card */}
              <div
                className="overflow-hidden shadow-xl bg-amber-100"
                style={{
                  width: isHighlighted ? 150 : 130,
                  height: isHighlighted ? 210 : 190,
                  borderRadius: 10,
                  transition: "all 0.35s ease",
                }}
              >
                {imgSrc ? (
                  <img src={imgSrc} alt={book.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-100">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-amber-400">
                      <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 13h8v1H8v-1zm0 3h8v1H8v-1zm0-6h4v1H8v-1z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Hover tooltip */}
              <div
                className="absolute -top-11 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <p className="font-bold truncate max-w-[140px]">{book.name}</p>
                {book.categories.length > 0 && (
                  <p className="text-white/60">{book.categories[0]}</p>
                )}
                <p className="text-amber-400 mt-0.5 font-semibold">
                  ${(book.sell_price || book.price).toLocaleString()}
                </p>
                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45" />
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        @keyframes bookScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
export default function BookstoreHero() {
  const [books, setBooks]     = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const catRes = await fetch(`${API_BASE}/api/categories`);
        const catData: Category[] = await catRes.json();
        const agphNames = new Set(
          catData
            .filter((c) => c.imprint === "agph")
            .map((c) => c.name)
        );

        // 2️⃣ Fetch products
        const prodRes = await fetch(`${API_BASE}/api/products?limit=10`);
        if (!prodRes.ok) throw new Error(`Server error: ${prodRes.status}`);
        const prodData: Product[] = await prodRes.json();

        const filtered = prodData
          .filter((p) =>
            p.categories.some((cat) => agphNames.has(cat))
          )
          .slice(0, 10);

        setBooks(filtered);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#f2f2f2", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>

      {/* ── Badge ── */}
      <div className="flex justify-center mt-8 z-10">
        <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 tracking-wide uppercase">
          ✦ Over 1500 titles in our collection
        </span>
      </div>

      {/* ── Headline ── */}
      <div className="relative text-center mt-8 px-6 z-10">
        <span
          className="absolute left-[12%] top-4 text-sm text-neutral-400 italic select-none hidden lg:block"
          style={{ fontFamily: "'Playfair Display', serif", transform: "rotate(-10deg)" }}
        >
          your next
          <br />favourite read ↓
        </span>

        <h1
          className="text-5xl md:text-7xl font-black text-neutral-900 leading-[1.08] tracking-tight max-w-3xl mx-auto"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Discover Books
          <br />
          <span className="text-gray-600">Worth Reading</span>
        </h1>

        <span
          className="absolute right-[10%] top-6 text-sm text-neutral-400 italic select-none hidden lg:block"
          style={{ fontFamily: "'Playfair Display', serif", transform: "rotate(8deg)" }}
        >
          Curate your
          <br />
          shelf ↙
        </span>

        <p className="mt-5 text-base md:text-lg text-neutral-500 max-w-md mx-auto leading-relaxed font-light">
          Hand-picked titles across every genre. From timeless classics to the
          hottest new releases — all in one place.
        </p>
      </div>

      {/* ── Book Strip or Loader ── */}
      {loading ? (
        <div className="flex justify-center items-center mt-10" style={{ height: 320 }}>
          <div className="w-10 h-10 border-[3px] border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      ) : (
        <BookStrip books={books} />
      )}

      {/* ── CTA ── */}
      <div className="flex flex-col items-center mt-6 z-10 pb-14">
        <div className="relative">
          <span
            className="absolute -left-16 -top-3 text-xs text-neutral-400 italic select-none"
            style={{ fontFamily: "'Playfair Display', serif", transform: "rotate(-8deg)" }}
          >
            Buy Now ↗
          </span>
          <button className="px-8 py-3.5 rounded-full text-white font-semibold text-sm shadow-lg transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95 bg-gray-500">
            Browse the Collection
          </button>
        </div>
      </div>
    </section>
  );
}