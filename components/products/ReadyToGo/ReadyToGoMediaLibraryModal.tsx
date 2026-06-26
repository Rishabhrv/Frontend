"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Upload, Check, ChevronLeft, ChevronRight } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const PAGE_LIMIT = 40;

export type MediaImage = {
  id: string;
  url: string;
  filename: string;
  size?: number;
  width?: number;
  height?: number;
  created_at?: string;
  alt_text?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (data: any) => void;
  folder: "products" | "gallery";
  productId?: number;
  title?: string;
  confirmLabel?: string;
  multiple?: boolean;
  externalImages?: MediaImage[]; // 👈 NEW: Allow parent to inject fetched images
};

const globalSessionTempImages: Record<string, MediaImage[]> = {
  products: [],
  gallery: [],
};

export default function ReadyToGoMediaLibraryModal({
  open,
  onClose,
  onSelect,
  folder,
  productId,
  title = "Product image",
  confirmLabel = "Set product image",
  multiple = false,
  externalImages = [], // 👈 NEW: Default to empty array
}: Props) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [images, setImages] = useState<MediaImage[]>([]);
  const [selected, setSelected] = useState<MediaImage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [fileName, setFileName] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  const [tempImages, setTempImages] = useState<MediaImage[]>(globalSessionTempImages[folder] || []);

  const activeImage = selected.length > 0 ? selected[selected.length - 1] : null;

  /* ── Fetch page of images ─────────────────────────────────────────────── */
  const fetchImages = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          folder,
          q: search,
          page: String(p),
          limit: String(PAGE_LIMIT),
        });
        if (productId) params.set("productId", String(productId));
        const res = await fetch(`${API_URL}/api/media?${params}`);
        const data = await res.json();
        setImages(Array.isArray(data.images) ? data.images : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      } catch {
        setImages([]);
        setTotal(0);
        setTotalPages(1);
      }
      setLoading(false);
    },
    [folder, search, productId]
  );

  useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch("");
      setPage(1);
      setTab("library");
      setTempImages(globalSessionTempImages[folder] || []);
      fetchImages(1);
    }
  }, [open, fetchImages, folder]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchImages(1), 350);
    return () => clearTimeout(t);
  }, [search, open, fetchImages]);

  useEffect(() => {
    if (activeImage) {
      setFileName(activeImage.filename.replace(/\.[^/.]+$/, ""));
      fetch(`${API_URL}/api/media/alt?file_path=${encodeURIComponent(activeImage.url)}`)
        .then((res) => res.json())
        .then((data) => setAltText(data.alt_text || ""))
        .catch(() => setAltText(""));
    }
  }, [activeImage]);

  /* ── Upload ───────────────────────────────────────────────────────────── */
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newlyUploaded: MediaImage[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("image", file);
      if (productId) {
        fd.append("productId", String(productId));
      }
      try {
        const res = await fetch(`${API_URL}/api/media/upload?folder=${folder}`, { method: "POST", body: fd });
        const data = await res.json();
        const fileUrl = data.url || data.image || data.filePath || data.path;
        
        if (fileUrl) {
          newlyUploaded.push({
            id: data.id || data.filename || `temp-${Date.now()}-${Math.random()}`,
            url: fileUrl,
            filename: data.filename || file.name,
          });
        }
      } catch {}
    }

    setUploading(false);
    setTab("library");

    if (newlyUploaded.length > 0) {
      const updatedTemp = [...newlyUploaded, ...(globalSessionTempImages[folder] || [])];
      globalSessionTempImages[folder] = updatedTemp;
      setTempImages(updatedTemp);
    }
    fetchImages(1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onSelect(multiple ? selected : selected[0]);
    onClose();
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setSelected([]);
    fetchImages(p);
  };

  if (!open) return null;

  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | "…")[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("…");
    if (page + delta < totalPages - 1) range.push("…");
    if (totalPages > 1) range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  /* 👇 NEW: Merge externalImages into the displayed list */
  const combinedImages = [...externalImages, ...tempImages, ...images].filter(
    (img, index, self) => index === self.findIndex((t) => t.url === img.url || t.id === img.id)
  );

  const displayImages = combinedImages.filter(img =>
    img.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-white w-[90vw] max-w-5xl h-[85vh] flex flex-col rounded shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white px-4 shrink-0">
          <button type="button" onClick={() => setTab("upload")} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === "upload" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
            Upload files
          </button>
          <button type="button" onClick={() => setTab("library")} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === "library" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
            Media Library
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {tab === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`w-full max-w-lg border-2 border-dashed rounded-lg p-16 text-center transition-colors ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"}`}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Uploading…</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-3">Drop files to upload</p>
                    <p className="text-sm text-gray-400 mb-4">or</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Select Files
                    </button>
                    <p className="mt-4 text-xs text-gray-400">Maximum upload file size: 2 GB.</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={(e) => handleUpload(e.target.files)} />
            </div>
          )}

          {tab === "library" && (
            <>
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0">
                  <div className="relative w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search images…" className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">
                    {displayImages.length > 0 ? `${displayImages.length} image${displayImages.length !== 1 ? "s" : ""}` : ""}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-7 h-7 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : displayImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <Upload className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">No images found in the library.</p>
                      <button type="button" onClick={() => setTab("upload")} className="mt-3 text-xs text-blue-500 hover:underline">
                        Upload a new image →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 gap-1.5">
                      {displayImages.map((img) => {
                        const isSel = selected.some((s) => s.id === img.id);
                        
                        // 👇 NEW: Check if URL is absolute (Drive/HTTP) or relative.
                        const imgSrc = img.url.startsWith("http") || img.url.startsWith("blob:") 
                          ? img.url 
                          : `${API_URL}${img.url}`;

                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => {
                              if (multiple) {
                                if (isSel) setSelected((prev) => prev.filter((s) => s.id !== img.id));
                                else setSelected((prev) => [...prev, img]);
                              } else {
                                if (isSel) setSelected([]);
                                else setSelected([img]);
                              }
                            }}
                            className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${isSel ? "border-blue-600 shadow-md" : "border-transparent hover:border-gray-300"}`}
                          >
                            <img src={imgSrc} alt={img.alt_text || img.filename} className="w-full h-full object-cover" loading="lazy" />
                            {isSel && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {activeImage && (
                <div className="w-60 border-l border-gray-200 overflow-y-auto shrink-0 flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachment Details</p>
                    {/* 👇 Ensure absolute URLs render in sidebar properly too */}
                    <img 
                      src={activeImage.url.startsWith("http") || activeImage.url.startsWith("blob:") ? activeImage.url : `${API_URL}${activeImage.url}`} 
                      alt={activeImage.filename} 
                      className="w-full rounded border border-gray-200 object-cover max-h-36" 
                    />
                  </div>
                  <div className="p-4 space-y-2 text-xs text-gray-600 flex-1">
                    <p className="font-medium text-gray-800 break-all leading-snug">{activeImage.filename}</p>
                    
                    <div className="pt-2 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">File Name</label>
                        <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Alt Text</label>
                        <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image…" className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`${API_URL}/api/media/alt`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ file_path: activeImage.url, alt_text: altText }),
                        });
                        const originalName = activeImage.filename.replace(/\.[^/.]+$/, "");
                        if (fileName !== originalName && !activeImage.url.startsWith("http")) {
                          // Rename local files (Skip rename for external Google Drive links)
                          const res = await fetch(`${API_URL}/api/media/rename`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ old_path: activeImage.url, new_name: fileName }),
                          });
                          const data = await res.json();
                          if (data.success) fetchImages(page);
                          else { setToastMsg(data.message || "Rename failed"); setToastOpen(true); }
                        } else {
                          setToastMsg("Saved successfully");
                          setToastOpen(true);
                        }
                      }}
                      className="w-full mt-3 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white shrink-0">
          {multiple && selected.length > 0 && (
            <span className="text-sm font-medium text-gray-600 mr-auto">{selected.length} image(s) selected</span>
          )}
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={selected.length === 0} className="px-5 py-2 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
  );
}