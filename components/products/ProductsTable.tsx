"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";

/* ---------------- TYPES ---------------- */

type Product = {
  id: number;
  name: string;
  image: string;
  sku: string;
  stock: number;
  price: string;
  categories: string[];
  date: string;
  status: "published" | "draft" | "trash";
  slug: string;
  description: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ═══════════════════════════════════════════════════════════════
   SHARED SCORE LOGIC
   ═══════════════════════════════════════════════════════════════ */

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

function calcSeoScore(p: Product): number {
  const kp    = (p.keywords.split(",")[0] || "").toLowerCase().trim();
  const kp2   = (p.keywords.split(",")[1] || "").toLowerCase().trim();
  const plain = stripHtml(p.description);
  const words = countWords(plain);

  const titleLower = (p.meta_title || p.name).toLowerCase();
  const descLower  = p.meta_description.toLowerCase();
  const slugLower  = p.slug.toLowerCase();
  const bodyLower  = plain.toLowerCase();

  const h1Count    = (p.description.match(/<h1[\s>]/gi) || []).length;
  const h2h3WithKp = kp
    ? (p.description.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [])
        .filter(h => h.toLowerCase().includes(kp)).length
    : 0;

  const safeRe     = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const kpCount    = kp  ? (plain.toLowerCase().match(new RegExp(safeRe(kp),  "gi")) || []).length : 0;
  const kp2Count   = kp2 ? (plain.toLowerCase().match(new RegExp(safeRe(kp2), "gi")) || []).length : 0;
  const density    = words > 0 ? (kpCount  / words) * 100 : 0;
  const kp2density = words > 0 ? (kp2Count / words) * 100 : 0;

  const checks = [
    true, true, true, true,
    kp ? bodyLower.slice(0, 200).includes(kp) : false,
    kp ? (density >= 0.5 && density <= 3) || (kp2density >= 0.5 && kp2density <= 3) : false,
    kp ? titleLower.includes(kp) : false,
    kp ? kp.split(/\s+/).length <= 4 : true,
    kp ? descLower.includes(kp) : false,
    p.meta_description.length >= 120 && p.meta_description.length <= 160,
    true,
    h1Count <= 1,
    kp ? slugLower.includes(kp.replace(/\s+/g, "-")) || slugLower.includes(kp) : false,
    kp ? h2h3WithKp >= 1 : false,
    true,
    words >= 300,
    (p.meta_title || p.name).length >= 30 && (p.meta_title || p.name).length <= 70,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function calcReadabilityScore(description: string): number {
  const plain     = stripHtml(description);
  const words     = countWords(plain);
  const sentences = plain.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 3);
  const sentenceCount = sentences.length;

  const passiveRx   = /\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+(en|wn|t))\b/gi;
  const passiveRate = sentenceCount > 0
    ? (sentences.filter(s => passiveRx.test(s)).length / sentenceCount) * 100 : 0;

  const paragraphs = description
    .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\n+/i)
    .map(p => stripHtml(p).trim()).filter(p => p.length > 0);
  const longParas  = paragraphs.filter(p => countWords(p) > 150).length;

  const longRate = sentenceCount > 0
    ? (sentences.filter(s => countWords(s) > 20).length / sentenceCount) * 100 : 0;

  const beginnings = sentences.map(s => {
    const w = s.trim().split(/\s+/);
    return w.find(w => w.length > 2)?.toLowerCase() || "";
  });
  let consecutiveCount = 0;
  for (let i = 1; i < beginnings.length; i++) {
    if (beginnings[i] && beginnings[i - 1] && beginnings[i].length > 2 && beginnings[i] === beginnings[i - 1])
      consecutiveCount++;
  }

  const h2h3Count    = (description.match(/<h[23][\s>]/gi) || []).length;
  const subheadingOk = h2h3Count >= 1 || words < 300;

  const transitionWords = [
    "however","therefore","furthermore","moreover","consequently","additionally",
    "nevertheless","meanwhile","thus","hence","subsequently","accordingly",
    "although","because","since","while","whereas","unless","despite","besides",
    "instead","otherwise","similarly","likewise","first","second","third",
    "finally","in conclusion","in summary","for example","for instance",
    "in addition","as a result","on the other hand","in contrast","in fact",
  ];
  const transitionRate = sentenceCount > 0
    ? (sentences.filter(s => transitionWords.some(tw => s.toLowerCase().includes(tw))).length / sentenceCount) * 100
    : 0;

  const checks = [
    passiveRate < 10, longParas === 0, longRate < 25,
    consecutiveCount === 0, subheadingOk, transitionRate >= 30, words > 50,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function scoreColorClass(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-orange-400";
  return "bg-red-500";
}

function ScoreDot({ score, label }: { score: number; label: string }) {
  const [show, setShow] = useState(false);
  const rating = score >= 70 ? "Good" : score >= 40 ? "Needs improvement" : "Poor";
  return (
    <div className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className={`w-3 h-3 rounded-full cursor-pointer ${scoreColorClass(score)}`} />
      {show && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap
          rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-lg pointer-events-none">
          {label}: {score}% — {rating}
        </div>
      )}
    </div>
  );
}

function SeoCell({ product }: { product: Product }) {
  const seo  = useMemo(() => calcSeoScore(product), [product]);
  const read = useMemo(() => calcReadabilityScore(product.description), [product.description]);
  return (
    <div className="flex items-center gap-5 justify-center">
      <ScoreDot score={seo}  label="SEO" />
      <ScoreDot score={read} label="Readability" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function ProductsTable() {
  const [search,      setSearch]      = useState("");
  const [bulkAction,  setBulkAction]  = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState<number | "">("");  // ← NEW
  const [category,    setCategory]    = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [activeTab,   setActiveTab]   = useState<"all" | "published" | "draft" | "trash">("published");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<{ key: keyof Product | null; direction: "asc" | "desc" }>({
    key: null, direction: "asc",
  });

  const [products,       setProducts]       = useState<Product[]>([]);
  const [allCategories,  setAllCategories]  = useState<{ id: number; name: string }[]>([]);  // ← changed to objects
  const [loading,        setLoading]        = useState(true);
  const [selectedIds,    setSelectedIds]    = useState<number[]>([]);
  const [toastOpen,      setToastOpen]      = useState(false);
  const [toastMsg,       setToastMsg]       = useState("");
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [confirmConfig,  setConfirmConfig]  = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const toast = (msg: string) => { setToastMsg(msg); setToastOpen(true); };

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.map((p: any) => ({
          ...p,
          status:           p.status.toLowerCase(),
          meta_title:       p.meta_title       || "",
          meta_description: p.meta_description || "",
          keywords:         p.keywords         || "",
          description:      p.description      || "",
          slug:             p.slug             || "",
        })));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => setAllCategories(data.map((c: any) => ({ id: c.id, name: c.name }))));
  }, []);

  /* ---------------- FILTER + SORT ---------------- */

  const filteredProducts = useMemo(() => {
    let data = products.filter(p => {
      if (activeTab !== "all" && p.status !== activeTab) return false;
      if (search      && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category    && !p.categories.includes(category)) return false;
      if (stockFilter === "instock"    && p.stock <= 0) return false;
      if (stockFilter === "outofstock" && p.stock >  0) return false;
      return true;
    });

    const key = sortBy.key;
    if (key) {
      data = [...data].sort((a, b) => {
        const av = a[key], bv = b[key];
        if (key === "price") {
          const an = Number(String(av).replace(/[₹,]/g, ""));
          const bn = Number(String(bv).replace(/[₹,]/g, ""));
          return sortBy.direction === "asc" ? an - bn : bn - an;
        }
        if (key === "date") {
          const at = new Date(String(av)).getTime();
          const bt = new Date(String(bv)).getTime();
          return sortBy.direction === "asc" ? at - bt : bt - at;
        }
        if (typeof av === "number" && typeof bv === "number")
          return sortBy.direction === "asc" ? av - bv : bv - av;
        return sortBy.direction === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return data;
  }, [products, search, category, stockFilter, activeTab, sortBy]);

  const totalPages        = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage, currentPage * rowsPerPage
  );

  const handleSort = (key: keyof Product) =>
    setSortBy(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const count = {
    all:       products.length,
    published: products.filter(p => p.status === "published").length,
    draft:     products.filter(p => p.status === "draft").length,
    trash:     products.filter(p => p.status === "trash").length,
  };

  function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
    return <span className="ml-1 text-xs">{active ? (direction === "asc" ? "▲" : "▼") : " "}</span>;
  }

  /* ---------------- DELETE / BULK ---------------- */

  const handleDelete = (id: number, status: string) => {
    if (status !== "trash") {
      setConfirmConfig({
        title: "Move product to Trash?",
        message: "This product will be moved to Trash. You can restore it later.",
        onConfirm: async () => {
          const res = await fetch(`${API_URL}/api/products/${id}/trash`, { method: "PUT" });
          if (!res.ok) { toast("Failed to move product to trash"); return; }
          setProducts(prev => prev.map(p => p.id === id ? { ...p, status: "trash" } : p));
        },
      });
    } else {
      setConfirmConfig({
        title: "Delete product permanently?",
        message: "This product will be permanently deleted. This action cannot be undone.",
        onConfirm: async () => {
          const res = await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE" });
          if (!res.ok) { toast("Permanent delete failed"); return; }
          setProducts(prev => prev.filter(p => p.id !== id));
        },
      });
    }
    setConfirmOpen(true);
  };

  /* ── BULK APPLY ── */
  const handleBulkApply = async () => {
    if (!bulkAction)         { toast("Please select a bulk action");        return; }
    if (!selectedIds.length) { toast("Please select at least one product"); return; }

    /* ── Change Category ── */
    if (bulkAction === "change_category") {
      if (!bulkCategoryId) { toast("Please select a category"); return; }

      setConfirmConfig({
        title:   "Change category for selected products?",
        message: `This will replace the current categories of ${selectedIds.length} product(s) with the selected one.`,
        onConfirm: async () => {
          const res = await fetch(`${API_URL}/api/products/bulk-category`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ ids: selectedIds, categoryId: bulkCategoryId }),
          });
          if (!res.ok) { toast("Bulk category update failed"); return; }

          // Update local state — replace categories with the chosen one's name
          const chosenName = allCategories.find(c => c.id === bulkCategoryId)?.name || "";
          setProducts(prev =>
            prev.map(p => selectedIds.includes(p.id) ? { ...p, categories: [chosenName] } : p)
          );
          setSelectedIds([]);
          setBulkAction("");
          setBulkCategoryId("");
          toast("Categories updated successfully.");
        },
      });
      setConfirmOpen(true);
      return;
    }

    /* ── Existing bulk actions ── */
    if (bulkAction === "published" || bulkAction === "draft") {
      const res = await fetch(`${API_URL}/api/products/bulk-status`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ids: selectedIds, status: bulkAction }),
      });
      if (!res.ok) { toast("Bulk update failed"); return; }
      setProducts(prev => prev.map(p =>
        selectedIds.includes(p.id) ? { ...p, status: bulkAction as any } : p
      ));
      setSelectedIds([]);
    }

    if (bulkAction === "delete") {
      setConfirmConfig({
        title: "Move to Trash?", message: "Selected products will be moved to Trash.",
        onConfirm: async () => {
          const res = await fetch(`${API_URL}/api/products/bulk-status`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ ids: selectedIds, status: "trash" }),
          });
          if (!res.ok) { toast("Bulk trash failed"); return; }
          setProducts(prev => prev.map(p =>
            selectedIds.includes(p.id) ? { ...p, status: "trash" } : p
          ));
          setSelectedIds([]);
          setBulkAction("");
        },
      });
      setConfirmOpen(true);
      return;
    }

    setBulkAction("");
    setBulkCategoryId("");
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="bg-white p-6">

      {/* HEADER */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link href="AddProduct" className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm text-white">
          Add new product
        </Link>
      </div>

      {/* STATUS TABS */}
      <div className="mb-4 text-sm text-gray-600 space-x-2">
        {(["all", "published", "draft", "trash"] as const).map(tab => (
          <React.Fragment key={tab}>
            <button onClick={() => setActiveTab(tab)} className={activeTab === tab ? "font-medium text-blue-600" : ""}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count[tab]})
            </button>
            <span>|</span>
          </React.Fragment>
        ))}
      </div>

      {/* FILTER ROW */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">

          {/* Bulk action selector */}
          <select
            value={bulkAction}
            onChange={e => { setBulkAction(e.target.value); setBulkCategoryId(""); }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">Bulk actions</option>
            <option value="published">Move to Published</option>
            <option value="draft">Move to Draft</option>
            <option value="delete">Move to Trash</option>
            <option value="change_category">Change Category</option>
          </select>

          {/* ── Category picker — only shown when "Change Category" is selected ── */}
          {bulkAction === "change_category" && (
            <select
              value={bulkCategoryId}
              onChange={e => setBulkCategoryId(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
            >
              <option value="">Select category…</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleBulkApply}
            disabled={
              !bulkAction || !selectedIds.length ||
              (bulkAction === "change_category" && !bulkCategoryId)
            }
            className="rounded px-3 py-1 text-sm shadow-lg disabled:opacity-50 bg-[#e7f2ff] text-[#385dfc] cursor-pointer"
          >
            Apply
          </button>

          {/* Filter dropdowns */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded border px-2 py-1 text-sm border-gray-300"
          >
            <option value="">All categories</option>
            {allCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>

          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="rounded border px-2 py-1 text-sm border-gray-300">
            <option value="">Filter by stock</option>
            <option value="instock">In stock</option>
            <option value="outofstock">Out of stock</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search products" value={search}
            onChange={e => setSearch(e.target.value)} className="rounded border border-gray-300 px-3 py-1 text-sm" />
          <button className="rounded px-3 p-2 text-xs shadow-lg bg-[#e7f2ff] text-[#385dfc]">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-2 flex justify-end text-xs text-gray-500">{filteredProducts.length} items</div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-[#e4e7ec]">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-4 text-left">
                <input type="checkbox"
                  checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                  onChange={e => setSelectedIds(e.target.checked ? paginatedProducts.map(p => p.id) : [])} />
              </th>
              <th className="px-6 py-4 text-left cursor-pointer select-none" onClick={() => handleSort("name")}>
                Product <SortIcon active={sortBy.key === "name"} direction={sortBy.direction} />
              </th>
              <th className="px-6 py-4 text-left cursor-pointer select-none" onClick={() => handleSort("sku")}>
                SKU <SortIcon active={sortBy.key === "sku"} direction={sortBy.direction} />
              </th>
              <th className="px-6 py-4 text-left cursor-pointer select-none" onClick={() => handleSort("stock")}>
                Stock <SortIcon active={sortBy.key === "stock"} direction={sortBy.direction} />
              </th>
              <th className="px-6 py-4 text-left cursor-pointer select-none" onClick={() => handleSort("price")}>
                Price <SortIcon active={sortBy.key === "price"} direction={sortBy.direction} />
              </th>
              <th className="px-6 py-4 text-left">Categories</th>
              <th className="px-6 py-4 text-left text-xs whitespace-nowrap"
                title="Left = SEO (17 checks) · Right = Readability (7 checks). Hover for score.">
                SEO | Readability
              </th>
              <th className="px-6 py-4 text-left cursor-pointer select-none" onClick={() => handleSort("date")}>
                Date <SortIcon active={sortBy.key === "date"} direction={sortBy.direction} />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-xs">
            {paginatedProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input type="checkbox" checked={selectedIds.includes(product.id)}
                    onChange={() => setSelectedIds(prev =>
                      prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                    )} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={`${API_URL}${product.image}`} alt={product.name}
                      className="h-12 w-12 rounded object-cover" />
                    <div>
                      <p className="font-medium text-xs">{product.name}</p>
                      <p className="text-xs text-gray-500 space-x-2">
                        <Link href={`/admin/product/EditProduct?id=${product.id}`}
                          className="text-blue-600 hover:underline cursor-pointer">Edit</Link>
                        <span>|</span>
                        <button onClick={() => handleDelete(product.id, product.status)}
                          className="text-red-600 hover:underline cursor-pointer">Delete</button>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{product.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap"><StockBadge stock={product.stock} /></td>
                <td className="px-6 py-4 font-medium">{product.price}</td>
                <td className="px-6 py-4 text-gray-500">{product.categories.join(", ")}</td>
                <td className="px-6 py-4"><SeoCell product={product} /></td>
                <td className="px-6 py-4 text-xs text-gray-500">{product.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex items-center justify-between">
        <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm">
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
      <ConfirmPopup
        open={confirmOpen}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        confirmText="Confirm"
        onCancel={() => { setConfirmOpen(false); setConfirmConfig(null); }}
        onConfirm={() => { confirmConfig?.onConfirm(); setConfirmOpen(false); setConfirmConfig(null); }}
      />
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium
      ${stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {stock > 0 ? "In stock" : "Out of stock"}
    </span>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | string)[] = [];
  const start = Math.max(2, currentPage - 1);
  const end   = Math.min(totalPages - 1, currentPage + 1);
  pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center gap-2 text-sm">
      <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}
        className="rounded border px-3 py-1 disabled:opacity-50">Previous</button>
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={i} className="px-2 text-gray-400">...</span>
        ) : (
          <button key={page} onClick={() => onPageChange(Number(page))}
            className={`h-8 w-8 rounded ${page === currentPage ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
            {page}
          </button>
        )
      )}
      <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}
        className="rounded border cursor-pointer px-3 py-1 disabled:opacity-50">Next</button>
    </div>
  );
}