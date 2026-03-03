"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Menu,
  Plus,
  Minus,
  BookOpen,
  StickyNote,
  Search,
    List,
    Bookmark,
    BookmarkCheck,
    TextInitial,
  Type,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as solidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as regularBookmark } from "@fortawesome/free-regular-svg-icons";


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function EpubReaderPage() {
  const { slug } = useParams() as { slug: string };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<any>(null);

  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark" | "read">("light");
  const [pageMode, setPageMode] = useState<"single" | "double">("double");
  const [fontSize, setFontSize] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<any[]>([]);
  const [fontFamily, setFontFamily] = useState("serif");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [panel, setPanel] = useState<
    "search" | "toc" | "typography" | "bookmarks"
  >("toc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentCfi, setCurrentCfi] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [bookReady, setBookReady] = useState(false);



useEffect(() => {
  if (typeof window !== "undefined") {
    import("@/lib/foliate/view.js");
  }
}, []);


useEffect(() => {
  if (!currentCfi) return;

  const exists = bookmarks.some((b) =>
    currentCfi.startsWith(b.cfi) ||
    b.cfi.startsWith(currentCfi)
  );

  setIsBookmarked(exists);
}, [currentCfi, bookmarks]);

  /* ================= LOAD META ================= */
  useEffect(() => {
    if (!slug) return;

    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/my-books/${slug}/meta`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setTitle(d.title || ""))
      .catch(() => {});
  }, [slug]);

  

  /* ================= LOAD BOOK ================= */
  useEffect(() => {
    if (!slug) return;
    if (!containerRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let destroyed = false;

    const loadBook = async () => {
      setLoading(true);
      setBookReady(false);

      const res = await fetch(
        `${API_URL}/api/my-books/${slug}/read`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (destroyed) return;

      const view = document.createElement("foliate-view") as any;

      containerRef.current!.innerHTML = "";
      containerRef.current!.appendChild(view);

      viewRef.current = view;

view.addEventListener("relocate", async (e: any) => {
  const fraction = Math.round(e.detail.fraction * 100);
  setProgress(fraction);

  const cfi = e.detail.cfi;
  if (!cfi) return;

  // ✅ Save current location
  setCurrentCfi(cfi);

  const token = localStorage.getItem("token");

  try {
    await fetch(`${API_URL}/api/my-books/${slug}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cfi }),
    });
  } catch {}
});

      await view.open(url);
      // Load last progress
try {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/my-books/continue`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const list = await res.json();
  const current = list.find((b: any) => b.slug === slug);

  if (current?.last_cfi) {
    await view.goTo(current.last_cfi);
  } else {
    view.goTo(0);
  }
} catch {
  view.goTo(0);
}


      
      setToc(view.book?.toc || []);

// Load bookmarks
try {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `${API_URL}/api/my-books/${slug}/bookmarks`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  setBookmarks(data);

  data.forEach((b: any) => {
    view.addAnnotation({
      value: b.cfi,
      label: b.label,
    });
  });
} catch {}

      setLoading(false);
      setBookReady(true);
    };

    loadBook();

    return () => {
      destroyed = true;
      setBookReady(false);
      viewRef.current?.close?.();
      viewRef.current?.remove?.();
    };
  }, [slug]);

/* ================= TYPOGRAPHY ================= */
useEffect(() => {
  if (!viewRef.current || !bookReady) return;

  const applyTypography = () => {
  const contents = viewRef.current.renderer?.getContents?.();
  if (!contents) return;

  contents.forEach((item: any) => {
    const doc = item.doc;
    if (!doc) return;

    // Base styles
    doc.documentElement.style.fontSize = `${fontSize}%`;
    doc.documentElement.style.fontFamily = fontFamily;

    // Force line height globally
    const style = doc.createElement("style");
    style.innerHTML = `
      html, body, p, div, span, li, blockquote {
        line-height: ${lineHeight} !important;
      }
    `;

    doc.head.appendChild(style);
  });
};


  applyTypography();

  viewRef.current.addEventListener("load", applyTypography);

  return () => {
    viewRef.current?.removeEventListener("load", applyTypography);
  };
}, [fontSize, fontFamily, lineHeight, bookReady]);

const handleSearch = async (query: string) => {

  if (!viewRef.current || !bookReady || query.trim().length < 3) {
    setSearchResults([]);
    viewRef.current?.clearSearch?.(); // ← important
    return;
  }

  setSearching(true);
  setSearchResults([]);

  const results: any[] = [];

  try {
    for await (const item of viewRef.current.search({
      query,
      wholeWords: false,
    })) {
      if (item === "done") break;

      if (item.subitems) {
        item.subitems.forEach((sub: any) => {
          results.push({
            cfi: sub.cfi,
            excerpt: sub.excerpt,
            label: item.label,
          });
        });
      }
    }

    setSearchResults(results);
  } catch (err) {
    console.error(err);
  }

  setSearching(false);
};


const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    setIsFullscreen(true);
  } else {
    document.exitFullscreen();
    setIsFullscreen(false);
  }
};



/* ================= THEME ================= */
useEffect(() => {
  if (!viewRef.current) return;

  const view = viewRef.current;

  if (theme === "dark") {
    view.style.setProperty(
      "--reader-filter",
      "invert(1) hue-rotate(180deg)"
    );
  } else {
    view.style.setProperty("--reader-filter", "none");
  }

  // Apply to shadow part
  view.style.setProperty(
    "filter",
    theme === "dark"
      ? "invert(1) hue-rotate(180deg)"
      : "none"
  );
}, [theme]);

useEffect(() => {
  if (!viewRef.current?.renderer) return;

  const renderer = viewRef.current.renderer;

  renderer.setAttribute("flow", "paginated");

  renderer.setAttribute(
    "max-column-count",
    pageMode === "single" ? "1" : "2"
  );
}, [pageMode]);

useEffect(() => {
  if (!viewRef.current?.lastLocation?.cfi) return;

  const currentCfi = viewRef.current.lastLocation.cfi;

  const exists = bookmarks.some((b) =>
    currentCfi.startsWith(b.cfi) ||
    b.cfi.startsWith(currentCfi)
  );

  setIsBookmarked(exists);
}, [bookmarks]);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      viewRef.current?.next();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      viewRef.current?.prev();
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) {
      viewRef.current?.next();
    } else {
      viewRef.current?.prev();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("wheel", handleWheel);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("wheel", handleWheel);
  };
}, []);


  if (!slug) return null;

  return (
    <div className="fixed z-50 inset-0 flex bg-[#1e1e1e] text-white">
{/* ===== SIDEBAR ===== */}
     {/* ===== SIDEBAR ===== */}
<div className={`${sidebarOpen ? "w-72" : "w-18"} bg-[#141414] border-r border-white/5 transition-all duration-300 ease-in-out flex flex-shrink-0`}>

  {/* ICON RAIL */}
  <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 border-r border-white/5">
    <button
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all cursor-pointer mb-3"
    >
      <Menu size={18} />
    </button>

    <div className="w-8 h-px bg-white/10 mb-3" />

    {[
      { id: "search", icon: <Search size={16} />, label: "Search" },
      { id: "toc", icon: <Type size={16} />, label: "Contents" },
      { id: "typography", icon: <TextInitial size={16} />, label: "Typography" },
      { id: "bookmarks", icon: <Bookmark size={16} />, label: "Bookmarks" },
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => { setPanel(item.id as any); if (!sidebarOpen) setSidebarOpen(true); }}
        title={item.label}
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer relative group ${
          panel === item.id && sidebarOpen
            ? "bg-white text-black"
            : "text-gray-500 hover:text-white hover:bg-white/8"
        }`}
      >
        {item.icon}
        {(!sidebarOpen) && (
          <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a2a] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
            {item.label}
          </span>
        )}
      </button>
    ))}

    <div className="mt-2 flex flex-col items-center gap-2 pb-2">
      <div className="w-8 h-px bg-white/10" />
      <span className="text-[10px] text-gray-600 font-mono tracking-wider">{progress}%</span>
    </div>
  </div>

  {/* PANEL CONTENT */}
  {sidebarOpen && (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

      {/* Panel Header */}
      <div className="px-4 py-4 border-b border-white/5 flex-shrink-0">
        <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">
          { panel === "search" ? "Search"
          : panel === "toc" ? "Contents"
          : panel === "typography" ? "Typography"
          : "Bookmarks" }
        </h2>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

        {/* ── SEARCH ── */}
        {panel === "search" && (
          <div className="p-4">
            <div className="relative mb-4">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (value.trim().length >= 3) {
                    handleSearch(value);
                  } else {
                    setSearchResults([]);
                    viewRef.current?.clearSearch?.();
                  }
                }}
                placeholder="Search in book…"
                className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-white/20 focus:bg-white/8 transition-all"
              />
            </div>

            {searching && (
              <div className="flex items-center gap-2 text-xs text-gray-600 py-2">
                <div className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                Searching…
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">{searchResults.length} results</p>
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => viewRef.current?.goTo(result.cfi)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/6 transition-colors group cursor-pointer"
                  >
                    <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate">{result.label}</p>
                    {result.excerpt && (
  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
    {result.excerpt.pre}
    <span className="text-white bg-white/20 rounded px-0.5">{result.excerpt.match}</span>
    {result.excerpt.post}
  </p>
)}
                  </button>
                ))}
              </div>
            )}

            {!searching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-8">No results found</p>
            )}
          </div>
        )}

        {/* ── TOC ── */}
        {panel === "toc" && (
          <div className="py-2">
            {/* Book title row */}
            <button
              onClick={() => viewRef.current?.goTo(toc[0]?.href)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 mb-1"
            >
              <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors leading-tight line-clamp-2 text-left">{title}</span>
              <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 ml-2 transition-colors" />
            </button>

            <div className="px-2">
              {toc.slice(1).map((item, i) => (
                <button
                  key={i}
                  onClick={() => viewRef.current?.goTo(item.href)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/6 transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-gray-400 flex-shrink-0 transition-colors" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── BOOKMARKS ── */}
        {panel === "bookmarks" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">{bookmarks.length} saved</span>
            </div>

            {bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark size={24} className="text-gray-700 mb-3" />
                <p className="text-xs text-gray-600">No bookmarks yet</p>
                <p className="text-[11px] text-gray-700 mt-1">Click the bookmark icon while reading</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((b) => (
                  <div key={b.id} className="group bg-white/4 hover:bg-white/7 border border-white/6 rounded-xl p-3 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => viewRef.current?.goTo(b.cfi)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors leading-snug">
                          {b.label || "Bookmark"}
                        </p>
                        {b.note && (
                          <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed line-clamp-3 italic border-l-2 border-white/10 pl-2">
                            {b.note}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch(`${API_URL}/api/my-books/${slug}/bookmark`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ cfi: b.cfi }),
                          });
                          setBookmarks((prev) => prev.filter((x) => x.cfi !== b.cfi));
                          viewRef.current.deleteAnnotation({ value: b.cfi });
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 1l10 10M11 1L1 11"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TYPOGRAPHY ── */}
        {panel === "typography" && (
          <div className="p-4 space-y-5">

            {/* Font Family */}
            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Typeface</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "serif", label: "Serif" },
                  { value: "sans-serif", label: "Sans" },
                  { value: "Georgia", label: "Georgia" },
                  { value: "Arial", label: "Arial" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontFamily(f.value)}
                    className={`py-2 px-3 rounded-lg text-xs transition-all cursor-pointer border ${
                      fontFamily === f.value
                        ? "bg-white text-black border-white font-medium"
                        : "bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white"
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-gray-600 uppercase tracking-wider">Font Size</label>
                <span className="text-[10px] text-gray-500 font-mono">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize((f) => Math.max(60, f - 10))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-sm font-medium"
                >A−</button>
                <div className="flex-1 bg-white/5 rounded-full h-1.5 relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all"
                    style={{ width: `${((fontSize - 60) / 140) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setFontSize((f) => Math.min(200, f + 10))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-sm font-medium"
                >A+</button>
              </div>
            </div>

            {/* Line Spacing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-gray-600 uppercase tracking-wider">Line Spacing</label>
                <span className="text-[10px] text-gray-500 font-mono">{lineHeight.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLineHeight((l) => Math.max(1, parseFloat((l - 0.1).toFixed(1))))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 bg-white/5 rounded-full h-1.5 relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all"
                    style={{ width: `${((lineHeight - 1) / 2) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setLineHeight((l) => Math.min(3, parseFloat((l + 0.1).toFixed(1))))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Layout */}
            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Layout</label>
              <div className="flex gap-1.5">
                {[
                  { value: "single", label: "1 Page" },
                  { value: "double", label: "2 Pages" },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPageMode(m.value as any)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer border ${
                      pageMode === m.value
                        ? "bg-white text-black border-white font-medium"
                        : "bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Theme</label>
              <div className="flex gap-1.5">
                {[
                  { value: "light", label: "Light", icon: "☀" },
                  { value: "dark", label: "Dark", icon: "☾" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value as any)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                      theme === t.value
                        ? "bg-white text-black border-white font-medium"
                        : "bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className="text-sm">{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )}
</div>
      <div className="flex-1 flex flex-col relative">

        {/* ===== READER ===== */}
        <div className="flex-1 relative flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              Loading...
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            title="Full Screen"
            className="absolute top-4 left-6 bg-white text-black px-1 py-0 rounded shadow cursor-pointer"
          >
            ⛶
          </button>

    <div className="relative p-[3px]">

          <button
            className={`cursor-pointer transition absolute top-0 right-4 z-40 ${
              isBookmarked
                ? "text-black bg-white rounded"
                : "text-gray-400 hover:text-red-400"
            }`}
            onClick={() => {
  const location = viewRef.current?.lastLocation;
  if (!location?.cfi) return;

  const existing = bookmarks.find(
    (b) =>
      location.cfi.startsWith(b.cfi) ||
      b.cfi.startsWith(location.cfi)
  );

  setNoteText(existing?.note || "");
  setNoteModalOpen(true);
}}
          >
           <FontAwesomeIcon
            icon={isBookmarked ? solidBookmark : regularBookmark}
            className="text-2xl text-black"
          />
          </button>

{pageMode === "double" && (
  <div className="pointer-events-none absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-px bg-gray-300 z-30" />
)}
          <div
            ref={containerRef}
            className={` w-[900px] h-[90vh] shadow-2xl ${ theme === "dark" ? "bg-black" : "bg-white" }`}
          />

          </div>

          <button
            onClick={() => viewRef.current?.prev()}
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-xl cursor-pointer"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() => viewRef.current?.next()}
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-xl cursor-pointer"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

{noteModalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100">

      {/* Header */}
      <div className="px-6 pt-6 pb-0 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isBookmarked ? "Edit Note" : "Add Note"}
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {isBookmarked ? "Update your note for this passage" : "Attach a note to this bookmark"}
          </p>
        </div>
        <button
          onClick={() => setNoteModalOpen(false)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-0.5 cursor-pointer"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l10 10M11 1L1 11"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-6 mt-5 h-px bg-gray-100" />

      {/* Textarea */}
      <div className="px-6 pt-5">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write your note here..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 leading-relaxed resize-none outline-none focus:border-gray-400 focus:bg-white transition-colors"
          rows={5}
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-300">{noteText.length} / 500</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 px-6 py-5">
        <button
          onClick={() => setNoteModalOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            const location = viewRef.current?.lastLocation;
            if (!location?.cfi) return;
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/api/my-books/${slug}/bookmark`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                cfi: location.cfi,
                label: location.tocItem?.label || "Bookmark",
                note: noteText,
              }),
            });
            const res = await fetch(`${API_URL}/api/my-books/${slug}/bookmarks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setBookmarks(data);
            setNoteModalOpen(false);
            setNoteText("");
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 hover:bg-gray-700 text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 7l3.5 3.5L11 3"/>
          </svg>
          Save
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}
