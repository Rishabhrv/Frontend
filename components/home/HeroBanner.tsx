"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
const AUTO_INTERVAL_MS = 2500;

interface Product {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  sku: string;
  stock: number;
  price: number;
  sell_price: number;
  status: string;
  date: string;
  categories: string[];
}

interface Category {
  name: string;
  imprint: "agph";
}

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: "Luxora",    slug: "luxora",    price: 2200, sell_price: 1980, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80", sku: "LUX-01", stock: 10, status: "active", date: "", categories: ["Handbags"] },
  { id: 2, name: "Grandeur",  slug: "grandeur",  price: 3200, sell_price: 2900, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80", sku: "GRN-02", stock:  5, status: "active", date: "", categories: ["Handbags"] },
  { id: 3, name: "Prestigio", slug: "prestigio", price: 4500, sell_price: 4500, image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80", sku: "PRE-03", stock:  3, status: "active", date: "", categories: ["Luxury"]  },
  { id: 4, name: "Auron",     slug: "auron",     price: 3500, sell_price: 3200, image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80", sku: "AUR-04", stock:  8, status: "active", date: "", categories: ["Handbags"] },
  { id: 5, name: "Noir",      slug: "noir",      price: 2200, sell_price: 2200, image: "https://images.unsplash.com/photo-1601924357840-3e50ad4dd9a5?w=400&q=80", sku: "NOR-05", stock: 12, status: "active", date: "", categories: ["Classic"] },
  { id: 6, name: "Velara",    slug: "velara",    price: 2800, sell_price: 2600, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80", sku: "VEL-06", stock:  6, status: "active", date: "", categories: ["Handbags"] },
  { id: 7, name: "Solenne",   slug: "solenne",   price: 3900, sell_price: 3500, image: "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=400&q=80", sku: "SOL-07", stock:  4, status: "active", date: "", categories: ["Luxury"]  },
];

// ─── Responsive position configs ─────────────────────────────────────────────
type PosKey = "far-far-left" | "far-left" | "left" | "center" | "right" | "far-right" | "far-far-right" | "hidden-l" | "hidden-r";

// Desktop: 7 visible slots
const posDesktop: Record<PosKey, React.CSSProperties & { className: string }> = {
  "far-far-left":  { className: "opacity-50 z-[1]",  transform: "translateX(-490px) scale(0.62) rotate(-10deg)", filter: "brightness(0.75)" },
  "far-left":      { className: "opacity-65 z-[2]",  transform: "translateX(-330px) scale(0.74) rotate(-6deg)",  filter: "brightness(0.85)" },
  "left":          { className: "opacity-[0.82] z-[3]", transform: "translateX(-185px) scale(0.87) rotate(-3deg)", filter: "brightness(0.95)" },
  "center":        { className: "opacity-100 z-[6]", transform: "translateX(0) scale(1) rotate(0deg)",           filter: "brightness(1)" },
  "right":         { className: "opacity-[0.82] z-[3]", transform: "translateX(185px) scale(0.87) rotate(3deg)",  filter: "brightness(0.95)" },
  "far-right":     { className: "opacity-65 z-[2]",  transform: "translateX(330px) scale(0.74) rotate(6deg)",   filter: "brightness(0.85)" },
  "far-far-right": { className: "opacity-50 z-[1]",  transform: "translateX(490px) scale(0.62) rotate(10deg)",  filter: "brightness(0.75)" },
  "hidden-l":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(-660px) scale(0.5)" },
  "hidden-r":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(660px) scale(0.5)" },
};

// Tablet: 5 visible slots (hide far-far variants)
const posTablet: Record<PosKey, React.CSSProperties & { className: string }> = {
  "far-far-left":  { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(-440px) scale(0.55)" },
  "far-left":      { className: "opacity-60 z-[2]", transform: "translateX(-290px) scale(0.72) rotate(-7deg)", filter: "brightness(0.8)" },
  "left":          { className: "opacity-[0.82] z-[3]", transform: "translateX(-162px) scale(0.86) rotate(-3.5deg)", filter: "brightness(0.92)" },
  "center":        { className: "opacity-100 z-[6]", transform: "translateX(0) scale(1) rotate(0deg)", filter: "brightness(1)" },
  "right":         { className: "opacity-[0.82] z-[3]", transform: "translateX(162px) scale(0.86) rotate(3.5deg)",  filter: "brightness(0.92)" },
  "far-right":     { className: "opacity-60 z-[2]", transform: "translateX(290px) scale(0.72) rotate(7deg)",   filter: "brightness(0.8)" },
  "far-far-right": { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(440px) scale(0.55)" },
  "hidden-l":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(-560px) scale(0.4)" },
  "hidden-r":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(560px) scale(0.4)" },
};

// Mobile: 3 visible slots (only left, center, right)
const posMobile: Record<PosKey, React.CSSProperties & { className: string }> = {
  "far-far-left":  { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(-360px) scale(0.45)" },
  "far-left":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(-360px) scale(0.45)" },
  "left":          { className: "opacity-70 z-[3]", transform: "translateX(-112px) scale(0.76) rotate(-5deg)", filter: "brightness(0.82)" },
  "center":        { className: "opacity-100 z-[6]", transform: "translateX(0) scale(1) rotate(0deg)", filter: "brightness(1)" },
  "right":         { className: "opacity-70 z-[3]", transform: "translateX(112px) scale(0.76) rotate(5deg)",  filter: "brightness(0.82)" },
  "far-right":     { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(360px) scale(0.45)" },
  "far-far-right": { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(360px) scale(0.45)" },
  "hidden-l":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(-360px) scale(0.4)" },
  "hidden-r":      { className: "opacity-0 z-[0] pointer-events-none", transform: "translateX(360px) scale(0.4)" },
};

// Card dimensions per breakpoint
const cardSize = {
  mobile:  { w: 180, h: 270 },
  tablet:  { w: 220, h: 330 },
  desktop: { w: 260, h: 380 },
};

const wrapperHeight = {
  mobile:  380,
  tablet:  440,
  desktop: 480,
};

function getPos(index: number, current: number, total: number): PosKey {
  let diff = index - current;
  if (diff < -Math.floor(total / 2)) diff += total;
  if (diff >  Math.floor(total / 2)) diff -= total;
  if (diff === -3) return "far-far-left";
  if (diff === -2) return "far-left";
  if (diff === -1) return "left";
  if (diff ===  0) return "center";
  if (diff ===  1) return "right";
  if (diff ===  2) return "far-right";
  if (diff ===  3) return "far-far-right";
  return diff < 0 ? "hidden-l" : "hidden-r";
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  product: Product;
  index: number;
  current: number;
  total: number;
  onSelect: (index: number) => void;
  screen: "mobile" | "tablet" | "desktop";
}

const ProductCard = ({ product, index, current, total, onSelect, screen }: CardProps) => {
  const posKey = getPos(index, current, total);
  const isCenter = posKey === "center";
  const displayPrice = product.sell_price || product.price;
  const [imgError, setImgError] = useState(false);

  const posMap = screen === "mobile" ? posMobile : screen === "tablet" ? posTablet : posDesktop;
  const pos = posMap[posKey];
  const { w, h } = cardSize[screen];

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${API_BASE}${product.image.startsWith("/") ? "" : "/"}${product.image}`
    : null;

  return (
    <div
      onClick={() => { if (!isCenter) onSelect(index); }}
      className={`absolute rounded-[22px] p-4 flex flex-col justify-end cursor-pointer select-none overflow-hidden shadow-2xl bg-gray-300 ${pos.className}`}
      style={{
        width: w,
        height: h,
        position: "absolute",
        transform: pos.transform,
        filter: (pos as any).filter,
        transition: "transform 500ms cubic-bezier(0.34,1.56,0.64,1), opacity 500ms ease, filter 500ms ease",
        ...(isCenter ? { boxShadow: "0 0 0 3px rgba(255,255,255,0.35), 0 20px 60px rgba(0,0,0,0.2)" } : {}),
      }}
    >
      {/* Product image */}
      <div className="absolute inset-0 bottom-[72px] flex items-center justify-center">
        {imageUrl && !imgError ? (
        <Image
          src={imageUrl}
          alt={product.name}
          width={400}
          height={400}
          unoptimized
          onError={() => setImgError(true)}
          className={`w-3/4 h-3/4 object-contain drop-shadow-2xl transition-transform duration-300 ${
            isCenter ? "hover:scale-105 hover:-translate-y-2" : ""
          }`}
        />
        ) : (
          <div className="w-3/4 h-3/4 flex items-center justify-center opacity-40">
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-white">
              <path d="M20 7h-3.5l-1-2h-7l-1 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-8 10a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="relative z-10">
        <p
          className="font-black uppercase tracking-widest text-gray-800 text-xs mb-2 mt-4 line-clamp-2 leading-snug"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {isCenter ? (
            <Link href={`/product/${product.slug}`} tabIndex={-1} >{product.name}</Link>
          ) : (
            product.name
          )}
        </p>
        <span className="text-gray-800 font-bold text-sm whitespace-nowrap">
          ₹{Number(displayPrice).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProductCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [current, setCurrent]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [screen, setScreen]     = useState<"mobile" | "tablet" | "desktop">("desktop");

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX  = useRef(0);

  // ── Breakpoint detection ──
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setScreen(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Fetch products ──
  useEffect(() => {
    (async () => {
      try {
        const catRes = await fetch(`${API_BASE}/api/categories`);
        const catData: Category[] = await catRes.json();
        const agphNames = new Set(catData.filter((c) => c.imprint === "agph").map((c) => c.name));

        const res = await fetch(`${API_BASE}/api/products?limit=10`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data: Product[] = await res.json();
        const filtered = data
          .filter((p) => p.categories.some((c) => agphNames.has(c)) && p.image)
          .slice(0, 30);
        
        const validated = await Promise.all(
          filtered.map(
            (p: Product) =>
              new Promise<Product | null>((resolve) => {
                const img = new window.Image();
                img.onload = () => resolve(p);
                img.onerror = () => resolve(null);
                img.src = p.image!.startsWith("http")
                  ? p.image!
                  : `${API_BASE}${p.image!.startsWith("/") ? "" : "/"}${p.image}`;
              })
          )
        );
        
        const valid = validated.filter(Boolean).slice(0, 10) as Product[];
        setProducts(valid.length ? valid : FALLBACK_PRODUCTS);
      } catch (err) {
        console.error(err);
        setError("Could not reach the server — showing demo data.");
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Auto-advance ──
  const startInterval = (len: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % len);
    }, AUTO_INTERVAL_MS);
  };

  useEffect(() => {
    if (!products.length) return;
    startInterval(products.length);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [products.length]);

  const handleSelect = (index: number) => {
    setCurrent(index);
    startInterval(products.length);
  };

  // ── Swipe ──
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 44)
      handleSelect((current + (dx < 0 ? 1 : -1) + products.length) % products.length);
  };

  const { w, h } = cardSize[screen];

  return (
    <div
      className="pt-10 sm:pt-14 bg-gray-100 flex flex-col items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {error && (
        <p className="mb-4 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-4 py-2 rounded-full">
          ⚠️ {error}
        </p>
      )}

      <h2
        className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight text-center px-4"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Take a Quick Look
      </h2>

      {/* Carousel */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: wrapperHeight[screen] }}
      >
        <div className="relative" style={{ width: w, height: h }}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 border-[3px] border-black/15 border-t-black/50 rounded-full animate-spin" />
            </div>
          ) : (
            products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                current={current}
                total={products.length}
                onSelect={handleSelect}
                screen={screen}
              />
            ))
          )}
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
    </div>
  );
}