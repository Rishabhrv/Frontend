"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingCart, CircleCheck, BookOpen, Loader2 } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  status: string;
  imprint: "agph"; // ← NEW
};

type Book = {
  id: number;
  title: string;
  slug: string;
  image: string;        // resolved by component
  main_image: string;   // raw from API
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

// ─── Resolve image URL ────────────────────────────────────────────────────────
function resolveImg(path: string | null | undefined): string {
  if (!path) return "/placeholder-book.png";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── Book Card ────────────────────────────────────────────────────────────────
const BookCard = ({ book }: { book: Book }) => {
  const [liked, setLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/wishlist/check/${book.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { liked: false }))
      .then((d) => setLiked(!!d.liked))
      .catch(() => {});
  }, [book.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { window.dispatchEvent(new Event("open-account-slider")); return; }
    try {
      const res = await fetch(`${API_URL}/api/wishlist/${book.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.status === "added");
      window.dispatchEvent(new Event("wishlist-change"));
    } catch {}
  };

  const addToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) { window.dispatchEvent(new Event("open-account-slider")); return; }
    const format =
      book.product_type === "ebook" ? "ebook"
      : book.product_type === "physical" ? "paperback"
      : book.stock > 0 ? "paperback" : "ebook";
    try {
      const res = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: book.id, format, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) return;
      window.dispatchEvent(new Event("cart-change"));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {}
  };

  const isEbookOnly     = book.product_type === "ebook";
  const displaySell     = book.ebook_sell_price ?? book.sell_price;
  const displayMrp      = book.ebook_price ?? book.price;
  const showDiscount    = displayMrp && displaySell && displayMrp > displaySell;
  const discountPct     = showDiscount ? Math.round(((displayMrp! - displaySell!) / displayMrp!) * 100) : 0;
  const isOutOfStock    = book.product_type === "physical" && book.stock === 0;
  const isDisabled      = addedToCart || isOutOfStock;
  const imgSrc          = resolveImg(book.main_image ?? book.image);

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-300 flex flex-col">

      {/* Cover */}
      <Link href={`/product/${book.slug}`} className="block">
        <div className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 200 }}>

          <button
            onClick={toggleWishlist}
            className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/90 backdrop-blur-sm p-1.5 shadow transition-transform hover:scale-110 cursor-pointer"
          >
            <Heart size={13} className={liked ? "fill-red-500 text-red-500" : "text-gray-400"} />
          </button>

          {book.badge && (
            <span className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">
              {book.badge}
            </span>
          )}

          {discountPct > 0 && (
            <span className="absolute bottom-2.5 left-2.5 z-10 bg-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
              {discountPct}% OFF
            </span>
          )}

          {isEbookOnly && (
            <span className="absolute bottom-2.5 right-2.5 z-10 bg-violet-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <BookOpen size={9} /> eBook
            </span>
          )}

          <Image
            src={imgSrc}
            alt={book.title}
            width={120}
            height={170}
            className="object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 py-5"
            style={{ maxHeight: 200 }}
            unoptimized
          />
        </div>

        {/* Text */}
        <div className="px-3 pt-3 pb-2">
          {book.category && (
            <p className="text-[10px] italic text-amber-600/80 truncate mb-0.5">{book.category}</p>
          )}
          <h3 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">{book.title}</h3>
          {book.author && (
            <p className="text-[11px] font-bold text-gray-700 truncate mb-1">{book.author}</p>
          )}
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-sm font-bold text-gray-900">₹{displaySell}</span>
            {showDiscount && <span className="text-[10px] line-through text-gray-400">₹{displayMrp}</span>}
          </div>
        </div>
      </Link>

      {/* Cart button */}
      <div className="px-3 pb-3 pt-1 mt-auto">
        <button
          onClick={addToCart}
          disabled={isDisabled}
          className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-lg transition-all duration-200
            ${isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : addedToCart  ? "bg-emerald-500 text-white"
            : "bg-gray-900 text-white hover:bg-amber-700 cursor-pointer"}`}
        >
          {isOutOfStock  ? "Out of Stock"
          : addedToCart  ? <><CircleCheck size={12} /> Added</>
          : <><ShoppingCart size={12} /> Add to Cart</>}
        </button>
      </div>
    </div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="bg-gray-100" style={{ height: 200 }} />
    <div className="p-3 space-y-2">
      <div className="h-2 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="h-7 bg-gray-100 rounded mt-3" />
    </div>
  </div>
);

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function CategoryBookSection() {
  const [categories, setCategories]         = useState<Category[]>([]);
  const [activeSlug, setActiveSlug]         = useState<string>("");
  const [books, setBooks]                   = useState<Book[]>([]);
  const [loadingCats, setLoadingCats]       = useState(true);
  const [loadingBooks, setLoadingBooks]     = useState(false);

  // ── Load categories ───────────────────────────────────────────────────────
  useEffect(() => {
    // Fetch all active categories, then filter to only those with ebooks
    fetch(`${API_URL}/api/categories`)
      .then((r) => r.json())
      .then(async (data: Category[]) => {
        const active = data.filter((c) => c.status === "active" && c.imprint === "agph");
        // Check each category in parallel for ebook presence
        const checks = await Promise.all(
          active.map((cat) =>
            fetch(`${API_URL}/api/categories/${cat.slug}/products`)
              .then((r) => r.json())
              .then((books: Book[]) => ({
                cat,
                // Only count ebook or both — backend currently ignores ?product_type
                hasEbooks: books.some((b: Book) => b.product_type === 'ebook' || b.product_type === 'both'),
              }))
              .catch(() => ({ cat, hasEbooks: false }))
          )
        );
        const withEbooks = checks.filter((c) => c.hasEbooks).map((c) => c.cat);
        setCategories(withEbooks);
        if (withEbooks.length) setActiveSlug(withEbooks[0].slug);
      })
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  }, []);

  // ── Load books when tab changes ───────────────────────────────────────────
  useEffect(() => {
    if (!activeSlug) return;
    setLoadingBooks(true);
    setBooks([]);
    fetch(`${API_URL}/api/categories/${activeSlug}/products?limit=10&product_type=ebook`)
      .then((r) => r.json())
      .then((data: Book[]) => setBooks(data.filter((b) => b.product_type === 'ebook' || b.product_type === 'both').slice(0, 10)))
      .catch(console.error)
      .finally(() => setLoadingBooks(false));
  }, [activeSlug]);

  return (
    <section className="w-full py-12 px-4 md:px-8 lg:px-12 bg-gray-100">

      {/* Section header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1">Browse by Category</p>
        <h2
          className="text-3xl md:text-4xl font-black text-gray-900 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Find Your Next E-Book Read
        </h2>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── LEFT: Category tabs ── */}
        <aside className="flex-shrink-0 w-44 sticky top-24">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categories</p>
            </div>

            {loadingCats ? (
              <div className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <nav className="p-2 flex flex-col gap-1">
                {categories.map((cat) => {
                  const isActive = cat.slug === activeSlug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveSlug(cat.slug)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 
                        ${isActive
                          ? "bg-gray-700 text-white shadow-sm shadow-amber-200"
                          : "text-gray-600 hover:bg-amber-50 hover:text-amber-800"
                        }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </aside>

        {/* ── RIGHT: Book grid ── */}
        <div className="flex-1 min-w-0">

          {/* Active category label */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">
              {categories.find((c) => c.slug === activeSlug)?.name ?? ""}
            </h3>
          </div>

          {/* Loading skeletons */}
          {loadingBooks && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Books grid */}
          {!loadingBooks && books.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingBooks && books.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <BookOpen size={28} className="text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No books in this category yet</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon for new arrivals</p>
            </div>
          )}
        </div>
      </div>

      {/* Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>
    </section>
  );
}