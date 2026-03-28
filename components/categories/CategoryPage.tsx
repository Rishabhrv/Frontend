"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookCard from "@/components/books/BookCard";
import { Star, SlidersHorizontal, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Book = {
  id: number;
  title: string;
  price: number;
  sell_price: number;
  image: string;
  slug: string;
};

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();

  if (!params || !params.slug) {
    return null;
  }

  const slug = params.slug;
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<any>({});
  const [authors, setAuthors] = useState<any[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [page, setPage] = useState(1);
  const LIMIT = 12;
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [visibleSubjectCount, setVisibleSubjectCount] = useState(5);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("categories");

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/viewcategory/${slug}/top-authors`)
      .then((res) => res.json())
      .then(setAuthors);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/viewcategory/${slug}/authors?search=${authorSearch}`)
      .then((res) => res.json())
      .then(setAuthors);
  }, [authorSearch]);

  useEffect(() => {
    if (!slug) return;
    fetch(
      `${API}/api/viewcategory/${slug}/subjects?search=${encodeURIComponent(subjectSearch)}`
    )
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, [slug, subjectSearch]);

  useEffect(() => {
    setPage(1);
  }, [slug, maxPrice, sort, search, rating, selectedAuthor, selectedSubject]);

  useEffect(() => {
    if (!slug) return;
    fetch(
      `${API}/api/viewcategory/${slug}/products?min=0&max=${maxPrice}&sort=${sort}&search=${encodeURIComponent(search)}&rating=${rating}&author=${selectedAuthor}&subject=${selectedSubject}&page=${page}&limit=${LIMIT}`
    )
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      });
  }, [slug, page, maxPrice, sort, search, rating, selectedAuthor, selectedSubject]);

  useEffect(() => {
    fetch(`${API}/api/viewcategory/counts`)
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/viewcategory/${slug}/rating-counts`)
      .then((res) => res.json())
      .then(setRatingCounts);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/viewcategory/${slug}/best-sellers`)
      .then((res) => res.json())
      .then(setBestSellers);
  }, [slug]);

  useEffect(() => {
    setVisibleSubjectCount(5);
  }, [subjectSearch]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const groupedCategories = categories.reduce((acc: any, cat: any) => {
    const parent = cat.parent_id ?? 0;
    if (!acc[parent]) acc[parent] = [];
    acc[parent].push(cat);
    return acc;
  }, {});

  const visibleAuthors = authorSearch
    ? authors
    : [...authors]
        .sort((a, b) => b.product_count - a.product_count)
        .slice(0, 5);

  const activeFilterCount = [
    search,
    maxPrice < 2000,
    rating > 0,
    selectedAuthor,
    selectedSubject,
    sort !== "latest",
  ].filter(Boolean).length;

  const SidebarContent = () => (
    <aside className="space-y-8 text-sm text-gray-700">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search products…"
          className="w-full border border-gray-300 px-3 py-2 text-sm rounded-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Price Filter */}
      <div>
        <h2 className="font-serif text-base mb-3">Filter by Price</h2>
        <input
          type="range"
          min="0"
          max="5000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="price-range w-full"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs">₹0 – ₹{maxPrice}</span>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="font-serif text-base mb-3">Categories</h2>
        <ul className="space-y-2">
          {(groupedCategories[0] || []).map((parent: any) => (
            <li key={parent.id}>
              <div className="flex justify-between items-center font-medium">
                <a href={`/category/${parent.slug}`} className="hover:underline">
                  {parent.name}
                </a>
                <span className="text-xs text-gray-400">({parent.product_count})</span>
              </div>
              {groupedCategories[parent.id] && (
                <ul className="mt-1 ml-4 space-y-1 pl-1">
                  {groupedCategories[parent.id].map((child: any) => (
                    <li key={child.id} className="flex justify-between items-center text-sm">
                      <a href={`/category/${child.slug}`} className="hover:underline">
                        {child.name}
                      </a>
                      <span className="text-xs text-gray-400">({child.product_count})</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Rating Filter */}
      <div>
        <h2 className="font-serif text-base mb-3">Filter by Rating</h2>
        {[5, 4, 3, 2, 1].map((r) => (
          <label key={r} className="flex justify-between items-center cursor-pointer mb-2">
            <span
              onClick={() => setRating(r)}
              className={`flex items-center gap-1 ${rating === r ? "font-semibold" : ""}`}
            >
              {Array.from({ length: r }, (_, i) => (
                <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />
              ))}
              {Array.from({ length: 5 - r }, (_, i) => (
                <Star key={i} className="w-4 h-4 fill-current text-gray-300" />
              ))}
              &nbsp;
            </span>
            <span className="text-xs text-gray-400">({ratingCounts?.[r] || 0})</span>
          </label>
        ))}
      </div>

      {/* Authors */}
      <div>
        <h2 className="font-serif text-base mb-3">Authors</h2>
        <input
          type="text"
          placeholder="Search author..."
          className="w-full border px-2 py-1 mb-5 text-sm rounded-full"
          value={authorSearch}
          onChange={(e) => setAuthorSearch(e.target.value)}
        />
        <ul className="space-y-2 text-sm">
          {visibleAuthors.map((a) => (
            <li
              key={a.id}
              onClick={() => setSelectedAuthor(String(a.id))}
              className={`flex items-center justify-between cursor-pointer ${
                selectedAuthor === String(a.id)
                  ? "font-semibold text-black"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>{a.name}</span>
              <span className="text-xs text-gray-400">({a.product_count})</span>
            </li>
          ))}
        </ul>
        {!authorSearch && authors.length > 5 && (
          <p className="text-xs text-gray-400 mt-2">Type to search more authors</p>
        )}
        {selectedAuthor && (
          <button
            onClick={() => setSelectedAuthor("")}
            className="text-xs mt-3 underline text-gray-600 hover:text-black cursor-pointer transition"
          >
            Clear author filter
          </button>
        )}
      </div>

      {/* Subjects */}
      <div>
        <h2 className="font-serif text-base mb-3">Subjects</h2>
        <input
          type="text"
          placeholder="Search subject..."
          className="w-full border px-2 py-1 mb-5 text-sm rounded-full"
          value={subjectSearch}
          onChange={(e) => {
            setSubjectSearch(e.target.value);
            setVisibleSubjectCount(5);
          }}
        />
        <ul className="space-y-2 text-sm">
          {subjects.slice(0, visibleSubjectCount).map((s) => (
            <li
              key={s.id}
              onClick={() => setSelectedSubject(String(s.id))}
              className={`flex items-center justify-between cursor-pointer ${
                selectedSubject === String(s.id)
                  ? "font-semibold text-black"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span>{s.name}</span>
              <span className="text-xs text-gray-400">({s.product_count})</span>
            </li>
          ))}
        </ul>
        {subjects.length > visibleSubjectCount && (
          <button
            onClick={() => setVisibleSubjectCount((c) => c + 5)}
            className="text-xs mt-3 underline text-gray-500 hover:text-black cursor-pointer transition"
          >
            See more
          </button>
        )}
        {selectedSubject && (
          <button
            onClick={() => setSelectedSubject("")}
            className="text-xs mt-3 ml-3 underline text-gray-600 hover:text-black cursor-pointer transition"
          >
            Clear subject filter
          </button>
        )}
      </div>

      {/* Best Sellers */}
      <div>
        <h2 className="font-serif text-base mb-3">Best Sellers</h2>
        <ul className="space-y-3 text-xs">
          {bestSellers.map((b) => (
            <Link key={b.id} href={`/product/${b.slug}`} className="flex gap-3 items-center">
              <li className="flex gap-3 items-center">
                <img
                  src={`${API}${b.main_image}`}
                  className="w-10 h-14 object-cover"
                  alt=""
                />
                <span className="line-clamp-2">{b.title}</span>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </aside>
  );

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-25 py-8 lg:py-12 bg-white">

      {/* ── Mobile: Filter + Sort bar ── */}
      <div className="lg:hidden flex items-center border-b border-gray-200 mb-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-r border-gray-200 hover:bg-gray-50 transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex-1 flex items-center justify-center">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full text-center text-sm font-medium py-3 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="latest">Sort: Latest</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* ── Mobile: Flipkart-style tabbed filter drawer ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />

          {/* Full-screen drawer */}
          <div className="relative mt-auto bg-white w-full h-[90vh] flex flex-col shadow-2xl rounded-t-2xl overflow-hidden">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="font-semibold text-base">Filters</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two-panel body */}
            <div className="flex flex-1 overflow-hidden">

              {/* LEFT: Tab rail */}
              <div className="w-[130px] shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                {[
                  { key: "search",     label: "Search",     active: !!search },
                  { key: "categories", label: "Categories", active: false },
                  { key: "price",      label: "Price",      active: maxPrice < 2000 },
                  { key: "rating",     label: "Rating",     active: rating > 0 },
                  { key: "authors",    label: "Authors",    active: !!selectedAuthor },
                  { key: "subjects",   label: "Subjects",   active: !!selectedSubject },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilterTab(tab.key)}
                    className={`w-full text-left px-4 py-4 text-sm border-b border-gray-100 relative transition-colors
                      ${activeFilterTab === tab.key
                        ? "bg-white font-semibold text-black border-l-2 border-l-black"
                        : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {tab.label}
                    {tab.active && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-black" />
                    )}
                  </button>
                ))}
              </div>

              {/* RIGHT: Filter content */}
              <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-700">

                {/* Search */}
                {activeFilterTab === "search" && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-gray-400 mb-3">Search</p>
                    <input
                      type="text"
                      placeholder="Search products…"
                      className="w-full border border-gray-300 px-3 py-2 text-sm rounded-full"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="text-xs mt-3 underline text-gray-500">
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Categories */}
                {activeFilterTab === "categories" && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-gray-400 mb-3">Categories</p>
                    <ul className="space-y-2">
                      {(groupedCategories[0] || []).map((parent: any) => (
                        <li key={parent.id}>
                          <div className="flex justify-between items-center font-medium py-1">
                            <a href={`/category/${parent.slug}`} className="hover:underline">{parent.name}</a>
                            <span className="text-xs text-gray-400">({parent.product_count})</span>
                          </div>
                          {groupedCategories[parent.id] && (
                            <ul className="ml-3 space-y-1 border-l border-gray-200 pl-3 mt-1">
                              {groupedCategories[parent.id].map((child: any) => (
                                <li key={child.id} className="flex justify-between items-center py-1">
                                  <a href={`/category/${child.slug}`} className="hover:underline text-gray-600">{child.name}</a>
                                  <span className="text-xs text-gray-400">({child.product_count})</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price */}
                {activeFilterTab === "price" && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-gray-400 mb-3">Price</p>
                    <input
                      type="range" min="0" max="5000" value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="price-range w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>₹0</span>
                      <span className="font-semibold text-black">Up to ₹{maxPrice}</span>
                      <span>₹5000</span>
                    </div>
                    {maxPrice < 2000 && (
                      <button onClick={() => setMaxPrice(2000)} className="text-xs mt-4 underline text-gray-500">Reset</button>
                    )}
                  </div>
                )}

                {/* Rating */}
                {activeFilterTab === "rating" && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-gray-400 mb-3">Customer Rating</p>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRating(rating === r ? 0 : r)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition
                            ${rating === r ? "border-black bg-black/5 font-semibold" : "border-gray-200 hover:border-gray-400"}`}
                        >
                          <span className="flex items-center gap-1">
                            {Array.from({ length: r }, (_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - r }, (_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current text-gray-200" />
                            ))}
                            <span className="text-xs ml-1 text-gray-500">& above</span>
                          </span>
                          <span className="text-xs text-gray-400">({ratingCounts?.[r] || 0})</span>
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <button onClick={() => setRating(0)} className="text-xs mt-4 underline text-gray-500">Clear</button>
                    )}
                  </div>
                )}

                {/* Authors */}
                {activeFilterTab === "authors" && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-gray-400 mb-3">Authors</p>
                    <input
                      type="text" placeholder="Search author..."
                      className="w-full border px-3 py-2 mb-3 text-sm rounded-full"
                      value={authorSearch}
                      onChange={(e) => setAuthorSearch(e.target.value)}
                    />
                    <ul className="space-y-1">
                      {visibleAuthors.map((a) => (
                        <li key={a.id}>
                          <button
                            onClick={() => setSelectedAuthor(selectedAuthor === String(a.id) ? "" : String(a.id))}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition
                              ${selectedAuthor === String(a.id)
                                ? "border-black bg-black/5 font-semibold"
                                : "border-gray-200 hover:border-gray-400"}`}
                          >
                            <span>{a.name}</span>
                            <span className="text-xs text-gray-400">({a.product_count})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {!authorSearch && authors.length > 5 && (
                      <p className="text-xs text-gray-400 mt-2">Type to search more authors</p>
                    )}
                    {selectedAuthor && (
                      <button onClick={() => setSelectedAuthor("")} className="text-xs mt-3 underline text-gray-500">Clear</button>
                    )}
                  </div>
                )}

                {/* Subjects */}
                {activeFilterTab === "subjects" && (
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wide text-gray-400 mb-3">Subjects</p>
                    <input
                      type="text" placeholder="Search subject..."
                      className="w-full border px-3 py-2 mb-3 text-sm rounded-full"
                      value={subjectSearch}
                      onChange={(e) => { setSubjectSearch(e.target.value); setVisibleSubjectCount(5); }}
                    />
                    <ul className="space-y-1">
                      {subjects.slice(0, visibleSubjectCount).map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => setSelectedSubject(selectedSubject === String(s.id) ? "" : String(s.id))}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition
                              ${selectedSubject === String(s.id)
                                ? "border-black bg-black/5 font-semibold"
                                : "border-gray-200 hover:border-gray-400"}`}
                          >
                            <span>{s.name}</span>
                            <span className="text-xs text-gray-400">({s.product_count})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {subjects.length > visibleSubjectCount && (
                      <button onClick={() => setVisibleSubjectCount((c) => c + 5)} className="text-xs mt-3 underline text-gray-500">
                        See more
                      </button>
                    )}
                    {selectedSubject && (
                      <button onClick={() => setSelectedSubject("")} className="text-xs mt-3 ml-3 underline text-gray-500">Clear</button>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex gap-3 bg-white">
              <button
                onClick={() => {
                  setSearch(""); setMaxPrice(2000); setRating(0);
                  setSelectedAuthor(""); setSelectedSubject(""); setSort("latest");
                }}
                className="flex-1 py-3 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50 transition"
              >
                Clear All
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex-1 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Show {total} Results
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 xl:gap-10">

        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:block">
          <SidebarContent />
        </div>

        {/* ── Products section ── */}
        <section className="min-w-0 px-0 sm:px-0 lg:px-10 xl:px-16">

          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <p className="text-xs text-gray-400 mb-1">Home / {slug}</p>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-4 capitalize">
              {slug?.replace(/-/g, " ")}
            </h1>

            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">

              {/* Active filters */}
              {(search || rating || selectedAuthor || selectedSubject || maxPrice < 2000 || sort !== "latest") && (
                <div className="flex flex-wrap items-center gap-2 max-w-full lg:max-w-[80%]">
                  {search && (
                    <FilterChip label={`Search: "${search}"`} onRemove={() => setSearch("")} />
                  )}
                  {maxPrice < 2000 && (
                    <FilterChip label={`Price: ₹0 – ₹${maxPrice}`} onRemove={() => setMaxPrice(2000)} />
                  )}
                  {rating > 0 && (
                    <FilterChip label={`${rating}★`} onRemove={() => setRating(0)} />
                  )}
                  {selectedAuthor && (
                    <FilterChip
                      label={`Author: ${authors.find((a) => String(a.id) === selectedAuthor)?.name || ""}`}
                      onRemove={() => setSelectedAuthor("")}
                    />
                  )}
                  {selectedSubject && (
                    <FilterChip
                      label={`Subject: ${subjects.find((s) => String(s.id) === selectedSubject)?.name || ""}`}
                      onRemove={() => setSelectedSubject("")}
                    />
                  )}
                  {sort !== "latest" && (
                    <FilterChip
                      label={sort === "price_low" ? "Price: Low → High" : "Price: High → Low"}
                      onRemove={() => setSort("latest")}
                    />
                  )}
                </div>
              )}

              {/* Desktop sort */}
              <div className="hidden lg:block ml-auto">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-gray-300 bg-black text-white text-xs rounded-full p-1 focus:outline-none"
                >
                  <option value="latest">Sort by latest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid – responsive columns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 mb-12">
            {products.map((product) => (
              <div key={product.id} className="w-full min-w-0 [&>*]:!w-full [&>*]:!max-w-full">
                <BookCard
                  visibleCount={3}
                  book={{
                    id: product.id,
                    title: product.title,
                    slug: product.slug,
                    image: product.main_image
                      ? `${API}${product.main_image}`
                      : "/images/placeholder.png",
                    product_type: product.product_type,
                    stock: product.stock,
                    price: product.price,
                    sell_price: product.sell_price,
                    ebook_price: product.ebook_price,
                    ebook_sell_price: product.ebook_sell_price,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 text-sm flex-wrap">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs sm:text-sm ${
                  page === 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-black hover:text-white"
                }`}
              >
                ← Prev
              </button>

              {Array.from({ length: Math.ceil(total / LIMIT) }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), page + 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-full border cursor-pointer text-xs sm:text-sm ${
                      page === p ? "bg-black text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}

              <button
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage((p) => p + 1)}
                className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs sm:text-sm ${
                  page >= Math.ceil(total / LIMIT)
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-black hover:text-white"
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-full text-xs">
      {label}
      <button
        onClick={onRemove}
        className="text-white/70 hover:text-red-400 font-bold leading-none cursor-pointer"
      >
        ×
      </button>
    </span>
  );
}