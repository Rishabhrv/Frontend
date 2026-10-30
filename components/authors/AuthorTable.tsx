"use client";

import React, { useEffect, useState } from "react";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";


/* ================= TYPES ================= */
type Author = {
  id: number;
  name: string;
  slug: string;
  profile_image?: string;
  bio?: string;
  status: "active" | "inactive";
  is_featured?: number | boolean;
};


/* ================= COMPONENT ================= */
type Props = {
  onEdit: (author: any) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const AuthorTable = ({ onEdit }: Props) => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterTab, setFilterTab] = useState<"all" | "featured">("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [bulkAction, setBulkAction] = useState("");



  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchAuthors = () => {
      fetch(`${API_URL}/api/authors`)
        .then((res) => res.json())
        .then((data: Author[]) => setAuthors(data))
        .catch(console.error);
    };

    fetchAuthors(); // initial load

    // 👂 listen for add / edit refresh
    window.addEventListener("authors:refresh", fetchAuthors);

    return () => {
      window.removeEventListener("authors:refresh", fetchAuthors);
    };
  }, []);

  const isAuthorFeatured = (a: Author) => a.is_featured === 1 || a.is_featured === true;
  const featuredCount = authors.filter(isAuthorFeatured).length;

  /* ================= FILTER + SORT ================= */
  const filtered = authors
    .filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.slug.toLowerCase().includes(search.toLowerCase());
      const matchesTab = filterTab === "all" || isAuthorFeatured(a);
      return matchesSearch && matchesTab;
    })
    .sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* ================= SELECT ================= */
  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === paginated.length) {
      setSelected([]);
    } else {
      setSelected(paginated.map((a) => a.id));
    }
  };

  /* ================= TOGGLE FEATURED ================= */
  const toggleFeatured = async (author: Author) => {
    const currentlyFeatured = isAuthorFeatured(author);
    const nextVal = !currentlyFeatured;

    // Optimistic UI update
    setAuthors((prev) =>
      prev.map((a) =>
        a.id === author.id ? { ...a, is_featured: nextVal ? 1 : 0 } : a
      )
    );
    setTogglingId(author.id);

    try {
      const res = await fetch(
        `${API_URL}/api/authors/${author.id}/toggle-featured`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_featured: nextVal }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error("Toggle featured error:", err);
      // Revert optimistic update
      setAuthors((prev) =>
        prev.map((a) =>
          a.id === author.id ? { ...a, is_featured: currentlyFeatured ? 1 : 0 } : a
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  /* ================= DELETE ================= */
  const deleteAuthor = (id: number) => {
    setConfirmConfig({
      title: "Delete author?",
      message: "This author will be permanently deleted.",
      onConfirm: async () => {
        await fetch(`${API_URL}/api/authors/${id}`, {
          method: "DELETE",
        });

        setAuthors((prev) => prev.filter((a) => a.id !== id));
        setSelected((prev) => prev.filter((x) => x !== id));
      },
    });

    setConfirmOpen(true);
  };

  const applyBulkAction = () => {
    if (!bulkAction || selected.length === 0) return;

    // 🗑 DELETE
    if (bulkAction === "delete") {
      setConfirmConfig({
        title: "Delete selected authors?",
        message: "This action cannot be undone.",
        onConfirm: async () => {
          const res = await fetch(
            `${API_URL}/api/authors/bulk-delete`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: selected }),
            }
          );

          if (!res.ok) return;

          setAuthors((prev) =>
            prev.filter((a) => !selected.includes(a.id))
          );
          setSelected([]);
          setBulkAction("");
        },
      });

      setConfirmOpen(true);
      return;
    }

    // 🌟 BULK FEATURE / UNFEATURE ON HOME
    if (bulkAction === "feature" || bulkAction === "unfeature") {
      const isFeature = bulkAction === "feature";

      setConfirmConfig({
        title: isFeature
          ? "Show selected authors on Home Carousel?"
          : "Remove selected authors from Home Carousel?",
        message: isFeature
          ? "Selected authors will be displayed in the Featured Authors carousel on the homepage."
          : "Selected authors will be removed from the homepage carousel.",
        onConfirm: async () => {
          const res = await fetch(
            `${API_URL}/api/authors/bulk-featured`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: selected,
                is_featured: isFeature ? 1 : 0,
              }),
            }
          );

          if (!res.ok) return;

          setAuthors((prev) =>
            prev.map((a) =>
              selected.includes(a.id)
                ? { ...a, is_featured: isFeature ? 1 : 0 }
                : a
            )
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
      const status =
        bulkAction === "activate" ? "active" : "inactive";

      setConfirmConfig({
        title: `Mark authors as ${status}?`,
        message: "Selected authors will be updated.",
        onConfirm: async () => {
          const res = await fetch(
            `${API_URL}/api/authors/bulk-status`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: selected,
                status,
              }),
            }
          );

          if (!res.ok) return;

          setAuthors((prev) =>
            prev.map((a) =>
              selected.includes(a.id)
                ? { ...a, status }
                : a
            )
          );

          setSelected([]);
          setBulkAction("");
        },
      });

      setConfirmOpen(true);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 pl-0">
      {/* FILTER TABS & STATS */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterTab("all");
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${filterTab === "all"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            All Authors ({authors.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterTab("featured");
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${filterTab === "featured"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
          >
            <span>⭐ Home Carousel</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filterTab === "featured"
                ? "bg-amber-800 text-white"
                : "bg-amber-200 text-amber-900"
                }`}
            >
              {featuredCount}
            </span>
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filtered.length}</span> author{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs"
          >
            <option value="">Bulk actions</option>
            <option value="feature">⭐ Show on Home</option>
            <option value="unfeature">Hide from Home</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
          </select>

          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || selected.length === 0}
            className="rounded bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
          >
            Apply ({selected.length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search author name or slug..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={
                    paginated.length > 0 &&
                    selected.length === paginated.length
                  }
                  onChange={toggleAll}
                />
              </th>

              <th className="p-3 text-left">Author</th>
              <th className="p-3 text-center w-32">Home Carousel</th>
              <th className="p-3 text-left">Bio</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((author) => (
              <tr
                key={author.id}
                className="border-t border-gray-200 hover:bg-gray-50 text-xs"
              >
                {/* CHECKBOX */}
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(author.id)}
                    onChange={() => toggleSelect(author.id)}
                  />
                </td>

                {/* AUTHOR IMAGE + NAME */}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {author.profile_image ? (
                      <img
                        src={`${API_URL}${author.profile_image}`}
                        className="h-10 w-10 rounded-full object-cover "
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        NA
                      </div>
                    )}

                    <div>
                      <div className="font-medium text-gray-900">
                        {author.name}
                      </div>
                      <div className="text-xs mt-1">
                        <button
                          onClick={() => onEdit(author)}
                          className="text-blue-600 hover:underline text-xs mr-2 cursor-pointer transition"
                        >
                          Edit
                        </button>
                        |
                        <button
                          onClick={() => deleteAuthor(author.id)}
                          className="text-red-600 hover:underline ml-2 text-xs cursor-pointer transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </td>

                {/* HOME CAROUSEL FEATURED TOGGLE */}
                <td className="p-3 text-center whitespace-nowrap">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(author)}
                      disabled={togglingId === author.id}
                      title={
                        isAuthorFeatured(author)
                          ? "Visible on Home Carousel. Click to remove."
                          : "Not on Home Carousel. Click to show on Home."
                      }
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:opacity-50 ${isAuthorFeatured(author) ? "bg-amber-500" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAuthorFeatured(author) ? "translate-x-3" : "translate-x-0"
                          }`}
                      />
                    </button>
                    <div>
                      {isAuthorFeatured(author) ? (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                          ⭐ On Home
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* BIO */}
                <td className="p-3 text-gray-600  max-w-40 truncate">
                  {author.bio || "-"}
                </td>

                {/* SLUG */}
                <td className="p-3 text-gray-500 ">
                  {author.slug}
                </td>

                {/* STATUS */}
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1  font-medium ${author.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {author.status}
                  </span>
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No authors found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="rounded border px-2 py-1"
        >
          <option value={10}>10 rows</option>
          <option value={25}>25 rows</option>
          <option value={50}>50 rows</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded border px-3 py-1 disabled:opacity-50 cursor-pointer transition"
          >
            Previous
          </button>

          <span>
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages || 1}</strong>
          </span>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="rounded border px-3 py-1 disabled:opacity-50 cursor-pointer transition"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmPopup
        open={confirmOpen}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        confirmText="Update"
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

export default AuthorTable;
