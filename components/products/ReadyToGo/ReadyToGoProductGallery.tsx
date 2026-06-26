"use client";

import {
  useRef, useState, forwardRef, useImperativeHandle, useEffect,
} from "react";
import { X, ImagePlus } from "lucide-react";
import {
  DndContext, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReadyToGoMediaLibraryModal, { type MediaImage } from "./ReadyToGoMediaLibraryModal"; 

const CRMSERVER_API_URL = process.env.NEXT_PUBLIC_CRMSERVER_API_URL;
type GalleryImage = {
  id: string | number;
  file?: File;
  preview: string;
  isExisting?: boolean;
  url?: string; 
};

type Props = {
  initialGalleryUrls?: string[]; 
  bookId?: string | number; // 👈 NEW: Accepts bookId to fetch from Drive
  error?: string;
  onValidChange?: () => void;
};

function SortableImage({
  img,
  onRemove,
}: {
  img: GalleryImage;
  onRemove: (id: string | number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: img.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative group aspect-square rounded border border-gray-300 overflow-hidden"
    >
      <div {...attributes} {...listeners} className="h-full w-full cursor-grab">
        <img src={img.preview} className="h-full w-full object-cover pointer-events-none" />
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
        className="absolute right-1 top-1 bg-black/60 p-1 rounded-full text-white flex items-center justify-center z-10 cursor-pointer"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}



const ReadyToGoProductGallery = forwardRef<any, Props>(({ initialGalleryUrls, bookId, error, onValidChange }, ref) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    getGalleryData: () => ({
      existing: [], 
      newFiles: images
        .filter((i) => !i.isExisting && i.file)
        .map((i) => i.file),
      newUrls: images
        .filter((i) => !i.isExisting && !i.file && i.url)
        .map((i) => i.url),
      deleted: [],
    }),
  }));

  // ── INIT DATA FETCH FROM PARENT ───────────────────────
  useEffect(() => {
    if (initialGalleryUrls && initialGalleryUrls.length > 0) {
      const initialImages = initialGalleryUrls.map((url, idx) => ({
        id: `imported-${idx}-${Date.now()}`,
        preview: url, 
        isExisting: false, 
        url: url, 
      }));
      setImages(initialImages);
    }
  }, [initialGalleryUrls]);

// ── FETCH ALL IMAGES FROM GOOGLE DRIVE ────────────────
  useEffect(() => {
    const fetchDriveGallery = async () => {
      if (!bookId) return;
      try {
        const res = await fetch(`${CRMSERVER_API_URL}/api/books/${bookId}/gallery-images`);
        if (res.ok) {
          const data = await res.json();
          if (data.urls && data.urls.length > 0) {
            
            // 👇 Convert all Drive URLs into native File objects
            const driveImages = await Promise.all(
              data.urls.map(async (url: string, idx: number) => {
                const imageRes = await fetch(url);
                const blob = await imageRes.blob();
                const ext = blob.type.split('/')[1] || 'jpg';
                const file = new File([blob], `drive-gallery-${idx}.${ext}`, { type: blob.type });
                
                return {
                  id: `drive-${idx}-${Date.now()}`,
                  preview: url,
                  isExisting: false,
                  file: file, // 👈 KEY FIX: Assigned as a file, not a url string
                };
              })
            );
            
            // Append images to gallery, preventing duplicates
            setImages((prev) => {
              const existingPreviews = prev.map((p) => p.preview);
              const newImages = driveImages.filter((img) => !existingPreviews.includes(img.preview));
              return [...prev, ...newImages];
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch drive gallery", err);
      }
    };

    fetchDriveGallery();
  }, [bookId]);

  const removeImage = (id: string | number) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleMediaSelect = async (mediaData: MediaImage | MediaImage[]) => {
    // Ensure we are working with an array
    const selectedImages = Array.isArray(mediaData) ? mediaData : [mediaData];

    const newGalleryImages = selectedImages.map((media) => ({
      id: media.id,
      preview: `${CRMSERVER_API_URL}${media.url}`,
      isExisting: false,
      url: media.url,
    }));

    setImages((prev) => [...prev, ...newGalleryImages]);
    onValidChange?.();
  };

  // Transform existing gallery state images to pass into the modal
  const externalGalleryImages = images.map((img, idx) => ({
    id: String(img.id),
    url: img.preview,
    filename: img.file?.name || `Gallery Image ${idx + 1}.jpg`,
  }));

  return (
    <>
      <div className={`bg-white rounded-xl border p-4 border-gray-300 `}>
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          Product Gallery <span className="text-red-500">*</span>
        </h3>

        {error && (
          <p className="text-red-500 text-xs mb-3 rounded px-2 py-1.5 bg-red-50 border border-red-200">
            {error}
          </p>
        )}

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img) => (
                <SortableImage key={img.id} img={img} onRemove={removeImage} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          <ImagePlus className="h-4 w-4" />
          Add product gallery images
        </button>
      </div>

      <ReadyToGoMediaLibraryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleMediaSelect}
        folder="gallery"
        title="Product Gallery"
        confirmLabel="Add to gallery"
        multiple={true}
        externalImages={externalGalleryImages} // 👈 ADD THIS LINE
      />
    </>
  );
});

ReadyToGoProductGallery.displayName = "ReadyToGoProductGallery";
export default ReadyToGoProductGallery;