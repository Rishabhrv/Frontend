"use client";

import { useEffect, useState } from "react";
import { BookOpen, X, ChevronRight } from "lucide-react";
import Link from "next/link";

import EbookHero from "@/components/ebooks/EbookHero";
import BookCard from "@/components/books/BookCard";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const BOOKS_PER_ROW = 5;
const ROWS_PER_CAT  = 2;
const LIMIT_PER_CAT = BOOKS_PER_ROW * ROWS_PER_CAT; // 10 shown, fetch more to avoid missing books

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
  categories: string;       // comma-separated category names
  category_slugs?: string;  // comma-separated category slugs (if returned by API)
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
    price:            raw.price,
    sell_price:       raw.sell_price,
    ebook_price:      raw.ebook_price      ?? undefined,
    ebook_sell_price: raw.ebook_sell_price ?? undefined,
    category:         cats[0]?.trim()      ?? undefined,
    author:           raw.author_name      ?? undefined,
  };
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonSection() {
  return (
    <div className="mb-12">
      <div className="h-6 bg-gray-200 rounded w-48 mb-5 animate-pulse" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse border border-gray-100">
            <div className="bg-gray-100" style={{ height: 200 }} />
            <div className="p-3 space-y-2">
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
  const [sections, setSections]   = useState<CategorySection[]>([]);
  const [loading, setLoading]     = useState(true);

  // ── On mount: fetch ALL ebooks at once, then group by category ────────────
  useEffect(() => {
    (async () => {
      try {
        // Fetch all ebooks (backend already filters product_type = ebook/both)
        const res  = await fetch(`${API_URL}/api/ebooks?limit=200&sort=newest`);
        const data = await res.json();
        const allBooks: EbookRaw[] = data.ebooks ?? [];

        // Build a map: categoryName → books[]
        const catMap = new Map<string, { slug: string; books: Book[] }>();

        allBooks.forEach((raw) => {
          const book = toBook(raw);

          // Parse category names & slugs from comma-separated strings
          const rawNames = raw.categories
            ? raw.categories.split(",").map((c: string) => c.trim()).filter(Boolean)
            : [];
          const rawSlugs = raw.category_slugs
            ? raw.category_slugs.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];

          // If book has no category at all, place in "Other"
          const catNames = rawNames.length > 0 ? rawNames : ["Other"];
          const catSlugs = rawSlugs.length > 0 ? rawSlugs : ["other"];

          catNames.forEach((name, idx) => {
            const slug = catSlugs[idx] ?? name.toLowerCase().replace(/\s+/g, "-");
            if (!catMap.has(name)) catMap.set(name, { slug, books: [] });
            // Avoid duplicates within the same category section
            const entry = catMap.get(name)!;
            if (!entry.books.find((b) => b.id === book.id)) {
              entry.books.push(book);
            }
          });
        });

        // Convert map → sections array, cap each category at LIMIT_PER_CAT
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

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* ── Hero ── */}
      <EbookHero />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* ── Loading skeletons ── */}
        {loading && (
          <>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No eBooks available yet</h3>
            <p className="text-sm text-gray-400">Check back soon for new additions</p>
          </div>
        )}

        {/* ── Category sections ── */}
        {!loading && sections.map(({ category, books }) => (
          <div key={category.id} className="mb-14">

            {/* Category header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {/* Accent bar */}
                <span className="w-1 h-7 rounded-full bg-gray-800 block" />
                <h2
                  className="text-xl font-black text-gray-900"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {category.name}
                </h2>
                <span className="text-xs text-gray-400 font-medium bg-gray-200 px-2.5 py-1 rounded-full">
                  {books.length} book{books.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* View all link */}
              <Link
                href={`/ebooks?category=${category.slug}`}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                View all <ChevronRight size={13} />
              </Link>
            </div>

            {/* 2 rows × 5 books grid */}
            <div className="flex flex-wrap -mx-1">
              {books.slice(0, LIMIT_PER_CAT).map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  visibleCount={BOOKS_PER_ROW}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="mt-10 border-b border-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}