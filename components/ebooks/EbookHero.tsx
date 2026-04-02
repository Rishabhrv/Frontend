"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Star } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type HeroStats = {
  total_ebooks: number;
  total_authors: number;
};

type FeaturedBook = {
  id: number;
  title: string;
  slug: string;
  main_image: string | null;
  ebook_sell_price: number | null;
  sell_price: number;
  author_name: string | null;
};

function resolveImg(path: string | null | undefined): string {
  if (!path) return "/placeholder-book.png";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function FloatingBook({
  book,
  style,
  delay,
}: {
  book: FeaturedBook;
  style: React.CSSProperties;
  delay: number;
}) {
  const price = book.ebook_sell_price ?? book.sell_price;
  return (
    <div
      className="absolute rounded-lg overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm cursor-pointer hover:scale-105 hover:-translate-y-2 transition-all duration-500"
      style={{
        ...style,
        animation: `floatBook 6s ease-in-out ${delay}s infinite`,
      }}
    >
      <Link href={`/product/${book.slug}`}>
        <div className="relative" style={{ width: style.width ?? 120 }}>
          <img
            src={resolveImg(book.main_image)}
            alt={book.title}
            className="w-full object-cover"
            style={{ height: typeof style.width === "number" ? style.width * 1.45 : 170 }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
            <p className="text-white text-[9px] font-black truncate">₹{price}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 35);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function EbookHero() {
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [featured, setFeatured] = useState<FeaturedBook[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/ebooks/hero-stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ total_ebooks: 1500, total_authors: 320 }));

    fetch(`${API_URL}/api/ebooks?limit=5&sort=newest`)
      .then((r) => r.json())
      .then(async (d) => {
        const candidates: FeaturedBook[] = d.ebooks ?? [];
    
        const validated = await Promise.all(
          candidates.map(
            (book) =>
              new Promise<FeaturedBook | null>((resolve) => {
                if (!book.main_image) return resolve(null);
                const src = book.main_image.startsWith("http")
                  ? book.main_image
                  : `${API_URL}${book.main_image.startsWith("/") ? "" : "/"}${book.main_image}`;
                const img = new window.Image();
                img.onload = () => resolve(book);
                img.onerror = () => resolve(null);
                img.src = src;
              })
          )
        );
    
        setFeatured(validated.filter(Boolean) as FeaturedBook[]);
      })
      .catch(() => {});
  }, []);

  // Desktop float positions (unchanged)
  const desktopPositions: { style: React.CSSProperties; delay: number }[] = [
    { style: { top: "8%",  right: "18%", width: 110, zIndex: 3 }, delay: 0 },
    { style: { top: "5%",  right: "32%", width: 90,  zIndex: 2 }, delay: 1.2 },
    { style: { top: "38%", right: "10%", width: 130, zIndex: 4 }, delay: 0.7 },
    { style: { top: "55%", right: "28%", width: 95,  zIndex: 2 }, delay: 1.8 },
    { style: { top: "22%", right: "44%", width: 80,  zIndex: 1 }, delay: 2.3 },
  ];

  // Tablet float positions (tighter, smaller)
  const tabletPositions: { style: React.CSSProperties; delay: number }[] = [
    { style: { top: "6%",  right: "5%",  width: 90,  zIndex: 3 }, delay: 0 },
    { style: { top: "4%",  right: "28%", width: 75,  zIndex: 2 }, delay: 1.2 },
    { style: { top: "42%", right: "2%",  width: 105, zIndex: 4 }, delay: 0.7 },
    { style: { top: "58%", right: "24%", width: 78,  zIndex: 2 }, delay: 1.8 },
    { style: { top: "24%", right: "40%", width: 65,  zIndex: 1 }, delay: 2.3 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes floatBook {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(1.5deg); }
          66%       { transform: translateY(-6px) rotate(-1deg); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes scrollBooks {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .hero-text-1 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.1s; }
        .hero-text-2 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.25s; }
        .hero-text-3 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.4s; }
        .hero-text-5 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.7s; }

        .shimmer-text {
          background: linear-gradient(90deg, #374151, #6b7280, #374151, #9ca3af, #374151);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .books-scroll-track {
          display: flex;
          width: max-content;
          animation: scrollBooks 18s linear infinite;
        }
        .books-scroll-track:hover { animation-play-state: paused; }
      `}</style>

      <section
        className="relative flex items-center overflow-hidden"
        style={{ background: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Background dots */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Glow blob */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #f3f4f6, transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-12 md:py-14">

          {/* ── MOBILE (< md): stacked layout with horizontal scroll strip ── */}
          <div className="flex flex-col md:hidden">

            {/* Badge */}
            <div className="hero-text-1 inline-flex items-center gap-2 self-start mb-5 px-4 py-2 rounded-full border border-gray-200 bg-gray-100">
              <Sparkles size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Digital Library</span>
            </div>

            {/* Headline */}
            <h1
              className="hero-text-2 font-black leading-[1.08] tracking-tight mb-3"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 9vw, 3rem)" }}
            >
              <span className="text-gray-900">Explore Our</span>
              <br />
              <span className="shimmer-text">eBook Collection</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-text-3 text-gray-500 text-base font-light leading-relaxed mb-6">
              Instant access to your ebook. Start reading in seconds.
            </p>

            {/* Horizontal auto-scrolling book strip */}
            {featured.length > 0 && (
              <div className="hero-text-3 overflow-hidden mb-7 -mx-4 px-4">
                <div className="books-scroll-track gap-3" style={{ gap: "12px" }}>
                  {[...featured, ...featured].map((book, i) => {
                    const price = book.ebook_sell_price ?? book.sell_price;
                    return (
                      <Link
                        key={`${book.id}-${i}`}
                        href={`/product/${book.slug}`}
                        className="shrink-0 rounded-lg overflow-hidden shadow-md border border-gray-100 hover:scale-105 transition-transform duration-300"
                        style={{ width: 90 }}
                      >
                        <div className="relative">
                          <img
                            src={resolveImg(book.main_image)}
                            alt={book.title}
                            className="w-full object-cover"
                            style={{ height: 130 }}
                          />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 rounded px-1.5 py-0.5">
                            <p className="text-white text-[9px] font-black truncate">₹{price}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Placeholder strip when loading */}
            {featured.length === 0 && (
              <div className="flex gap-3 mb-7 overflow-hidden">
                {[90, 90, 90, 90].map((w, i) => (
                  <div key={i} className="shrink-0 rounded-lg bg-gray-100 animate-pulse" style={{ width: w, height: 130 }} />
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="hero-text-5 flex gap-6">
              {[
                {
                  icon: <BookOpen size={16} className="text-indigo-400" />,
                  value: stats ? <Counter target={stats.total_ebooks} suffix="+" /> : "—",
                  label: "eBooks",
                },
                {
                  icon: <Star size={16} className="text-amber-400" />,
                  value: stats ? <Counter target={stats.total_authors} suffix="+" /> : "—",
                  label: "Authors",
                },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-gray-900 font-black text-lg leading-tight">{s.value}</p>
                    <p className="text-gray-400 text-xs">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TABLET (md–lg): side-by-side with smaller floating books ── */}
          <div className="hidden md:flex lg:hidden items-center gap-8">

            {/* Left text */}
            <div className="flex-1 flex flex-col">
              <div className="hero-text-1 inline-flex items-center gap-2 self-start mb-5 px-4 py-2 rounded-full border border-gray-200 bg-gray-100">
                <Sparkles size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Digital Library</span>
              </div>

              <h1
                className="hero-text-2 font-black leading-[1.07] tracking-tight mb-3"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)" }}
              >
                <span className="text-gray-900">Explore Our</span>
                <br />
                <span className="shimmer-text">eBook Collection</span>
              </h1>

              <p className="hero-text-3 text-gray-500 text-base font-light leading-relaxed mb-7 max-w-sm">
                Instant access to your ebook. Start reading in seconds.
              </p>

              <div className="hero-text-5 flex gap-7">
                {[
                  {
                    icon: <BookOpen size={17} className="text-indigo-400" />,
                    value: stats ? <Counter target={stats.total_ebooks} suffix="+" /> : "—",
                    label: "eBooks Available",
                  },
                  {
                    icon: <Star size={17} className="text-amber-400" />,
                    value: stats ? <Counter target={stats.total_authors} suffix="+" /> : "—",
                    label: "Expert Authors",
                  },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-gray-900 font-black text-xl leading-tight">{s.value}</p>
                      <p className="text-gray-400 text-xs">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right floating books (tablet) */}
            <div className="relative shrink-0" style={{ width: 280, height: 420 }}>
              {/* Rings */}
              <div
                className="absolute"
                style={{
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 260, height: 260, borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.06)",
                  background: "radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute"
                style={{
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 160, height: 160, borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              />

              {featured.slice(0, 5).map((book, i) => (
                <FloatingBook
                  key={book.id}
                  book={book}
                  style={tabletPositions[i].style}
                  delay={tabletPositions[i].delay}
                />
              ))}

              {featured.length === 0 &&
                tabletPositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute rounded-2xl bg-gray-100 border border-gray-200 animate-pulse"
                    style={{
                      ...pos.style,
                      height: typeof pos.style.width === "number" ? pos.style.width * 1.45 : 140,
                    }}
                  />
                ))}

              <div
                className="absolute z-10 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 shadow-xl"
                style={{ top: "44%", left: "34%", transform: "translate(-50%, -50%)" }}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen size={12} className="text-white" />
                  <span className="text-white text-[11px] font-bold whitespace-nowrap">Read Anywhere</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── DESKTOP (lg+): original layout ── */}
          <div className="hidden lg:grid grid-cols-2 gap-12 items-center">

            {/* Left text */}
            <div className="flex flex-col">
              <div className="hero-text-1 inline-flex items-center gap-2 self-start mb-6 px-4 py-2 rounded-full border border-gray-200 bg-gray-100">
                <Sparkles size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Digital Library</span>
              </div>

              <h1
                className="hero-text-2 font-black leading-[1.05] tracking-tight mb-4"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.6rem, 5.5vw, 5rem)" }}
              >
                <span className="text-gray-900">Explore Our</span>
                <br />
                <span className="shimmer-text">eBook Collection</span>
              </h1>

              <p className="hero-text-3 text-gray-500 text-lg font-light leading-relaxed mb-8 max-w-lg">
                Instant access to your ebook. Start reading in seconds.
              </p>

              <div className="hero-text-5 flex flex-wrap gap-8">
                {[
                  {
                    icon: <BookOpen size={18} className="text-indigo-400" />,
                    value: stats ? <Counter target={stats.total_ebooks} suffix="+" /> : "—",
                    label: "eBooks Available",
                  },
                  {
                    icon: <Star size={18} className="text-amber-400" />,
                    value: stats ? <Counter target={stats.total_authors} suffix="+" /> : "—",
                    label: "Expert Authors",
                  },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-gray-900 font-black text-xl leading-tight">{s.value}</p>
                      <p className="text-gray-400 text-xs">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right floating books (desktop) */}
            <div className="relative" style={{ height: 520 }}>
              <div
                className="absolute"
                style={{
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 340, height: 340, borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.06)",
                  background: "radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)",
                  boxShadow: "0 0 60px rgba(0,0,0,0.04)",
                }}
              />
              <div
                className="absolute"
                style={{
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 220, height: 220, borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              />

              {featured.slice(0, 5).map((book, i) => (
                <FloatingBook
                  key={book.id}
                  book={book}
                  style={desktopPositions[i].style}
                  delay={desktopPositions[i].delay}
                />
              ))}

              {featured.length === 0 &&
                desktopPositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute rounded-2xl bg-gray-100 border border-gray-200 animate-pulse"
                    style={{
                      ...pos.style,
                      height: typeof pos.style.width === "number" ? pos.style.width * 1.45 : 170,
                    }}
                  />
                ))}

              <div
                className="absolute z-10 px-4 py-2 rounded-2xl bg-gray-900 border border-gray-700 shadow-xl"
                style={{ top: "44%", left: "38%", transform: "translate(-50%, -50%)" }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-white" />
                  <span className="text-white text-xs font-bold whitespace-nowrap">Read Anywhere</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 60L60 51.3C120 43 240 25 360 20C480 15 600 23 720 28C840 33 960 35 1080 31.7C1200 28 1320 20 1380 15.3L1440 10V60H0Z"
              fill="#f3f4f6"
            />
          </svg>
        </div>
      </section>
    </>
  );
}