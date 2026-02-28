"use client";

import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { Upload, Eye } from "lucide-react";
import ProductAttributes from "./ProductAttributes";
import ProductGallery from "./ProductGallery";
import ProductAuthor from "./ProductAuthor";
import PopupModal from "../Popups/PopupModal";
import AlertPopup from "@/components/Popups/AlertPopup";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import SeoPanel from "./SeoPanel";
import MediaLibraryModal from "./MediaLibraryModal";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────
type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
};

type Props = {
  mode?: "add" | "edit";
  productId?: number;
};

type ProductImage = {
  file_path: string;
  alt_text: string | null;
  source: "main" | "gallery";
};

// ── Helpers (outside component so they never remount) ────────────
function buildCategoryTree(categories: Category[]): Category[] {
  const map: Record<number, Category> = {};
  const roots: Category[] = [];
  categories.forEach((cat) => { map[cat.id] = { ...cat, children: [] }; });
  categories.forEach((cat) => {
    if (cat.parent_id) map[cat.parent_id]?.children?.push(map[cat.id]);
    else roots.push(map[cat.id]);
  });
  return roots;
}

// ── CategoryNode MUST be outside AddProductFrom ──────────────────
// If defined inside, React remounts it on every render (new function
// reference each time), resetting checkbox state in edit mode.
type CategoryNodeProps = {
  category: Category;
  level?: number;
  selectedCategories: number[];
  toggleCategory: (id: number) => void;
};

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category, level = 0, selectedCategories, toggleCategory,
}) => (
  <div style={{ marginLeft: level * 16, marginTop: level * 7 }}>
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={selectedCategories.includes(category.id)}
        onChange={() => toggleCategory(category.id)}
        className="w-3 h-3"
      />
      <span>{category.name}</span>
    </label>
    {category.children?.map((child) => (
      <CategoryNode
        key={child.id}
        category={child}
        level={level + 1}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
      />
    ))}
  </div>
);

// ── Req asterisk (also outside to avoid remount) ─────────────────
const Req = () => <span className="text-red-500 ml-0.5">*</span>;

// ── API URL ───────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ─────────────────────────────────────────────────────────────────
const AddProductFrom = ({ mode = "add", productId }: Props) => {
  const [productType, setProductType] = useState<"ebook" | "physical" | "both">("physical");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [ebookPrice, setEbookPrice] = useState("");
  const [ebookSellPrice, setEbookSellPrice] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("published");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const attributesRef = useRef<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const galleryRef = useRef<any>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const authorRef = useRef<any>(null);
  const [existingEbook, setExistingEbook] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    open: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ open: false, type: "success", title: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [existingEbookType, setExistingEbookType] = useState<string | null>(null);
  const router = useRouter();
  const [needsConversion, setNeedsConversion] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFilePath, setConvertedFilePath] = useState<string | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mainImageAlt, setMainImageAlt] = useState("");
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const fetchProductImages = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/media/product-images/${id}`);
      const data = await res.json();
      setProductImages(Array.isArray(data) ? data : []);
    } catch {
      setProductImages([]);
    }
  };

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    fetch(`${API_URL}/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price);
        setSellPrice(data.sell_price);
        setStock(data.stock);
        setSlug(data.slug || "");
        setSku(data.sku);
        setStatus(data.status);
        setProductType(data.product_type);
        setWeight(data.weight || "");
        setLength(data.length || "");
        setWidth(data.width || "");
        setHeight(data.height || "");
        setSelectedCategories(data.category_ids || []);
        setMetaTitle(data.meta_title || "");
        setMetaDescription(data.meta_description || "");
        setKeywords(data.keywords || "");
        if (data.main_image) setPreview(`${API_URL}${data.main_image}`);
        if (data.ebook_path) {
          setExistingEbook(`${API_URL}${data.ebook_path}`);
          setExistingEbookType(data.ebook_type);
        }
        setEbookPrice(data.ebook_price);
        setEbookSellPrice(data.ebook_sell_price);
      });
    fetchProductImages(productId);
  }, [mode, productId]);

  if (productId) fetchProductImages(productId);

  // ── Validation ──────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Product title is required";

    if (status === "published") {
      if (!description) newErrors.description = "Description is required";
      if (mode === "add" && !productImage) newErrors.image = "Product image is required";
      if (!sku.trim()) newErrors.sku = "SKU is required";
      if (selectedCategories.length === 0)
        newErrors.categories = "At least one category is required";

      if (productType === "physical" || productType === "both") {
        if (!price) newErrors.price = "Cost price is required";
        if (!sellPrice) newErrors.sellPrice = "Selling price is required";
        if (!stock) newErrors.stock = "Stock is required";
        if (!weight) newErrors.weight = "Weight is required";
        if (!length) newErrors.length = "Length is required";
        if (!width) newErrors.width = "Width is required";
        if (!height) newErrors.height = "Height is required";
      }

      if (productType === "ebook" || productType === "both") {
        if (!ebookPrice) newErrors.ebookPrice = "E-book price is required";
        if (!ebookSellPrice) newErrors.ebookSellPrice = "E-book selling price is required";
        if (mode === "add" && !ebookFile && !existingEbook)
          newErrors.ebookFile = "E-book file is required";
      }

      const attributes = attributesRef.current?.getAttributes() || [];
      if (attributes.length === 0)
        newErrors.attributes = "At least one attribute (with name & value) is required";

      const authors = authorRef.current?.getAuthors() || [];
      if (authors.length === 0)
        newErrors.authors = "At least one author is required";

      const galleryData = galleryRef.current?.getGalleryData();
      const totalGalleryImages =
        (galleryData?.existing?.length || 0) + (galleryData?.newFiles?.length || 0);
      if (totalGalleryImages === 0)
        newErrors.gallery = "At least one gallery image is required";

      if (!keywords.trim()) newErrors.keywords = "Focus keyphrase is required";
      if (!metaTitle.trim()) newErrors.metaTitle = "SEO title is required";
      if (mode === "edit" && !slug.trim()) newErrors.slug = "Slug is required";
      if (!metaDescription.trim())
        newErrors.metaDescription = "Meta description is required";
      else if (metaDescription.length < 120 || metaDescription.length > 160)
        newErrors.metaDescription = `Meta description must be 120–160 characters (currently ${metaDescription.length})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (key: string) =>
    setErrors((prev) => ({ ...prev, [key]: "" }));

  const handlePreview = () => {
    if (!existingEbook) return;
    router.push(`/admin/product/PreviewPage?slug=${slug}`);
  };

  const handleConvert = async () => {
    if (!ebookFile) return;
    setIsConverting(true);
    const attributes = attributesRef.current?.getAttributes() || [];
    const authors = authorRef.current?.getAuthors() || [];
    const formData = new FormData();
    formData.append("file", ebookFile);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("sell_price", sellPrice);
    formData.append("stock", stock);
    formData.append("sku", sku);
    formData.append("product_type", productType);
    formData.append("status", status);
    formData.append("weight", weight);
    formData.append("length", length);
    formData.append("width", width);
    formData.append("height", height);
    formData.append("ebook_price", ebookPrice);
    formData.append("ebook_sell_price", ebookSellPrice);
    formData.append("categories", JSON.stringify(selectedCategories));
    formData.append("authors", JSON.stringify(authors));
    formData.append("attributes", JSON.stringify(attributes));
    formData.append("meta_title", metaTitle);
    formData.append("meta_description", metaDescription);
    formData.append("keywords", keywords);
    if (productId) formData.append("product_id", String(productId));
    try {
      const res = await fetch(`${API_URL}/api/products/convert-doc`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setConvertedFilePath(data.epubPath);
      if (!productId && data.productId) {
        router.replace(`/admin/product/EditProduct?id=${data.productId}`);
      }
      setNeedsConversion(false);
    } catch (error: any) {
      setToastMsg(error.message);
      setToastOpen(true);
    }
    setIsConverting(false);
  };

  const handleSubmit = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    const attributes = attributesRef.current?.getAttributes() || [];
    const galleryData = galleryRef.current?.getGalleryData();
    const authors = authorRef.current?.getAuthors() || [];
    const formData = new FormData();

    if (productImage) formData.append("image", productImage);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("sell_price", sellPrice);
    formData.append("stock", stock);
    formData.append("sku", sku);
    if (mode === "edit") formData.append("slug", slug);
    formData.append("product_type", productType);
    formData.append("status", status);
    formData.append("weight", weight);
    formData.append("length", length);
    formData.append("width", width);
    formData.append("height", height);
    if (convertedFilePath) {
      formData.append("converted_epub", convertedFilePath);
    } else if (ebookFile) {
      formData.append("ebook", ebookFile);
    }
    formData.append("ebook_price", ebookPrice);
    formData.append("ebook_sell_price", ebookSellPrice);
    formData.append("attributes", JSON.stringify(attributes));
    formData.append("authors", JSON.stringify(authors));
    formData.append("categories", JSON.stringify(selectedCategories));
    formData.append("meta_title", metaTitle);
    formData.append("meta_description", metaDescription);
    formData.append("keywords", keywords);

    if (galleryData) {
      formData.append("existingGallery", JSON.stringify(galleryData.existing));
      formData.append("deletedGallery", JSON.stringify(galleryData.deleted));
      galleryData.newFiles.forEach((file: File) => formData.append("gallery", file));
    }

    const url =
      mode === "edit" ? `${API_URL}/api/products/${productId}` : `${API_URL}/api/products`;
    const method = mode === "edit" ? "PUT" : "POST";
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();

    if (!res.ok) {
      setPopup({ open: true, type: "error", title: "Error", message: data.message || "Something went wrong" });
      return;
    }
    setPopup({
      open: true,
      type: "success",
      title: "Success",
      message: mode === "edit" ? "Product updated successfully" : "Product added successfully",
    });
  };

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data));
  }, []);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    clearError("categories");
  };

  const categoryTree = buildCategoryTree(categories);
  const isPublishing = status === "published";

  return (
    <div className="p-6 pr-2">
      <h1 className="mb-6 text-xl font-semibold text-gray-800">
        {mode === "edit" ? "Edit Product" : "Add New Product"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ══════════════ LEFT FORM ══════════════ */}
        <div className="lg:col-span-3 space-y-6">

          {/* BASIC INFO */}
          <div className="bg-white rounded-xl border p-6 border-gray-300">
            <h2 className="mb-4 font-medium text-gray-700">Basic Information</h2>
            <div className="flex gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Product Title <Req /></label>
                  <input
                    type="text" placeholder="Enter Product Title"
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.title ? "border-red-400" : ""}`}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); clearError("title"); }}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    Full Description {isPublishing && <Req />}
                  </label>
                  <RichTextEditor
                    value={description}
                    onChange={(value) => { setDescription(value); clearError("description"); }}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* PRICING & STOCK */}
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <h2 className="mb-4 font-medium text-gray-700">Pricing & Stock</h2>
            <div className="grid gap-5">
              {(productType === "physical" || productType === "both") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Cost Price {isPublishing && <Req />}</label>
                    <input type="number" placeholder="₹0.00"
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.price ? "border-red-400" : ""}`}
                      value={price} onChange={(e) => { setPrice(e.target.value); clearError("price"); }} />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Selling Price {isPublishing && <Req />}</label>
                    <input type="number" placeholder="₹0.00"
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.sellPrice ? "border-red-400" : ""}`}
                      value={sellPrice} onChange={(e) => { setSellPrice(e.target.value); clearError("sellPrice"); }} />
                    {errors.sellPrice && <p className="text-red-500 text-xs mt-1">{errors.sellPrice}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Stock {isPublishing && <Req />}</label>
                    <input type="number" placeholder="0"
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.stock ? "border-red-400" : ""}`}
                      value={stock} onChange={(e) => { setStock(e.target.value); clearError("stock"); }} />
                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">SKU {isPublishing && <Req />}</label>
                  <input type="text" placeholder="AGPH-001"
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.sku ? "border-red-400" : ""}`}
                    value={sku} onChange={(e) => { setSku(e.target.value); clearError("sku"); }} />
                  {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Product Type</label>
                  <select value={productType} onChange={(e) => setProductType(e.target.value as any)}
                    className="w-full rounded border px-3 py-2 text-sm">
                    <option value="physical">Physical</option>
                    <option value="ebook">E-book</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* E-BOOK FILE */}
          {(productType === "ebook" || productType === "both") && (
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h2 className="mb-4 font-medium text-gray-700">E-book File</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm mb-1">E-book Price {isPublishing && <Req />}</label>
                  <input type="number" placeholder="₹0.00"
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.ebookPrice ? "border-red-400" : ""}`}
                    value={ebookPrice} onChange={(e) => { setEbookPrice(e.target.value); clearError("ebookPrice"); }} />
                  {errors.ebookPrice && <p className="text-red-500 text-xs mt-1">{errors.ebookPrice}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">E-book Selling Price {isPublishing && <Req />}</label>
                  <input type="number" placeholder="₹0.00"
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.ebookSellPrice ? "border-red-400" : ""}`}
                    value={ebookSellPrice} onChange={(e) => { setEbookSellPrice(e.target.value); clearError("ebookSellPrice"); }} />
                  {errors.ebookSellPrice && <p className="text-red-500 text-xs mt-1">{errors.ebookSellPrice}</p>}
                </div>
              </div>

              {existingEbook && !ebookFile && (
                <div className="flex justify-between">
                  <div className="text-sm text-green-700">
                    📘 Existing file:
                    <a href={existingEbook} target="_blank" className="ml-1 underline text-blue-600">View / Download</a>
                  </div>
                  {mode === "edit" && existingEbookType === "epub" && !ebookFile && (
                    <div className="mt-3">
                      <button type="button" onClick={handlePreview}
                        className="p-1 m-1 bg-gray-800 text-white rounded hover:bg-gray-700 cursor-pointer">
                        <Eye width={20} height={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <label className="cursor-pointer block">
                <div className={`flex items-center justify-center border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 ${errors.ebookFile ? "border-red-400" : "border-gray-300"}`}>
                  <div className="text-gray-500">
                    <Upload className="mx-auto mb-2 h-6 w-6" />
                    <p className="text-sm">
                      {ebookFile ? ebookFile.name : existingEbook ? "Replace e-book file" : "Drag & drop file or browse"}
                    </p>
                  </div>
                </div>
                <input type="file" accept=".doc,.docx,.epub" hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ext = file.name.split(".").pop()?.toLowerCase();
                    setNeedsConversion(ext === "doc" || ext === "docx");
                    setEbookFile(file);
                    clearError("ebookFile");
                  }} />
              </label>
              {errors.ebookFile && <p className="text-red-500 text-xs mt-1">{errors.ebookFile}</p>}

              {needsConversion && ebookFile && !convertedFilePath && (
                <div className="mt-3">
                  <button type="button" disabled={isConverting} onClick={handleConvert}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                    {isConverting ? "Converting..." : "Convert to EPUB"}
                  </button>
                </div>
              )}
              {convertedFilePath && (
                <div className="mt-3">
                  <button type="button"
                    onClick={() => router.push(`/admin/product/TempPreviewPage?temp=${convertedFilePath}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer">
                    Preview Converted EPUB
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SHIPPING */}
          {(productType === "physical" || productType === "both") && (
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h2 className="mb-4 font-medium text-gray-700">Shipping Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Weight (kg) {isPublishing && <Req />}</label>
                  <input type="number" placeholder="0.5"
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.weight ? "border-red-400" : ""}`}
                    value={weight} onChange={(e) => { setWeight(e.target.value); clearError("weight"); }} />
                  {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Dimensions (cm) {isPublishing && <Req />}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input type="number" placeholder="L" value={length}
                        className={`w-full rounded border px-3 py-2 text-sm ${errors.length ? "border-red-400" : ""}`}
                        onChange={(e) => { setLength(e.target.value); clearError("length"); }} />
                      {errors.length && <p className="text-red-500 text-xs mt-1">{errors.length}</p>}
                    </div>
                    <div>
                      <input type="number" placeholder="W" value={width}
                        className={`w-full rounded border px-3 py-2 text-sm ${errors.width ? "border-red-400" : ""}`}
                        onChange={(e) => { setWidth(e.target.value); clearError("width"); }} />
                      {errors.width && <p className="text-red-500 text-xs mt-1">{errors.width}</p>}
                    </div>
                    <div>
                      <input type="number" placeholder="H" value={height}
                        className={`w-full rounded border px-3 py-2 text-sm ${errors.height ? "border-red-400" : ""}`}
                        onChange={(e) => { setHeight(e.target.value); clearError("height"); }} />
                      {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ProductAttributes
            ref={attributesRef}
            mode={mode}
            productId={productId}
            error={errors.attributes}
            onValidChange={() => clearError("attributes")}
          />

          <ProductAuthor
            ref={authorRef}
            mode={mode}
            productId={productId}
            error={errors.authors}
            onValidChange={() => clearError("authors")}
          />

          <SeoPanel
            title={title}
            slug={slug}
            description={description}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            keywords={keywords}
            onMetaTitleChange={(v) => { setMetaTitle(v); clearError("metaTitle"); }}
            onMetaDescriptionChange={(v) => { setMetaDescription(v); clearError("metaDescription"); }}
            onKeywordsChange={(v) => { setKeywords(v); clearError("keywords"); }}
            onSlugChange={(v) => { setSlug(v); clearError("slug"); }}
            productImages={productImages}
            errors={{
              keywords: errors.keywords,
              metaTitle: errors.metaTitle,
              slug: errors.slug,
              metaDescription: errors.metaDescription,
            }}
          />
        </div>

        {/* ══════════════ RIGHT SIDEBAR ══════════════ */}
        <div className="space-y-6">

          {/* PRODUCT IMAGE */}
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium text-gray-700">
                Product Image {isPublishing && <Req />}
              </h2>
              {mode === "edit" && slug && (
                <Link href={`/product/${slug}`}
                  className="bg-black text-white p-1 px-2 rounded hover:bg-gray-800 text-sm w-fit">
                  <Eye className="mr-1 inline-block w-4 h-4" />Preview
                </Link>
              )}
            </div>
            <div className="w-full">
              <button type="button" onClick={() => setMediaModalOpen(true)} className="w-full">
                <div className={`flex cursor-pointer h-60 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 text-center hover:border-blue-500 overflow-hidden transition-colors ${errors.image ? "border-red-400" : "border-gray-300"}`}>
                  {preview ? (
                    <img src={preview} alt={mainImageAlt || "Product image"} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <span className="text-sm text-gray-500">Upload Product Image</span>
                      <span className="mt-1 text-xs text-gray-400">Click to open media library</span>
                    </>
                  )}
                </div>
              </button>
              {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
              {preview && (
                <button type="button"
                  onClick={() => { setPreview(null); setProductImage(null); setMainImageAlt(""); }}
                  className="mt-2 text-xs text-red-500 hover:underline w-full text-center cursor-pointer">
                  Remove image
                </button>
              )}
            </div>
          </div>

          {/* PUBLISH / STATUS */}
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <h2 className="mb-4 font-medium text-gray-700">Publish</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <select
                  className="rounded border px-2 py-1 text-sm"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    if (e.target.value === "draft") setErrors({});
                  }}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              {status === "draft" && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  Draft mode: only Product Title is required.
                </p>
              )}
              {status === "published" && (
                <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                  Published mode: all fields marked <span className="text-red-500 font-bold">*</span> are required.
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleSubmit}
                className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 cursor-pointer">
                {mode === "edit" ? "Update" : "Save"}
              </button>
              <a href="/admin/products" className="flex-1 rounded border px-4 py-2 text-sm text-center cursor-pointer">
                Cancel
              </a>
            </div>
          </div>

          {/* CATEGORY */}
          <div className="bg-white rounded-xl border border-gray-300 p-4">
            <h2 className="mb-4 font-medium text-gray-700">
              Category {isPublishing && <Req />}
            </h2>
            <div className="max-h-56 overflow-y-auto space-y-2 bg-gray-50 p-5 rounded-lg">
              {categoryTree.map((cat) => (
                <CategoryNode
                  key={cat.id}
                  category={cat}
                  selectedCategories={selectedCategories}
                  toggleCategory={toggleCategory}
                />
              ))}
            </div>
            {errors.categories && <p className="text-red-500 text-xs mt-2">{errors.categories}</p>}
          </div>

          {/* SLUG */}
          {mode === "edit" && (
            <div className="bg-white rounded-xl border border-gray-300 p-4">
              <h2 className="mb-3 font-medium text-gray-700">Product Slug</h2>
              <input type="text" value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="product-url-slug" />
              <p className="mt-1 text-xs text-gray-500">This will be used in product URL</p>
            </div>
          )}

          <ProductGallery
            ref={galleryRef}
            productId={mode === "edit" ? productId : undefined}
            error={errors.gallery}
            onValidChange={() => clearError("gallery")}
          />
        </div>
      </div>

      <PopupModal
        open={popup.open}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ ...popup, open: false })}
      />
      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
      <MediaLibraryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(media) => {
          setPreview(`${process.env.NEXT_PUBLIC_API_URL}${media.url}`);
          setProductImage(null);
          clearError("image");
        }}
        folder="products"
        productId={productId}
        title="Product image"
        confirmLabel="Set product image"
      />
    </div>
  );
};

export default AddProductFrom;