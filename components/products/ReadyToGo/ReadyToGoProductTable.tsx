"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

// Use environment variable for production, fallback to localhost for dev

const CRMSERVER_API_URL = process.env.NEXT_PUBLIC_CRMSERVER_API_URL;
const FRONTEND_JWT_SECRET = process.env.NEXT_PUBLIC_FRONTEND_JWT_SECRET || "default_fallback_secret";

// ── NATIVE BROWSER JWT GENERATOR ─────────────────────────────────────
async function generateLocalToken(secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    user_id: 1, 
    session_id: "auto-generated-frontend-session",
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) 
  };

  const base64UrlEncode = (obj: any) => 
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const head64 = base64UrlEncode(header);
  const pay64 = base64UrlEncode(payload);
  const data = `${head64}.${pay64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${data}.${sig64}`;
}
// ──────────────────────────────────────────────────────────────────────

export default function ReadyToGoProductTable() {
  const router = useRouter();
  
  // Data States
  const [books, setBooks] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local Pagination & Search States
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ── 1. FETCH NEW PENDING BOOKS API ──
  const fetchPendingBooks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await generateLocalToken(FRONTEND_JWT_SECRET);

      const res = await fetch(`${CRMSERVER_API_URL}/api/books/unlisted/agph`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        }
      });

      if (res.status === 401) {
        throw new Error("401 Unauthorized: The generated token was rejected.");
      }

      if (!res.ok) throw new Error("Failed to fetch pending books");
      
      const json = await res.json();
      
      // Fixed: The API returns { "status": "success" } not { "success": true }
      if (json.status === "success") {
        setBooks(json.data || []);
      } else {
        console.error("API returned error:", json.message);
        setBooks([]);
      }
    } catch (error) {
      console.error("Error fetching pending books:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingBooks();
  }, [fetchPendingBooks]);

  // ── 2. LOCAL SEARCH & PAGINATION LOGIC ──
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1); 
    setSearchQuery(searchInput.trim().toLowerCase());
  };

  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true;
    const titleMatch = book.title?.toLowerCase().includes(searchQuery);
    const isbnMatch = book.isbn?.toLowerCase().includes(searchQuery);
    return titleMatch || isbnMatch;
  });

  const total = filteredBooks.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const visibleBooks = filteredBooks.slice((page - 1) * limit, page * limit);

  // ── 3. ACTIONS ──
  const handleImportClick = (book: any) => {
    sessionStorage.setItem("pendingProductImport", JSON.stringify(book));
    router.push("/admin/product/ReadytoGoProductFrom"); 
  };

  return (
    <div className="p-6">

      <div className="bg-white p-6 ">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-800">
              Pending Book Listings
            </h1>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Search title or ISBN..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]" 
            />
            <button type="submit" className="rounded p-2 shadow-sm bg-blue-50 text-blue-600 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="mb-2 flex justify-end text-xs text-gray-500 font-medium">
          Showing {visibleBooks.length} items on this page (Out of {total} total records)
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={visibleBooks.length > 0 && selectedIds.length === visibleBooks.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? visibleBooks.map(b => b.book_id) : [])}
                  />
                </th>
                <th className="px-3 py-4 whitespace-nowrap">Book Title & Details</th>
                <th className="px-3 py-4 whitespace-nowrap">ISBN</th>
                <th className="px-3 py-4 whitespace-nowrap">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                      <p className="font-medium text-gray-500">Fetching pending books...</p>
                    </div>
                  </td>
                </tr>
              ) : visibleBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    <p className="text-base font-medium mb-1">
                      {searchQuery ? "No books found matching your search." : "No pending books available."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleBooks.map((book) => (
                  <tr key={book.book_id} className="hover:bg-gray-50 bg-white transition-colors">
                    
                    {/* CHECKBOX */}
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(book.book_id)}
                        onChange={() => setSelectedIds(prev => 
                          prev.includes(book.book_id) 
                            ? prev.filter(id => id !== book.book_id) 
                            : [...prev, book.book_id]
                        )}
                      />
                    </td>

                    {/* BOOK TITLE & DETAILS */}
                    <td className="px-3 py-4 min-w-[300px] max-w-[400px]">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-10 flex-shrink-0 bg-blue-50 rounded border border-blue-100 flex items-center justify-center text-blue-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm leading-snug">
                            {book.title || "Untitled Book"}
                          </p>
                          <div className="text-xs mt-1 text-gray-500 font-mono">
                            ID: {book.book_id}
                          </div>
                          <div className="text-xs mt-2">
                            <button 
                              onClick={() => handleImportClick(book)} 
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium transition-colors"
                            >
                              Import to Catalog
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ISBN */}
                    <td className="px-3 py-4">
                      <div className="text-sm font-medium text-gray-800 font-mono">
                        {book.isbn || "—"}
                      </div>
                    </td>

                    {/* DATES */}
                    <td className="px-3 py-4">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium text-gray-800">Enrolled:</span> {book.enrollment_date ? new Date(book.enrollment_date).toLocaleDateString() : "—"}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium text-gray-800">ISBN Rcvd:</span> {book.isbn_receive_date ? new Date(book.isbn_receive_date).toLocaleDateString() : "—"}
                      </div>
                    </td>


                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-600">
            <div>
              Showing page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span> 
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 font-medium transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-medium bg-blue-50 text-blue-700 rounded border border-blue-200 shadow-sm">
                {page}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 font-medium transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}