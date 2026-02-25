"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookCard from "@/components/books/BookCard";
import { Star } from 'lucide-react';



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
    return null; // or loading skeleton
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


  


  useEffect(() => {
    if (!slug) return;
  
    fetch(`${API}/api/viewcategory/${slug}/top-authors`)
      .then(res => res.json())
      .then(setAuthors);
  }, [slug]);
  
  useEffect(() => {
    if (!slug) return;
  
    fetch(
      `${API}/api/viewcategory/${slug}/authors?search=${authorSearch}`
    )
      .then(res => res.json())
      .then(setAuthors);
  }, [authorSearch]);

useEffect(() => {
  setPage(1);
}, [slug, maxPrice, sort, search, rating, selectedAuthor]);


  /* ================= FETCH PRODUCTS ================= */
useEffect(() => {
  if (!slug) return;

  fetch(
    `${API}/api/viewcategory/${slug}/products?min=0&max=${maxPrice}&sort=${sort}&search=${encodeURIComponent(
      search
    )}&rating=${rating}&author=${selectedAuthor}&page=${page}&limit=${LIMIT}`
  )
    .then(res => res.json())
    .then(data => {
      setProducts(data.products || []);
      setTotal(data.total || 0);
    })
    .catch(() => {
      setProducts([]);
      setTotal(0);
    });
}, [slug, page, maxPrice, sort, search, rating, selectedAuthor]);



  /* ================= FETCH CATEGORIES ================= */
  useEffect(() => {
  fetch(`${API}/api/viewcategory/counts`)
    .then(res => res.json())
    .then(setCategories)
    .catch(() => setCategories([]));
}, []);

useEffect(() => {
  if (!slug) return;

  fetch(`${API}/api/viewcategory/${slug}/rating-counts`)
    .then(res => res.json())
    .then(setRatingCounts);
}, [slug]);



  useEffect(() => {
  if (!slug) return;

  fetch(`${API}/api/viewcategory/${slug}/best-sellers`)
    .then(res => res.json())
    .then(setBestSellers);
}, [slug]);

const groupedCategories = categories.reduce((acc: any, cat: any) => {
  const parent = cat.parent_id ?? 0;

  if (!acc[parent]) acc[parent] = [];
  acc[parent].push(cat);

  return acc;
}, {});


const visibleAuthors = authorSearch
  ? authors // 🔍 show searched authors
  : [...authors]
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 5); // ⭐ top 5 only


  return (
    <div className=" mx-auto px-30 py-12">
      <div className="grid grid-cols-[260px_1fr] gap-10">

        {/* ================= SIDEBAR ================= */}
        <aside className="space-y-10 text-sm text-gray-700">

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
            <h4 className="font-serif text-base mb-3">Filter by Price</h4>
            <input
              type="range"
              min="0"
              max="5000"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="price-range w-full"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs">₹0 – ₹{maxPrice}</span>
            </div>
          </div>

          {/* Categories */}
          {/* Categories */}
<div>
  <h4 className="font-serif text-base mb-3">Categories</h4>

  <ul className="space-y-2">
    {(groupedCategories[0] || []).map((parent: any) => (
      <li key={parent.id}>
        {/* Parent */}
        <div className="flex justify-between items-center font-medium">
          <a
            href={`/category/${parent.slug}`}
            className="hover:underline"
          >
            {parent.name}
          </a>
          <span className="text-xs text-gray-400">
            ({parent.product_count})
          </span>
        </div>

        {/* Children */}
        {groupedCategories[parent.id] && (
          <ul className="mt-1 ml-4 space-y-1  pl-1">
            {groupedCategories[parent.id].map((child: any) => (
              <li
                key={child.id}
                className="flex justify-between items-center text-sm "
              >
                <a
                  href={`/category/${child.slug}`}
                  className="hover:underline"
                >
                  {child.name}
                </a>
                <span className="text-xs text-gray-400">
                  ({child.product_count})
                </span>
              </li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ul>
</div>



          <div>
            <h4 className="font-serif text-base mb-3">Filter by Rating</h4>
          
            {[5, 4, 3, 2, 1].map((r) => (
              <label
                key={r}
                className="flex justify-between items-center cursor-pointer mb-2"
              >
                <span
                  onClick={() => setRating(r)}
                  className={`flex items-center gap-1 ${
                    rating === r ? "font-semibold" : ""
                  }`}
                >
                  {Array.from({ length: r }, (_, i) => <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />)}
                  {Array.from({ length: 5 - r }, (_, i) => <Star key={i} className="w-4 h-4 fill-current text-gray-300" />)} &nbsp; 
                </span>
          
                <span className="text-xs text-gray-400">
                  ({ratingCounts?.[r] || 0})
                </span>
              </label>
            ))}
          </div>
          <div>
  <h4 className="font-serif text-base mb-3">Authors</h4>

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
        className={`flex items-center justify-between cursor-pointer
          ${
            selectedAuthor === String(a.id)
              ? "font-semibold text-black"
              : "text-gray-600 hover:text-black"
          }`}
      >
        <span>{a.name}</span>
        <span className="text-xs text-gray-400">
          ({a.product_count})
        </span>
      </li>
    ))}
  </ul>

  {!authorSearch && authors.length > 5 && (
    <p className="text-xs text-gray-400 mt-2">
      Type to search more authors
    </p>
  )}

  {selectedAuthor && (
    <button
      onClick={() => setSelectedAuthor("")}
      className="text-xs mt-3 underline text-gray-600 hover:text-black"
    >
      Clear author filter
    </button>
  )}
</div>



          {/* Best Sellers */}
          <div>
            <h4 className="font-serif text-base mb-3">Best Sellers</h4>
            <ul className="space-y-3 text-xs">
              {bestSellers.map((b) => (
                <Link key={b.id} href={`/product/${b.slug}`} className="flex gap-3 items-center">
                    <li key={b.id} className="flex gap-3 items-center">
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

        {/* ================= PRODUCTS ================= */}
        <section className=" px-20">

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs text-gray-400 mb-1">
              Home / {slug}
            </p>

            <h1 className="font-serif text-4xl mb-2 capitalize">
              {slug?.replace(/-/g, " ")}
            </h1>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">

              {/* ================= ACTIVE FILTERS ================= */}
              {(search || rating || selectedAuthor || maxPrice < 2000 || sort !== "latest") && (
                <div className="flex flex-wrap items-center gap-2 max-w-[80%]">
                  
                  {search && (
                    <FilterChip
                      label={`Search: "${search}"`}
                      onRemove={() => setSearch("")}
                    />
                  )}
            
                  {maxPrice < 2000 && (
                    <FilterChip
                      label={`Price: ₹0 – ₹${maxPrice}`}
                      onRemove={() => setMaxPrice(2000)}
                    />
                  )}
            
                  {rating > 0 && (
                    <FilterChip
                      label={`${rating}★`}
                      onRemove={() => setRating(0)}
                    />
                  )}
            
                  {selectedAuthor && (
                    <FilterChip
                      label={`Author: ${
                        authors.find(a => String(a.id) === selectedAuthor)?.name || ""
                      }`}
                      onRemove={() => setSelectedAuthor("")}
                    />
                  )}
            
                  {sort !== "latest" && (
                    <FilterChip
                      label={
                        sort === "price_low"
                          ? "Price: Low → High"
                          : "Price: High → Low"
                      }
                      onRemove={() => setSort("latest")}
                    />
                  )}
            
                </div>
              )}

               {/* ================= SORT ================= */}
              <div className="ml-auto">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="border border-gray-300 bg-black text-white  text-xs rounded-full p-1  focus:outline-none"
                >
                  <option value="latest">Sort by latest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            
            </div>

          </div>
          {/* Product Grid */}
          <div className="flex flex-wrap -mx-2 gap-y-15 mb-15">
            {products.map((product) => (
              <BookCard
  key={product.id}
  visibleCount={3}
  book={{
    id: product.id,
    title: product.title,
    slug: product.slug,
    // In your products.map() inside CategoryPage
    image: product.main_image ? `${API}${product.main_image}` : "/images/placeholder.png",

    // ✅ REQUIRED FIELDS
    product_type: product.product_type,
    stock: product.stock,

    price: product.price,
    sell_price: product.sell_price,

    // ✅ OPTIONAL (safe)
    ebook_price: product.ebook_price,
    ebook_sell_price: product.ebook_sell_price,
  }}
/>

            ))}
          </div>

          {total > LIMIT && (
            <div className="flex justify-center items-center gap-2 mt-12 text-sm">
          
              {/* Prev */}
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className={`px-3 py-1 rounded-full border cursor-pointer
                  ${page === 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-black hover:text-white"}`}
              >
                ← Prev
              </button>
          
              {/* Page Numbers */}
              {Array.from({ length: Math.ceil(total / LIMIT) }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), page + 2)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-full border cursor-pointer
                      ${page === p
                        ? "bg-black text-white"
                        : "hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                ))}
          
              {/* Next */}
              <button
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage(p => p + 1)}
                className={`px-3 py-1 rounded-full border cursor-pointer
                  ${page >= Math.ceil(total / LIMIT)
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-black hover:text-white"}`}
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
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
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

