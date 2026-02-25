"use client";

import React, { useEffect, useState } from "react";
import AlertPopup from "@/components/Popups/AlertPopup";


type Category = {
  id: number;
  name: string;
  parent_id: number | null;
};

type Props = {
  editCategory?: any;
  clearEdit: () => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const AddCategoriesForm = ({ editCategory, clearEdit }: Props) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [parentId, setParentId] = useState<number | null>(null);
  const [imprint, setImprint] = useState<"agph" | "agclassics">("agph"); // ← NEW

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  /* ---------------- FETCH PARENT CATEGORIES ---------------- */
  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Category[]) => {
        const parentOnly = data.filter((cat) => cat.parent_id === null);
        setCategories(parentOnly);
      })
      .catch((err) => {
        console.error("Category fetch error:", err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    if (!editCategory) return;

    setName(editCategory.name);
    setSlug(editCategory.slug);
    setStatus(editCategory.status);
    setParentId(editCategory.parent_id);
    setImprint(editCategory.imprint ?? "agph"); // ← NEW
  }, [editCategory]);


  /* ---------------- AUTO SLUG ---------------- */
  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      slug,
      status,
      parent_id: parentId,
      imprint, // ← NEW
    };

    try {
      const url = editCategory
        ? `${API_URL}/api/categories/${editCategory.id}`
        : `${API_URL}/api/categories`;

      const method = editCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setToastMsg(data.message || "Failed");
        setToastOpen(true);
        return;
      }

      window.dispatchEvent(new Event("categories:refresh"));

      // RESET FORM
      setName("");
      setSlug("");
      setStatus("active");
      setParentId(null);
      setImprint("agph"); // ← NEW
      clearEdit();

    } catch (err) {
      setToastMsg("Server error");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">
        Product Category
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
      >
        {/* CATEGORY NAME */}
        <div>
          <label className="block text-sm mb-1 font-medium">
            Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Enter category name"
            required
          />
        </div>

        {/* SLUG */}
        <div>
          <label className="block text-sm mb-1 font-medium">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="category-slug"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            URL friendly version
          </p>
        </div>

        {/* PARENT CATEGORY */}
        <div>
          <label className="block text-sm mb-1 font-medium">
            Parent Category
          </label>
          <select
            value={parentId ?? ""}
            onChange={(e) =>
              setParentId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* IMPRINT ← NEW */}
        <div>
          <label className="block text-sm mb-1 font-medium">
            Imprint
          </label>
          <select
            value={imprint}
            onChange={(e) => setImprint(e.target.value as "agph" | "agclassics")}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="agph">AGPH</option>
            <option value="agclassics">AG Classics</option>
          </select>
        </div>

        {/* STATUS */}
        <div>
          <label className="block text-sm mb-1 font-medium">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-5 py-2 text-sm text-white"
          >
            {loading
              ? "Saving..."
              : editCategory
              ? "Update Category"
              : "Save Category"}
          </button>
        </div>
      </form>

      <AlertPopup
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default AddCategoriesForm;