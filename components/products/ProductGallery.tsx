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
import MediaLibraryModal, { type MediaImage } from "./MediaLibraryModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type GalleryImage = {
  id: string | number;
  file?: File;
  preview: string;
  isExisting?: boolean;
  url?: string; 
};

type Props = {
  productId?: number;
  mode?: "add" | "edit";
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

const ProductGallery = forwardRef<any, Props>(({ productId, mode, error, onValidChange }, ref) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [deletedImages, setDeletedImages] = useState<(string | number)[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    getGalleryData: () => ({
      existing: images
        .filter((i) => i.isExisting)
        .map((img, index) => ({ id: img.id, sort_order: index })),
      newFiles: images
        .filter((i) => !i.isExisting && i.file)
        .map((i) => i.file),
      newUrls: images 
        .filter((i) => !i.isExisting && !i.file && (i as any).url)
        .map((i) => (i as any).url),
      deleted: deletedImages,
    }),
  }));

  const removeImage = (id: string | number) => {
    const img = images.find((i) => i.id === id);
    if (img?.isExisting) setDeletedImages((prev) => [...prev, id]);
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

  // 🔥 Update to handle multiple images returned securely.
  const handleMediaSelect = (selectedData: any) => {
    // MediaLibrary returns array because `multiple={true}`
    const selectedMedias = Array.isArray(selectedData) ? selectedData : [selectedData];
    
    const newImages = selectedMedias.map((media: MediaImage) => ({
      id: media.id,
      preview: `${API_URL}${media.url}`,
      isExisting: false,
      url: media.url,
    }));

    setImages((prev) => {
      // Prevent duplicating items already mapped in local state
      const existingIds = new Set(prev.map(p => p.id));
      const toAdd = newImages.filter((n: any) => !existingIds.has(n.id));
      return [...prev, ...toAdd];
    });

    onValidChange?.();
  };

  useEffect(() => {
    if (!productId) return;
    fetch(`${API_URL}/api/products/${productId}/gallery`)
      .then((res) => res.json())
      .then((data) => {
        setImages(
          data.map((img: any) => ({
            id: img.id,
            preview: `${API_URL}${img.image_path}`,
            isExisting: true,
          }))
        );
      });
  }, [productId]);

  return (
    <>
      <div className={`bg-white rounded-xl border p-4 border-gray-300 `}>
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          Product Gallery <span className="text-red-500">*</span>
        </h3>

        {error && (
          <p className="text-red-500 text-xs mb-3  rounded px-2 py-1.5">
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

      <MediaLibraryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleMediaSelect}
        folder="gallery"
        productId={productId}
        title="Product Gallery"
        confirmLabel="Add to gallery"
        multiple={true} // 🔥 SET MULTIPLE SELECT TO TRUE
      />
    </>
  );
});

ProductGallery.displayName = "ProductGallery";
export default ProductGallery;