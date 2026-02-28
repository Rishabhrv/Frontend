"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Tag, ShoppingBag, BookOpen, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Coupon = {
  id: number;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_discount: number | null;
  min_cart_value: number;
  applicable_on: "all" | "product" | "category";
  product_type: "all" | "ebook" | "physical";
  expiry_date: string;
  usable: boolean;
  user_used: number;
  usage_per_user: number | null;
  scope_items: string[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysLeft(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function discountLabel(c: Coupon): string {
  if (c.discount_type === "percent") {
    return `${c.discount_value}% OFF`;
  }
  return `₹${c.discount_value} OFF`;
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer
        ${copied
          ? "bg-emerald-500 text-white"
          : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
    >
      {copied ? <><Check size={11} /> COPIED</> : <><Copy size={11} /> COPY</>}
    </button>
  );
}

// ─── Coupon Card ─────────────────────────────────────────────────────────────
function CouponCard({ coupon }: { coupon: Coupon }) {
  const days   = daysLeft(coupon.expiry_date);
  const urgent = days <= 3;

  const productIcon = coupon.product_type === "ebook"
    ? <BookOpen size={11} />
    : <ShoppingBag size={11} />;

  const scopeLabel =
    coupon.applicable_on === "all"      ? "All products"
    : coupon.applicable_on === "product"  ? "Selected products"
    : coupon.applicable_on === "category" ? "Selected categories"
    : "All products";

  return (
    <div
      className={`relative flex flex-col sm:flex-row rounded-2xl overflow-hidden border transition-all duration-300
        ${coupon.usable
          ? "bg-white border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          : "bg-gray-50 border-gray-100 opacity-60"
        }`}
    >
      {/* ── LEFT: Discount badge ── */}
      <div
        className={`flex-shrink-0 flex flex-col items-center justify-center px-7 py-6 sm:w-36
          ${coupon.usable ? "bg-gray-900" : "bg-gray-300"}`}
      >
        <span
          className="text-2xl font-black text-white leading-none tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {coupon.discount_type === "percent"
            ? `${coupon.discount_value}%`
            : `₹${coupon.discount_value}`}
        </span>
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
          {coupon.discount_type === "percent" ? "percent off" : "flat off"}
        </span>

        {/* Serrated edge (decorative) */}
        <div className="hidden sm:block absolute left-[136px] top-0 bottom-0 w-0 border-l-2 border-dashed border-gray-200 z-10" />
      </div>

      {/* ── RIGHT: Details ── */}
      <div className="flex-1 px-5 py-5 flex flex-col justify-between gap-3">

        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            {/* Code */}
            <div className="flex items-center gap-2 mb-1.5">
              <Tag size={13} className="text-gray-400" />
              <span className="text-base font-black text-gray-900 tracking-widest">
                {coupon.code}
              </span>
              {!coupon.usable && (
                <span className="text-[9px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Used
                </span>
              )}
            </div>

            {/* Discount summary */}
            <p className="text-xs text-gray-500 leading-relaxed">
              {coupon.discount_type === "percent" && coupon.max_discount
                ? `Up to ₹${coupon.max_discount} off`
                : discountLabel(coupon)
              }
              {coupon.min_cart_value > 0 && (
                <span className="text-gray-400"> · Min. cart ₹{coupon.min_cart_value}</span>
              )}
            </p>
          </div>

          {coupon.usable && <CopyButton code={coupon.code} />}
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5">

          {/* Product type */}
          {coupon.product_type !== "all" && (
            <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              {productIcon}
              {coupon.product_type === "ebook" ? "eBooks only" : "Physical only"}
            </span>
          )}

          {/* Scope */}
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <ShoppingBag size={10} /> {scopeLabel}
          </span>

          {/* Scope items */}
          {coupon.scope_items.slice(0, 2).map((item, i) => (
            <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2.5 py-1 rounded-full">
              {item}
            </span>
          ))}
          {coupon.scope_items.length > 2 && (
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-2.5 py-1 rounded-full">
              +{coupon.scope_items.length - 2} more
            </span>
          )}
        </div>

        {/* Bottom row: expiry + usage */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium
            ${urgent ? "text-red-500" : "text-gray-400"}`}>
            <Clock size={11} />
            {days === 0 ? "Expires today" : `${days} day${days !== 1 ? "s" : ""} left`}
          </span>

          {coupon.usage_per_user !== null && (
            <span className="text-[11px] text-gray-400">
              Used {coupon.user_used}/{coupon.usage_per_user}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="w-36 bg-gray-200" />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CouponsPage() {
  const [coupons, setCoupons]   = useState<Coupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "usable" | "used">("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    fetch(`${API_URL}/api/coupons/available`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = coupons.filter(c => {
    if (filter === "usable") return c.usable;
    if (filter === "used")   return !c.usable;
    return true;
  });

  const usableCount = coupons.filter(c => c.usable).length;

  return (
    <div className="min-h-screen">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <div className=" mx-auto p-4 " style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Savings & Offers
          </p>
          <h1
            className="text-4xl font-black text-gray-900 leading-tight mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            My Coupons
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : `${usableCount} coupon${usableCount !== 1 ? "s" : ""} available to use`}
          </p>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 mb-7">
          {(["all", "usable", "used"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all duration-200 cursor-pointer
                ${filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
            >
              {f === "all"    ? `All (${coupons.length})`
               : f === "usable" ? `Available (${usableCount})`
               : `Used (${coupons.length - usableCount})`}
            </button>
          ))}
        </div>

        {/* ── List ── */}
        <div className="space-y-4">
          {loading && [...Array(3)].map((_, i) => <SkeletonCard key={i} />)}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Tag size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No coupons here</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon for new offers</p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-gray-900 underline underline-offset-2 hover:text-amber-700"
              >
                Continue shopping <ChevronRight size={12} />
              </Link>
            </div>
          )}

          {!loading && filtered.map(coupon => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>

        {/* ── How to use ── */}
        {!loading && usableCount > 0 && (
          <div className="mt-10 bg-amber-50 border border-amber-100 rounded-2xl px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
              How to use
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Copy a coupon code and paste it in the <strong>Have a coupon?</strong> field at checkout. Discounts are applied automatically.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}