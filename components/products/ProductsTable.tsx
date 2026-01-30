"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import {
  Search, 
} from "lucide-react";
import Link from "next/link";


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
};


const API_URL = process.env.NEXT_PUBLIC_API_URL!;



/* ---------------- MAIN COMPONENT ---------------- */

export default function ProductsTable() {
  const [search, setSearch] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "published" | "draft" | "trash">("published");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<{
    key: keyof Product | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

const [products, setProducts] = useState<Product[]>([]);
const [allCategories, setAllCategories] = useState<string[]>([]);
const [loading, setLoading] = useState(true);
const [selectedIds, setSelectedIds] = useState<number[]>([]);

useEffect(() => {
  fetch(`${API_URL}/api/products`)
    .then((res) => res.json())
    .then((data) => {
      const normalized = data.map((p: any) => ({
        ...p,
        status: p.status.toLowerCase(), // 🔥 FIX
      }));
      setProducts(normalized);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, []);


useEffect(() => {
  fetch(`${API_URL}/api/categories`)
    .then((res) => res.json())
    .then((data) => {
      const names = data.map((c: any) => c.name);
      setAllCategories(names);
    });
}, []);


  /* ---------------- FILTER LOGIC ---------------- */

  const filteredProducts = useMemo(() => {
    let data = products.filter((p) => {
      if (activeTab !== "all" && p.status !== activeTab) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && !p.categories.includes(category)) return false;
      if (stockFilter === "instock" && p.stock <= 0) return false;
      if (stockFilter === "outofstock" && p.stock > 0) return false;
      return true;
    });
  
  
    const key = sortBy.key;

    if (key) {
      data = [...data].sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];
    
        // 🔹 PRICE
        if (key === "price") {
          const aNum = Number(String(aVal).replace(/[₹,]/g, ""));
          const bNum = Number(String(bVal).replace(/[₹,]/g, ""));
          return sortBy.direction === "asc" ? aNum - bNum : bNum - aNum;
        }
    
        // 🔹 DATE
        if (key === "date") {
          const aTime = new Date(String(aVal)).getTime();
          const bTime = new Date(String(bVal)).getTime();
          return sortBy.direction === "asc" ? aTime - bTime : bTime - aTime;
        }
    
        // 🔹 NUMBER
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortBy.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
    
        // 🔹 STRING
        return sortBy.direction === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
  
  
    return data;
  }, [products, search, category, stockFilter, activeTab, sortBy]);



  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key: keyof Product) => {
    setSortBy((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* ---------------- COUNTS ---------------- */

  const count = {
    all: products.length,
    published: products.filter(p => p.status === "published").length,
    draft: products.filter(p => p.status === "draft").length,
    trash: products.filter(p => p.status === "trash").length,
  };

  function SortIcon({
    active,
    direction,
  }: {
    active: boolean;
    direction: "asc" | "desc";
  }) {
    return (
      <span className="ml-1 text-xs">
        {active ? (direction === "asc" ? "▲" : "▼") : " "}
      </span>
    );
  }

  const handleDelete = async (id: number) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch(
      `${API_URL}/api/products/${id}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    // 🔥 remove from UI instantly
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => prev.filter(pid => pid !== id));

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
};


  return (
    <div className="bg-white p-6">
      {/* ---------- HEADER ---------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="flex gap-2">
            <Link
              href="AddProduct"
              className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm text-white"
            >
              Add new product
            </Link>
        </div>
      </div>

      {/* ---------- STATUS TABS ---------- */}
      <div className="mb-4 text-sm text-gray-600 space-x-2">
        {(["all", "published", "draft", "trash"] as const).map(tab => (
          <React.Fragment key={tab}>
            <button
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "font-medium text-blue-600" : ""}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count[tab]})
            </button>
            <span>|</span>
          </React.Fragment>
        ))}
      </div>

      {/* ---------- FILTER ROW ---------- */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
            <option value="draft">Move to Draft</option>
          </select>

          <button className="rounded px-3 py-1 text-sm shadow-lg bg-[#e7f2ff] text-[#385dfc] cursor-pointer">Apply</button>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border px-2 py-1 text-sm border-gray-300"
          >
            <option value="">All categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>


          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded border px-2 py-1 text-sm border-gray-300"
          >
            <option value="">Filter by stock</option>
            <option value="instock">In stock</option>
            <option value="outofstock">Out of stock</option>
          </select>

          <button className="rounded px-3 py-1 text-sm shadow-lg bg-[#e7f2ff] text-[#385dfc] cursor-pointer">Filter</button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          />
          <button className="rounded px-3 p-2 text-xs shadow-lg bg-[#e7f2ff] text-[#385dfc]"><Search className="w-5 h-5"/></button>
        </div>
      </div>

      {/* ---------- ITEMS COUNT ---------- */}
      <div className="mb-2 flex justify-end text-xs text-gray-500">
        {filteredProducts.length} items
      </div>

      {/* ---------- TABLE ---------- */}
      <div className="overflow-x-auto rounded-xl border border-[#e4e7ec]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
  <tr>
    <th className="px-6 py-4 text-left">
      <input
        type="checkbox"
        checked={
          paginatedProducts.length > 0 &&
          selectedIds.length === paginatedProducts.length
        }
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedIds(paginatedProducts.map(p => p.id));
          } else {
            setSelectedIds([]);
          }
        }}
      />

    </th>

    <th
      className="px-6 py-4 text-left cursor-pointer select-none"
      onClick={() => handleSort("name")}
    >
      Product
      <SortIcon active={sortBy.key === "name"} direction={sortBy.direction} />
    </th>

    <th
      className="px-6 py-4 text-left cursor-pointer select-none"
      onClick={() => handleSort("sku")}
    >
      SKU
      <SortIcon active={sortBy.key === "sku"} direction={sortBy.direction} />
    </th>

    <th
      className="px-6 py-4 text-left cursor-pointer select-none"
      onClick={() => handleSort("stock")}
    >
      Stock
      <SortIcon active={sortBy.key === "stock"} direction={sortBy.direction} />
    </th>

    <th
      className="px-6 py-4 text-left cursor-pointer select-none"
      onClick={() => handleSort("price")}
    >
      Price
      <SortIcon active={sortBy.key === "price"} direction={sortBy.direction} />
    </th>

    <th className="px-6 py-4 text-left">
      Categories
    </th>

    <th
      className="px-6 py-4 text-left cursor-pointer select-none"
      onClick={() => handleSort("date")}
    >
      Date
      <SortIcon active={sortBy.key === "date"} direction={sortBy.direction} />
    </th>
  </tr>
</thead>


          <tbody className="divide-y divide-gray-200 text-xs">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => {
                      setSelectedIds(prev =>
                        prev.includes(product.id)
                          ? prev.filter(id => id !== product.id)
                          : [...prev, product.id]
                      );
                    }}
                  />
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`${API_URL}${product.image}`}
                      alt={product.name}
                      className="h-15 w-15 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium ">{product.name}</p>
                        <p className="text-xs text-gray-500 space-x-2">
                        <Link
                          href={`/admin/product/EditProduct?id=${product.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
                      
                        <span>|</span>
                      
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-gray-500">{product.sku}</td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <StockBadge stock={product.stock} />
                </td>

                <td className="px-6 py-4 font-medium">{product.price}</td>

                <td className="px-6 py-4 text-gray-500">
                  {product.categories.join(", ")}
                </td>

                <td className="px-6 py-4 text-xs text-gray-500">{product.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- PAGINATION ---------- */}
      <div className="mt-4 flex items-center justify-between">
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

/* ---------------- STOCK BADGE ---------------- */

function StockBadge({ stock }: { stock: number }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        stock > 0
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {stock > 0 ? "In stock" : "Out of stock"}
    </span>
  );
}

/* ---------------- PAGINATION ---------------- */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded border px-3 py-1 disabled:opacity-50"
      >
        Previous
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 rounded ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded border px-3 py-1 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
