"use client";

import { useEffect, useState } from "react";
import BookCard from "@/components/books/BookCard";

/* ─────────────────────────── Types ──────────────────────────────── */

type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  status: string;
  imprint: string;
};

type RawCategoryProduct = {
  id: number;
  title: string;
  slug: string;
  price: number;
  sell_price: number;
  ebook_price?: number;
  ebook_sell_price?: number;
  stock: number;
  product_type: "ebook" | "physical" | "both";
  status: string;
  main_image: string;
};

type Book = {
  id: number;
  title: string;
  slug: string;
  image: string;
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

type CategoryGroup = {
  parent: Category;
  children: Category[];
  isStandalone: boolean;
};

/* ─────────────────────────── Constants ──────────────────────────── */

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const FETCH_LIMIT = 10;

/* ─────────────────────────── Responsive hook ────────────────────── */

function useVisible(): number {
  const [visible, setVisible] = useState(5);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setVisible(5);
      else if (w >= 1024) setVisible(4);
      else if (w >= 640)  setVisible(3);
      else                setVisible(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return visible;
}

/* ─────────────────────────── Helpers ────────────────────────────── */

function toImgUrl(path: string) {
  if (!path) return "/placeholder-book.png";
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

function normalise(p: RawCategoryProduct): Book {
  return {
    id: p.id, title: p.title, slug: p.slug,
    image: toImgUrl(p.main_image),
    product_type: p.product_type, stock: p.stock,
    price: p.price, sell_price: p.sell_price,
    ebook_price: p.ebook_price, ebook_sell_price: p.ebook_sell_price,
  };
}

async function fetchBooksForChildren(children: Category[]): Promise<Book[]> {
  const results = await Promise.all(
    children.map((child) =>
      fetch(`${API_URL}/api/categories/${child.slug}/products?limit=${FETCH_LIMIT}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((raw: RawCategoryProduct[]) => raw.map(normalise))
        .catch(() => [] as Book[])
    )
  );
  const seen = new Set<number>();
  const merged: Book[] = [];
  for (const arr of results)
    for (const book of arr)
      if (!seen.has(book.id)) { seen.add(book.id); merged.push(book); }
  return merged.slice(0, FETCH_LIMIT);
}

async function fetchBooksForSingle(slug: string): Promise<Book[]> {
  return fetch(`${API_URL}/api/categories/${slug}/products?limit=${FETCH_LIMIT}`)
    .then((r) => (r.ok ? r.json() : []))
    .then((raw: RawCategoryProduct[]) => raw.map(normalise))
    .catch(() => []);
}

/* ─────────────────────────── Skeleton ───────────────────────────── */

function SkeletonCard({ visible }: { visible: number }) {
  return (
    <div
      className="flex-shrink-0 bg-white rounded-2xl overflow-hidden animate-pulse shadow-sm"
      style={{ width: `calc((100% - ${(visible - 1) * 12}px) / ${visible})` }}
    >
      <div className="bg-gray-100" style={{ height: visible <= 2 ? 160 : 200 }} />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-2 bg-gray-100 rounded w-1/2" />
        <div className="h-7 bg-gray-100 rounded-lg mt-2" />
      </div>
    </div>
  );
}

/* ─────────────────────────── Nav Arrow ──────────────────────────── */

function Arrow({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir}
      className={`group w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
        disabled
          ? "border-gray-200 text-gray-300 cursor-not-allowed bg-white"
          : "border-gray-300 text-gray-500 cursor-pointer bg-white hover:bg-gray-900 hover:border-gray-900 hover:text-white shadow-sm"
      }`}
    >
      {dir === "prev" ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

/* ─────────────────────────── Category Row ───────────────────────── */

function CategoryRow({ group }: { group: CategoryGroup }) {
  const visible = useVisible();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const gapPx = 12;

  useEffect(() => {
    const load = group.isStandalone
      ? fetchBooksForSingle(group.parent.slug)
      : fetchBooksForChildren(group.children);
    load.then(setBooks).finally(() => setLoading(false));
  }, [group]);

  // Reset index when visible count changes
  useEffect(() => { setIndex(0); }, [visible]);

  if (!loading && books.length === 0) return null;

  const canPrev = index > 0;
  const canNext = index + visible < books.length;
  const dots = Math.max(0, books.length - visible + 1);
  const cardWidthPercent = 100 / visible;

  return (
    <section className="mb-10 sm:mb-14 lg:mb-16">
      <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-7">
        <h2
          className="text-lg sm:text-xl lg:text-2xl text-gray-900 tracking-tight truncate mr-4"
          style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 600 }}
        >
          {group.parent.name}
        </h2>

        {!loading && books.length > visible && (
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <Arrow dir="prev" disabled={!canPrev} onClick={() => setIndex((i) => i - 1)} />
            <Arrow dir="next" disabled={!canNext} onClick={() => setIndex((i) => i + 1)} />
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent mb-4 sm:mb-6 lg:mb-7" />

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: visible }).map((_, i) => <SkeletonCard key={i} visible={visible} />)}
        </div>
      ) : (
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out will-change-transform"
            style={{
              gap: `${gapPx}px`,
              transform: `translateX(calc(-${index} * (${cardWidthPercent}% + ${gapPx / visible}px)))`,
            }}
          >
            {books.map((book) => (
              <div
                key={book.id}
                className="flex-shrink-0 min-w-0 [&>*]:!w-full [&>*]:!max-w-full"
                style={{ width: `calc((100% - ${(visible - 1) * gapPx}px) / ${visible})` }}
              >
                <BookCard book={book} visibleCount={visible} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && dots > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 sm:mt-6">
          {Array.from({ length: dots }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                i === index ? "w-5 sm:w-6 h-1.5 bg-gray-800" : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-500"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── Hero Banner ────────────────────────── */

function HeroBanner() {
  const [heroBooks, setHeroBooks] = useState<string[]>([]);
  const [stats, setStats] = useState<{ titles: number; authors: number; categories: number } | null>(null);

  // Fewer floaters on desktop; on mobile we'll just show none (hidden via CSS)
  const floaterLayout = [
    { w: 78,  h: 110, top: "5%",  left: "3%",   delay: "0s",   dur: "6s",   rotate: "-8deg",  opacity: 0.88 },
    { w: 60,  h: 84,  top: "50%", left: "10%",  delay: "1.5s", dur: "8s",   rotate: "5deg",   opacity: 0.82 },
    { w: 52,  h: 74,  top: "76%", left: "6%",   delay: "2.8s", dur: "7s",   rotate: "-4deg",  opacity: 0.70 },
    { w: 66,  h: 94,  top: "28%", left: "23%",  delay: "0.6s", dur: "9s",   rotate: "7deg",   opacity: 0.60 },
    { w: 44,  h: 62,  top: "66%", left: "17%",  delay: "3.5s", dur: "6.5s", rotate: "-11deg", opacity: 0.50 },
    { w: 94,  h: 128, top: "8%",  right: "3%",  delay: "0.8s", dur: "7s",   rotate: "10deg",  opacity: 0.88 },
    { w: 58,  h: 82,  top: "55%", right: "25%", delay: "2s",   dur: "9s",   rotate: "-6deg",  opacity: 0.78 },
    { w: 70,  h: 98,  top: "78%", right: "2%",  delay: "1.2s", dur: "8s",   rotate: "4deg",   opacity: 0.65 },
    { w: 62,  h: 88,  top: "32%", right: "14%", delay: "1s",   dur: "8.5s", rotate: "-12deg", opacity: 0.55 },
    { w: 46,  h: 64,  top: "68%", right: "12%", delay: "4s",   dur: "7.5s", rotate: "8deg",   opacity: 0.45 },
  ];

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { image: string; status: string }[]) => {
        const imgs = data
          .filter((p) => p.status === "published" && p.image)
          .map((p) => toImgUrl(p.image))
          .slice(0, 10);
        setHeroBooks(imgs);
      })
      .catch(() => {});

    Promise.all([
      fetch(`${API_URL}/api/products`).then((r) => (r.ok ? r.json() : [])).then((data: { status: string }[]) => data.filter((p) => p.status === "published").length).catch(() => 0),
      fetch(`${API_URL}/api/categories`).then((r) => (r.ok ? r.json() : [])).then((data: Category[]) => data.filter((c) => c.imprint === "agph" && c.status === "active").length).catch(() => 0),
      fetch(`${API_URL}/api/authors`).then((r) => (r.ok ? r.json() : [])).then((data: unknown[]) => data.length).catch(() => 0),
    ]).then(([titles, categories, authors]) => setStats({ titles, authors, categories }));
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) rotate(var(--r)); }
          50%       { transform: translateY(-18px) rotate(var(--r)); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-float { animation: floatUp var(--dur) ease-in-out var(--delay) infinite; }
        .hero-entry { animation: fadeSlideUp 0.8s ease-out both; }
        .entry-1 { animation-delay: 0.1s; }
        .entry-2 { animation-delay: 0.25s; }
        .entry-3 { animation-delay: 0.4s; }
        .entry-4 { animation-delay: 0.6s; }
        .entry-5 { animation-delay: 0.8s; }
        .book-cover-float {
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 6px 8px 24px rgba(0,0,0,0.18), -2px 0 6px rgba(0,0,0,0.08);
        }
      `}</style>

      <section
        className="relative overflow-hidden bg-white"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        {/* Soft background mesh */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 15% 50%, #f5f5f5 0%, transparent 70%)," +
              "radial-gradient(ellipse 50% 50% at 85% 30%, #f8f8f8 0%, transparent 60%)",
          }}
        />

        {/* Dot texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Floating book covers — hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          {floaterLayout.map((f, i) => {
            const imgSrc = heroBooks[i] ?? null;
            return (
              <div
                key={i}
                className="absolute pointer-events-none hero-float book-cover-float"
                style={{
                  width: f.w,
                  height: f.h,
                  top: f.top,
                  left: "left" in f ? (f as any).left : undefined,
                  right: "right" in f ? (f as any).right : undefined,
                  "--r": f.rotate,
                  "--dur": f.dur,
                  "--delay": f.delay,
                  opacity: imgSrc ? f.opacity : 0,
                  position: "absolute",
                } as React.CSSProperties}
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt=""
                    aria-hidden="true"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 4 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", borderRadius: 4, background: "linear-gradient(135deg, #e5e7eb, #d1d5db)" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Mobile book strip (replaces floaters on small screens) ── */}
        {heroBooks.length > 0 && (
          <div className="md:hidden overflow-hidden pt-8 pb-2 px-4">
            <div className="flex gap-3 justify-center">
              {heroBooks.slice(0, 5).map((src, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-lg overflow-hidden shadow-md"
                  style={{
                    width: 52, height: 76,
                    opacity: [0.95, 0.80, 1, 0.80, 0.95][i] ?? 0.8,
                    transform: ["-4deg", "-2deg", "0deg", "2deg", "4deg"].map(r => `rotate(${r})`)[i],
                    transition: "transform 0.3s",
                  }}
                >
                  <img src={src} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative mx-auto px-4 sm:px-6 py-8 sm:py-16 md:py-20 lg:py-28">
          <div className="mx-auto text-center max-w-2xl">

            {/* Headline */}
            <div className="hero-entry entry-2">
              <h1
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-gray-900"
                style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}
              >
                New Releases
              </h1>
            </div>

            {/* Subtext */}
            <p className="hero-entry entry-3 mt-4 sm:mt-6 text-gray-500 text-sm sm:text-base leading-relaxed max-w-sm sm:max-w-xl mx-auto px-2 sm:px-0">
              Discover our latest titles — handpicked across every category,
              available as paperback and digital editions.
            </p>

            {/* CTAs */}
            <div className="hero-entry entry-4 mt-6 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <a
                href="#browse"
                className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-gray-900 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ fontFamily: "sans-serif", letterSpacing: "0.05em" }}
              >
                Browse All
              </a>
              <a
                href="/ebooks"
                className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-full hover:border-gray-700 hover:text-gray-900 transition-all duration-200 shadow-sm"
                style={{ fontFamily: "sans-serif" }}
              >
                eBooks Only
              </a>
            </div>

            {/* Stats bar */}
            <div className="hero-entry entry-5 mt-8 sm:mt-16 grid grid-cols-3 gap-0 border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm max-w-xs sm:max-w-lg mx-auto">
              {(
                [
                  { value: stats?.titles,     label: "Titles"     },
                  { value: stats?.authors,    label: "Authors"    },
                  { value: stats?.categories, label: "Categories" },
                ] as { value: number | undefined; label: string }[]
              ).map((s, i) => (
                <div
                  key={s.label}
                  className={`py-3 sm:py-5 text-center ${i < 2 ? "border-r border-gray-200" : ""}`}
                >
                  <p
                    className="text-lg sm:text-2xl text-gray-900"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
                  >
                    {s.value == null ? (
                      <span className="inline-block w-8 sm:w-10 h-5 sm:h-7 rounded bg-gray-100 animate-pulse align-middle" />
                    ) : (
                      `${s.value}+`
                    )}
                  </p>
                  <p
                    className="text-[10px] sm:text-xs text-gray-400 mt-0.5 uppercase tracking-wide"
                    style={{ fontFamily: "sans-serif", letterSpacing: "0.1em" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-10 pointer-events-none">
          <svg viewBox="0 0 1440 40" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────── Main Page ──────────────────────────── */

export default function NewReleasesPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const visible = useVisible();

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((all: Category[]) => {
        const active = all.filter((c) => c.imprint === "agph" && c.status === "active");
        const topLevel = active.filter((c) => !c.parent_id);
        const children = active.filter((c) => c.parent_id !== null);
        const grouped: CategoryGroup[] = topLevel.map((parent) => {
          const kids = children.filter((c) => c.parent_id === parent.id);
          return { parent, children: kids, isStandalone: kids.length === 0 };
        });
        setGroups(grouped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .hero-entry { animation: fadeSlideUp 0.8s ease-out both; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <HeroBanner />

      <main id="browse" className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-10 lg:py-14">
        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <section key={i} className="mb-10 sm:mb-14 lg:mb-16">
              <div className="mb-4 sm:mb-6 space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: visible }).map((_, j) => (
                  <SkeletonCard key={j} visible={visible} />
                ))}
              </div>
            </section>
          ))}

        {/* Category rows */}
        {!loading &&
          groups.map((group, idx) => (
            <div
              key={group.parent.id}
              className="hero-entry"
              style={{ animationDelay: `${idx * 0.1}s`, animationDuration: "0.6s" }}
            >
              <CategoryRow group={group} />
            </div>
          ))}

        {/* Empty state */}
        {!loading && groups.length === 0 && (
          <div className="text-center py-20 sm:py-28 space-y-3">
            <svg className="w-12 h-12 sm:w-14 sm:h-14 text-gray-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-lg sm:text-xl text-gray-300 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              No categories found.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}