"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ePub from "epubjs";
import type { Contents } from "epubjs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  BookOpen,
  Sun,
  Moon,
  Bookmark,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type TocItem = {
  id: string;
  label: string;
  href: string;
};

const token =
  typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;



const normalizeHref = (href?: string) =>
  href ? href.split("#")[0].replace(/^(\.\.\/)+/, "") : "";

export default function EpubReaderPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : null;

  const viewerRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);

  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);

  const [title, setTitle] = useState("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<
  { id: number; cfi: string; label: string }[]
>([]);

  /* ================= LOAD BOOK META ================= */
  useEffect(() => {
    if (!slug) return;
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/my-books/${slug}/meta`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTitle(d.title || ""))
      .catch(() => setTitle(""));
  }, [slug]);

  const isCurrentBookmarked = () => {
  const cfi = renditionRef.current?.location?.start?.cfi;
  if (!cfi) return false;

  return bookmarks.some(bm => bm.cfi === cfi);
};


const toggleBookmark = async () => {
  const cfi = renditionRef.current.location.start.cfi;

  if (isCurrentBookmarked()) {
    // ❌ DELETE
    await fetch(`${API_URL}/api/my-books/${slug}/bookmark`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cfi }),
    });

    setBookmarks(prev => prev.filter(b => b.cfi !== cfi));
  } else {
    // ✅ ADD
    const label = `Bookmark at ${progress}%`;

    await fetch(`${API_URL}/api/my-books/${slug}/bookmark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cfi, label }),
    });

    setBookmarks(prev => [
      { id: Date.now(), cfi, label },
      ...prev,
    ]);
  }
};


  /* ================= LOAD EPUB ================= */
  useEffect(() => {
    setLoading(true);
    if (!slug || !viewerRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    let destroyed = false;

    (async () => {
      const res = await fetch(
        `${API_URL}/api/my-books/${slug}/read`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const buffer = await (await res.blob()).arrayBuffer();
      if (destroyed) return;

      const book = ePub(buffer);
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current!, {
        width: "100%",
        height: "100%",
        flow: "scrolled",
        spread: "none",
      });

      renditionRef.current = rendition;

      /* ===== THEMES ===== */
      rendition.themes.register("light", {
        body: { background: "#ffffff", color: "#111827" },
      });

      rendition.themes.register("dark", {
        body: { background: "#111827", color: "#f9fafb" },
      });

      rendition.themes.default({
        body: {
          lineHeight: "1.6",
          padding: "40px",
        },
      });

      rendition.themes.select(theme);
      rendition.themes.fontSize(`${fontSize}%`);

      /* ===== CONTENT HOOK ===== */
      rendition.hooks.content.register((contents: Contents) => {
  const doc = contents.document;
  const scrollingEl =
    doc.scrollingElement || doc.documentElement || doc.body;

  // Enable scrolling
  doc.documentElement.style.height = "100%";
  doc.body.style.height = "100%";
  doc.documentElement.style.overflowY = "auto";
  doc.body.style.overflowY = "auto";
  doc.documentElement.style.scrollBehavior = "smooth";

  // ---- Scrollbar styling (WebKit) ----
  const style = doc.createElement("style");
  style.innerHTML = `
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.35);
      border-radius: 8px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.55);
    }
  `;
  doc.head.appendChild(style);
});


      await rendition.display();
      const bookmarksRes = await fetch(
        `${API_URL}/api/my-books/${slug}/bookmarks`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const bookmarkData = await bookmarksRes.json();
      setBookmarks(bookmarkData);
      setLoading(false);

      /* ===== TOC ===== */
      const nav = await book.loaded.navigation;
      setToc(nav.toc || []);

      await book.locations.generate(1600);
      const progressRes = await fetch(`${API_URL}/api/my-books/continue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const progress = await progressRes.json();
      
      const current = progress.find((b:any) => b.slug === slug);
      if (current?.last_cfi) {
        rendition.display(current.last_cfi);
      }


      /* ===== RELOCATION ===== */
      rendition.on("relocated", (loc: any) => {

          const cfi = loc.start.cfi;

  fetch(`${API_URL}/api/my-books/${slug}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ cfi }),
  });
  const href = normalizeHref(loc.start.href);
  setActiveHref(href);

  try {
    const percent =
      book.locations.percentageFromCfi(loc.start.cfi) || 0;
    setProgress(Math.round(percent * 100));
  } catch {
    setProgress(0);
  }


  setTimeout(() => {
    const el = tocRef.current?.querySelector(
      `[data-href="${href}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "center" });
  }, 100);
});

    })();

    return () => {
      destroyed = true;
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, [slug, theme]);

  /* ================= FONT SIZE ================= */
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  if (!slug) return <p className="p-10">Invalid book</p>;

  return (
    <div className="fixed inset-0 flex bg-gray-100">
      {/* ===== SIDEBAR ===== */}

      {loading && (
  <div className="absolute inset-0 z-50 flex items-center justify-center
                  bg-white/80 backdrop-blur">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-gray-300
                      border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600 font-medium">
        Loading book…
      </p>
    </div>
  </div>
)}

      <aside className="w-72 bg-white border-r flex flex-col">

  {/* CONTENTS */}
  <div className="border-b p-4 font-semibold flex items-center gap-2">
    <BookOpen size={18} /> Contents
  </div>

  <div ref={tocRef} className="flex-1 overflow-y-auto">
    <ul className="text-sm">
      {toc.map(item => {
        const href = normalizeHref(item.href);
        const active =
          activeHref &&
          (activeHref === href || activeHref.endsWith(href));

        return (
          <li key={item.id} >
            <button
              onClick={() =>
                renditionRef.current?.display(item.href)
              }
              className={`w-full px-4 py-2 text-left ${
                active
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* BOOKMARKS (sticky bottom) */}
  {bookmarks.length > 0 && (
    <div className="border-t bg-gray-50">
      <div className="p-3 font-semibold flex items-center gap-2">
        <Bookmark size={16} /> Bookmarks
      </div>

      <ul className="text-sm max-h-48 overflow-y-auto">
        {bookmarks.map(bm => (
          <li key={bm.id}>
            <button
              onClick={() =>
                renditionRef.current?.display(bm.cfi)
              }
              className="w-full text-left px-4 py-2 hover:bg-yellow-100"
            >
              {bm.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )}
</aside>



      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col">
        {/* ===== TOOLBAR ===== */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
          

          <div className="flex-1 text-center text-sm font-medium truncate">
            {title}
          </div>

          <span className="text-xs text-gray-500">
            {progress}% read
          </span>

          <button onClick={() => setFontSize(f => f - 10)}>
            <Minus />
          </button>

          <button onClick={() => setFontSize(f => f + 10)}>
            <Plus />
          </button>

          <button
            onClick={() =>
              setTheme(t => (t === "light" ? "dark" : "light"))
            }
          >
            {theme === "light" ? <Moon /> : <Sun />}
          </button>

          <button onClick={toggleBookmark}>
            <Bookmark
              className={`transition ${
                isCurrentBookmarked()
                  ? "fill-black text-black"
                  : "text-gray-500"
              }`}
            />
          </button>


        </div>

        {/* ===== READER ===== */}
        <div className="flex-1 bg-gray-200 overflow-hidden relative">
          <div
            ref={viewerRef}
            className="h-full mx-auto"
            style={{
              maxWidth: 900,
              background: theme === "dark" ? "#111827" : "#ffffff",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            }}
          />
        
          {/* ===== FLOATING CONTROLS (PAGE-ALIGNED) ===== */}
          <button
            onClick={() => renditionRef.current?.prev()}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30
                       bg-white/90 backdrop-blur pointer-cursor rounded-full
                       p-3 shadow hover:bg-white"
          >
            <ChevronLeft />
          </button>
        
          <button
            onClick={() => renditionRef.current?.next()}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30
                       bg-white/90 backdrop-blur pointer-cursor rounded-full
                       p-3 shadow hover:bg-white"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
