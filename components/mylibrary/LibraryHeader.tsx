"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type User = {
  id: number;
  name: string;
  email: string;
};

type SearchResult = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
};

export default function LibraryHeader() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  /* =========================
     FETCH USER INFO
  ========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/mylibrary/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setUser)
      .catch(() => {});
  }, []);

  /* =========================
     CHECK SUBSCRIPTION
  ========================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/mylibrary/check-access`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.access) setBlocked(true);
      });
  }, []);

  /* =========================
     COUNTDOWN REDIRECT
  ========================== */
  useEffect(() => {
    if (!blocked) return;

    if (countdown === 0) {
      window.location.href = "/subscriptions";
      return;
    }

    const timer = setTimeout(
      () => setCountdown((c) => c - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [blocked, countdown]);

  /* =========================
     LIVE SEARCH (DEBOUNCED)
  ========================== */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const delay = setTimeout(() => {
      setLoadingSearch(true);

      fetch(
        `${API_URL}/api/mylibrary/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((r) => r.json())
        .then((data) => {
          setResults(data);
          setShowDropdown(true);
        })
        .finally(() => setLoadingSearch(false));
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  /* =========================
     CLOSE ON OUTSIDE CLICK
  ========================== */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6 justify-between">

          {/* LOGO */}
          <Link
            href="/library/MyLibrary"
            className="flex items-center gap-2 text-lg font-bold text-gray-700"
          >
            <Library size={22} />
            My Library
          </Link>

          {/* 🔍 SEARCH */}
          <div
            ref={wrapperRef}
            className="relative flex-1 max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search books..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length && setShowDropdown(true)}
              className="
                w-full rounded-lg border border-gray-300
                bg-white pl-10 pr-4 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-black
              "
            />

            {/* DROPDOWN */}
           {showDropdown && (
  <div
    className="
      absolute left-0 right-0 mt-2 bg-white
      rounded-xl shadow-lg border border-gray-200 z-50
      p-4
    "
  >
    <div className="mb-3 text-xs font-semibold text-gray-400">
      Products
    </div>

    {loadingSearch && (
      <div className="text-sm text-gray-500">
        Searching...
      </div>
    )}

    {!loadingSearch && results.length === 0 && (
      <div className="text-sm text-gray-500">
        No results found
      </div>
    )}

    {/* 🔲 GRID (3 columns, max 6 items) */}
    <div className="grid grid-cols-3 gap-4">
      {results.slice(0, 6).map((book) => (
        <Link
          key={book.id}
          href={`/my-books/${book.slug}`}
          onClick={() => {
            setShowDropdown(false);
            setQuery("");
          }}
          className="group text-center"
        >
          <div className="relative">
            <img
              src={
                book.main_image
                  ? `${API_URL}${book.main_image}`
                  : "/images/placeholder-book.png"
              }
              alt={book.title}
              className="
                w-full h-60 object-cover rounded
                group-hover:scale-105 transition
              "
            />

            {/* READ BUTTON */}
            <span
              className="
                absolute bottom-2 right-2
                bg-blue-600 text-white text-xs
                px-2 py-1 rounded
              "
            >
              Read
            </span>
          </div>

          <p className="mt-2 text-xs text-gray-700 line-clamp-2">
            {book.title}
          </p>
        </Link>
      ))}
    </div>
  </div>
)}

          </div>

          {/* USER */}
          {user && (
            <span className="text-sm text-gray-600 font-medium">
              Hi, {user.name}
            </span>
          )}
        </div>
      </header>

      {/* ================= BLOCKED OVERLAY ================= */}
      {blocked && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <h2 className="text-2xl font-bold">
              Activate Your Subscription
            </h2>

            <p className="text-gray-600 text-sm">
              You need an active subscription to access{" "}
              <strong>My Library</strong>.
            </p>

            <p className="text-sm text-gray-500">
              Redirecting in{" "}
              <span className="font-bold text-blue-600">
                {countdown}
              </span>{" "}
              seconds…
            </p>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() =>
                  (window.location.href = "/subscriptions")
                }
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Choose Plan Now
              </button>

              <button
                onClick={() => router.push("/")}
                className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
