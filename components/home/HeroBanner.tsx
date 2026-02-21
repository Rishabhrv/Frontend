"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const AUTO_INTERVAL_MS = 2500; // slide every 2.5 s

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  image: string | null;
  sku: string;
  stock: number;
  price: number;
  sell_price: number;
  status: string;
  date: string;
  categories: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_COLORS = [
  "bg-gray-300","bg-gray-300","bg-gray-300","bg-gray-300",
  "bg-gray-300","bg-gray-300","bg-gray-300","bg-gray-300",
];

const CARD_SHADOWS = [
  "shadow-gray-300","shadow-gray-300","shadow-gray-300","shadow-gray-300",
  "shadow-gray-300","shadow-gray-300","shadow-gray-300","shadow-gray-300",
];

const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: "Luxora",    price: 2200, sell_price: 1980, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80", sku: "LUX-01", stock: 10, status: "active", date: "", categories: ["Handbags"] },
  { id: 2, name: "Grandeur",  price: 3200, sell_price: 2900, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80", sku: "GRN-02", stock:  5, status: "active", date: "", categories: ["Handbags"] },
  { id: 3, name: "Prestigio", price: 4500, sell_price: 4500, image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80", sku: "PRE-03", stock:  3, status: "active", date: "", categories: ["Luxury"]  },
  { id: 4, name: "Auron",     price: 3500, sell_price: 3200, image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80", sku: "AUR-04", stock:  8, status: "active", date: "", categories: ["Handbags"] },
  { id: 5, name: "Noir",      price: 2200, sell_price: 2200, image: "https://images.unsplash.com/photo-1601924357840-3e50ad4dd9a5?w=400&q=80", sku: "NOR-05", stock: 12, status: "active", date: "", categories: ["Classic"] },
  { id: 6, name: "Velara",    price: 2800, sell_price: 2600, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80", sku: "VEL-06", stock:  6, status: "active", date: "", categories: ["Handbags"] },
  { id: 7, name: "Solenne",   price: 3900, sell_price: 3500, image: "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=400&q=80", sku: "SOL-07", stock:  4, status: "active", date: "", categories: ["Luxury"]  },
];

// ─── Position config — 7 visible slots ───────────────────────────────────────
type PosKey =
  | "far-far-left" | "far-left" | "left" | "center"
  | "right" | "far-right" | "far-far-right"
  | "hidden-l" | "hidden-r";

const posStyles: Record<PosKey, string> = {
  "far-far-left":  "-translate-x-[490px] scale-[0.62] rotate-[-10deg] opacity-50 z-[1]  brightness-75",
  "far-left":      "-translate-x-[330px] scale-[0.74] rotate-[-6deg]  opacity-65 z-[2]  brightness-85",
  "left":          "-translate-x-[185px] scale-[0.87] rotate-[-3deg]  opacity-82 z-[3]  brightness-95",
  "center":        "translate-x-0        scale-[1]    rotate-0        opacity-100 z-[6] brightness-100",
  "right":         "translate-x-[185px]  scale-[0.87] rotate-[3deg]   opacity-82 z-[3]  brightness-95",
  "far-right":     "translate-x-[330px]  scale-[0.74] rotate-[6deg]   opacity-65 z-[2]  brightness-85",
  "far-far-right": "translate-x-[490px]  scale-[0.62] rotate-[10deg]  opacity-50 z-[1]  brightness-75",
  "hidden-l":      "-translate-x-[660px] scale-[0.5]  opacity-0       z-[0]  pointer-events-none",
  "hidden-r":      "translate-x-[660px]  scale-[0.5]  opacity-0       z-[0]  pointer-events-none",
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
}

const ProductCard = ({ product, index, current, total, onSelect }: CardProps) => {
  const pos      = getPos(index, current, total);
  const color    = CARD_COLORS[index % CARD_COLORS.length];
  const shadow   = CARD_SHADOWS[index % CARD_SHADOWS.length];
  const isCenter = pos === "center";
  const displayPrice = product.sell_price || product.price;
  const [imgError, setImgError] = useState(false);

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${API_BASE}${product.image.startsWith("/") ? "" : "/"}${product.image}`
    : null;

  return (
    <div
      onClick={() => { if (!isCenter) onSelect(index); }}
      className={`
        absolute w-[260px] h-[380px] rounded-[22px] p-5 flex flex-col justify-end
        cursor-pointer select-none overflow-hidden
        shadow-2xl ${shadow} ${color}
        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${posStyles[pos]}
        ${isCenter ? "ring-4 ring-white/30" : ""}
      `}
      style={{ position: "absolute" }}
    >
      {/* Product image */}
      <div className="absolute inset-0 bottom-[88px] flex items-center justify-center">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className={`w-3/4 h-3/4 object-contain drop-shadow-2xl transition-transform duration-300 ${isCenter ? "hover:scale-105 hover:-translate-y-2" : ""}`}
          />
        ) : (
          <div className="w-3/4 h-3/4 flex items-center justify-center opacity-40">
            <svg viewBox="0 0 24 24" className="w-24 h-24 fill-white">
              <path d="M20 7h-3.5l-1-2h-7l-1 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-8 10a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="relative z-10">
        <p
          className="font-black uppercase tracking-widest text-gray-800 text-xs mb-3 mt-5"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {product.name}
        </p>
        <span className="text-gray-800 font-bold text-sm whitespace-nowrap">
          ₹{Number(displayPrice).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [current, setCurrent]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch products ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=10`);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        const data: Product[] = await res.json();
        const sliced = data.slice(0, 10);
        setProducts(sliced.length ? sliced : FALLBACK_PRODUCTS);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Could not reach the server — showing demo data.");
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Auto-advance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (products.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % products.length);
    }, AUTO_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [products.length]);

  // Reset timer when user manually picks a card
  const handleSelect = (index: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrent(index);
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % products.length);
    }, AUTO_INTERVAL_MS);
  };

  // Touch swipe (keep for mobile)
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) handleSelect((current + (dx < 0 ? 1 : -1) + products.length) % products.length);
  };

  return (
    <div
      className="min-h-screen bg-gray-100 flex flex-col items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Error banner */}
      {error && (
        <p className="mb-4 text-xs text-amber-700 bg-amber-100 border border-amber-200 px-4 py-2 rounded-full">
          ⚠️ {error}
        </p>
      )}
        <h2
          className="text-3xl md:text-4xl font-black text-gray-900 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Take a Quick Look
        </h2>

      {/* Carousel */}
      <div className="relative w-full h-[480px] flex items-center justify-center">
        <div className="relative w-[260px] h-[380px]">
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
              />
            ))
          )}
        </div>
      </div>

      {/* Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
    </div>
  );
}