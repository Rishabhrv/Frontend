"use client";

import React, { useEffect, useState } from "react";

type Author = {
  id?: number;
  name: string;
  slug?: string;
  bio?: string;
  profile_image?: string;
  status?: "active" | "inactive";
};


type Props = {
  editAuthor?: Author | null;
  clearEdit: () => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const AuthorForm = ({ editAuthor, clearEdit }: Props) => {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");


    const generateSlug = (value: string) =>
        value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");


  /* 🔁 Fill data on Edit */
  useEffect(() => {
  if (!editAuthor) return;

  setName(editAuthor.name);
  setBio(editAuthor.bio || "");
  setStatus(editAuthor.status || "active");
  setSlug(editAuthor.slug || "");

  if (editAuthor.profile_image) {
    setPreview(
      editAuthor.profile_image.startsWith("http")
        ? editAuthor.profile_image
        : `${API_URL}${editAuthor.profile_image}`
    );
  } else {
    setPreview(null);
  }
}, [editAuthor]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("status", status);

    if (image) {
      formData.append("profile_image", image);
    }

    const url = editAuthor
      ? `${API_URL}/api/authors/${editAuthor.id}`
      : `${API_URL}/api/authors`;

    const method = editAuthor ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      window.dispatchEvent(new Event("authors:refresh"));

      // reset
      setName("");
      setBio("");
      setStatus("active");
      setImage(null);
      setPreview(null);
      clearEdit();
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <h2 className="text-lg font-semibold mb-4">
        {editAuthor ? "Edit Author" : "Add Author"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-300 rounded-lg p-4 text-xs">

        <div className="flex gap-3">
            {/* PROFILE IMAGE  */}
            <div>
              <label className="block whitespace-nowrap font-medium mb-1">
                Author Profile Image
              </label>
            
              <div className="w-20">
                <label className="block cursor-pointer">
                  <div className="flex h-30 w-30 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:border-blue-500 overflow-hidden">
            
                    {preview ? (
                      <img
                        src={preview}
                        alt="Author Preview"
                        className="h-full w-full object-cover cursor-pointer"
                      />
                    ) : (
                      <>
                        <span className="text-gray-500 cursor-pointer">
                          Upload Author Image
                        </span>
                        <span className="mt-1 text-xs text-gray-400 cursor-pointer">
                          JPG, PNG, WebP
                        </span>
                      </>
                    )}
            
                  </div>
            
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
            
                      setImage(file);
                      setPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="gap-3">
                {/* NAME */}
                <div className="my-3">
                  <label className="font-medium">Author Name</label>
                    <input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                    
                        // auto-generate slug only when adding
                        if (!editAuthor) {
                          setSlug(generateSlug(e.target.value));
                        }
                      }}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                </div>
                {/* SLUG */}
                <div>
                  <label className="font-medium">Slug</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="author-slug"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL friendly version
                  </p>
                </div>
            </div>


        </div>
        


        {/* BIO */}
        <div>
          <label className="font-medium">Bio</label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        


        {/* STATUS */}
        <div>
          <label className="font-medium">Status</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as any)
            }
            className="w-full border rounded px-3 py-2 "
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded cursor-pointer"
          >
            {loading
              ? "Saving..."
              : editAuthor
              ? "Update Author"
              : "Add Author"}
          </button>

          {editAuthor && (
            <button
              type="button"
              onClick={clearEdit}
              className="border px-5 py-2 rounded border-gray-300 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthorForm;
