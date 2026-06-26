"use client";

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { X, Pencil } from "lucide-react"; // Added Pencil icon

type Author = {
  id: number;
  name: string;
  profile_image?: string;
  bio?: string;
  status?: string;
  python_id?: number; 
};

type ReadyToGoProductAuthorProps = {
  initialAuthors?: { id: number; name: string }[]; 
  error?: string;
  onValidChange?: () => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const CRMSERVER_API_URL = process.env.NEXT_PUBLIC_CRMSERVER_API_URL || "";

const normalizeName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/^(dr\.|dr|prof\.|prof|mr\.|mr|mrs\.|mrs|ms\.|ms)\s+/gi, "") 
    .replace(/[^a-z0-9]/gi, ""); 
};

const ReadyToGoProductAuthor = forwardRef<any, ReadyToGoProductAuthorProps>(
  ({ initialAuthors, error, onValidChange }, ref) => {
    const [search, setSearch] = useState("");
    const [authors, setAuthors] = useState<Author[]>([]);
    const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
    
    // Form States
    const [authorImage, setAuthorImage] = useState<File | null>(null);
    const [authorBio, setAuthorBio] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [authorImagePreview, setAuthorImagePreview] = useState<string | null>(null);
    
    // New: Track the author currently being edited
    const [editingAuthorId, setEditingAuthorId] = useState<number | null>(null);
    
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [dbAuthorsFetched, setDbAuthorsFetched] = useState(false);
    const hasImportedRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getAuthors: () => selectedAuthors.map((a) => a.id),
    }));

    const initialAuthorsStr = JSON.stringify(initialAuthors || []);

    // 1. Fetch DB Authors
    useEffect(() => {
      let isMounted = true;
      fetch(`${API_URL}/api/authors`)
        .then((res) => res.json())
        .then((dbAuthors: Author[]) => {
          if (isMounted) {
            setAuthors(dbAuthors);
            setDbAuthorsFetched(true);
          }
        })
        .catch(err => console.error("Failed to fetch authors", err));
      
      return () => { isMounted = false; };
    }, []);

    // 2. Process imported authors (unchanged)
    useEffect(() => {
      if (!dbAuthorsFetched || hasImportedRef.current) return;

      const parsedInitialAuthors = JSON.parse(initialAuthorsStr);
      
      if (parsedInitialAuthors && parsedInitialAuthors.length > 0) {
        hasImportedRef.current = true;

        const processImports = async () => {
          const allSelected: Author[] = [];
          let didCreateOrUpdate = false;

          for (const imported of parsedInitialAuthors) {
            const importedClean = normalizeName(imported.name);
            let expressAuthor = authors.find((a) => normalizeName(a.name) === importedClean);
            
            if (expressAuthor) {
              expressAuthor = { ...expressAuthor, python_id: imported.id };

              if (!expressAuthor.profile_image && !imageErrors[imported.id]) {
                try {
                  const imgRes = await fetch(`${CRMSERVER_API_URL}/api/authors/${imported.id}/photo`);
                  if (imgRes.ok) {
                    const blob = await imgRes.blob();
                    if (blob.type.startsWith("image/")) {
                      const ext = blob.type.split('/')[1] || 'jpg';
                      const file = new File([blob], `drive-author-${imported.id}.${ext}`, { type: blob.type });
                      
                      const updateData = new FormData();
                      updateData.append("name", expressAuthor.name);
                      updateData.append("profile_image", file);

                      const updateRes = await fetch(`${API_URL}/api/authors/${expressAuthor.id}`, {
                        method: "PUT",
                        body: updateData
                      });
                      if (updateRes.ok) didCreateOrUpdate = true;
                    }
                  }
                } catch (e) {
                  setImageErrors((prev) => ({ ...prev, [imported.id]: true }));
                }
              }

            } else {
              let fileToUpload = null;
              try {
                const imgRes = await fetch(`${CRMSERVER_API_URL}/api/authors/${imported.id}/photo`);
                if (imgRes.ok) {
                  const blob = await imgRes.blob();
                  if (blob.type.startsWith("image/")) {
                    const ext = blob.type.split('/')[1] || 'jpg';
                    fileToUpload = new File([blob], `drive-author-${imported.id}.${ext}`, { type: blob.type });
                  }
                }
              } catch(e) {
                setImageErrors((prev) => ({ ...prev, [imported.id]: true }));
              }

              const formData = new FormData();
              formData.append("name", imported.name);
              if (fileToUpload) {
                formData.append("profile_image", fileToUpload);
              }

              try {
                const res = await fetch(`${API_URL}/api/authors`, { method: "POST", body: formData });
                if (res.ok) {
                  const newDbAuthor = await res.json();
                  expressAuthor = { ...newDbAuthor, python_id: imported.id }; 
                  didCreateOrUpdate = true;
                } else {
                  continue; 
                }
              } catch (e) {
                console.error("Failed to auto-create author", e);
                continue;
              }
            }

            if (expressAuthor) allSelected.push(expressAuthor);
          }

          setSelectedAuthors(allSelected);
          
          if (didCreateOrUpdate) {
            const res = await fetch(`${API_URL}/api/authors`);
            if (res.ok) {
              const updatedDbAuthors = await res.json();
              setAuthors(updatedDbAuthors);
              setSelectedAuthors((prev) => prev.map(sa => {
                const upDb = updatedDbAuthors.find((ua: Author) => ua.id === sa.id);
                return upDb ? { ...sa, profile_image: upDb.profile_image } : sa;
              }));
            }
          }
          
          onValidChange?.();
        };

        processImports();
      }
    }, [dbAuthorsFetched, initialAuthorsStr, authors, onValidChange, imageErrors]);

    const filtered = authors.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) &&
        !selectedAuthors.some((s) => s.id === a.id)
    );

    const addAuthor = (author: Author) => {
      setSelectedAuthors((prev) => [...prev, author]);
      setSearch("");
      onValidChange?.(); 
    };

    const removeAuthor = (id: number) => {
      setSelectedAuthors((prev) => prev.filter((a) => a.id !== id));
      if (editingAuthorId === id) resetForm(); // Close edit form if the author is removed
    };

    // Helper to reset the form states
    const resetForm = () => {
      setSearch("");
      setAuthorImage(null);
      setAuthorImagePreview(null);
      setAuthorBio("");
      setShowCreateForm(false);
      setEditingAuthorId(null);
    };

    // Populate the form with the selected author's data
    const startEditAuthor = (author: Author) => {
      setSearch(author.name);
      setAuthorBio(author.bio || "");
      setEditingAuthorId(author.id);
      
      const pythonId = author.python_id || author.id;
      
      if (author.profile_image) {
        setAuthorImagePreview(`${API_URL}${author.profile_image}`);
      } else if (!imageErrors[pythonId]) {
        setAuthorImagePreview(`${CRMSERVER_API_URL}/api/authors/${pythonId}/photo`);
      } else {
        setAuthorImagePreview(null);
      }
      
      setShowCreateForm(true);
    };

    // Consolidated Save/Update Function
    const saveAuthor = async () => {
      const formData = new FormData();
      formData.append("name", search);
      if (authorImage) formData.append("profile_image", authorImage);
      if (authorBio) formData.append("bio", authorBio);

      if (editingAuthorId) {
        // --- UPDATE EXISTING AUTHOR ---
        const res = await fetch(`${API_URL}/api/authors/${editingAuthorId}`, {
          method: "PUT",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const updatedAuthor = {
            ...selectedAuthors.find(a => a.id === editingAuthorId)!,
            name: search,
            bio: authorBio,
            // Use the newly returned image path if the backend gives it to us
            ...(data.profile_image ? { profile_image: data.profile_image } : {})
          };

          // Update both the main pool and selected list
          setAuthors(prev => prev.map(a => a.id === editingAuthorId ? updatedAuthor : a));
          setSelectedAuthors(prev => prev.map(a => a.id === editingAuthorId ? updatedAuthor : a));
          
          resetForm();
          onValidChange?.(); 
        }
      } else {
        // --- CREATE NEW AUTHOR ---
        const res = await fetch(`${API_URL}/api/authors`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAuthors((prev) => [...prev, data]);
          setSelectedAuthors((prev) => [...prev, data]);
          resetForm();
          onValidChange?.(); 
        }
      }
    };

    return (
      <div className={`bg-white rounded-xl border p-4 border-gray-300`}>
        <h3 className="text-sm font-medium mb-3">
          Author <span className="text-red-500">*</span>
        </h3>

        {error && (
          <p className="text-red-500 text-xs mb-3 rounded px-2 py-1.5 bg-red-50 border border-red-200">
            {error}
          </p>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={editingAuthorId ? "Edit author name" : "Search or add author"}
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Hide dropdown if currently editing to prevent UI confusion */}
        {search && !editingAuthorId && (
          <div className="border rounded mt-1 bg-white shadow border-gray-300">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addAuthor(a)}
                className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm cursor-pointer"
              >
                {a.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  resetForm(); // clear edit state just in case
                  setSearch(search); // keep the typed text
                  setShowCreateForm(true);
                }}
                className="block w-full px-3 py-2 text-left text-blue-600 text-sm cursor-pointer"
              >
                + Add "{search}"
              </button>
            )}
          </div>
        )}

        {showCreateForm && (
          <div className="mt-3 space-y-2 pt-2 text-right">
            <div className="flex gap-5 text-left">
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
                        <span className="text-xs text-gray-500">Upload Author Image</span>
                        <span className="mt-1 text-[10px] text-gray-400">JPG, PNG, WebP</span>
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
                      setAuthorImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>

              <textarea
                placeholder="Author bio"
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded px-3 py-1.5 text-gray-600 text-xs cursor-pointer hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAuthor}
                className="rounded bg-blue-600 px-3 py-1.5 text-white text-xs cursor-pointer hover:bg-blue-700 transition-colors"
              >
                {editingAuthorId ? "Update Author" : "Save Author"}
              </button>
            </div>
          </div>
        )}

        {/* Selected authors */}
        <div className="mt-3 space-y-2">
          {selectedAuthors.map((a) => {
            const pythonId = a.python_id || a.id;

            return (
              <div
                key={a.id}
                className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center border border-gray-400">
                    
                    {a.profile_image ? (
                      <img
                        src={`${API_URL}${a.profile_image}`}
                        alt={a.name}
                        className="h-full w-full object-cover"
                      />
                    ) : !imageErrors[pythonId] ? (
                      <img
                        src={`${CRMSERVER_API_URL}/api/authors/${pythonId}/photo`}
                        alt={a.name}
                        className="h-full w-full object-cover"
                        onError={() => setImageErrors((prev) => ({ ...prev, [pythonId]: true }))}
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                    )}

                  </div>
                  <span className="text-sm font-medium text-gray-700">{a.name}</span>
                </div>
                
                {/* Actions: Edit & Remove */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditAuthor(a)}
                    className="text-gray-500 hover:text-blue-600 cursor-pointer p-1 transition-colors"
                    title="Edit Author"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAuthor(a.id)}
                    className="text-gray-500 hover:text-red-600 cursor-pointer p-1 transition-colors"
                    title="Remove Author"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default ReadyToGoProductAuthor;