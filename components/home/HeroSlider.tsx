"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

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

type CardCfg = {
  rotate: number;
  y: number;
  scale: number;
  z: number;
  w: number;
  h: number;
};

// ── Arc configs per breakpoint ────────────────────────────────────────────────
const DESKTOP_CARDS: readonly CardCfg[] = [
  { rotate: -22, y: 108, scale: 0.82, z: 1, w: 160, h: 228 },
  { rotate: -15, y:  52, scale: 0.87, z: 2, w: 170, h: 240 },
  { rotate:  -7, y:  20, scale: 0.94, z: 3, w: 178, h: 252 },
  { rotate:   0, y:   0, scale: 1.00, z: 6, w: 188, h: 268 }, // center
  { rotate:   7, y:  20, scale: 0.94, z: 3, w: 178, h: 252 },
  { rotate:  15, y:  52, scale: 0.87, z: 2, w: 170, h: 240 },
  { rotate:  22, y: 118, scale: 0.82, z: 1, w: 160, h: 228 },
];

const TABLET_CARDS: readonly CardCfg[] = [
  { rotate: -20, y:  72, scale: 0.82, z: 1, w: 140, h: 198 },
  { rotate: -10, y:  26, scale: 0.91, z: 2, w: 156, h: 221 },
  { rotate:   0, y:   0, scale: 1.00, z: 4, w: 172, h: 244 }, // center
  { rotate:  10, y:  26, scale: 0.91, z: 2, w: 156, h: 221 },
  { rotate:  20, y:  72, scale: 0.82, z: 1, w: 140, h: 198 },
];

const MOBILE_CARDS: readonly CardCfg[] = [
  { rotate: -17, y:  54, scale: 0.83, z: 1, w: 108, h: 153 },
  { rotate:   0, y:   0, scale: 1.00, z: 3, w: 144, h: 204 }, // center
  { rotate:  17, y:  54, scale: 0.83, z: 1, w: 108, h: 153 },
];

// ── Single book card ──────────────────────────────────────────────────────────
function BookCard({
  book,
  cfg,
  idx,
  visible,
}: {
  book: Product;
  cfg: CardCfg;
  idx: number;
  visible: boolean;
}) {
  const [hov, setHov] = useState(false);
  const imgSrc = resolveImage(book.image);
  const price = (book.sell_price || book.price).toLocaleString("en-IN");

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{
        width: cfg.w,
        zIndex: hov ? 20 : cfg.z,
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
            width: cfg.w,
            height: cfg.h,
            borderRadius: 10,
            boxShadow: hov
              ? "0 30px 60px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.1)"
              : "0 10px 30px rgba(0,0,0,0.14), 0 3px 8px rgba(0,0,0,0.07)",
            transition: "box-shadow 0.4s ease",
          }}
        >
          {imgSrc ? (
          <Image
            src={imgSrc}
            alt={book.name}
            width={400}
            height={400}
            unoptimized
            className="object-cover block"
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
function ShimmerCard({ cfg, idx }: { cfg: CardCfg; idx: number }) {
  return (
    <div
      className="flex-shrink-0"
      style={{
        width: cfg.w,
        height: cfg.h,
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
  const [books, setBooks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  // Responsive breakpoint detection
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop");

  // Carousel state — centerIdx = index within `books` array that sits in the center slot
  const [centerIdx, setCenterIdx] = useState(3);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animDir, setAnimDir] = useState(0); // -1 left, 1 right

  const touchStartX = useRef(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Screen size watcher ──
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setScreenSize(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Fetch books ──
  useEffect(() => {
    (async () => {
      try {
        const catRes = await fetch(`${API_BASE}/api/categories`);
        const catData: Category[] = await catRes.json();
        const agph = new Set(catData.filter((c) => c.imprint === "agph").map((c) => c.name));
        const pRes = await fetch(`${API_BASE}/api/products?limit=20`);
        const pData: Product[] = await pRes.json();
        const filtered = pData
          .filter((p) => p.categories.some((c) => agph.has(c)) && p.image)
          .slice(0, 20); // grab more so we have fallbacks
        
        // Pre-validate each image URL actually resolves
        const validated = await Promise.all(
          filtered.map(
            (p) =>
              new Promise<Product | null>((resolve) => {
                const img = new window.Image();
                img.onload = () => resolve(p);
                img.onerror = () => resolve(null); // URL exists in DB but file is missing
                img.src = resolveImage(p.image)!;
              })
          )
        );
        
        setBooks(validated.filter(Boolean).slice(0, 7) as Product[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      }
    })();
  }, []);

  // ── Derived carousel values ──
  const isCarousel = screenSize !== "desktop";
  const half = screenSize === "mobile" ? 1 : 2; // cards on each side of center
  const ACTIVE_CARDS =
    screenSize === "mobile"
      ? MOBILE_CARDS
      : screenSize === "tablet"
      ? TABLET_CARDS
      : DESKTOP_CARDS;

  // Clamp so we always have `half` cards on each side
  const minCenter = half;
  const maxCenter = Math.max(half, books.length - 1 - half);
  const clampedCenter = Math.max(minCenter, Math.min(maxCenter, centerIdx));

  const visibleBooks = isCarousel
    ? books.slice(clampedCenter - half, clampedCenter + half + 1)
    : books.slice(0, 7);

  // ── Auto-slide ──
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function navigate(dir: 1 | -1) {
    if (isTransitioning) return;
    setAnimDir(dir);
    setIsTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      setCenterIdx((c) => {
        const next = c + dir;
        // bounce: reverse at edges by wrapping back
        if (next > maxCenter) return minCenter;
        if (next < minCenter) return maxCenter;
        return next;
      });
      setIsTransitioning(false);
    }, 230);
  }

  useEffect(() => {
    if (!isCarousel || loading || books.length === 0) return;
    autoTimer.current = setInterval(() => navigate(1), 2800);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCarousel, loading, books.length, isTransitioning]);

  // ── Touch / swipe ──
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 44) navigate(diff > 0 ? 1 : -1);
  }

  // ── Render fan cards ──
  const displayCards = loading ? ACTIVE_CARDS : ACTIVE_CARDS;
  const fanContent = loading
    ? displayCards.map((cfg, i) => <ShimmerCard key={i} cfg={cfg} idx={i} />)
    : visibleBooks.map((book, i) => (
        <BookCard
          // key includes clampedCenter so cards remount (and re-animate) after each slide
          key={`${book.id}-${clampedCenter}`}
          book={book}
          cfg={ACTIVE_CARDS[i] ?? ACTIVE_CARDS[Math.floor(ACTIVE_CARDS.length / 2)]}
          idx={i}
          visible={visible}
        />
      ));

  // ── Gap & padding per breakpoint ──
  const fanGap = screenSize === "mobile" ? 8 : 14;
  const fanPadH = screenSize === "mobile" ? 16 : 60;

  return (
    <section
      className="relative w-full  flex flex-col items-center justify-center overflow-hidden select-none"
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
      `}</style>

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.62) 0%, transparent 60%)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* ── Book fan ── */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Fan container — fades + slides during carousel transition */}
        <div
          className="flex items-end justify-center"
          style={{
            gap: fanGap,
            paddingTop: screenSize === "mobile" ? 30 : 82,
            paddingLeft: fanPadH,
            paddingRight: fanPadH,
            paddingBottom: 0,
            // Carousel slide transition
            transition: "opacity 0.22s ease, transform 0.22s ease",
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? `translateX(${animDir === 1 ? -36 : 36}px)`
              : "translateX(0)",
          }}
          onTouchStart={isCarousel ? handleTouchStart : undefined}
          onTouchEnd={isCarousel ? handleTouchEnd : undefined}
        >
          {fanContent}
        </div>


      </div>

    {/* ── Text block ── */}
<div
  className="relative z-10 flex flex-col items-center text-center pb-12 px-6"
  style={{
    marginTop: screenSize === "mobile" ? 48 : 24,
    opacity: 0,
    animation: visible ? "textFade 0.75s ease 0.48s forwards" : "none",
  }}
>


  <h1
    className="text-gray-900 font-black mt-6 leading-none tracking-tight"
    style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: "clamp(2rem, 5.5vw, 2.25rem)",
      letterSpacing: "-0.02em",
    }}
  >
    AGPH Books Store
  </h1>


  <h2
    className="text-gray-800 font-bold leading-tight mt-5 tracking-tight"
    style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: "clamp(1.1rem, 2.8vw, 1.55rem)",
      fontStyle: "italic",
      marginBottom: "18px",
      maxWidth: screenSize === "mobile" ? "min(90vw, 360px)" : "600px",
    }}
  >
    India’s Ultimate Bookstore Experience
  </h2>

  <p
    className="text-gray-400 leading-relaxed"
    style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "clamp(0.72rem, 1.3vw, 0.875rem)",
      fontWeight: 400,
      marginBottom: "36px",
      maxWidth: screenSize === "mobile" ? "min(88vw, 640px)" : "820px",
      lineHeight: 1.75,
    }}
  >
    AGPH Books Store has been a trusted name in India since 2022, offering
    everything from essential academic resources and authoritative texts to
    engaging fiction, non-fiction, and children's books, carefully curated
    for every reader.
  </p>

  {/* CTA row */}
  <div className="flex items-center gap-3">
    <Link href="/product-category/agph">
      <button
        className="group flex cursor-pointer items-center gap-3 text-white font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          letterSpacing: "0.04em",
          padding: "10px 22px 10px 10px",
          background: "linear-gradient(145deg, #374151, #111827)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:rotate-6"
          style={{ width: 32, height: 32 }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zm2.5-2.5H18v3H6.5A.5.5 0 0 1 6 19.5a.5.5 0 0 1 .5-.5zM8 7h8v1.5H8V7zm0 3.5h6V12H8v-1.5z" />
          </svg>
        </span>
        Explore
      </button>
    </Link>
  </div>
</div>
    </section>
  );
}