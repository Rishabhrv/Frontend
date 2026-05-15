"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Minus,
  Search,
  Bookmark,
  TextInitial,
  Type,
  X,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as solidBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as regularBookmark } from "@fortawesome/free-regular-svg-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function EpubReaderPage() {
  const { slug } = useParams() as { slug: string };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<any>(null);

  // ✅ Refs for reliable navigation tracking (Prevents the Cover Glitch)
  const isAtFirstPageRef = useRef(true);
  const navState = useRef({ showCover: true, activeCover: null as string | null });

  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark" | "read">("light");
  const [pageMode, setPageMode] = useState<"single" | "double">("double");
  const [fontSize, setFontSize] = useState(90);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<any[]>([]);
  const [fontFamily, setFontFamily] = useState("serif");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [panel, setPanel] = useState<"search" | "toc" | "typography" | "bookmarks">("toc");
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
  const [isBlurred, setIsBlurred] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const totalActiveTimeRef = useRef<number>(0);
  
  // ✅ Distinct image states
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [ebookCover, setEbookCover] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(true);

  // ✅ Dynamic active cover selection
  const activeCover = pageMode === "single" ? mainImage : (ebookCover || mainImage);

  // ✅ Keep navState in sync
  useEffect(() => {
    navState.current = { showCover, activeCover };
  }, [showCover, activeCover]);

  /* ================= DETECT MOBILE ================= */
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setPageMode("single");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

    // Time Tracking Effect
  useEffect(() => {
    // Helper to send the duration to your Express API
    const sendTimeData = (timeInSeconds: number) => {
      // Only send if they stayed for at least 5 seconds to avoid spamming 
      // the DB on instant bounces
      if (timeInSeconds < 5) return; 
      
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        fetch(`${API_URL}/api/my-books/${slug}/track-time`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ duration: timeInSeconds }),
          // keepalive is critical here: it tells the browser to finish 
          // sending this request even if the tab is completely closed
          keepalive: true, 
        });
      } catch (error) {
        console.error("Tracking failed", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden (user switched tabs/minimized). Calculate time spent so far.
        const timeSpent = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        totalActiveTimeRef.current += timeSpent;
      } else {
        // Tab is visible again. Reset the start timer.
        sessionStartTimeRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      // Tab is being closed or refreshed. Tally up final time.
      if (!document.hidden) {
        const timeSpent = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        totalActiveTimeRef.current += timeSpent;
      }
      sendTimeData(totalActiveTimeRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Component unmounting (user clicked a Next.js Link to leave the page)
      if (!document.hidden) {
        const timeSpent = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
        totalActiveTimeRef.current += timeSpent;
      }
      sendTimeData(totalActiveTimeRef.current);
    };
  }, [slug]);

  /* ================= BLUR ON FOCUS LOSS ================= */
  useEffect(() => {
    let blurTimer: ReturnType<typeof setTimeout>;
    const handleBlur = () => {
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) setIsBlurred(true);
      }, 100);
    };
    const handleFocus = () => { clearTimeout(blurTimer); setIsBlurred(false); };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") setIsBlurred(true);
      else setIsBlurred(false);
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearTimeout(blurTimer);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /* ================= PREVENT COPY / PASTE ================= */
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = ["c", "x", "a", "u", "s", "p"];
      if ((e.ctrlKey || e.metaKey) && blocked.includes(e.key.toLowerCase())) e.preventDefault();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") import("@/lib/foliate/view.js");
  }, []);

  useEffect(() => {
    if (!currentCfi) return;
    const exists = bookmarks.some(
      (b) => currentCfi.startsWith(b.cfi) || b.cfi.startsWith(currentCfi)
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
      .then((d) => {
        setTitle(d.title || "");
        // ✅ Store BOTH images in state
        if (d.main_image) setMainImage(`${API_URL}${d.main_image}`);
        if (d.ebook_cover) setEbookCover(`${API_URL}${d.ebook_cover}`);
      })
      .catch(() => {});
  }, [slug]);

  /* ================= LOAD BOOK ================= */
  useEffect(() => {
    if (!slug || !containerRef.current) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    let destroyed = false;

    const loadBook = async () => {
      setLoading(true);
      setBookReady(false);
      const res = await fetch(`${API_URL}/api/my-books/${slug}/read`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (destroyed) return;
      await customElements.whenDefined("foliate-view");
      const view = document.createElement("foliate-view") as any;
      containerRef.current!.innerHTML = "";
      containerRef.current!.appendChild(view);
      viewRef.current = view;
      let annotationsApplied = false;

      view.addEventListener("relocate", async (e: any) => {
        setProgress(Math.round(e.detail.fraction * 100));
        // ✅ Track first page robustly
        isAtFirstPageRef.current = e.detail.atStart === true || e.detail.location?.atStart === true || e.detail.fraction <= 0.001;

        const cfi = e.detail.cfi;
        if (!cfi) return;
        setCurrentCfi(cfi);
        const loc = e.detail.location;
        if (loc) {
          setCurrentPage(loc.current ?? null);
          setNextPage(loc.next ?? null);
          setTotalPages(loc.total ?? null);
        }
        try {
          await fetch(`${API_URL}/api/my-books/${slug}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ cfi }),
          });
        } catch {}
        if (!annotationsApplied) {
          annotationsApplied = true;
          try {
            const res = await fetch(`${API_URL}/api/my-books/${slug}/bookmarks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setBookmarks(data);
            data.forEach((b: any) => {
              try { view.addAnnotation({ value: b.cfi, label: b.label }); } catch {}
            });
          } catch {}
        }
      });

      await view.open(url);
      try {
        const res = await fetch(`${API_URL}/api/my-books/continue`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = await res.json();
        const current = list.find((b: any) => b.slug === slug);
        if (current?.last_cfi) await view.goTo(current.last_cfi);
        else view.goTo(0);
      } catch { view.goTo(0); }

      setToc(view.book?.toc || []);
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
        doc.documentElement.style.fontSize = `${fontSize}%`;
        doc.documentElement.style.fontFamily = fontFamily;
        let style = doc.getElementById("foliate-custom-css");
        if (!style) {
          style = doc.createElement("style");
          style.id = "foliate-custom-css";
          doc.head.appendChild(style);
        }
        style.innerHTML = `
          html, body, p, div, span, li, blockquote { line-height: ${lineHeight} !important; }
          * { -webkit-user-select: none !important; -moz-user-select: none !important; user-select: none !important; }
        `;
        const blockEvent = (e: Event) => e.preventDefault();
        doc.addEventListener("copy", blockEvent);
        doc.addEventListener("cut", blockEvent);
        doc.addEventListener("contextmenu", blockEvent);
        doc.addEventListener("keydown", (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "u", "s", "p"].includes(e.key.toLowerCase()))
            e.preventDefault();
        });
      });
    };
    setTimeout(applyTypography, 100);
    viewRef.current.addEventListener("load", applyTypography);
    return () => viewRef.current?.removeEventListener("load", applyTypography);
  }, [fontSize, fontFamily, lineHeight, bookReady]);

  const handleSearch = async (query: string) => {
    if (!viewRef.current || !bookReady || query.trim().length < 3) {
      setSearchResults([]);
      viewRef.current?.clearSearch?.();
      return;
    }
    setSearching(true);
    setSearchResults([]);
    const results: any[] = [];
    try {
      for await (const item of viewRef.current.search({ query, wholeWords: false })) {
        if (item === "done") break;
        if (item.subitems) {
          item.subitems.forEach((sub: any) => {
            results.push({ cfi: sub.cfi, excerpt: sub.excerpt, label: item.label });
          });
        }
      }
      setSearchResults(results);
    } catch {}
    setSearching(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  /* ================= THEME ================= */
  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    view.style.setProperty("filter", theme === "dark" ? "invert(1) hue-rotate(180deg)" : "none");
  }, [theme]);

  useEffect(() => {
    if (!viewRef.current?.renderer) return;
    const renderer = viewRef.current.renderer;
    renderer.setAttribute("flow", "paginated");
    renderer.setAttribute("max-column-count", pageMode === "single" ? "1" : "2");
  }, [pageMode]);

  useEffect(() => {
    if (!viewRef.current?.lastLocation?.cfi) return;
    const cfi = viewRef.current.lastLocation.cfi;
    setIsBookmarked(bookmarks.some((b) => cfi.startsWith(b.cfi) || b.cfi.startsWith(cfi)));
  }, [bookmarks]);

  /* ================= NAVIGATION HANDLERS ================= */
  // ✅ Centralized logic exactly like the admin panel fix
  const handleNext = () => {
    const { showCover, activeCover } = navState.current;
    if (showCover && activeCover) {
      setShowCover(false);
    } else {
      viewRef.current?.next();
    }
  };

  const handlePrev = () => {
    const { showCover } = navState.current;
    if (showCover) return; 

    const isAtStart = isAtFirstPageRef.current || viewRef.current?.location?.atStart;
    if (isAtStart) {
      setShowCover(true); 
    } else {
      viewRef.current?.prev(); 
    }
  };

  /* ================= KEYBOARD + TOUCH ================= */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
    };
    const handleWheel = (e: WheelEvent) => {
      e.deltaY > 0 ? handleNext() : handlePrev();
    }; 
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  if (!slug) return null;

  const openPanel = (id: typeof panel) => {
    setPanel(id);
    setSidebarOpen(true);
  };

  const handleBookmarkClick = () => {
    const location = viewRef.current?.lastLocation;
    if (!location?.cfi) return;
    const existing = bookmarks.find(
      (b) => location.cfi.startsWith(b.cfi) || b.cfi.startsWith(location.cfi)
    );
    setNoteText(existing?.note || "");
    setNoteModalOpen(true);
  };

  const panelIcons = [
    { id: "search" as const, icon: <Search size={16} />, label: "Search" },
    { id: "toc" as const, icon: <Type size={16} />, label: "Contents" },
    { id: "typography" as const, icon: <TextInitial size={16} />, label: "Typography" },
    { id: "bookmarks" as const, icon: <Bookmark size={16} />, label: "Bookmarks" },
  ];

  return (
    <div
      className="fixed z-150 inset-0 flex flex-col bg-[#1e1e1e] text-white"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-[#141414] border-b border-white/5 shrink-0">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <Menu size={18} />
        </button>

        <p className="text-xs text-gray-300 font-medium truncate max-w-[55vw] text-center">{title}</p>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">{progress}%</span>
          <button
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
            onClick={handleBookmarkClick}
          >
            <FontAwesomeIcon
              icon={isBookmarked ? solidBookmark : regularBookmark}
              className={`text-lg ${isBookmarked ? "text-yellow-400" : "text-gray-500"}`}
            />
          </button>
        </div>
      </div>

      {/* MAIN BODY: sidebar + reader */}
      <div className="flex flex-1 min-h-0 relative">

        {/* MOBILE BACKDROP */}
        {sidebarOpen && isMobile && (
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <div
          className={`
            fixed md:relative
            top-0 md:top-auto left-0 md:left-auto
            h-full
            z-40 md:z-auto
            flex shrink-0
            bg-[#141414] border-r border-white/5
            transition-all duration-300 ease-in-out
            ${isMobile
              ? sidebarOpen
                ? "translate-x-0 w-72"
                : "-translate-x-full w-72"
              : sidebarOpen
              ? "w-72"
              : "w-14"
            }
          `}
        >
          {/* ICON RAIL */}
          <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 border-r border-white/5">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all cursor-pointer mb-3"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="w-8 h-px bg-white/10 mb-3" />

            {panelIcons.map((item) => (
              <button
                key={item.id}
                onClick={() => { setPanel(item.id); if (!sidebarOpen) setSidebarOpen(true); }}
                title={item.label}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer relative group ${
                  panel === item.id && sidebarOpen
                    ? "bg-white text-black"
                    : "text-gray-500 hover:text-white hover:bg-white/8"
                }`}
              >
                {item.icon}
                {!sidebarOpen && (
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
              <div className="px-4 py-4 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">
                  {panel === "search" ? "Search"
                    : panel === "toc" ? "Contents"
                    : panel === "typography" ? "Typography"
                    : "Bookmarks"}
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

                {/* SEARCH */}
                {panel === "search" && (
                  <div className="p-4">
                    <div className="relative mb-4">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        value={searchQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchQuery(value);
                          if (value.trim().length >= 3) handleSearch(value);
                          else { setSearchResults([]); viewRef.current?.clearSearch?.(); }
                        }}
                        placeholder="Search in book…"
                        style={{ userSelect: "text", WebkitUserSelect: "text" }}
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
                            onClick={() => { viewRef.current?.goTo(result.cfi); if (isMobile) setSidebarOpen(false); }}
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

                {/* TOC */}
                {panel === "toc" && (
                  <div className="py-2">
                    <button
                      onClick={() => { viewRef.current?.goTo(toc[0]?.href); if (isMobile) setSidebarOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5 mb-1"
                    >
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors leading-tight line-clamp-2 text-left">{title}</span>
                      <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 ml-2 transition-colors" />
                    </button>
                    <div className="px-2">
                      {toc.slice(1).map((item, i) => (
                        <button
                          key={i}
                          onClick={() => { viewRef.current?.goTo(item.href); if (isMobile) setSidebarOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/6 transition-all cursor-pointer flex items-center gap-2 group"
                        >
                          <span className="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-gray-400 flex-shrink-0 transition-colors" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOOKMARKS */}
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
                                onClick={() => { viewRef.current?.goTo(b.cfi); if (isMobile) setSidebarOpen(false); }}
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

                {/* TYPOGRAPHY */}
                {panel === "typography" && (
                  <div className="p-4 space-y-5">
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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-gray-600 uppercase tracking-wider">Font Size</label>
                        <span className="text-[10px] text-gray-500 font-mono">{fontSize}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setFontSize((f) => Math.max(60, f - 10))}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-sm font-medium">A−</button>
                        <div className="flex-1 bg-white/5 rounded-full h-1.5 relative">
                          <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all"
                            style={{ width: `${((fontSize - 60) / 140) * 100}%` }} />
                        </div>
                        <button onClick={() => setFontSize((f) => Math.min(200, f + 10))}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-sm font-medium">A+</button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-gray-600 uppercase tracking-wider">Line Spacing</label>
                        <span className="text-[10px] text-gray-500 font-mono">{lineHeight.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setLineHeight((l) => Math.max(1, parseFloat((l - 0.1).toFixed(1))))}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"><Minus size={14} /></button>
                        <div className="flex-1 bg-white/5 rounded-full h-1.5 relative">
                          <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all"
                            style={{ width: `${((lineHeight - 1) / 2) * 100}%` }} />
                        </div>
                        <button onClick={() => setLineHeight((l) => Math.min(3, parseFloat((l + 0.1).toFixed(1))))}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"><Plus size={14} /></button>
                      </div>
                    </div>

                    {!isMobile && (
                      <div>
                        <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Layout</label>
                        <div className="flex gap-1.5">
                          {[{ value: "single", label: "1 Page" }, { value: "double", label: "2 Pages" }].map((m) => (
                            <button key={m.value} onClick={() => setPageMode(m.value as any)}
                              className={`flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer border ${
                                pageMode === m.value
                                  ? "bg-white text-black border-white font-medium"
                                  : "bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white"
                              }`}>{m.label}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Theme</label>
                      <div className="flex gap-1.5">
                        {[{ value: "light", label: "Light", icon: "☀" }, { value: "dark", label: "Dark", icon: "☾" }].map((t) => (
                          <button key={t.value} onClick={() => setTheme(t.value as any)}
                            className={`flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                              theme === t.value
                                ? "bg-white text-black border-white font-medium"
                                : "bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white"
                            }`}>
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

        {/* READER AREA */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Loading…
              </div>
            )}

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              title="Full Screen"
              className="hidden md:block absolute top-4 left-6 bg-white text-black px-1.5 py-0.5 rounded shadow cursor-pointer text-sm z-10"
            >
              ⛶
            </button>

            {/* BOOK CONTAINER WRAPPER */}
            <div className="relative p-[3px] w-full h-full flex items-center justify-center">

              {/* Blur overlay */}
              {isBlurred && (
                <div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded"
                  style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "rgba(0,0,0,0.45)" }}
                >
                  <svg className="w-10 h-10 text-white/60 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                  <p className="text-white/80 text-sm font-medium tracking-wide">Content hidden</p>
                  <p className="text-white/40 text-xs mt-1">Return to this window to continue reading</p>
                </div>
              )}

              {/* ✅ SHOW COVER LOGIC */}
              {showCover && activeCover && !loading && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#171717]">
                  <img 
                    src={activeCover} 
                    alt="Book Cover" 
                    className="max-h-[85vh] w-auto mb-8  "
                  />
                </div>
              )}

              {/* Double-page divider */}
              {pageMode === "double" && !isMobile && (
                <div className="pointer-events-none absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-px bg-gray-300 z-30 my-10" />
              )}

              {/* Foliate reader wrapper */}
              <div
                className={`
                  relative
                  w-full h-full
                  md:w-[700px] md:h-[85vh]
                  lg:w-[900px] lg:h-[90vh]
                `}
              >
                {/* Bookmark button */}
                <button
                  onClick={handleBookmarkClick}
                  className="hidden md:flex absolute top-0 right-3 z-40 cursor-pointer transition-all"
                  title={isBookmarked ? "Edit bookmark" : "Add bookmark"}
                >
                  <FontAwesomeIcon
                    icon={isBookmarked ? solidBookmark : regularBookmark}
                    className={`text-3xl transition-colors ${
                      isBookmarked ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>

                {/* Actual foliate reader */}
                <div
                  ref={containerRef}
                  className={`${theme === "dark" ? "bg-black" : "bg-white"} w-full h-full`}
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                    filter: isBlurred ? "blur(18px)" : "none",
                    transition: "filter 0.2s ease",
                  }}
                />

                {/* Page number indicator */}
                {currentPage !== null && totalPages !== null && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                    <span className="text-[11px] text-gray-500 font-mono tracking-wider bg-black/10 px-2.5 py-1 rounded-full">
                      {pageMode === "double" && nextPage && nextPage <= totalPages
                        ? `${currentPage + 1}–${nextPage + 1} / ${totalPages}`
                        : `${currentPage + 1} / ${totalPages}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PREV / NEXT DESKTOP BUTTONS */}
            <button onClick={handlePrev}
            className="absolute left-8 hidden md:flex top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-xl cursor-pointer hover:bg-gray-100 transition-colors z-50">
            <ChevronLeft />
          </button>

          <button onClick={handleNext}
            className="absolute right-8 hidden md:flex top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-xl cursor-pointer hover:bg-gray-100 transition-colors z-50">
            <ChevronRight />
          </button>
          </div>

          {/* MOBILE BOTTOM BAR */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#141414] border-t border-white/5 shrink-0">
            <button
              onClick={handlePrev}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-1">
              {panelIcons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openPanel(item.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    panel === item.id && sidebarOpen
                      ? "bg-white text-black"
                      : "text-gray-500 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* NOTE / BOOKMARK MODAL */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100">
            <div className="px-6 pt-6 pb-0 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{isBookmarked ? "Edit Note" : "Add Note"}</h3>
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
            <div className="mx-6 mt-5 h-px bg-gray-100" />
            <div className="px-6 pt-5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                style={{ userSelect: "text", WebkitUserSelect: "text" }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 leading-relaxed resize-none outline-none focus:border-gray-400 focus:bg-white transition-colors"
                rows={5}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-300">{noteText.length} / 500</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-5">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >Cancel</button>
              <button
                onClick={async () => {
                  const location = viewRef.current?.lastLocation;
                  if (!location?.cfi) return;
                  const token = localStorage.getItem("token");
                  await fetch(`${API_URL}/api/my-books/${slug}/bookmark`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ cfi: location.cfi, label: location.tocItem?.label || "Bookmark", note: noteText }),
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