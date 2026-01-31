"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import BookCard from "@/components/books/BookCard";


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
  const slug = params?.slug;

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sort, setSort] = useState("latest");

  /* ================= FETCH PRODUCTS ================= */
  useEffect(() => {
    if (!slug) return;

    fetch(
      `${API}/api/viewcategory/${slug}/products?min=0&max=${maxPrice}&sort=${sort}`
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
  }, [slug, maxPrice, sort]);

  /* ================= FETCH CATEGORIES ================= */
  useEffect(() => {
    fetch(`${API}/api/viewcategory`)
      .then(res => res.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <div className=" mx-auto px-20 py-12">
      <div className="grid grid-cols-[260px_1fr] gap-10">

        {/* ================= SIDEBAR ================= */}
        <aside className="space-y-10 text-sm text-gray-700">

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search products…"
              className="w-full border border-gray-300 px-3 py-2 text-sm"
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
              className="w-full"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs">₹0 – ₹{maxPrice}</span>
              <button className="border px-3 py-1 text-xs">FILTER</button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-base mb-3">Categories</h4>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id} className="flex justify-between">
                  <a
                    href={`/category/${cat.slug}`}
                    className="hover:underline"
                  >
                    {cat.name}
                  </a>
                  <span className="text-xs text-gray-400">(0)</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Best Sellers */}
          <div>
            <h4 className="font-serif text-base mb-3">Our Best Sellers</h4>
            <ul className="space-y-4 text-xs">
              <li>
                <p className="font-medium">My First Number Book</p>
                <p className="text-gray-400">★★★★★</p>
              </li>
              <li>
                <p className="font-medium">Pride and Prejudice</p>
                <p className="text-gray-400">★★★★★</p>
              </li>
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

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing all {total} results
              </p>

              <select
                onChange={e => setSort(e.target.value)}
                className="border px-3 py-1 text-sm"
              >
                <option value="latest">Sort by latest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex flex-wrap -mx-2 gap-y-15 mb-20">
            {products.map((product) => (
              <BookCard
                key={product.id}
                visibleCount={3} // 👈 controls width (3 per row)
                book={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  sell_price: product.sell_price,
                  slug: product.slug,
                  image: `${API}${product.main_image}`, // 🔥 important
                }}
              />
            ))}
          </div>



        </section>
      </div>
    </div>
  );
}
