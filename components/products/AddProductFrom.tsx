"use client";


import React, { useState,useEffect } from "react";
import { useRef } from "react";
import { Upload } from "lucide-react";
import ProductAttributes from "./ProductAttributes";
import ProductGallery from "./ProductGallery";
import ProductAuthor from "./ProductAuthor";
import PopupModal from "../Popups/PopupModal";
import AlertPopup from "@/components/Popups/AlertPopup";



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


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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
    }>({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState("");


    useEffect(() => {
  if (mode !== "edit" || !productId) return;

  fetch(`${API_URL}/api/products/${productId}`)
    .then(res => res.json())
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

      // 🔥 show existing image
      if (data.main_image) {
        setPreview(`${API_URL}${data.main_image}`);
      }
      if (data.ebook_path) {
        setExistingEbook(`${API_URL}${data.ebook_path}`);
      }

      setEbookPrice(data.ebook_price);
      setEbookSellPrice(data.ebook_sell_price);
    });
}, [mode, productId]);

    const validateForm = () => {
      const newErrors: Record<string, string> = {};
    
      if (!title.trim()) newErrors.title = "Product title is required";
      if (!description) newErrors.description = "Description is required";
    
      if (mode === "add" && !productImage) {
        newErrors.image = "Product image is required";
      }

    
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };


const handleSubmit = async () => {

  const isValid = validateForm();
  if (!isValid) return;
  if (mode === "add" && !productImage) {
      setToastMsg("Please upload product image");
      setToastOpen(true);
    
    return;
  }

  const attributes = attributesRef.current?.getAttributes() || [];
  const galleryData = galleryRef.current?.getGalleryData();
  const authors = authorRef.current?.getAuthors() || [];

  const formData = new FormData();

  if (productImage) {
    formData.append("image", productImage);
  }

  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("sell_price", sellPrice);
  formData.append("stock", stock);
  formData.append("sku", sku);
  if (mode === "edit") {
    formData.append("slug", slug);
  }
  formData.append("product_type", productType);
  formData.append("status", status);
  formData.append("weight", weight);
  formData.append("length", length);
  formData.append("width", width);
  formData.append("height", height);

  if (ebookFile) {
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
    formData.append(
      "existingGallery",
      JSON.stringify(galleryData.existing)
    );
  
    formData.append(
      "deletedGallery",
      JSON.stringify(galleryData.deleted)
    );
  
    galleryData.newFiles.forEach((file: File) => {
      formData.append("gallery", file);
    });
  }

  const url =
    mode === "edit"
      ? `${API_URL}/api/products/${productId}`
      : `${API_URL}/api/products`;

  const method = mode === "edit" ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
      setPopup({
        open: true,
        type: "error",
        title: "Error",
        message: data.message || "Something went wrong",
      });
      return;
  }
      setPopup({
        open: true,
        type: "success",
        title: "Success",
        message: mode === "edit"
          ? "Product updated successfully"
          : "Product added successfully",
      });

};


    useEffect(() => {
      fetch(`${API_URL}/api/categories`)
        .then(res => res.json())
        .then((data: Category[]) => setCategories(data));
    }, []);


    const toggleCategory = (id: number) => {
      setSelectedCategories(prev =>
        prev.includes(id)
          ? prev.filter(c => c !== id)
          : [...prev, id]
      );
    };

    function buildCategoryTree(categories: Category[]): Category[] {
      const map: Record<number, Category> = {};
      const roots: Category[] = [];
    
      categories.forEach((cat) => {
        map[cat.id] = { ...cat, children: [] };
      });
    
      categories.forEach((cat) => {
        if (cat.parent_id) {
          map[cat.parent_id]?.children?.push(map[cat.id]);
        } else {
          roots.push(map[cat.id]);
        }
      });
    
      return roots;
    }


    type CategoryNodeProps = {
      category: Category;
      level?: number;
      selectedCategories: number[];
      toggleCategory: (id: number) => void;
    };
    
    const CategoryNode: React.FC<CategoryNodeProps> = ({
      category,
      level = 0,
      selectedCategories,
      toggleCategory,
    }) => (
      <div style={{ marginLeft: level * 16, marginTop:level * 7 }}>
        <label className="flex items-center gap-2 text-sm">
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


    const categoryTree = buildCategoryTree(categories);


  return (
    
    <div className="p-6 pr-2">
            <h1 className="mb-6 text-xl font-semibold text-gray-800">
              {mode === "edit" ? "Edit Product" : "Add New Product"}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* LEFT FORM */}
              <div className="lg:col-span-3 space-y-6">
                {/* BASIC INFO */}
                <div className="bg-white rounded-xl border p-6 border-gray-300">
                  <h2 className="mb-4 font-medium text-gray-700">
                    Basic Information
                  </h2>
                    <div className="flex gap-6">
                        {/* LEFT: IMAGE UPLOAD */}
                        <div className="w-50">
                          <label className="block cursor-pointer">
                            <div className="flex h-60 w-50 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center hover:border-blue-500 overflow-hidden">
                              
                              {preview ? (
                                <img
                                  src={preview}
                                  alt="Product Preview"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <>
                                  <span className="text-sm text-gray-500">
                                    Upload Product Image
                                  </span>
                                  <span className="mt-1 text-xs text-gray-400">
                                    JPG, PNG, WebP
                                  </span>
                                  {errors.image && (
                                    <p className="text-red-500 text-xs mt-2">{errors.image}</p>
                                  )}
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
                          
                                setProductImage(file);
                                setPreview(URL.createObjectURL(file));
                              }}
                            />
                          </label>
                        </div>
                    
                        {/* RIGHT: FORM FIELDS */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-sm mb-1">
                              Product Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Product Title"
                                className="w-full rounded border px-3 py-2 text-sm"
                                value={title}
                                onChange={(e) => {
                                  setTitle(e.target.value);
                                  setErrors((prev) => ({ ...prev, title: "" }));
                                }}
                              />
                              
                              {errors.title && (
                                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                              )}
                          </div>
                    
                          <div>
                          <label className="block text-sm mb-1">
                            Full Description
                          </label>
                          <textarea
                            rows={5}
                            placeholder="Full product description"
                            className="w-full rounded border px-3 py-2 text-sm"
                            value={description}
                            onChange={(e) => {
                              setDescription(e.target.value);
                              setErrors((prev) => ({ ...prev, description: "" }));
                            }}
                          />
                          {errors.description && (
                                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                              )}
                        </div>
                      </div>
                    </div>
                  
                </div>

                {/* PRICING */}
                <div className="bg-white rounded-xl border  border-gray-300 p-6">
                  <h2 className="mb-4 font-medium text-gray-700">
                    Pricing & Stock
                  </h2>

                  <div className="grid gap-5">
                     {(productType === "physical" || productType === "both") && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Cost Price</label>
                      <input
                        type="number"
                        placeholder="₹0.00"
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Selling Price</label>
                      <input
                        type="number"
                        placeholder="₹0.00"
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Stock</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                    </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">SKU</label>
                      <input
                        type="text"
                        placeholder="AGPH-001"
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />

                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Product Type
                      </label>
                      <select
                        value={productType}
                        onChange={(e) => setProductType(e.target.value as any)}
                        className="w-full rounded border px-3 py-2 text-sm"
                      >
                        <option value="physical">Physical</option>
                        <option value="ebook">E-book</option>
                        <option value="both">Both</option>
                      </select>

                    </div>
                  </div>

                    
                  </div>
                </div>
                {(productType === "ebook" || productType === "both") && (
                  <div className="bg-white rounded-xl border border-gray-300 p-6">
                    <h2 className="mb-4 font-medium text-gray-700">
                      E-book File
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm mb-1">E-book Price</label>
                        <input
                          type="number"
                          placeholder="₹0.00"
                          className="w-full rounded border px-3 py-2 text-sm"
                          value={ebookPrice}
                          onChange={(e) => setEbookPrice(e.target.value)}
                        />
                      </div>
                    
                      <div>
                        <label className="block text-sm mb-1">E-book Selling Price</label>
                        <input
                          type="number"
                          placeholder="₹0.00"
                          className="w-full rounded border px-3 py-2 text-sm"
                          value={ebookSellPrice}
                          onChange={(e) => setEbookSellPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* ✅ EXISTING FILE */}
                    {existingEbook && !ebookFile && (
                      <div className="mb-3 text-sm text-green-700">
                        📘 Existing file:
                        <a
                          href={existingEbook}
                          target="_blank"
                          className="ml-1 underline text-blue-600"
                        >
                          View / Download
                        </a>
                      </div>
                    )}
                
                    {/* 🔁 UPLOAD NEW */}
                    <label className="cursor-pointer block">
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500">
                        <div className="text-gray-500">
                          <Upload className="mx-auto mb-2 h-6 w-6" />
                          <p className="text-sm">
                            {ebookFile
                              ? ebookFile.name
                              : existingEbook
                              ? "Replace e-book file"
                              : "Drag & drop file or browse"}
                          </p>
                        </div>
                      </div>
                
                      <input
                        type="file"
                        accept=".pdf,.epub"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setEbookFile(file);
                        }}
                      />
                    </label>
                  </div>
                )}



                {(productType === "physical" || productType === "both") && (
                  <div className="bg-white rounded-xl border border-gray-300 p-6">
                    <h2 className="mb-4 font-medium text-gray-700">
                      Shipping Details
                    </h2>
                
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          placeholder="0.5"
                          className="w-full rounded border px-3 py-2 text-sm"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                        />
                      </div>
                
                      <div>
                        <label className="block text-sm mb-1">
                          Dimensions (cm)
                        </label>
                
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            placeholder="L"
                            value={length}
                            className="rounded border px-3 py-2 text-sm"
                            onChange={(e) => setLength(e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="W"
                            value={width}
                            className="rounded border px-3 py-2 text-sm"
                            onChange={(e) => setWidth(e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="H"
                            value={height}
                            className="rounded border px-3 py-2 text-sm"
                            onChange={(e) => setHeight(e.target.value)}
                          />

                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ProductAttributes */}

                <ProductAttributes
                  ref={attributesRef}
                  mode={mode}
                  productId={productId}
                />



                {/* Author Profile */}

                <ProductAuthor
                  ref={authorRef}
                  mode={mode}
                  productId={productId}
                />


              </div>

              {/* RIGHT SIDEBAR */}
              <div className="space-y-6">
                {/* STATUS */}
                <div className="bg-white rounded-xl border border-gray-300 p-6">
                  <h2 className="mb-4 font-medium text-gray-700">
                    Publish
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <select
                          className="rounded border px-2 py-1 text-sm"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                        <option>Published</option>
                        <option>Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm text-white"
                    >
                      {mode === "edit" ? "Update" : "Save"}
                    </button>

                    <a
                      href="/admin/products"
                      className="flex-1 rounded border px-4 py-2 text-sm text-center"
                    >
                      Cancel
                    </a>
                  </div>
                </div>

                {/* CATEGORY */}

                <div className="bg-white rounded-xl border border-gray-300 p-4">
                  <h2 className="mb-4 font-medium text-gray-700">
                    Category
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
                </div>

                {/* SLUG */}
                {mode === "edit" && (
                  <div className="bg-white rounded-xl border border-gray-300 p-4">
                    <h2 className="mb-3 font-medium text-gray-700">
                      Product Slug
                    </h2>
                
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="product-url-slug"
                    />
                
                    <p className="mt-1 text-xs text-gray-500">
                      This will be used in product URL
                    </p>
                  </div>
                )}





                {/* PRODUCT GALLRAY */}

                  <ProductGallery
                    ref={galleryRef}
                    productId={mode === "edit" ? productId : undefined}
                  />


                {/* SEO */}
                <div className="bg-white rounded-xl border border-gray-300 p-6">
                  <h2 className="mb-4 font-medium text-gray-700">
                    SEO Settings
                  </h2>
                
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Meta title"
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                    />
                
                    <textarea
                      rows={3}
                      placeholder="Meta description"
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                    />
                
                    <input
                      type="text"
                      placeholder="Keywords (comma separated)"
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                  </div>
                </div>



              </div>
            </div>

            <PopupModal
              open={popup.open}
              type={popup.type}
              title={popup.title}
              message={popup.message}
              onClose={() => setPopup({ ...popup, open: false })}
            />
                                              <AlertPopup
                                                open={toastOpen}
                                                message={toastMsg}
                                                onClose={() => setToastOpen(false)}
                                              />

          </div>
  )
}

export default AddProductFrom