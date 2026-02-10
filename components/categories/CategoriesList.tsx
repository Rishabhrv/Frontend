"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "../Popups/ConfirmPopup";


/* ---------------- TYPES ---------------- */
type Category = {
  id: number;
  name: string;
  slug: string;
  status: "active" | "inactive";
  parent_id: number | null;
};

type Props = {
  onEdit: (cat: Category) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ---------------- MAIN COMPONENT ---------------- */
const CategoriesList = ({ onEdit }: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Category>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmConfig, setConfirmConfig] = useState<{
  title: string;
  message: string;
  onConfirm: () => void;
} | null>(null);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
  const fetchCategories = () => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  };

  fetchCategories(); // initial load

  // 👂 listen for refresh
  window.addEventListener("categories:refresh", fetchCategories);

  return () => {
    window.removeEventListener("categories:refresh", fetchCategories);
  };
}, []);

const handleDelete = (id: number) => {
  setConfirmConfig({
    title: "Delete category?",
    message: "This category will be permanently deleted.",
    onConfirm: async () => {
      const res = await fetch(
        `${API_URL}/api/categories/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        setToastMsg("Delete failed");
        setToastOpen(true);
        return;
      }

      setCategories(prev => prev.filter(c => c.id !== id));
      setSelected(prev => prev.filter(cid => cid !== id));
    },
  });

  setConfirmOpen(true);
};




  /* ---------------- FILTER + SORT ---------------- */
  const filteredData = useMemo(() => {
    let data = categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );

    data.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [categories, search, sortKey, sortDir]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /* ---------------- SORT HANDLER ---------------- */
  const handleSort = (key: keyof Category) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ---------------- BULK APPLY  ---------------- */
const applyBulkAction = () => {
  if (!bulkAction) {
    setToastMsg("Please select a bulk action");
    setToastOpen(true);
    return;
  }

  if (selected.length === 0) {
    setToastMsg("Please select at least one category");
    setToastOpen(true);
    return;
  }

  // 🗑 DELETE
  if (bulkAction === "delete") {
    setConfirmConfig({
      title: "Delete selected categories?",
      message: "This action cannot be undone.",
      onConfirm: async () => {
        const res = await fetch(
          `${API_URL}/api/categories/bulk-delete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selected }),
          }
        );

        if (!res.ok) {
          setToastMsg("Bulk delete failed");
          setToastOpen(true);
          return;
        }

        setCategories(prev =>
          prev.filter(c => !selected.includes(c.id))
        );

        setSelected([]);
        setBulkAction("");
      },
    });

    setConfirmOpen(true);
    return;
  }

  // ✅ ACTIVATE / DEACTIVATE
  if (bulkAction === "activate" || bulkAction === "deactivate") {
    const newStatus =
      bulkAction === "activate" ? "active" : "inactive";

    setConfirmConfig({
      title: `Mark categories as ${newStatus}?`,
      message: `Selected categories will be marked as ${newStatus}.`,
      onConfirm: async () => {
        const res = await fetch(
          `${API_URL}/api/categories/bulk-status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: selected,
              status: newStatus,
            }),
          }
        );

        if (!res.ok) {
          setToastMsg("Bulk status update failed");
          setToastOpen(true);
          return;
        }

        setCategories(prev =>
          prev.map(c =>
            selected.includes(c.id)
              ? { ...c, status: newStatus }
              : c
          )
        );

        setSelected([]);
        setBulkAction("");
      },
    });

    setConfirmOpen(true);
    return;
  }
};



  /* ---------------- CHECKBOX ---------------- */
  const toggleAll = (checked: boolean) => {
    setSelected(
      checked ? paginatedData.map((c) => c.id) : []
    );
  };

  const toggleOne = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const parentMap = useMemo(() => {
  const map = new Map<number, string>();
  categories.forEach((c) => {
    map.set(c.id, c.name);
  });
  return map;
}, [categories]);

  return (
    <div className="p-1">
      <h1 className="mb-6 text-xl font-semibold">
        
      </h1>

      {/* TOP BAR */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="rounded border border-gray-100 px-2 py-1 text-sm"
          >
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
          </select>

          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || selected.length === 0}
            className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-500 shadow-lg disabled:opacity-50"
          >
            Apply
          </button>

        </div>

        <input
          type="text"
          placeholder="Search categories"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border px-3 py-1 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    paginatedData.length > 0 &&
                    selected.length === paginatedData.length
                  }
                  onChange={(e) =>
                    toggleAll(e.target.checked)
                  }
                />
              </th>

              <th
                onClick={() => handleSort("name")}
                className="cursor-pointer px-4 py-3 text-left"
              >
                Name <ChevronsUpDown className="inline h-4 w-4" />
              </th>

              <th className="px-4 py-3 text-left">
                Parent
              </th>

              <th
                onClick={() => handleSort("status")}
                className="cursor-pointer px-4 py-3 text-left"
              >
                Status <ChevronsUpDown className="inline h-4 w-4" />
              </th>

              <th className="px-4 py-3 text-left">
                Slug
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((cat) => (
              <tr
                key={cat.id}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.id)}
                    onChange={() => toggleOne(cat.id)}
                  />
                </td>

                <td className="px-4 py-3">
                  {/* Category Name */}
                  <div className="font-medium text-gray-900">
                    {cat.name}
                  </div>
                
                  {/* Action Links */}
                  <div className="mt-1 text-xs text-blue-600 space-x-2">
                    <button
                      onClick={() => onEdit(cat)}
                      className="hover:underline"
                    >
                      Edit
                    </button>
                
                    <span className="text-gray-400">|</span>
                
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>

                
                  </div>
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {cat.parent_id
                    ? parentMap.get(cat.parent_id) || "—"
                    : "—"}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      cat.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {cat.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {cat.slug}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex items-center justify-between">
        <select
          value={rowsPerPage}
          onChange={(e) =>
            setRowsPerPage(Number(e.target.value))
          }
          className="rounded border px-2 py-1 text-sm"
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((p) => p - 1)
            }
            className="rounded border px-3 py-1 disabled:opacity-50 text-sm"
          >
            Previous
          </button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((p) => p + 1)
            }
            className="rounded border px-3 py-1 disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      </div>
                            <AlertPopup
                              open={toastOpen}
                              message={toastMsg}
                              onClose={() => setToastOpen(false)}
                            />
                            <ConfirmPopup
                              open={confirmOpen}
                              title={confirmConfig?.title || ""}
                              message={confirmConfig?.message || ""}
                              confirmText="Delete"
                              onCancel={() => {
                                setConfirmOpen(false);
                                setConfirmConfig(null);
                              }}
                              onConfirm={() => {
                                confirmConfig?.onConfirm();
                                setConfirmOpen(false);
                                setConfirmConfig(null);
                              }}
                            />

    </div>
  );
};

export default CategoriesList;
