"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Book = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
  updated_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function ContinueReadingBook() {
  const [books, setBooks] = useState<Book[]>([]);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/my-books/continue`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then(setBooks)
      .catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">
        Continue Reading
      </h1>

      {books.length === 0 && (
        <p className="text-gray-500">
          You haven’t started reading any books yet.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/my-books/${book.slug}`}
            className="group"
          >
            <div className="bg-white rounded shadow hover:shadow-md transition">
              <Image
                src={
                  book.main_image
                    ? `${API_URL}${book.main_image}`
                    : "/images/placeholder-book.png"
                }
                alt={book.title}
                width={200}
                height={300}
                className="rounded-t object-cover"
                unoptimized
              />

              <div className="p-3">
                <h3 className="text-sm font-medium line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Last read:{" "}
                  {new Date(book.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
