"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Library, LayoutGrid, List, Search, Eye } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= TYPES ================= */
type Book = {
  product_id: number;
  title: string;
  slug: string;
  main_image: string;
  purchased_at: string;
  category_slug: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  status: string;
};

/* ================= PAGE ================= */
export default function MyBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /* ===== FETCH BOOKS ===== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/my-books`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBooks(data);
        } else {
          setBooks([]);
          window.location.href = "/login";
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* ===== FETCH CATEGORIES ===== */
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        const active = data.filter((c: Category) => c.status !== "inactive");
        setCategories(active);
      });
  }, []);

  /* ===== FILTER BOOKS ===== */
  const filteredBooks = Array.isArray(books)
  ? books.filter(book => {
      const matchSearch = book.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        !activeCategory || book.category_slug === activeCategory;

      return matchSearch && matchCategory;
    })
  : [];


  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading your library…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-15 py-10">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Library className="w-7 h-7" />
            My Books
          </h1>

          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search books…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* VIEW DROPDOWN */}
            <select
              value={view}
              onChange={e => setView(e.target.value as "grid" | "list")}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="grid">Grid view</option>
              <option value="list">List view</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= EMPTY ================= */}
      {filteredBooks.length === 0 && (
        <p className="text-center text-gray-500 mt-20">
          No books found.
        </p>
      )}

      {/* ================= GRID VIEW ================= */}
      {view === "grid" && filteredBooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredBooks.map(book => (
            <div
              key={book.product_id}
              className="group bg-white  overflow-hidden "
            >
              <div className="relative aspect-[3/4] bg-gray-100">
                <Image
                  src={`${API_URL}${book.main_image}`}
                  alt={book.title}
                  fill
                  className="object-cover shadow-sm group-hover:scale-105 transition-transform rounded-lg"
                  unoptimized
                />
              </div>

              <div className="p-4">
                <h3 className="font-medium text-sm line-clamp-2">
                  {book.title}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Purchased on{" "}
                  {new Date(book.purchased_at).toLocaleDateString()}
                </p>

                <Link
                  href={`/my-books/${book.slug}`}
                  className="block mt-4 text-center text-sm bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                     <Eye /> Read 
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= LIST VIEW ================= */}
      {view === "list" && filteredBooks.length > 0 && (
        <div className="space-y-4">
          {filteredBooks.map(book => (
            <div
              key={book.product_id}
              className="group flex items-center gap-4 bg-white rounded-xl p-4 "
            >
              <Image
                src={`${API_URL}${book.main_image}`}
                width={90}
                height={130}
                alt={book.title}
                className="rounded-lg object-cover group-hover:scale-105 transition-transform rounded-lg"
                unoptimized
              />

              <div className="flex-1">
                <h3 className="font-medium">{book.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Purchased on{" "}
                  {new Date(book.purchased_at).toLocaleDateString()}
                </p>
              </div>

              <Link
                href={`/my-books/${book.slug}`}
                className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
              >
                   <Eye /> Read
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ================= QUICK SEARCH ================= */}
      <div className="mt-16 border-t border-gray-300 pt-8">
        <h3 className="text-sm font-semibold mb-4">Quick Search</h3>

        <div className="flex flex-wrap gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat.slug ? null : cat.slug
                )
              }
              className={`px-4 py-2 rounded-lg text-sm  transition
                ${
                  activeCategory === cat.slug
                    ? "bg-black text-white border-black"
                    : "bg-gray-200 hover:bg-gray-300"
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
