"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

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
          <div className="grid grid-cols-3 gap-x-8 gap-y-14">
            {products.map(product => (
              <div key={product.id} className="relative ">

                {/* Image */}
                <div className="relative">
                  <Image
                    src={`${API}${product.main_image}`}
                    alt={product.title}
                    width={300}
                    height={420}
                    className="h-80 mx-auto object-cover"
                    unoptimized
                  />

                  {product.stock === 0 && (
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-200 text-xs px-3 py-1">
                      OUT OF STOCK
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="mt-4 text-sm leading-snug">
                  {product.title}
                </h3>

                {/* Price */}
                <div className="mt-1">
                  <span className="text-xs line-through text-gray-400 mr-2">
                    ₹{product.price}
                  </span>
                  <span className="font-semibold">
                    ₹{product.sell_price}
                  </span>
                </div>

                {/* Rating */}
                <div className="text-xs text-gray-400 mt-1">
                  ★★★★★
                </div>

              </div>
            ))}
          </div>

        </section>
      </div>
    </div>
  );
}
