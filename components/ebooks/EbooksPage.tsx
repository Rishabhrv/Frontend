"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

import EbookHero from "@/components/ebooks/EbookHero";
import BookCard from "@/components/books/BookCard";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const BOOKS_PER_ROW = 5;
const ROWS_PER_CAT  = 5;
const LIMIT_PER_CAT = BOOKS_PER_ROW * ROWS_PER_CAT;

// ─── Types ────────────────────────────────────────────────────────────────────
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

type EbookRaw = {
  id: number;
  title: string;
  slug: string;
  main_image: string | null;
  product_type: "ebook" | "physical" | "both";
  stock: number;
  price: number;
  sell_price: number;
  ebook_price: number | null;
  ebook_sell_price: number | null;
  file_type: "pdf" | "epub" | null;
  author_name: string | null;
  categories: string;
  category_slugs?: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  status: string;
};

type CategorySection = {
  category: Category;
  books: Book[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveImg(path: string | null | undefined): string {
  if (!path) return "/placeholder-book.png";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function toBook(raw: EbookRaw): Book {
  const cats = raw.categories ? raw.categories.split(",") : [];
  return {
    id:               raw.id,
    title:            raw.title,
    slug:             raw.slug,
    image:            resolveImg(raw.main_image),
    product_type:     raw.product_type,
    stock:            raw.stock,
    price:            raw.ebook_price      ?? raw.price,
    sell_price:       raw.ebook_sell_price ?? raw.sell_price,
    ebook_price:      raw.ebook_price      ?? undefined,
    ebook_sell_price: raw.ebook_sell_price ?? undefined,
    category:         cats[0]?.trim()      ?? undefined,
    author:           raw.author_name      ?? undefined,
  };
}

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useColumns(): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(5);
      else if (w >= 1024) setCols(4);
      else if (w >= 768)  setCols(3);
      else if (w >= 480)  setCols(2);
      else                setCols(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

// ─── Skeleton section ─────────────────────────────────────────────────────────
function SkeletonSection({ cols }: { cols: number }) {
  const gridClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };
  return (
    <div className="mb-10 sm:mb-12">
      <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
      <div className={`grid ${gridClass[cols] ?? "grid-cols-2"} gap-3 sm:gap-4`}>
        {[...Array(cols * 2)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse border border-gray-100">
            <div className="bg-gray-100" style={{ height: 160 }} />
            <div className="p-2.5 space-y-2">
              <div className="h-2 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-6 bg-gray-100 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EbooksPage() {
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading]   = useState(true);
  const cols = useColumns();

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/api/ebooks?limit=200&sort=newest`);
        const data = await res.json();
        const allRaw: EbookRaw[] = data.ebooks ?? [];

        // Pre-validate all images before building sections
        const validated = await Promise.all(
          allRaw.map(
            (raw) =>
              new Promise<EbookRaw | null>((resolve) => {
                if (!raw.main_image) return resolve(null);
                const src = raw.main_image.startsWith("http")
                  ? raw.main_image
                  : `${API_URL}${raw.main_image.startsWith("/") ? "" : "/"}${raw.main_image}`;
                const img = new window.Image();
                img.onload = () => resolve(raw);
                img.onerror = () => resolve(null);
                img.src = src;
              })
          )
        );
        
        const allBooks = validated.filter(Boolean) as EbookRaw[];
        
        const catMap = new Map<string, { slug: string; books: Book[] }>();
        
        allBooks.forEach((raw) => {
          const book = toBook(raw);

          const rawNames = raw.categories
            ? raw.categories.split(",").map((c: string) => c.trim()).filter(Boolean)
            : [];
          const rawSlugs = raw.category_slugs
            ? raw.category_slugs.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];

          const catNames = rawNames.length > 0 ? rawNames : ["Other"];
          const catSlugs = rawSlugs.length > 0 ? rawSlugs : ["other"];

          catNames.forEach((name, idx) => {
            const slug = catSlugs[idx] ?? name.toLowerCase().replace(/\s+/g, "-");
            if (!catMap.has(name)) catMap.set(name, { slug, books: [] });
            const entry = catMap.get(name)!;
            if (!entry.books.find((b) => b.id === book.id)) {
              entry.books.push(book);
            }
          });
        });

        const built: CategorySection[] = [];
        catMap.forEach((val, name) => {
          built.push({
            category: { id: 0, name, slug: val.slug, status: "active" },
            books: val.books.slice(0, LIMIT_PER_CAT),
          });
        });

        setSections(built);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Grid class based on current column count
  const gridClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* ── Hero ── */}
      <EbookHero />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">

        {/* ── Loading skeletons ── */}
        {loading && (
          <>
            <SkeletonSection cols={cols} />
            <SkeletonSection cols={cols} />
            <SkeletonSection cols={cols} />
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4 sm:mb-5">
              <BookOpen size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-1">No eBooks available yet</h3>
            <p className="text-xs sm:text-sm text-gray-400">Check back soon for new additions</p>
          </div>
        )}

        {/* ── Category sections ── */}
        {!loading && sections.map(({ category, books }) => (
          <div key={category.id} className="mb-10 sm:mb-14">

            {/* Category header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Accent bar */}
                <span className="w-1 h-6 sm:h-7 rounded-full bg-gray-800 block shrink-0" />
                <h2
                  className="text-base sm:text-xl font-black text-gray-900 truncate"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {category.name}
                </h2>
                {/* Hide count badge on very small screens */}
                <span className="hidden xs:inline-flex text-xs text-gray-400 font-medium bg-gray-200 px-2 py-0.5 rounded-full shrink-0">
                  {books.length} book{books.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* View all */}
              <Link
                href={`/product-category/${category.slug}`}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors shrink-0 ml-3"
              >
                <span className="hidden sm:inline">View all</span>
                <span className="sm:hidden">All</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Responsive book grid */}
            <div className={`grid ${gridClass[cols] ?? "grid-cols-2"} gap-3 sm:gap-4`}>
              {books.slice(0, cols * 2).map((book) => (
                <div key={book.id} className="w-full min-w-0 [&>*]:!w-full [&>*]:!max-w-full">
                  <BookCard
                    book={book}
                    visibleCount={cols}
                    forceFormat="ebook"
                  />
                </div>
              ))}
            </div>

            {/* View more row — show on mobile if there are more books than one row */}
            {books.length > cols * 2 && (
              <Link
                href={`/product-category/${category.slug}`}
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                See all {books.length} books in {category.name}
                <ChevronRight size={14} />
              </Link>
            )}

            {/* Divider */}
            <div className="mt-8 sm:mt-10 border-b border-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}