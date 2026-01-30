"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Book = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  sell_price: number;
  main_image: string;
  authors?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;


const FeaturedBookSection = () => {
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products/random/featured`)
      .then((res) => res.json())
      .then((data) => setBook(data));
  }, []);

  if (!book) return null;

  return (
    <section className="mt-16 grid grid-cols-1 md:grid-cols-[45%_55%] m-10 rounded-lg">
      {/* LEFT IMAGE */}
      <div className="flex items-center justify-center bg-gray-200 p-10">
        <div className="rounded-lg shadow-xl bg-white p-2 ">
            <Image
                src={`${API_URL}${book.main_image}`}
                alt={book.title}
                width={520}
                height={780}
                priority
                className="h-90 w-full object-contain rounded"
                unoptimized
            />

        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex flex-col justify-center px-8 py-10">
        <h2 className="text-3xl font-serif mb-2">
          {book.title}
        </h2>

        <p className="text-sm text-gray-600 mb-3">
          by{" "}
          <span className="underline">
            {book.authors || "AGPH Author"}
          </span>
        </p>

        {/* RATING (static for now) */}
        <div className="flex items-center gap-1 mb-4 text-yellow-500">
          ★ ★ ★ ★ ★ <span className="text-gray-500 text-sm">(4)</span>
        </div>

        {/* DESCRIPTION */}
        <p className="text-gray-700 mb-6 line-clamp-4">
          {book.description}
        </p>

        {/* PRICE */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-semibold">
            ₹{book.sell_price}
          </span>

          {book.price > book.sell_price && (
            <span className="text-gray-400 line-through">
              ₹{book.price}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/product/${book.slug}`}
          className="inline-block w-fit rounded bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          View Book
        </Link>
      </div>
    </section>
  );
};

export default FeaturedBookSection;
