"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { X, ImagePlus } from "lucide-react";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* TYPES */
type GalleryImage = {
  id: number;
  file?: File;
  preview: string;
  isExisting?: boolean;
};

type Props = {
  productId?: number;
};

/* DRAGGABLE ITEM */
function SortableImage({
  img,
  onRemove,
}: {
  img: GalleryImage;
  onRemove: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group aspect-square rounded border border-gray-300 overflow-hidden cursor-grab"
    >
      <img
        src={img.preview}
        className="h-full w-full object-cover pointer-events-none"
      />

      <button
        type="button"
        onClick={() => onRemove(img.id)}
        className="absolute right-1 top-1 hidden group-hover:block bg-black/60 p-1 rounded-full text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

const ProductGallery = forwardRef<any, Props>(({ productId }, ref) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);


  /* expose ordered NEW images only */
  useImperativeHandle(ref, () => ({
  getGalleryData: () => ({
    existing: images
      .filter(i => i.isExisting)
      .map((img, index) => ({
        id: img.id,
        sort_order: index,
      })),
    newFiles: images
      .filter(i => !i.isExisting && i.file)
      .map(i => i.file),
    deleted: deletedImages,
  }),
}));


  /* ADD FILES */
  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: GalleryImage[] = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  /* REMOVE */
  const removeImage = (id: number) => {
  const img = images.find(i => i.id === id);

  if (img?.isExisting) {
    setDeletedImages(prev => [...prev, id]);
  }

  setImages(prev => prev.filter(i => i.id !== id));
};


  /* DRAG END */
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  /* LOAD EXISTING IMAGES */
  useEffect(() => {
    if (!productId) return;

    fetch(`${API_URL}/api/products/${productId}/gallery`)
      .then((res) => res.json())
      .then((data) => {
        const existing: GalleryImage[] = data.map((img: any) => ({
          id: img.id,
          preview: `${API_URL}${img.image_path}`,
          isExisting: true,
        }));

        setImages(existing);
      });
  }, [productId]);

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Product gallery
      </h3>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-2 mb-3">
            {images.map((img) => (
              <SortableImage
                key={img.id}
                img={img}
                onRemove={removeImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 text-sm text-blue-600"
      >
        <ImagePlus className="h-4 w-4" />
        Add product gallery images
      </button>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
});

export default ProductGallery;
