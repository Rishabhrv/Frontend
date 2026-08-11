"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Star, CircleCheck, Share2, Copy, Check, X, Quote } from "lucide-react";
import ReviewSection from "@/components/reviews/ReviewSection";
import CategoryBookSection from "@/components/books/CategoryBookSection";
import Link from "next/link";
import NotifyMeButton from "../notification/NotifyMeButton";
import BottomBannerAd from "../ads/BottomBannerAd";
import PopupAd from "../ads/PopupAd";
import { useRouter, usePathname } from "next/navigation";
import {
  addToGuestCart,
  isInGuestWishlist,
  toggleGuestWishlist,
} from "@/utils/guestStorage"; // ← add this
import ProductSectionsRenderer from "./ProductSectionsRenderer";
import ProductMetaPixel from "./ProductMetaPixel";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Attribute = { name: string; value: string };
type GalleryImage = { image_path: string };
type Subject = { id: number; name: string; slug: string };
type Author = { id: number; name: string; image: string | null; bio?: string | null; slug: string };
type Category = { id: number; name: string; slug: string; imprint: string };

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  sell_price: number;
  stock: number;
  product_type: "ebook" | "physical" | "both";
  main_image: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  ebook_price?: number;
  ebook_sell_price?: number;
  authors: Author[];
  attributes: Attribute[];
  gallery: GalleryImage[];
  categories: Category[];
  subjects?: Subject[];
  sections?: any[];
  pixel_ids?: string[];
  active_sale?: {
    id: number;
    name: string;
    discount_type: string;
    discount_value: number;
    end_date: string;
    timer_duration_hours?: number;
  };
  original_sell_price?: number;
  original_ebook_sell_price?: number;
};

/* ─── Independence Day flourishes — only rendered on /even-after-you ───────
   NOTE: relies on the .animate-flagWave and .animate-chakraSpin keyframes
   already added to globals.css for the site Header. If those aren't in
   globals.css yet, add them (see bottom of this message). ────────────────── */
function IndianFlagWaving({ className = "h-9 w-14" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-500/70 rounded-full" />
      <div className="absolute -left-[2px] -top-[2px] h-[6px] w-[6px] rounded-full bg-gray-500/70" />
      <svg
        viewBox="0 0 30 20"
        className="absolute left-[3px] top-0 h-full w-[calc(100%-3px)] animate-flagWave drop-shadow-sm"
        style={{ transformOrigin: "left center" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="30" height="20" fill="#F5F5F5" />
        <rect width="30" height="6.67" fill="#FF9933" />
        <rect y="13.33" width="30" height="6.67" fill="#138808" />
        <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.3" />
        <circle cx="15" cy="10" r="0.4" fill="#000080" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="15" y1="10"
            x2={15 + 2.6 * Math.cos((i * 15 * Math.PI) / 180)}
            y2={10 + 2.6 * Math.sin((i * 15 * Math.PI) / 180)}
            stroke="#000080"
            strokeWidth="0.15"
          />
        ))}
      </svg>
    </div>
  );
}

/* ─── Share dropdown ─────────────────────────────────────────────────────── */
function ShareButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const url = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  };

  const shareLinks = [
    {
      label: "WhatsApp",
      color: "#25D366",
      href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: "X (Twitter)",
      color: "#000000",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-50 transition-colors"
        aria-label="Share"
      >
        <Share2 size={20} className="text-gray-600" />
      </button>

      {open && (
        <div className="absolute top-11 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 w-52 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Share</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <div className="p-2">
            {shareLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                >
                  {s.icon}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{s.label}</span>
              </a>
            ))}
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
            >
              <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-600" />}
              </span>
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {copied ? "Copied!" : "Copy link"}
              </span>
            </button>
          </div>
        </div>
      )
      }
    </div >
  );
}

/* ─── Flip digit tile ────────────────────────────────────────────────────── */
function FlipUnit({ value, label }: { value: number; label: string }) {
  const [current, setCurrent] = useState(value);
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== current) {
      setPrev(current);
      setFlipping(true);
      const t = setTimeout(() => {
        setCurrent(value);
        setFlipping(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [value, current]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14 sm:w-16 sm:h-16" style={{ perspective: "300px" }}>
        {/* base tile — settled value */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white rounded-lg shadow-md">
          <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums">
            {String(flipping ? prev : current).padStart(2, "0")}
          </span>
        </div>

        {/* flipping face — drops in the new value */}
        {flipping && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white rounded-lg shadow-md flip-face">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums">
              {String(value).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* mid divider */}
      </div>
      <span className="text-[10px] sm:text-xs text-gray-500 tracking-wide">{label}</span>
    </div>
  );
}


/* ─── Countdown Timer ────────────────────────────────────────────────────── */
function SaleCountdown({ endDate, saleId, timerDurationHours, saleName }: { endDate: string; saleId?: number; timerDurationHours?: number; saleName?: string }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let finalEndTime = new Date(endDate).getTime();

    if (timerDurationHours && saleId) {
      const storageKey = `sale_timer_${saleId}`;
      const storedTime = localStorage.getItem(storageKey);
      if (storedTime) {
        finalEndTime = parseInt(storedTime, 10);
      } else {
        finalEndTime = new Date().getTime() + timerDurationHours * 60 * 60 * 1000;
        localStorage.setItem(storageKey, finalEndTime.toString());
      }

      const globalEndTime = new Date(endDate).getTime();
      if (finalEndTime > globalEndTime) {
        finalEndTime = globalEndTime;
      }
    }

    const calculateTimeLeft = () => {
      let diff = finalEndTime - new Date().getTime();
      if (diff <= 0) {
        // Restart timer
        const duration = timerDurationHours ? timerDurationHours * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        finalEndTime = new Date().getTime() + duration;
        if (saleId) {
          localStorage.setItem(`sale_timer_${saleId}`, finalEndTime.toString());
        }
        diff = finalEndTime - new Date().getTime();
      }
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, saleId, timerDurationHours]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const d = Math.floor(timeLeft / (3600 * 24));
  const h = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  const units = [
    { value: d, label: "days" },
    { value: h, label: "hrs" },
    { value: m, label: "mins" },
    { value: s, label: "secs" },
  ];
  return (
    <div className="flex flex-col items-center gap-3 bg-white  py-4 px-1 w-full max-w-xs my-1">
      <style jsx global>{`
        @keyframes flipCardReveal {
          0% { transform: rotateX(90deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        .flip-face {
          animation: flipCardReveal 0.5s ease-out;
          transform-origin: top center;
          backface-visibility: hidden;
        }
      `}</style>

      <span className="text-sm sm:text-base font-bold text-red-600 uppercase tracking-wide text-center">
        {saleName || "Limited Time Offer"}
      </span>
      <span className="text-xs sm:text-sm font-medium text-gray-500">Offer ends in</span>
      <div className="flex items-center gap-2 sm:gap-3">
        {units.map((u) => (
          <FlipUnit key={u.label} value={u.value} label={u.label} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function SingleProductPage({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  const [activeImage, setActiveImage] = useState(product.main_image);
  const [format, setFormat] = useState<"paperback" | "ebook">(
    product.product_type === "ebook" ? "ebook" : "paperback"
  );
  const [qty, setQty] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [expandedAuthors, setExpandedAuthors] = useState<Record<number, boolean>>({});
  const [stockWarning, setStockWarning] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  // Independence Day props are scoped to this one campaign product only
  const isIndependenceSalePage = pathname?.includes("/even-after-you") ?? false;

  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const mobileThumbnailRef = useRef<HTMLDivElement>(null);

  const allImages = [{ image_path: product.main_image }, ...product.gallery];

  /* ── Review summary ── */
  useEffect(() => {
    fetch(`${API_URL}/api/reviews/product/${product.id}/summary`)
      .then((r) => r.json())
      .then((d) => { setAvgRating(d.average ?? 0); setReviewCount(d.total ?? 0); })
      .catch(() => { });
  }, [product.id]);

  /* ── Auto-cycle images every 5 s ── */
  useEffect(() => {
    if (!product.gallery?.length) return;
    const images = allImages;
    const visibleCount = 5;
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;
      setActiveImage(images[currentIndex].image_path);
      setGalleryIndex((prev) => {
        if (currentIndex >= prev + visibleCount) return currentIndex - visibleCount + 1;
        if (currentIndex < prev) return currentIndex;
        return prev;
      });
      scrollMobileStrip(currentIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [product]);

  /* ── Wishlist initial state: server (logged-in) or localStorage (guest) ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/api/wishlist/check/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setLiked(d.liked));
    } else {
      setLiked(isInGuestWishlist(product.id));
    }
  }, [product.id]);

  // Keep heart in sync when guest wishlist changes elsewhere (e.g. BookCard)
  useEffect(() => {
    const sync = () => {
      if (!localStorage.getItem("token")) setLiked(isInGuestWishlist(product.id));
    };
    window.addEventListener("guest-wishlist-change", sync);
    return () => window.removeEventListener("guest-wishlist-change", sync);
  }, [product.id]);

  /* ── Helpers ── */
  const scrollMobileStrip = (index: number) => {
    if (!mobileThumbnailRef.current) return;
    mobileThumbnailRef.current.scrollTo({
      left: Math.max(0, index * (56 + 8) - (56 + 8)),
      behavior: "smooth",
    });
  };

  const jumpToImage = (index: number) => {
    setActiveImage(allImages[index].image_path);
    setGalleryIndex(Math.max(0, index - 4));
    scrollMobileStrip(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 50) return;
    const currentIndex = allImages.findIndex((img) => img.image_path === activeImage);
    if (diff > 0) jumpToImage(currentIndex < allImages.length - 1 ? currentIndex + 1 : 0);
    else jumpToImage(currentIndex > 0 ? currentIndex - 1 : allImages.length - 1);
  };

  /* ── Toggle wishlist ── */
  const toggleWishlist = async () => {
    const token = localStorage.getItem("token");

    if (token) {
      // Logged-in: sync with server
      await fetch(`${API_URL}/api/wishlist/${product.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiked((v) => !v);
      window.dispatchEvent(new Event("wishlist-change"));
    } else {
      // Guest: persist to localStorage
      const nowLiked = toggleGuestWishlist({
        id: product.id,
        title: product.title,
        slug: product.categories?.[0]?.slug ?? "",  // fallback; slug comes from product page URL
        sell_price: format === "ebook" ? (product.ebook_sell_price ?? product.sell_price) : product.sell_price,
        image: `${API_URL}${product.main_image}`,
        product_type: product.product_type,
        stock: product.stock,
      });
      setLiked(nowLiked);
    }
  };

  /* ── Add to cart ── */
  const addToCart = async () => {
    const token = localStorage.getItem("token");
    const cartFormat = format === "ebook" ? "ebook" : "paperback";
    const cartQty = format === "ebook" ? 1 : qty;
    const cartPrice = format === "ebook"
      ? (product.ebook_sell_price ?? product.sell_price)
      : product.sell_price;

    if (token) {
      // Logged-in: sync with server
      try {
        const res = await fetch(`${API_URL}/api/cart/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ product_id: product.id, format: cartFormat, quantity: cartQty }),
        });
        if (!res.ok) throw new Error("Add to cart failed");
        window.dispatchEvent(new Event("cart-change"));
      } catch (err) { console.error(err); return; }
    } else {
      // Guest: persist to localStorage
      addToGuestCart({
        product_id: product.id,
        format: cartFormat,
        quantity: cartQty,
        title: product.title,
        slug: product.categories?.[0]?.slug ?? "",
        image: `${API_URL}${product.main_image}`,
        price: cartPrice,
        stock: product.stock,
      });
    }

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  /* ── Buy Now ── */
  const handleBuyNow = () => {
    const buyNowFormat = format === "ebook" ? "ebook" : "paperback";
    const buyNowQty = format === "ebook" ? 1 : qty;
    const buyNowPrice = format === "ebook"
      ? (product.ebook_sell_price ?? product.sell_price)
      : product.sell_price;

    const buyNowItem = {
      product_id: product.id,
      format: buyNowFormat,
      quantity: buyNowQty,
      title: product.title,
      slug: product.categories?.[0]?.slug ?? "",
      image: `${API_URL}${product.main_image}`,
      price: buyNowPrice,
      stock: product.stock,
      category_imprints: product.categories?.map(c => c.imprint || "agph").join(",") || "agph",
    };

    sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
    router.push("/checkout?buyNow=true");
  };

  if (!product) return null;

  const paperbackDiscount =
    product.price > product.sell_price
      ? Math.round(((product.price - product.sell_price) / product.price) * 100)
      : 0;

  const ebookDiscount =
    product.ebook_price && product.ebook_sell_price && product.ebook_price > product.ebook_sell_price
      ? Math.round(((product.ebook_price - product.ebook_sell_price) / product.ebook_price) * 100)
      : 0;

  // Strip HTML tags to get an accurate word count for the Read More button logic
  const plainTextDesc = product.description ? product.description.replace(/<[^>]+>/g, '') : "";
  const isLongDescription = plainTextDesc.split(" ").length > 150; // Adjusted threshold

  const getShortBio = (text: string, limit = 100) => {
    const words = text.split(" ");
    return words.length <= limit ? text : words.slice(0, limit).join(" ");
  };

  const isPaperbackOnly = product.product_type === "physical";
  const activeIndex = allImages.findIndex((img) => img.image_path === activeImage);

  const videoSections = product.sections?.filter((s) => s.type === "video" || s.type === "two_video") || [];
  const otherSections = product.sections?.filter((s) => s.type !== "video" && s.type !== "two_video") || [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-8 lg:px-14 xl:px-20 py-4 sm:py-6">
      <ProductMetaPixel
        pixelIds={product.pixel_ids || []}
        product={{
          id: product.id,
          title: product.title,
          price: product.sell_price || product.price,
        }}
      />

      {/* ── BREADCRUMB ── */}
      <nav className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 border-b border-t border-gray-300 py-3 sm:py-4">
        <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <li><Link href="/" className="hover:underline">Home</Link></li>
          {product.categories?.length > 0 && (
            <>
              <li>/</li>
              <li>
                <Link href={`/product-category/${product.categories[0].slug}`} className="hover:underline">
                  {product.categories[0].name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-gray-800 font-medium truncate max-w-[160px] sm:max-w-2xl">{product.title}</li>
        </ol>
      </nav>

      {/* ── TOP SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-14">

        {/* ── LEFT: Images ── */}
        <div>

          <div
            className="relative flex justify-center bg-white rounded-xl p-4 sm:p-6 border border-gray-100 select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sale / Discount Badge */}
            {product.active_sale ? (
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex flex-col items-center justify-center bg-red-600 text-white font-bold rounded-full w-[52px] h-[52px] shadow-md leading-none border-2 border-white">
                {product.active_sale.discount_type === "percent" ? (
                  <>
                    <span className="text-[9px] uppercase tracking-wide mb-0.5">Sale</span>
                    <span className="text-[11px] font-extrabold whitespace-nowrap">
                      {Number(product.active_sale.discount_value)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-wide">Flat</span>
                    <span className="text-[10px] font-extrabold whitespace-nowrap my-0.5">
                      ₹{Number(product.active_sale.discount_value)}
                    </span>
                    <span className="text-[7px] uppercase tracking-wide">Off</span>
                  </>
                )}
              </div>
            ) : (format === "paperback" ? paperbackDiscount : ebookDiscount) > 0 ? (
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex flex-col items-center justify-center bg-[#00C853] text-white font-bold rounded-full w-[52px] h-[52px] shadow-sm leading-none border-2 border-white">
                <span className="text-[13px] font-extrabold mb-0.5">{format === "paperback" ? paperbackDiscount : ebookDiscount}%</span>
                <span className="text-[9px] uppercase tracking-wide">OFF</span>
              </div>
            ) : null}

            <Image
              src={`${API_URL}${activeImage}`}
              alt={product.title}
              width={360} height={520}
              className="object-contain max-h-[320px] sm:max-h-[400px] md:max-h-[480px] w-auto pointer-events-none"
              unoptimized
            />

            {/* Dot indicators — mobile only */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToImage(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "bg-gray-800 w-4" : "bg-gray-300 w-1.5"
                      }`}
                  />
                ))}
              </div>
            )}

            {/* Wishlist + Share */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2">
              <button
                onClick={toggleWishlist}
                className="bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-50 transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={20} className={liked ? "text-red-600 fill-red-600" : "text-gray-600"} />
              </button>
              <ShareButton title={product.title} />
            </div>
          </div>

          {/* Mobile thumbnail strip */}
          {allImages.length > 1 && (
            <div
              ref={mobileThumbnailRef}
              className="mt-3 flex gap-2 overflow-x-auto pb-1 scroll-smooth md:hidden mx-3"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => jumpToImage(i)}
                  className={`border rounded p-0.5 flex-shrink-0 transition-all duration-200 ${i === activeIndex ? "border-red-400 scale-100 shadow-sm" : "border-gray-200"
                    }`}
                >
                  <Image
                    src={`${API_URL}${img.image_path}`}
                    width={56} height={80}
                    className="h-16 w-12 object-cover rounded"
                    unoptimized alt=""
                  />
                </button>
              ))}
            </div>
          )}

          {/* Desktop thumbnail strip */}
          {product.gallery?.length > 0 && (() => {
            const images = allImages;
            const visibleCount = 5;

            return (
              <div className="mt-3 sm:mt-4 hidden md:flex items-center gap-2">
                <div className="overflow-hidden flex-1">
                  <div
                    className="flex gap-3 transition-transform duration-300"
                    style={{ transform: `translateX(-${galleryIndex * 74}px)` }}
                  >
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(img.image_path)}
                        className={`border rounded p-1 flex-shrink-0 transition-all duration-200 ${activeImage === img.image_path
                          ? "border-red-400 scale-100 shadow-sm"
                          : "border-gray-300"
                          }`}
                      >
                        <Image
                          src={`${API_URL}${img.image_path}`}
                          width={60} height={90}
                          className="h-24 w-[70px] object-cover cursor-pointer"
                          unoptimized alt=""
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── RIGHT: Info ── */}
        <div className="flex flex-col px-5 xl:px-1">
          <h1 className="text-xl sm:text-2xl font-serif mb-2 leading-snug">{product.title}</h1>

          {product.authors?.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2">
              by{" "}
              {product.authors.map((a, i) => (
                <span key={a.id}>
                  <Link
                    href={`/author/${a.slug}`}
                    className="font-medium text-gray-800 hover:underline hover:text-black transition-colors"
                  >
                    {a.name}
                  </Link>
                  {i < product.authors.length - 1 && ", "}
                </span>
              ))}
            </p>
          )}

          {/* Stars */}
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => {
                const filled = avgRating >= i;
                const partial = !filled && avgRating > i - 1;
                const fillPercent = partial ? Math.round((avgRating - (i - 1)) * 100) : 0;
                return (
                  <span key={i} className="relative inline-block w-3.5 h-3.5">
                    <Star size={14} className="text-gray-300 absolute inset-0" fill="currentColor" />
                    <span
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: filled ? "100%" : `${fillPercent}%` }}
                    >
                      <Star size={14} className="text-yellow-500" fill="currentColor" />
                    </span>
                  </span>
                );
              })}
            </div>
            {reviewCount > 0 ? (
              <span className="text-xs text-gray-500 ml-1">
                {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            ) : (
              <span className="text-xs text-gray-400 ml-1">No reviews yet</span>
            )}
          </div>

          {/* ── PRICE ── */}
          <div className="mb-5 space-y-3">
            <div className="flex items-center sm:items-end gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-semibold text-green-600">
                ₹{format === "paperback" ? product.sell_price : product.ebook_sell_price}
              </span>
              {format === "paperback" && product.price > product.sell_price && (
                <span className="text-base sm:text-lg line-through text-gray-400">
                  ₹{product.price}
                </span>
              )}
              {format === "ebook" && product.ebook_price && product.ebook_sell_price && product.ebook_price > product.ebook_sell_price && (
                <span className="text-base sm:text-lg line-through text-gray-400">
                  ₹{product.ebook_price}
                </span>
              )}
              {format === "paperback" && (
                <span className="text-xs font-medium text-gray-500 self-end mb-1">
                  + Delivery Charge
                </span>
              )}
            </div>

            {/* Independence Day special-price callout */}
            {isIndependenceSalePage && (
              <div className="flex justify-center items-center gap-2.5 bg-gradient-to-r from-orange-50 via-white to-green-50 border border-orange-200 rounded-lg px-3 py-2">
                <IndianFlagWaving className="h-6 w-9 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#0a1a4d]">
                  Independence Day Special
                </span>
              </div>
            )}

            {product.active_sale && product.active_sale.end_date && (
              <SaleCountdown
                endDate={product.active_sale.end_date}
                saleId={product.active_sale.id}
                timerDurationHours={product.active_sale.timer_duration_hours}
                saleName={product.active_sale.name}
              />
            )}

            <p className="text-[11px] sm:text-xs text-gray-500">
              {format === "paperback"
                ? "Order now for delivery in 6 to 7 days"
                : "Buy now and the eBook will be available instantly in My Books"}
            </p>

            {(() => {
              const itemType = format === "ebook" ? "eBook" : "book";

              if (product.active_sale) {
                if (product.active_sale.discount_type === "flat") {
                  return (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded">
                      <span>Save Flat ₹{Number(product.active_sale.discount_value)} Off on this {itemType}</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded">
                      <span>Save up to {Number(product.active_sale.discount_value)}% Off on this {itemType}</span>
                    </div>
                  );
                }
              } else {
                const discount = format === "ebook" ? ebookDiscount : paperbackDiscount;
                if (discount > 0) {
                  return (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded">
                      <span>Save up to {discount}% Off on this {itemType}</span>
                    </div>
                  );
                }
              }
              return null;
            })()}

            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {product.product_type !== "ebook" && (
                <button
                  onClick={() => setFormat("paperback")}
                  className={`border rounded-md px-3 sm:px-4 py-2.5 sm:py-3 w-36 sm:w-40 text-left cursor-pointer transition-shadow ${format === "paperback" ? "border-black shadow-sm" : "border-gray-300"
                    }`}
                >
                  <p className="text-[11px] sm:text-xs text-gray-500">Paperback</p>
                  <p className="font-semibold text-sm sm:text-base">₹{product.sell_price}</p>
                </button>
              )}
              {product.product_type !== "physical" && (
                <button
                  onClick={() => setFormat("ebook")}
                  className={`border rounded-md px-3 sm:px-4 py-2.5 sm:py-3 w-36 sm:w-40 text-left cursor-pointer transition-shadow ${format === "ebook" ? "border-black shadow-sm" : "border-gray-300"
                    }`}
                >
                  <p className="text-[11px] sm:text-xs text-gray-500">eBook</p>
                  <p className="font-semibold text-sm sm:text-base">₹{product.ebook_sell_price}</p>
                </button>
              )}
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10">
            {format === "paperback" && (product.stock === 0 || stockWarning) && (
              <p className="text-xs text-red-600">
                {product.stock === 0 ? "Out of stock" : `Only ${product.stock} copies available`}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {isPaperbackOnly && product.stock === 0 ? (
                <NotifyMeButton productId={product.id} productTitle={product.title} />
              ) : (
                <>
                  {format === "paperback" && (
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                      <button
                        onClick={() => setQty((q) => (q > 1 ? q - 1 : 1))}
                        className="px-2.5 sm:px-3 py-2 text-lg hover:bg-gray-100 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="px-3 sm:px-4 py-2 min-w-[36px] text-center text-sm sm:text-base">
                        {qty}
                      </span>
                      <button
                        onClick={() => {
                          if (product.stock && qty >= product.stock) { setStockWarning(true); return; }
                          setQty((q) => q + 1);
                          setStockWarning(false);
                        }}
                        className="px-2.5 sm:px-3 py-2 text-lg hover:bg-gray-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={addToCart}
                    disabled={addedToCart || (format === "paperback" && product.stock === 0)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-10 py-3 rounded-md transition cursor-pointer text-sm sm:text-base font-medium ${addedToCart
                      ? "bg-green-600 text-white cursor-default"
                      : "bg-black text-white hover:bg-gray-800"
                      } ${format === "paperback" && product.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {addedToCart ? <><CircleCheck size={16} /> Added</> : <><ShoppingCart size={16} /> Add to Cart</>}
                  </button>
                </>
              )}
            </div>

            {!(isPaperbackOnly && product.stock === 0) && (
              <button
                onClick={handleBuyNow}
                disabled={format === "paperback" && product.stock === 0}
                className={`w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 rounded-md transition cursor-pointer text-sm sm:text-base font-medium border-2 border-black ${format === "paperback" && product.stock === 0 ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "bg-white text-black hover:bg-black hover:text-white"}`}
              >
                Buy Now
              </button>
            )}

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
              {[
                { icon: "/images/icons/quality.png", title: "Premium Quality", sub: "High-grade paper & binding" },
                { icon: "/images/icons/fast_delivery.png", title: "Fast Shipping", sub: "Dispatch in 24–48 hours" },
                { icon: "/images/icons/best_price.png", title: "Best Price", sub: "Direct publisher pricing" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 text-center sm:text-left">
                  <img src={item.icon} alt="" className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium leading-tight">{item.title}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── VIDEO SECTIONS ── */}
      {videoSections.length > 0 && (
        <ProductSectionsRenderer sections={videoSections} className="mt-10 sm:mt-14 px-5 xl:px-1 border-t border-gray-200 " />
      )}

      {/* ── DESCRIPTION ── */}
      <div className="mt-10 sm:mt-10 border-y border-gray-300 py-6 sm:py-8 px-5 xl:px-1">
        <h2 className="text-lg sm:text-xl font-serif font-semibold mb-4">Description</h2>
        <div
          className={`text-gray-700 leading-relaxed text-justify prose max-w-none transition-all duration-300 ${showFullDesc ? "" : "line-clamp-[12] overflow-hidden"
            } [&>p]:mb-4  [&>p]:text-base sm:[&>p]:text-sm [&>p]:leading-relaxed [&>h1]:text-xl [&>h1]:font-serif [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-2 [&>h2]:text-lg [&>h2]:font-serif [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:text-base [&>h3]:font-serif [&>h3]:font-bold [&>h3]:mt-5 [&>h3]:mb-2 [&>strong]:font-semibold [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-4`}
          dangerouslySetInnerHTML={{
            __html: product.description,
          }}
        />
        {isLongDescription && (
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="mt-3 text-sm sm:text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {showFullDesc ? "Read Less" : "Read More"}
          </button>
        )}
      </div>

      {/* ── ATTRIBUTES ── */}
      {product.attributes?.length > 0 && (
        <div className="mt-8 sm:mt-10 px-5 xl:px-1">
          <h2 className="text-lg sm:text-xl font-serif font-semibold mb-2">Product Details</h2>
          <div>
            {product.attributes.map((a, i) => (
              <div key={i} className="py-1.5 text-xs sm:text-sm flex gap-2">
                <span className="font-semibold min-w-[120px] sm:min-w-[160px]">{a.name}:</span>
                <span className="text-gray-500">{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUBJECTS ── */}
      {product.subjects && product.subjects.length > 0 && (
        <div className="py-1.5 text-xs sm:text-sm flex gap-2">
          <span className="font-semibold min-w-[120px] sm:min-w-[160px]">Subjects: </span>
          <span className="text-gray-500">
            {product.subjects.map((subject, i) => (
              <span key={subject.id}>
                {subject.name}{i < product.subjects!.length - 1 && ", "}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* ── SHIPPING ── */}
      {(product.weight || product.length) && (
        <div className="mt-5 border-b border-gray-300 pb-8 sm:pb-10 px-5 xl:px-1 ">
          <h2 className="text-lg sm:text-xl font-serif font-semibold mb-3 sm:mb-4">Shipping Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            {product.weight && <div>Weight: {product.weight} kg</div>}
            {product.length && <div>Length: {product.length} cm</div>}
            {product.width && <div>Width: {product.width} cm</div>}
            {product.height && <div>Height: {product.height} cm</div>}
          </div>
        </div>
      )}

      {/* ── PRODUCT SECTIONS (A+ CONTENT) ── */}
      <ProductSectionsRenderer sections={otherSections} />

      {/* ── AUTHORS ── */}
      {product.authors?.length > 0 && (
        <div className="mt-8 sm:mt-10 px-5 xl:px-1">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">About the Author</h2>
          <div className="space-y-6">
            {product.authors.map((a) => {
              const isLongBio = a.bio && a.bio.split(" ").length > 40;

              return (
                <div key={a.id} className="flex items-start gap-4 sm:gap-6  rounded-lg p-4 sm:p-5 border border-gray-100">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24">
                    <Link href={`/author/${a.slug}`}>
                      <Image
                        src={a.image ? `${API_URL}${a.image}` : `/default-author.png`}
                        width={96} height={96}
                        className="w-13 h-13 sm:w-18 sm:h-18 rounded-full object-cover shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        unoptimized alt={a.name}
                      />
                    </Link>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/author/${a.slug}`}
                      className="font-semibold font-serif text-base sm:text-lg block hover:underline hover:text-blue-600 transition-colors mb-1"
                    >
                      {a.name}
                    </Link>
                    {a.bio && (
                      <div className="relative">
                        <p
                          // 👇 Add whitespace-pre-wrap right here
                          className={`whitespace-pre-wrap text-sm text-gray-600 leading-relaxed break-words text-justify ${expandedAuthors[a.id] ? "" : "line-clamp-3 overflow-hidden"
                            }`}
                        >
                          {a.bio}
                        </p>
                        {isLongBio && (
                          <button
                            onClick={() => setExpandedAuthors((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                            className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {expandedAuthors[a.id] ? "Read less" : "Read more"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REVIEWS ── */}
      {isIndependenceSalePage ? (
        <div className="mt-10 px-5 xl:px-1 border-t border-gray-200 pt-8">
          {/* Section header + aggregate rating */}
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-2xl font-bold font-serif text-gray-900 tracking-tight">Customer Reviews</h2>
            <span className="text-sm text-gray-400 mt-0.5">(4)</span>
          </div>

          {/* Summary + breakdown */}
          <div className="flex flex-col sm:flex-row gap-8 mb-10">
            {/* Big avg */}
            <div className="flex flex-col items-center justify-center sm:border-r-2 sm:border-yellow-400 sm:pr-8 shrink-0">
              <span className="text-[3.5rem] font-black text-slate-900 leading-none">4.8</span>
              <div className="mt-3 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-[13px] text-gray-500 mt-2">4 reviews</span>
            </div>

            {/* Bars */}
            <div className="flex-1 flex flex-col justify-center gap-3">
              {[
                { star: 5, count: 1 },
                { star: 4, count: 3 },
                { star: 3, count: 0 },
                { star: 2, count: 0 },
                { star: 1, count: 0 },
              ].map(({ star, count }) => {
                const pct = Math.round((count / 4) * 100);
                return (
                  <div key={star} className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1 w-6 shrink-0 justify-end">
                      <span>{star}</span>
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-4 text-right shrink-0 text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review cards */}
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                name: "Priya Sharma",
                rating: "4.8",
                quote: "I honestly didn't expect this book to affect me this much. The emotions felt very real, especially the parts about love, loss and moving on.",
                fullStars: 4,
                lastStarOpacity: "opacity-80",
                date: "15 Jun 2026",
                image: "/images/reviewusers/portrait-pretty-indian-woman-wearing-260nw-2804152407.webp",
              },
              {
                name: "Smita Tiwari",
                rating: "4.7",
                quote: "A beautiful and emotional read. There were a few moments where I had to put the book down and just take it in. Definitely stayed with me.",
                fullStars: 4,
                lastStarOpacity: "opacity-80",
                date: "02 Jul 2026",
                image: "/images/reviewusers/istockphoto-854681422-170667a.jpg",
              },
              {
                name: "Meera Prakash",
                rating: "5",
                quote: "What I loved most was how the story talks about grief without making it feel heavy all the time. It left me with a sense of hope by the end.",
                fullStars: 5,
                lastStarOpacity: null,
                date: "08 Aug 2026",
                image: "/images/reviewusers/images (48).jpg",
              },
              {
                name: "Arjun Verma",
                rating: "4.6",
                quote: "A simple but touching story. It made me think about how much we take our loved ones and their presence for granted. Worth reading.",
                fullStars: 4,
                lastStarOpacity: "opacity-50",
                date: "11 Aug 2026",
                image: "/images/reviewusers/images (49).jpg",
              },
            ].map((review) => {
              return (
                <div
                  key={review.name}
                  className="bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all rounded-2xl p-5"
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                      <img src={review.image} alt={review.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{review.name}</span>
                        <time className="text-xs text-gray-400 shrink-0">
                          {review.date}
                        </time>
                      </div>
                      <div className="mt-0.5 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i <= review.fullStars
                                ? "fill-amber-400 text-amber-400"
                                : review.lastStarOpacity && i === review.fullStars + 1
                                  ? `fill-amber-400 text-amber-400 ${review.lastStarOpacity}`
                                  : "fill-gray-200 text-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-gray-600 leading-relaxed pl-12">{review.quote}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        product && <ReviewSection productId={product.id} />
      )}

      <BottomBannerAd pageType="product" />
      <PopupAd pageType="product" />

      {/* ── RELATED BOOKS ── */}
      {product.categories?.length > 0 && (
        <CategoryBookSection
          title={product.categories[0].name}
          categorySlug={product.categories[0].slug}
          visibleCount={4}
        />
      )}
    </div>
  );
}