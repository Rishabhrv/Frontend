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

  /* ================= FILTER + SORT ================= */
  const filtered = authors
    .filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    )
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

  /* ================= DELETE ================= */
const deleteAuthor = (id: number) => {
  setConfirmConfig({
    title: "Delete author?",
    message: "This author will be permanently deleted.",
    onConfirm: async () => {
      await fetch(`${API_URL}/api/authors/${id}`, {
        method: "DELETE",
      });

      setAuthors(prev => prev.filter(a => a.id !== id));
      setSelected(prev => prev.filter(x => x !== id));
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

        setAuthors(prev =>
          prev.filter(a => !selected.includes(a.id))
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

        setAuthors(prev =>
          prev.map(a =>
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
    <div className="bg-white  p-6 pl-0">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="rounded border px-3 py-1 text-sm"
          >
            <option value="">Bulk actions</option>
            <option value="delete">Delete</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
          </select>

          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || selected.length === 0}
            className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-500 shadow-lg disabled:opacity-50 cursor-pointer"
          >
            Apply
          </button>

        </div>

        <input
          type="text"
          placeholder="Search authors"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded border px-3 py-1 text-sm w-56"
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
                          className="text-blue-600 hover:underline text-xs mr-2"
                        >
                          Edit
                        </button>
                        |
                        <button
                          onClick={() => deleteAuthor(author.id)}
                          className="text-red-600 hover:underline ml-2"
                        >
                          Delete
                        </button>
                      </div>
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
                    className={`inline-block rounded-full px-3 py-1  font-medium ${
                      author.status === "active"
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
                <td colSpan={5} className="text-center py-6 text-gray-400">
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
            className="rounded border px-3 py-1 disabled:opacity-50"
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
            className="rounded border px-3 py-1 disabled:opacity-50"
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
