"use client";

import React, { useEffect, useState } from "react";

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
    if (!confirm("Delete this author?")) return;

    fetch(`${API_URL}/api/authors/${id}`, {
      method: "DELETE",
    }).then(() => {
      setAuthors((prev) => prev.filter((a) => a.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
    });
  };

  const bulkDelete = () => {
    if (!confirm("Delete selected authors?")) return;

    selected.forEach((id) => {
      fetch(`${API_URL}/api/authors/${id}`, {
        method: "DELETE",
      });
    });

    setAuthors((prev) =>
      prev.filter((a) => !selected.includes(a.id))
    );
    setSelected([]);
  };

  /* ================= UI ================= */
  return (
    <div className="bg-white  p-6 pl-0">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <select className="rounded border px-3 py-1 text-sm">
            <option>Bulk actions</option>
            <option value="delete">Delete</option>
          </select>
          <button
            onClick={bulkDelete}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
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
    </div>
  );
};

export default AuthorTable;
