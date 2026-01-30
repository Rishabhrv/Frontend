"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LibraryBookCard from "@/components/mylibrary/LibraryBookCard";
import LibraryFooter from '@/components/mylibrary/LibraryFooter';
import LibrarySidebar from '@/components/mylibrary/LibrarySidebar';
import LibraryHeader from '@/components/mylibrary/LibraryHeader';
import "../../../app/globals.css";

type Book = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };

  const [books, setBooks] = useState<Book[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/mylibrary/category/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),

      fetch(`${API_URL}/api/mylibrary/category/${slug}/meta`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([booksData, meta]) => {
        setBooks(booksData || []);
        setCategoryName(meta?.name || "");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug || loading) {
    return (
      <div className="p-10 text-sm text-gray-500">
        Loading category…
      </div>
    );
  }

  return (
         <div >
                    <div className="flex">
                      <LibrarySidebar />
                      <div className="flex flex-1 flex-col">
                        <LibraryHeader />

                         <div className="p-6 space-y-6 min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold">
          {categoryName}
        </h1>
        <p className="text-sm text-gray-500">
          {books.length} books
        </p>
      </div>

      {/* BOOK GRID */}
      {books.length === 0 ? (
        <p className="text-sm text-gray-500">
          No books found in this category.
        </p>
      ) : (
        <div className="flex flex-wrap -mx-2">
          {books.map(book => (
            <LibraryBookCard
              key={book.id}
              book={book}
              visibleCount={6}
            />
          ))}
        </div>
      )}
    </div>
                       
            
                        <LibraryFooter />
                      </div>
                    </div>
                </div>
   
  );
}
