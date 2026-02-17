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
  Type,
} from "lucide-react";



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
  const [panel, setPanel] = useState<"search" | "toc" | "typography">("toc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);


useEffect(() => {
  if (typeof window !== "undefined") {
    import("@/lib/foliate/view.js");
  }
}, []);


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

      view.addEventListener("relocate", (e: any) => {
        setProgress(Math.round(e.detail.fraction * 100));
      });

      await view.open(url);

      requestAnimationFrame(() => {
        view.goTo(0); // force first page render
      });

      
      setToc(view.book?.toc || []);

      setLoading(false);
    };

    loadBook();

    return () => {
      destroyed = true;
      viewRef.current?.close?.();
      viewRef.current?.remove?.();
    };
  }, [slug]);

/* ================= TYPOGRAPHY ================= */
useEffect(() => {
  if (!viewRef.current) return;

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
}, [fontSize, fontFamily, lineHeight]);

const handleSearch = async (query: string) => {

    if (!viewRef.current || query.trim().length < 3) {
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


  if (!slug) return null;

  return (
    <div className="fixed inset-0 flex bg-[#1e1e1e] text-white">
{/* ===== SIDEBAR ===== */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-16"
        } bg-[#1a1a1a] border-r border-gray-800 transition-all duration-300 flex p-5`}
      >
        {/* ICON COLUMN */}
        <div className="flex flex-col items-center py-4 gap-6 border-b border-gray-800">
          <button className="cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>

          <button className="cursor-pointer" onClick={() => setPanel("search")}>
            <Search size={20} />
          </button>

          <button className="cursor-pointer" onClick={() => setPanel("toc")}>
            <List size={20} />
          </button>

          <button className="cursor-pointer" onClick={() => setPanel("typography")}>
            <Type size={20} />
          </button>

          <span className="text-xs">{progress}%</span>
        </div>

        {/* EXPANDED CONTENT */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4 text-sm">

            {panel === "search" && (
      <div>
        <input
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
          
            if (value.trim().length >= 3) {
              handleSearch(value);
            } else {
              setSearchResults([]);
          
              // 🔥 Clear highlights from book
              viewRef.current?.clearSearch?.();
            }
          }}
          placeholder="Search..."
          className="w-full p-2 bg-gray-800"
        />


    {searching && (
      <p className="text-xs text-gray-400 mt-2">
        Searching...
      </p>
    )}

    <div className="mt-4 space-y-3">
      {searchResults.map((result, i) => (
        <button
          key={i}
          onClick={() => viewRef.current?.goTo(result.cfi)}
          className="text-left w-full text-xs hover:text-gray-300"
        >
          <div className="font-semibold cursor-pointer">
            {result.label}
          </div>
        <div/>
        </button>
      ))}
    </div>
  </div>
)}


            {panel === "toc" && (
              <ul className="space-y-2">

                {toc.map((item, i) => (
                  <li key={i}>
                    <button
                      onClick={() => viewRef.current?.goTo(item.href)}
                      className="text-left text-xs w-full hover:bg-gray-100 hover:text-black p-1 rounded-xs cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {panel === "typography" && (
              <div className="space-y-4">

                <div>
                  <label>Font</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-gray-800 p-2 mt-1 cursor-pointer"
                  >
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Arial">Arial</option>
                  </select>
                </div>

                <div>
                  <label>Font Size</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setFontSize((f) => f - 10)}
                      className="flex-1 bg-gray-800 p-2 cursor-pointer"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize((f) => f + 10)}
                      className="flex-1 bg-gray-800 p-2 cursor-pointer"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div>
                  <label>Line Spacing</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setLineHeight((l) => l - 0.1)}
                      className="flex-1 bg-gray-800 p-2 cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setLineHeight((l) => l + 0.1)}
                      className="flex-1 bg-gray-800 p-2 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label>Layout</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setPageMode("single")}
                      className={`flex-1 p-2 cursor-pointer ${
                        pageMode === "single"
                          ? "bg-white text-black"
                          : "bg-gray-800"
                      }`}
                    >
                      1 Page
                    </button>
                    <button
                      onClick={() => setPageMode("double")}
                      className={`flex-1 p-2 cursor-pointer ${
                        pageMode === "double"
                          ? "bg-white text-black"
                          : "bg-gray-800"
                      }`}
                    >
                      2 Page
                    </button>
                  </div>
                </div>

                <div>
                  <label>Theme</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setTheme("light")}
                      className="flex-1 bg-gray-800 p-2 cursor-pointer"
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className="flex-1 bg-gray-800 p-2 cursor-pointer"
                    >
                      Dark
                    </button>
                  </div>
                </div>

              </div>
            )}
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
            className="absolute top-4 right-6 bg-white text-black px-3 py-2 rounded shadow cursor-pointer"
          >
            ⛶
          </button>

          <div
            ref={containerRef}
            className={` w-[900px] h-[90vh] shadow-2xl ${ theme === "dark" ? "bg-black" : "bg-white" }`}
          />


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


    </div>
  );
}
