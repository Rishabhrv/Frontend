"use client";

import { useEffect, useState, useRef } from "react";
import React from "react";
import Image from "next/image";
import BookCard from "@/components/books/BookCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Author = {
  id: number;
  name: string;
  slug: string;
  profile_image: string | null;
  bio: string | null;
  created_at: string;
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
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default function AuthorPage({ params }: Props) {
  const { slug } = React.use(params);

  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioOverflows, setBioOverflows] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/authors/slug/${slug}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setAuthor(data.author);
        setBooks(data.books);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (bioRef.current) {
      setBioOverflows(bioRef.current.scrollHeight > bioRef.current.clientHeight + 4);
    }
  }, [author]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="h-px bg-gray-200 mb-12" />
          <div className="grid grid-cols-3 gap-16">
            <div className="col-span-1 space-y-6">
              <div className="aspect-[3/4] bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
            <div className="col-span-2 space-y-8 pt-4">
              <div className="h-16 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 404 ── */
  if (notFound || !author) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 text-center px-6">
        <div
          className="text-9xl font-black text-gray-800 leading-none"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          404
        </div>
        <div className="h-px w-24 bg-gray-400" />
        <p
          className="text-gray-600 text-sm uppercase tracking-[0.25em]"
          style={{ fontFamily: "Garamond, Georgia, serif" }}
        >
          Author Not Found
        </p>
        <p className="text-gray-400 text-sm max-w-xs" style={{ fontFamily: "Garamond, Georgia, serif" }}>
          We couldn't locate this author. The link may be incorrect or the author may have been removed.
        </p>
        <a
          href="/"
          className="mt-4 inline-block border border-gray-800 text-gray-800 text-xs uppercase tracking-[0.2em] px-8 py-3 hover:bg-gray-800 hover:text-white transition-all duration-300"
          style={{ fontFamily: "Garamond, Georgia, serif" }}
        >
          Return Home
        </a>
      </div>
    );
  }

  const initials = author.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const joinYear = new Date(author.created_at).getFullYear();

  return (
    <div className="min-h-screen bg-white">
      {/*
       * ─────────────────────────────────────────
       * TOP RULE + MASTHEAD
       * ─────────────────────────────────────────
       */}
      <div className="border-b-2 border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.35em] text-gray-400"
            style={{ fontFamily: "Garamond, Georgia, serif" }}
          >
            Author Profile
          </span>
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gray-400" />
            <span
              className="text-[10px] uppercase tracking-[0.3em] text-gray-500"
              style={{ fontFamily: "Garamond, Georgia, serif" }}
            >
              {books.length} {books.length === 1 ? "Work" : "Works"} · Est. {joinYear}
            </span>
          </div>
        </div>
      </div>

      {/*
       * ─────────────────────────────────────────
       * HERO — editorial split layout
       * ─────────────────────────────────────────
       */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative pt-16 pb-0">
          {/* Background large ghost text */}
          <div
            className="absolute top-0 left-0 right-0 text-[clamp(80px,14vw,160px)] font-black leading-none text-gray-900/[0.04] select-none pointer-events-none overflow-hidden whitespace-nowrap"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            aria-hidden="true"
          >
            {author.name.toUpperCase()}
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-16 items-start">
            {/* Portrait column */}
            <div className="flex flex-col items-start">
              <div className="relative">
                {/* Offset shadow block */}
                <div className="absolute top-3 left-3 w-full h-full bg-gray-200" />
                <div className="relative w-44 h-56 md:w-56 md:h-72 overflow-hidden bg-gray-100">
                  {author.profile_image ? (
                    <Image
                      src={`${API_URL}${author.profile_image}`}
                      alt={author.name}
                      fill
                      className="object-cover grayscale-[15%] contrast-[1.05]"
                      unoptimized
                      style={{ position: "absolute" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <span
                        className="text-5xl md:text-6xl font-black text-white/90"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Small vertical meta */}
              <div className="mt-6 space-y-1" style={{ fontFamily: "Garamond, Georgia, serif" }}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Since</p>
                <p className="text-2xl font-light text-gray-700">{joinYear}</p>
              </div>
            </div>

            {/* Name + bio column */}
            <div className="flex flex-col pt-2 md:pt-6">
              {/* Section label */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10 bg-gray-400" />
                <span
                  className="text-[10px] uppercase tracking-[0.35em] text-gray-400"
                  style={{ fontFamily: "Garamond, Georgia, serif" }}
                >
                  The Author
                </span>
              </div>

              {/* Name */}
              <h1
                className="text-[clamp(36px,6vw,72px)] font-black text-gray-900 leading-[0.95] mb-8 tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {author.name}
              </h1>

              {/* Thick rule */}
              <div className="flex gap-1 mb-8">
                <div className="h-1 w-16 bg-gray-800" />
                <div className="h-1 w-4 bg-gray-400" />
              </div>

              {/* Bio */}
              {author.bio ? (
                <div>
                  <p
                    ref={bioRef}
                    className={`text-gray-500 text-[15px] leading-[1.85] transition-all ${
                      bioExpanded ? "" : "line-clamp-5"
                    }`}
                    style={{ fontFamily: "Garamond, Georgia, serif" }}
                  >
                    {author.bio}
                  </p>
                  {bioOverflows && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gray-400 hover:text-gray-800 transition-colors cursor-pointer"
                      style={{ fontFamily: "Garamond, Georgia, serif" }}
                    >
                      {bioExpanded ? "Collapse" : "Read Full Biography"}
                      <span className="text-base leading-none">{bioExpanded ? "↑" : "↓"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic text-[15px]" style={{ fontFamily: "Garamond, Georgia, serif" }}>
                  No biography available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/*
         * ─────────────────────────────────────────
         * BOOKS SECTION
         * ─────────────────────────────────────────
         */}
        <div className="mt-20 mb-16">
          {/* Section header */}
          <div className="flex items-center gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-px w-10 bg-gray-400" />
                <span
                  className="text-[10px] uppercase tracking-[0.35em] text-gray-400"
                  style={{ fontFamily: "Garamond, Georgia, serif" }}
                >
                  Bibliography
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black text-gray-900"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Works by {author.name}
              </h2>
            </div>
            <div className="flex-1 border-b border-dashed border-gray-200" />
            <span
              className="shrink-0 text-xs uppercase tracking-[0.2em] text-gray-400 border border-gray-200 px-3 py-1"
              style={{ fontFamily: "Garamond, Georgia, serif" }}
            >
              {books.length} {books.length === 1 ? "Title" : "Titles"}
            </span>
          </div>

          {books.length === 0 ? (
            <div className="border border-dashed border-gray-200 py-24 flex flex-col items-center gap-4">
              <div className="text-5xl">📚</div>
              <p className="text-gray-400 italic text-sm" style={{ fontFamily: "Garamond, Georgia, serif" }}>
                No published works yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-10">
              {books.map((book, i) => (
                <div key={book.id} className="w-full" style={{ animationDelay: `${i * 60}ms` }}>
                  <BookCard
                    visibleCount={1}
                    book={{
                      id: book.id,
                      title: book.title,
                      slug: book.slug,
                      image: `${API_URL}${book.image}`,
                      product_type: book.product_type,
                      stock: book.stock,
                      price: book.price,
                      sell_price: book.sell_price,
                      ebook_price: book.ebook_price,
                      ebook_sell_price: book.ebook_sell_price,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom rule */}
        <div className="border-t-2 border-gray-800 py-6 flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.3em] text-gray-400"
            style={{ fontFamily: "Garamond, Georgia, serif" }}
          >
            {author.name}
          </span>
          <div className="flex gap-1">
            <div className="h-1 w-8 bg-gray-800" />
            <div className="h-1 w-2 bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}