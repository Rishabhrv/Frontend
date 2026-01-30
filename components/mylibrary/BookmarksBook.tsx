"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bookmark = {
  title: string;
  slug: string;
  cfi: string;
  label: string;
  created_at: string;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function BookmarksBook() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/my-books/bookmarks/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then(setBookmarks)
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">
        Bookmarks
      </h1>

      {bookmarks.length === 0 && (
        <p className="text-gray-500">
          You haven’t added any bookmarks yet.
        </p>
      )}

      <div className="space-y-4">
        {bookmarks.map((bm, i) => (
          <Link
            key={i}
            href={`/my-books/${bm.slug}`}
            className="block bg-white p-4 rounded shadow hover:bg-gray-50"
          >
            <h3 className="font-medium">{bm.title}</h3>
            <p className="text-sm text-gray-500">
              {bm.label}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(bm.created_at).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
