"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ════════════════════════════════════════
   TYPES
════════════════════════════════════════ */
interface Author {
  id: number;
  name: string;
  slug: string;
  profile_image?: string;
  bio?: string;
  status: "active" | "inactive";
}

interface ScrollEdge {
  left: boolean;
  right: boolean;
}

/* ════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════ */
const SCROLL_PX      = 420;
const SKELETON_N     = 6;
const MAX_AUTHORS    = 10;
const AUTO_SLIDE_MS  = 3200;

const AVATAR_PALETTES: [string, string][] = [
  ["#ffffff", "#c0c0c0"],
];

/* ════════════════════════════════════════
   PURE HELPERS
════════════════════════════════════════ */
const initials = (name: string): string =>
  name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");

const truncate = (text: string, max: number): string =>
  text.length > max ? text.slice(0, max).trimEnd() + "…" : text;

/* ════════════════════════════════════════
   HOOKS
════════════════════════════════════════ */
function useAuthors() {
  const [data, setData]       = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/authors`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: Author[]) => {
        if (alive) {
          const active = d
            .filter(a => a.status === "active")
            .slice(0, MAX_AUTHORS);           // ← limit to 10
          setData(active);
          setLoading(false);
        }
      })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}

/* Fixed: use RefObject<HTMLDivElement | null> to match React 18+ useRef */
function useScrollEdge(
  ref: React.RefObject<HTMLDivElement | null>,
  ready: boolean
): ScrollEdge {
  const [edge, setEdge] = useState<ScrollEdge>({ left: false, right: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      left:  el.scrollLeft > 8,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8,
    });
  }, [ref]);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    const id = requestAnimationFrame(measure);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener("scroll", measure);
    };
  }, [ready, measure]);

  return edge;
}

/* Auto-slide hook — pauses on hover */
function useAutoSlide(
  ref: React.RefObject<HTMLDivElement | null>,
  ready: boolean,
  paused: boolean
) {
  useEffect(() => {
    if (!ready || paused) return;

    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;

      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + SCROLL_PX,
        behavior: "smooth",
      });
    }, AUTO_SLIDE_MS);

    return () => clearInterval(id);
  }, [ref, ready, paused]);
}

/* ════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════ */

const SkeletonCard = memo(function SkeletonCard({ delay }: { delay: number }) {
  const s: React.CSSProperties = {
    background: "linear-gradient(90deg,#f0ede8 25%,#e8e4de 50%,#f0ede8 75%)",
    backgroundSize: "800px 100%",
    animation: `ac-shimmer 1.6s ${delay}ms infinite`,
  };
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ width: 200 }}>
      <div className="mb-4 h-[120px] w-[120px] rounded-full" style={s} />
      <div className="mb-2 h-4 w-28 rounded" style={s} />
      <div className="mb-1.5 h-3 w-36 rounded" style={{ ...s, animationDelay: `${delay + 60}ms` }} />
      <div className="h-3 w-24 rounded" style={{ ...s, animationDelay: `${delay + 120}ms` }} />
    </div>
  );
});

const ArrowBtn = memo(function ArrowBtn({
  dir, disabled, onClick,
}: { dir: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`Scroll ${dir}`}
      className="
        flex h-9 w-9 shrink-0 items-center justify-center rounded-full
        border border-gray-200 bg-white text-gray-600 shadow-sm
        transition-all duration-200
        hover:scale-105 hover:border-[#1a1209]  hover:text-white
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
        disabled:pointer-events-none disabled:opacity-20
      "
    >
      {dir === "left"
        ? <ChevronLeft  className="h-4 w-4" />
        : <ChevronRight className="h-4 w-4" />}
    </button>
  );
});

interface AuthorCardProps {
  author: Author;
  index: number;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}

const AuthorCard = memo(function AuthorCard({
  author, index, hovered, onEnter, onLeave,
}: AuthorCardProps) {
  const [imgBroken, setImgBroken] = useState(false);
  const [bg, accent] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const showImg = !!(author.profile_image && !imgBroken);
  const abbr    = initials(author.name);
  const bio     = author.bio ? truncate(author.bio, 72) : null;

  return (
    <Link
      role="listitem"
      href={`/author/${author.slug}`}
      className="
        group relative flex shrink-0 flex-col items-center
        cursor-pointer select-none
        outline-none focus-visible:outline-2 focus-visible:outline-offset-4
        focus-visible:outline-amber-600
      "
      style={{
        width: 200,
        animation: "ac-fadeUp 0.55s ease both",
        animationDelay: `${index * 60}ms`,
        scrollSnapAlign: "start",
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* ── Avatar ── */}
      <div className="relative mb-4">

        {/* Spinning dashed ring */}
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full border-[1.5px] border-dashed"
          style={{
            inset: -7,
            borderColor: hovered ? accent : "transparent",
            transition: "border-color 0.3s ease",
            animation: hovered ? "ac-spin 9s linear infinite" : "none",
          }}
        />

        {/* Glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            boxShadow: `0 0 0 4px ${accent}33, 0 12px 32px -6px ${accent}55`,
          }}
        />

        {/* Circle */}
        <div
          className="relative flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${bg}, ${bg}cc)`,
            border: `2px solid ${hovered ? accent : "#e5e0d8"}`,
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), border-color 0.25s, box-shadow 0.3s",
            boxShadow: hovered
              ? `0 14px 36px -8px ${accent}44`
              : "0 2px 14px -4px rgba(0,0,0,0.10)",
          }}
        >
          {showImg ? (
            <img
              src={`${API_URL}${author.profile_image}`}
              alt={author.name}
              className="h-full w-full object-cover"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <span
              className="font-bold tracking-tight"
              style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: abbr.length > 2 ? 28 : 36,
                color: accent,
                lineHeight: 1,
              }}
            >
              {abbr}
            </span>
          )}

          {/* Gloss */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.46) 0%, transparent 55%)",
            }}
          />
        </div>
      </div>

      {/* Name */}
      <span
        className="mb-1.5 text-center text-[15px] font-semibold leading-tight tracking-wide transition-colors duration-200"
        style={{
          fontFamily: "'Libre Baskerville', serif",
          color: hovered ? accent : "#1a1209",
          maxWidth: 176,
        }}
      >
        {author.name}
      </span>

      {/* Animated divider */}
      <span
        aria-hidden
        className="mb-2 block h-px transition-all duration-300"
        style={{
          width:      hovered ? 40  : 20,
          background: hovered ? accent : "#d4c9b8",
        }}
      />

      {/* Bio */}
      {bio && (
        <p
          className="text-center text-[12px] leading-relaxed transition-colors duration-200"
          style={{
            fontFamily: "'Barlow', sans-serif",
            color:     hovered ? "#555" : "#9a8c7c",
            maxWidth:  176,
            fontWeight: 300,
          }}
        >
          {bio}
        </p>
      )}

    </Link>
  );
});

/* ════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════ */
export default function AuthorCarousel() {
  const { data: authors, loading, error } = useAuthors();

  // ← React 18+ correct typing: RefObject<HTMLDivElement | null>
  const trackRef                    = useRef<HTMLDivElement | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const isPaused                    = hoveredIdx !== null;

  const edge = useScrollEdge(trackRef, !loading);
  useAutoSlide(trackRef, !loading && !error && authors.length > 0, isPaused);

  const scrollTrack = useCallback((dir: "left" | "right") => {
    trackRef.current?.scrollBy({
      left: dir === "left" ? -SCROLL_PX : SCROLL_PX,
      behavior: "smooth",
    });
  }, []);

  const makeEnter   = useCallback((i: number) => () => setHoveredIdx(i), []);
  const handleLeave = useCallback(() => setHoveredIdx(null), []);

  const dotCount = useMemo(
    () => Math.max(1, Math.ceil(authors.length / 4)),
    [authors.length]
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500&display=swap');

        @keyframes ac-spin    { to   { transform: rotate(360deg); } }
        @keyframes ac-shimmer { 0%   { background-position: -400px 0; }
                                100% { background-position:  400px 0; } }
        @keyframes ac-fadeUp  { from { opacity:0; transform:translateY(22px); }
                                to   { opacity:1; transform:translateY(0);    } }
      `}</style>

      <section
        className="relative overflow-hidden py-16"
        style={{ fontFamily: "'Barlow', sans-serif" }}
        aria-label="Featured authors"
      >
        {/* Background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 50%, #f0e8d822 0%, transparent 50%),
              radial-gradient(circle at 85% 20%, #e8dcc822 0%, transparent 45%)
            `,
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent  to-transparent" />

        <div className="relative mx-auto  px-6">

          {/* ── Header ── */}
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-8 bg-gray-700" />
                <p
                  className="text-[11px] uppercase tracking-[0.35em] text-gray-600"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Meet the writers
                </p>
              </div>
              <h2
                className="text-[2rem] font-bold leading-tight text-[#1a1209]"
                style={{ fontFamily: "'Libre Baskerville', serif" }}
              >
                Featured{" "}
                <em className="font-normal italic text-gray-600">Authors</em>
              </h2>
              <p
                className="mt-2 text-sm font-light text-[#9a8c7c]"
                style={{ fontFamily: "'Barlow', sans-serif" }}
              >
                Discover the minds behind the books
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ArrowBtn dir="left"  disabled={!edge.left}  onClick={() => scrollTrack("left")} />
              <ArrowBtn dir="right" disabled={!edge.right} onClick={() => scrollTrack("right")} />
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-gray-400">
              <User className="h-4 w-4" />
              Could not load authors — please try again later.
            </div>
          )}

          {/* ── Track ── */}
          {!error && (
            <div
              ref={trackRef}
              role="list"
              aria-label="Author list"
              className="flex gap-3 pt-10 overflow-x-auto pb-6"
              style={{
                scrollbarWidth:    "none",
                msOverflowStyle:   "none",
                scrollSnapType:    "x mandatory",
              } as React.CSSProperties}
            >
              {loading
                ? Array.from({ length: SKELETON_N }, (_, i) => (
                    <SkeletonCard key={i} delay={i * 70} />
                  ))
                : authors.map((author, i) => (
                    <AuthorCard
                      key={author.id}
                      author={author}
                      index={i}
                      hovered={hoveredIdx === i}
                      onEnter={makeEnter(i)}
                      onLeave={handleLeave}
                    />
                  ))}
            </div>
          )}

          {/* ── Footer: dots + CTA ── */}
          {!loading && !error && authors.length > 0 && (
            <div className="mt-4 flex flex-col items-center gap-5">
              <div className="flex items-center gap-2" role="presentation">
                <div className="h-px w-16 bg-[#e5ddd0]" />
                <div className="flex gap-1.5">
                  {Array.from({ length: dotCount }, (_, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width:      i === 0 ? 20 : 6,
                        background: i === 0 ? "#737373" : "#e5ddd0",
                      }}
                    />
                  ))}
                </div>
                <div className="h-px w-16 bg-[#e5ddd0]" />
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent  to-transparent" />
      </section>
    </>
  );
}