"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Book = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
};

export default function LibraryFavoriteBook() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/my-books/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setBooks);
  }, []);

  return (
    <div className="p-6 min-h-screen">
      <h1 className="text-xl font-semibold mb-4">Favorites</h1>

      {books.length === 0 ? (
        <p className="text-gray-500">No favorites yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {books.map(book => (
            <Link
              key={book.id}
              href={`/library/read/${book.slug}`}
              className="group"
            >
              <img
                src={`${API_URL}${book.main_image}`}
                className="rounded shadow group-hover:scale-105 transition"
              />
              <p className="mt-2 text-sm font-medium">
                {book.title}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
