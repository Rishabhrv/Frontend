"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, Plus, Minus, Search, Type, TextInitial } from "lucide-react";
import "../../../app/globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function TempPreviewPage() {
  const searchParams = useSearchParams();
  const tempFile = searchParams?.get("temp") ?? "";
  const slug = searchParams?.get("slug") ?? "";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<any>(null);

  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pageMode, setPageMode] = useState<"single" | "double">("double");
  const [fontSize, setFontSize] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<any[]>([]);
  const [fontFamily, setFontFamily] = useState("serif");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [panel, setPanel] = useState<"search" | "toc" | "typography">("toc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookReady, setBookReady] = useState(false);
      const [mainImage, setMainImage] = useState<string | null>(null);
      const [showCover, setShowCover] = useState(true);
  
  

  useEffect(() => { document.title = "Temp Preview | Admin Panel"; }, []);

  useEffect(() => {
    if (typeof window !== "undefined") import("@/lib/foliate/view.js");
  }, []);

  /* ================= LOAD BOOK ================= */
 /* ================= LOAD BOOK ================= */
useEffect(() => {
  if (!tempFile || !containerRef.current) return;
  let destroyed = false;

  const loadBook = async () => {
    setLoading(true);
    setBookReady(false);

    try {
      // 1. Ensure the library is loaded first
      if (typeof window !== "undefined") {
        await import("@/lib/foliate/view.js");
      }

      // 2. Wait for the browser to recognize the custom element
      await customElements.whenDefined("foliate-view");

      const res = await fetch(`${API_URL}${tempFile}`);
      if (!res.ok) throw new Error("Temp file not found");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (destroyed) return;

      // 3. Create and append
      const view = document.createElement("foliate-view") as any;
      containerRef.current!.innerHTML = "";
      containerRef.current!.appendChild(view);
      viewRef.current = view;

      // 4. Setup listeners
      view.addEventListener("relocate", (e: any) => {
        setProgress(Math.round(e.detail.fraction * 100));
      });

      // 5. Now .open() will definitely exist
      await view.open(url);
      view.goTo(0);

      setToc(view.book?.toc || []);
      setBookReady(true);
    } catch (err) {
      console.error("Error loading book:", err);
    } finally {
      setLoading(false);
    }
  };

  loadBook();

  return () => {
    destroyed = true;
    setBookReady(false);
    viewRef.current?.close?.();
    viewRef.current?.remove?.();
  };
}, [tempFile]);


    useEffect(() => {
      if (!slug) return;
      fetch(`${API_URL}/api/admin/ebooksperview/${slug}/meta`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.main_image) setMainImage(`${API_URL}${d.main_image}`);
        })
        .catch(() => {});
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
        const style = doc.createElement("style");
        style.innerHTML = `html, body, p, div, span, li, blockquote { line-height: ${lineHeight} !important; }`;
        doc.head.appendChild(style);
      });
    };

    applyTypography();
    viewRef.current.addEventListener("load", applyTypography);
    return () => viewRef.current?.removeEventListener("load", applyTypography);
  }, [fontSize, fontFamily, lineHeight, bookReady]);

  /* ================= SEARCH ================= */
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
    } catch (err) { console.error(err); }
    setSearching(false);
  };

  /* ================= THEME ================= */
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.style.setProperty("filter", theme === "dark" ? "invert(1) hue-rotate(180deg)" : "none");
  }, [theme]);

  /* ================= PAGE MODE ================= */
  useEffect(() => {
    if (!viewRef.current?.renderer) return;
    viewRef.current.renderer.setAttribute("flow", "paginated");
    viewRef.current.renderer.setAttribute("max-column-count", pageMode === "single" ? "1" : "2");
  }, [pageMode]);

  /* ================= KEYBOARD + SCROLL ================= */
useEffect(() => {
    const handleNext = () => {
      setShowCover((prev) => {
        if (prev) return false;
        viewRef.current?.next();
        return false;
      });
    }; 
    const handlePrev = () => {
      if (viewRef.current?.location?.start?.index === 0) {
        setShowCover(true);
      } else {
        viewRef.current?.prev();
      }
    }; 
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  if (!tempFile) return null;

  return (
    <div className="fixed inset-0 flex bg-[#1e1e1e] text-white">

      {/* ===== SIDEBAR ===== */}
      <div className={`${sidebarOpen ? "w-72" : "w-14"} bg-[#141414] border-r border-white/5 transition-all duration-300 ease-in-out flex flex-shrink-0`}>

        {/* ICON RAIL */}
        <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1 border-r border-white/5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all cursor-pointer mb-3"
          >
            <Menu size={18} />
          </button>

          <div className="w-8 h-px bg-white/10 mb-3" />

          {/* Conversion badge */}
          <div className="mb-2">
            <span className="text-[9px] font-bold text-violet-400 bg-violet-400/10 border border-violet-400/30 rounded px-1.5 py-0.5 uppercase tracking-wider">
              Conv
            </span>
          </div>

          {[
            { id: "search",     icon: <Search size={16} />,      label: "Search" },
            { id: "toc",        icon: <Type size={16} />,         label: "Contents" },
            { id: "typography", icon: <TextInitial size={16} />,  label: "Typography" },
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
              {!sidebarOpen && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a2a2a] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
                  {item.label}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto flex flex-col items-center gap-2 pb-2">
            <div className="w-8 h-px bg-white/10" />
            <span className="text-[10px] text-gray-600 font-mono tracking-wider">{progress}%</span>
          </div>
        </div>

        {/* PANEL CONTENT */}
        {sidebarOpen && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Panel Header */}
            <div className="px-4 py-4 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">
                {panel === "search" ? "Search" : panel === "toc" ? "Contents" : "Typography"}
              </h2>
              <span className="text-[9px] font-semibold text-violet-400/70 uppercase tracking-wider border border-violet-400/20 rounded px-1.5 py-0.5">
                Converted
              </span>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto">

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
                        if (value.trim().length >= 3) handleSearch(value);
                        else { setSearchResults([]); viewRef.current?.clearSearch?.(); }
                      }}
                      placeholder="Search in book…"
                      className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-white/20 transition-all"
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
                          <p className="text-xs font-medium text-gray-300 group-hover:text-white truncate">{result.label}</p>
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
                  <div className="px-2">
                    {toc.map((item, i) => (
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

              {/* ── TYPOGRAPHY ── */}
              {panel === "typography" && (
                <div className="p-4 space-y-5">

                  <div>
                    <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Typeface</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { value: "serif",      label: "Serif" },
                        { value: "sans-serif", label: "Sans" },
                        { value: "Georgia",    label: "Georgia" },
                        { value: "Arial",      label: "Arial" },
                      ].map((f) => (
                        <button key={f.value} onClick={() => setFontFamily(f.value)}
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
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-sm font-medium">
                        A−
                      </button>
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 relative">
                        <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all"
                          style={{ width: `${((fontSize - 60) / 140) * 100}%` }} />
                      </div>
                      <button onClick={() => setFontSize((f) => Math.min(200, f + 10))}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-sm font-medium">
                        A+
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] text-gray-600 uppercase tracking-wider">Line Spacing</label>
                      <span className="text-[10px] text-gray-500 font-mono">{lineHeight.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLineHeight((l) => Math.max(1, parseFloat((l - 0.1).toFixed(1))))}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                        <Minus size={14} />
                      </button>
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 relative">
                        <div className="absolute left-0 top-0 h-full bg-white/40 rounded-full transition-all"
                          style={{ width: `${((lineHeight - 1) / 2) * 100}%` }} />
                      </div>
                      <button onClick={() => setLineHeight((l) => Math.min(3, parseFloat((l + 0.1).toFixed(1))))}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-600 uppercase tracking-wider block mb-2">Layout</label>
                    <div className="flex gap-1.5">
                      {[{ value: "single", label: "1 Page" }, { value: "double", label: "2 Pages" }].map((m) => (
                        <button key={m.value} onClick={() => setPageMode(m.value as any)}
                          className={`flex-1 py-2 rounded-lg text-xs transition-all cursor-pointer border ${
                            pageMode === m.value
                              ? "bg-white text-black border-white font-medium"
                              : "bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white"
                          }`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

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
                          <span>{t.icon}</span> {t.label}
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

      {/* ===== READER ===== */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 relative flex items-center justify-center">

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Loading converted EPUB…</span>
              </div>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-6 z-20">

            <button onClick={toggleFullscreen} title="Full Screen"
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer text-sm">
              ⛶
            </button>
          </div>

           {/* COVER OVERLAY */}
          {showCover && mainImage && !loading && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#1e1e1e]">
              <img 
                src={mainImage} 
                alt="Book Cover" 
                className="max-h-[75vh] w-auto shadow-2xl mb-8 rounded-r-md border border-white/10"
              />
            </div>
          )}

          <div className="relative p-[3px]">
            {pageMode === "double" && (
              <div className="pointer-events-none absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-px bg-gray-300 z-30" />
            )}
            <div
              ref={containerRef}
              className={`w-[900px] h-[90vh] shadow-2xl ${theme === "dark" ? "bg-black" : "bg-white"}`}
            />
          </div>

                    <button onClick={() => {
              if (viewRef.current?.location?.start?.index === 0) setShowCover(true);
              else viewRef.current?.prev();
            }}
            className="absolute left-8 top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-xl cursor-pointer hover:bg-gray-100 transition-colors z-50">
            <ChevronLeft />
          </button>

          <button onClick={() => {
              if (showCover && mainImage) setShowCover(false);
              else viewRef.current?.next();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-3 shadow-xl cursor-pointer hover:bg-gray-100 transition-colors z-50">
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}