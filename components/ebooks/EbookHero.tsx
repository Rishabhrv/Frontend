"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Sparkles, ArrowRight, Download, Star, Zap } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Floating book card (decorative) ─────────────────────────────────────────
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
          {/* Gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          {/* Price chip */}
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
            <p className="text-white text-[9px] font-black truncate">₹{price}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
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

// ─── Hero Component ───────────────────────────────────────────────────────────
export default function EbookHero() {
  const [stats, setStats]         = useState<HeroStats | null>(null);
  const [featured, setFeatured]   = useState<FeaturedBook[]>([]);

  useEffect(() => {
    // Fetch stats
    fetch(`${API_URL}/api/ebooks/hero-stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ total_ebooks: 1500, total_authors: 320 }));

    // Fetch a handful of featured ebooks for floating covers
    fetch(`${API_URL}/api/ebooks?limit=5&sort=newest`)
      .then((r) => r.json())
      .then((d) => setFeatured(d.ebooks ?? []))
      .catch(() => {});
  }, []);

  // Layout positions for floating books
  const floatPositions: { style: React.CSSProperties; delay: number }[] = [
    { style: { top: "8%",  right: "18%", width: 110, zIndex: 3 }, delay: 0 },
    { style: { top: "5%",  right: "32%", width: 90,  zIndex: 2 }, delay: 1.2 },
    { style: { top: "38%", right: "10%", width: 130, zIndex: 4 }, delay: 0.7 },
    { style: { top: "55%", right: "28%", width: 95,  zIndex: 2 }, delay: 1.8 },
    { style: { top: "22%", right: "44%", width: 80,  zIndex: 1 }, delay: 2.3 },
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

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 40px rgba(99,102,241,0.8); }
        }

        .hero-text-1 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.1s; }
        .hero-text-2 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.25s; }
        .hero-text-3 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.4s; }
        .hero-text-4 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.55s; }
        .hero-text-5 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.7s; }

        .shimmer-text {
          background: linear-gradient(90deg, #374151, #6b7280, #374151, #9ca3af, #374151);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .cta-glow { animation: pulseGlow 2.5s ease-in-out infinite; }
      `}</style>

      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#ffffff",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Background texture dots ── */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* ── Glow blobs ── */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #f3f4f6, transparent 70%)", filter: "blur(60px)" }} />

        {/* ── Content ── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-13">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT — Text */}
            <div className="flex flex-col">

              {/* Badge */}
              <div className="hero-text-1 inline-flex items-center gap-2 self-start mb-6 px-4 py-2 rounded-full border border-gray-200 bg-gray-100">
                <Sparkles size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Digital Library
                </span>
              </div>

              {/* Headline */}
              <h1
                className="hero-text-2 font-black leading-[1.05] tracking-tight mb-4"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.6rem, 5.5vw, 5rem)" }}
              >
                <span className="text-gray-900">Explore Our</span>
                <br />
                <span className="shimmer-text">eBook Collection</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-text-3 text-gray-500 text-lg font-light leading-relaxed mb-8 max-w-lg">
                Instant access to your ebook.
                Start reading in seconds.
              </p>

              {/* Stats row */}
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

            {/* RIGHT — Floating book covers */}
            <div className="relative hidden lg:block" style={{ height: 520 }}>

              {/* Central glowing ring */}
              <div
                className="absolute"
                style={{
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 340, height: 340,
                  borderRadius: "50%",
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
                  width: 220, height: 220,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              />

              {/* Floating book covers from API */}
              {featured.slice(0, 5).map((book, i) => (
                <FloatingBook
                  key={book.id}
                  book={book}
                  style={floatPositions[i].style}
                  delay={floatPositions[i].delay}
                />
              ))}

              {/* Fallback placeholder books if API hasn't loaded */}
              {featured.length === 0 &&
                floatPositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute rounded-2xl bg-gray-100 border border-gray-200 animate-pulse"
                    style={{
                      ...pos.style,
                      height: typeof pos.style.width === "number" ? pos.style.width * 1.45 : 170,
                    }}
                  />
                ))}

              {/* Center tag */}
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

        {/* ── Bottom wave ── */}
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