"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { X } from "lucide-react";

type Author = {
  id: number;
  name: string;
  profile_image?: string;
};

type ProductAuthorProps = {
  mode?: "add" | "edit";
  productId?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const ProductAuthor = forwardRef<any, ProductAuthorProps>(
({ mode = "add", productId }, ref) => {

  const [search, setSearch] = useState("");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
  const [authorImage, setAuthorImage] = useState<File | null>(null);
  const [authorBio, setAuthorBio] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(null);




  /* expose selected author IDs */
  useImperativeHandle(ref, () => ({
    getAuthors: () => selectedAuthors.map((a) => a.id),
  }));

  useEffect(() => {
    fetch(`${API_URL}/api/authors`)
      .then((res) => res.json())
      .then((data) => setAuthors(data));
  }, []);

  useEffect(() => {
  if (mode !== "edit" || !productId) return;

  fetch(`${API_URL}/api/authors/${productId}/authors`)
    .then(res => res.json())
    .then((data) => {
      setSelectedAuthors(data);
    });
}, [mode, productId]);


  const filtered = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedAuthors.some((s) => s.id === a.id)
  );

  const addAuthor = (author: Author) => {
    setSelectedAuthors((prev) => [...prev, author]);
    setSearch("");
  };

  const removeAuthor = (id: number) => {
    setSelectedAuthors((prev) => prev.filter((a) => a.id !== id));
  };

  const createAuthor = async () => {
  const formData = new FormData();
  formData.append("name", search);
  if (authorImage) formData.append("profile_image", authorImage);
  if (authorBio) formData.append("bio", authorBio);

  const res = await fetch(`${API_URL}/api/authors`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (res.ok) {
  setAuthors((prev) => [...prev, data]);
  setSelectedAuthors((prev) => [...prev, data]);

  // 🔥 reset & hide form
  setSearch("");
  setAuthorImage(null);
  setAuthorImagePreview(null);
  setAuthorBio("");
  setShowCreateForm(false);
}

};


  return (
    <div className="bg-white rounded-xl border p-4 border-gray-300">
      <h3 className="text-sm font-medium mb-3">Author</h3>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search or add author"
        className="w-full border rounded px-3 py-2 text-sm"
      />

      {search && (
        <div className="border rounded mt-1 bg-white shadow border-gray-300">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => addAuthor(a)}
              className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
            >
              {a.name}
            </button>
          ))}

          {filtered.length === 0 && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="block w-full px-3 py-2 text-left text-blue-600 text-sm"
            >
              + Add "{search}"
            </button>

          )}
        </div>
      )}
      {showCreateForm && (
        <div className="mt-3 space-y-2 pt-2 text-right">
          <div className="flex gap-5">
              {/* AUTHOR IMAGE UPLOAD */}
                <div className="w-40">
                  <label className="block cursor-pointer">
                    <div className="flex h-32 w-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:border-blue-500 overflow-hidden">
                      
                      {authorImagePreview ? (
                        <img
                          src={authorImagePreview}
                          alt="Author Preview"
                          className="h-full w-full object-cover"
                        />
                          ) : (
                            <>
                              <span className="text-xs text-gray-500">
                                Upload Author Image
                              </span>
                              <span className="mt-1 text-[10px] text-gray-400">
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
                    
                            setAuthorImage(file);
                            setAuthorImagePreview(URL.createObjectURL(file)); // 🔥 preview
                          }}
                        />
                      </label>
                    </div>

              {/* BIO */}
              <textarea
                placeholder="Author bio"
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
              />
          </div>
         
          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={createAuthor}
            className="rounded bg-blue-600 px-2 py-1 text-white text-xs cursor-pointer"
          >
            Save Author
          </button>
        </div>
      )}



      {/* Selected */}
          <div className="mt-3 space-y-2">
            {selectedAuthors.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded"
              >
                <div className="flex items-center gap-2">
                  {/* AUTHOR IMAGE */}
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                    {a.profile_image ? (
                      <img
                        src={`${API_URL}${a.profile_image}`}
                        alt={a.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
          
                  {/* AUTHOR NAME */}
                  <span className="text-sm p-2 ">{a.name}</span>
                </div>
          
                {/* REMOVE */}
                <button
                  type="button"
                  onClick={() => removeAuthor(a.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
    </div>
  );
});

export default ProductAuthor;
