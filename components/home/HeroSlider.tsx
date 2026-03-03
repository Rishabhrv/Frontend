"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Product {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  sell_price: number;
  categories: string[];
}
interface Category {
  id: number;
  name: string;
  imprint: "agph";
}

function resolveImage(img: string | null): string | null {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
}

// Exact arc config from the reference image:
// center card is tallest & highest, outer cards tilt outward and descend
const CARDS = [
  { rotate: -22, y:  108, scale: 0.82, z: 1, w: 160, h: 228 },
  { rotate: -15, y:  52, scale: 0.87, z: 2, w: 170, h: 240 },
  { rotate:  -7, y:  20, scale: 0.94, z: 3, w: 178, h: 252 },
  { rotate:   0, y:   0, scale: 1.00, z: 6, w: 188, h: 268 }, // center
  { rotate:   7, y:  20, scale: 0.94, z: 3, w: 178, h: 252 },
  { rotate:  15, y:  52, scale: 0.87, z: 2, w: 170, h: 240 },
  { rotate:  22, y:  118, scale: 0.82, z: 1, w: 160, h: 228 },
] as const;

// ── Single book card ──────────────────────────────────────────────────────────
function BookCard({
  book,
  idx,
  visible,
}: {
  book: Product;
  idx: number;
  visible: boolean;
}) {
  const [hov, setHov] = useState(false);
  const cfg    = CARDS[idx];
  const imgSrc = resolveImage(book.image);
  const price  = (book.sell_price || book.price).toLocaleString("en-IN");

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{
        width:   cfg.w,
        zIndex:  hov ? 20 : cfg.z,
        opacity: 0,
        animation: visible
          ? `cardRise 0.85s cubic-bezier(0.22,1,0.36,1) ${idx * 80}ms forwards`
          : "none",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Arc transform */}
      <div
        style={{
          transform: hov
            ? "rotate(0deg) translateY(-14px) scale(1.06)"
            : `rotate(${cfg.rotate}deg) translateY(${cfg.y}px) scale(${cfg.scale})`,
          transformOrigin: "bottom center",
          transition: "transform 0.44s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Shadow blob */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: "75%",
            height: 16,
            background: "rgba(0,0,0,0.15)",
            filter: "blur(10px)",
            opacity: hov ? 0.5 : 0.22,
            transition: "opacity 0.35s",
          }}
        />

        {/* Card face */}
        <Link
          href={`/product/${book.slug}`}
          className="block relative overflow-hidden"
          style={{
            width:        cfg.w,
            height:       cfg.h,
            borderRadius: 10,
            boxShadow:    hov
              ? "0 30px 60px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.1)"
              : "0 10px 30px rgba(0,0,0,0.14), 0 3px 8px rgba(0,0,0,0.07)",
            transition: "box-shadow 0.4s ease",
          }}
        >
          {/* Book cover image */}
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={book.name}
              className="w-full h-full object-cover block"
              style={{
                filter: hov ? "brightness(1.06) saturate(1.05)" : "brightness(1)",
                transition: "filter 0.35s",
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-3"
              style={{ background: "linear-gradient(145deg,#e0ddd8,#cac7c0)" }}
            >
              <span
                className="text-[10px] text-center text-gray-500 leading-snug"
                style={{ fontFamily: "Georgia,serif" }}
              >
                {book.name}
              </span>
            </div>
          )}

          {/* Gloss sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, transparent 42%, rgba(0,0,0,0.04) 100%)",
            }}
          />

          {/* Hover price overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.74), transparent)",
              opacity: hov ? 1 : 0,
              transition: "opacity 0.28s ease",
            }}
          >
            {book.categories[0] && (
              <p className="text-[7px] font-bold tracking-widest uppercase text-white/60 mb-0.5">
                {book.categories[0]}
              </p>
            )}
            <p
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "Georgia,serif" }}
            >
              ₹{price}
            </p>
          </div>
        </Link>

        {/* Name tooltip */}
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg px-3 py-1.5 text-[10px] font-medium whitespace-nowrap pointer-events-none z-50"
          style={{
            opacity: hov ? 1 : 0,
            transition: "opacity 0.2s ease",
            maxWidth: 190,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {book.name}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </div>
    </div>
  );
}

// ── Shimmer placeholder ───────────────────────────────────────────────────────
function ShimmerCard({ idx }: { idx: number }) {
  const cfg = CARDS[idx];
  return (
    <div
      className="flex-shrink-0"
      style={{
        width:    cfg.w,
        height:   cfg.h,
        borderRadius: 18,
        transform: `rotate(${cfg.rotate}deg) translateY(${cfg.y}px) scale(${cfg.scale})`,
        transformOrigin: "bottom center",
        background: "linear-gradient(90deg,#ddd 25%,#eee 50%,#ddd 75%)",
        backgroundSize: "400px 100%",
        animation: `shimmer 1.4s ease infinite ${idx * 100}ms`,
        zIndex: cfg.z,
        position: "relative",
      }}
    />
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
export default function BookstoreHero() {
  const [books,   setBooks]   = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const catRes  = await fetch(`${API_BASE}/api/categories`);
        const catData: Category[] = await catRes.json();
        const agph = new Set(catData.filter(c => c.imprint === "agph").map(c => c.name));
        const pRes  = await fetch(`${API_BASE}/api/products?limit=20`);
        const pData: Product[] = await pRes.json();
        setBooks(pData.filter(p => p.categories.some(c => agph.has(c))).slice(0, 7));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      }
    })();
  }, []);

  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: "#e8e8e8" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes cardRise {
          from { opacity: 0; transform: translateY(60px) scale(0.86); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes textFade {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes ripple {
          0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.45); }
          70%  { box-shadow: 0 0 0 12px rgba(249,115,22,0);  }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0);     }
        }
      `}</style>

      {/* Subtle radial glow in center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.62) 0%, transparent 60%)",
        }}
      />

      {/* Very faint dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* ── Book fan ── */}
      <div
        className="relative z-10 flex items-end justify-center"
        style={{ gap: 14, paddingTop: 82, paddingBottom: 0, paddingLeft: 60, paddingRight: 60 }}
      >
        {loading
          ? [0, 1, 2, 3, 4, 5, 6].map(i => <ShimmerCard key={i} idx={i} />)
          : books.slice(0, 7).map((book, i) => (
              <BookCard key={book.id} book={book} idx={i} visible={visible} />
            ))
        }
      </div>

      {/* ── Text block ── */}
      <div
        className="relative z-10 flex flex-col items-center text-center mt-30 pb-20 px-6"
        style={{
          opacity: 0,
          animation: visible ? "textFade 0.75s ease 0.48s forwards" : "none",
        }}
      >
      <h1
  className="text-gray-900 font-black leading-tight tracking-tight"
  style={{
    fontFamily: "'Playfair Display', serif",
    fontSize:   "clamp(2rem, 4.5vw, 3.0rem)",
    marginBottom: 10,
  }}
>
  Trusted Academic Publications
</h1>

<p
  className="text-gray-500 w-170 leading-relaxed"
  style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize:   "clamp(0.875rem, 1.4vw, 1rem)",
    fontWeight: 300,
    marginBottom: 28,
  }}
>
  Curated academic resources designed to support students, researchers, and
  professionals with trusted, syllabus-aligned publications.
</p>

{/* CTA — professional gray pill */}
<Link href="/category/academic-books">
  <button
    className="flex cursor-pointer items-center gap-2.5 text-white font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
    style={{
      fontFamily:   "'DM Sans', sans-serif",
      fontSize:     14,
      letterSpacing:"0.03em",
      padding:      "11px 26px",
      background:   "linear-gradient(135deg, #4b5563, #1f2937)", // gray gradient
      boxShadow:    "0 6px 20px rgba(0,0,0,0.25)",
    }}
  >
    {/* Book icon in subtle lighter gray circle */}
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: 30,
        height: 30,
        background: "rgba(255,255,255,0.15)"
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-white"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zm2.5-2.5H18v3H6.5A.5.5 0 0 1 6 19.5a.5.5 0 0 1 .5-.5zM8 7h8v1.5H8V7zm0 3.5h6V12H8v-1.5z" />
      </svg>
    </span>
    Explore
  </button>
</Link>
      </div>
    </section>
  );
}