"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Loader2 } from "lucide-react"; 
import ReadyToGoProductAttributes from "./ReadyToGoProductAttributes";
import ReadyToGoProductGallery from "./ReadyToGoProductGallery";
import ReadyToGoProductAuthor from "./ReadyToGoProductAuthor";
import PopupModal from "../../Popups/PopupModal";
import AlertPopup from "@/components/Popups/AlertPopup";
import { useRouter } from "next/navigation";
import RichTextEditor from "../RichTextEditor";
import SeoPanel from "../SeoPanel";
import ReadyToGoMediaLibraryModal from "./ReadyToGoMediaLibraryModal"; 
import ProductSubjects from "../Productsubjects";

// ── Types ────────────────────────────────────────────────────────
type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  imprint: "agph" | "agclassics";
  children?: Category[];
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

const CategoryNode: React.FC<{
  category: Category;
  level?: number;
  selectedCategories: number[];
  toggleCategory: (id: number) => void;
  disabled?: boolean;
}> = ({ category, level = 0, selectedCategories, toggleCategory, disabled }) => (
  <div style={{ marginLeft: level * 16, marginTop: level * 7 }}>
    <label className={`flex items-center gap-2 text-sm ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={selectedCategories.includes(category.id)}
        onChange={() => toggleCategory(category.id)}
        disabled={disabled}
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
        disabled={disabled}
      />
    ))}
  </div>
);

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

// ── API Configuration & JWT ──────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CRMSERVER_API_URL = process.env.NEXT_PUBLIC_CRMSERVER_API_URL;
const FRONTEND_JWT_SECRET = process.env.NEXT_PUBLIC_FRONTEND_JWT_SECRET || "default_fallback_secret";
const CONFIRM_MSG = "You have unsaved changes. Are you sure you want to leave?\nYour changes will be lost.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

async function generateLocalToken(secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    user_id: 1, 
    session_id: "auto-generated-frontend-session",
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) 
  };
  const base64UrlEncode = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const data = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${sig64}`;
}

// Safely decode the JWT payload without needing an external library
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function formatProductDescription(rawDesc: string, currentTitle: string) {
  let html = rawDesc || "";
  
  // 1. Auto-update or inject the Book Title H2
  const titleHtml = `<h2>Book Title: ${currentTitle}</h2>`;
  if (/<h2>Book Title:.*?<\/h2>/i.test(html)) {
    // If it exists, update it with the latest title
    html = html.replace(/<h2>Book Title:.*?<\/h2>/i, titleHtml);
  } else {
    // If missing, prepend it
    html = `${titleHtml}${html}`;
  }

  // 2. Wrap in justify div if not already wrapped
  if (!html.startsWith('<div className="text-justify">')) {
    html = `<div className="text-justify">${html}</div>`;
  }
  
  return html;
}

// ─────────────────────────────────────────────────────────────────
const ReadyToGoProductForm = () => {
  const [productType, setProductType] = useState<"ebook" | "physical" | "both">("physical");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [ebookPrice, setEbookPrice] = useState("");
  const [ebookSellPrice, setEbookSellPrice] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(
    '<div><h2>Book Title: </h2><p><strong>About The Publisher:</strong></p><p>AGPH Books is a Professional Self Book Publishing House based in Central India, specializing in academic, professional, fiction, and non-fiction books in both print, digital and audio formats. The publishing house produces textbooks, research and reference works, biographies, self-help titles, children’s books, literary fiction, poetry, and general interest publications. With a transparent publishing process and strong digital distribution, AGPH Books ensures global availability through Google Books, Amazon, Flipkart, and its official website store, supporting authors and institutions in reaching a wide and diverse readership.</p></div>'
  );
  const [price, setPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState(""); 
  const [status, setStatus] = useState("published");
  
  const [weight, setWeight] = useState("0.40");
  const [length, setLength] = useState("22.86");
  const [width, setWidth] = useState("15.24");
  const [height, setHeight] = useState("1.60");
  
  const attributesRef = useRef<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const galleryRef = useRef<any>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const authorRef = useRef<any>(null);
  const [popup, setPopup] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string; }>({ open: false, type: "success", title: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("error");
  const router = useRouter();
  const [needsConversion, setNeedsConversion] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFilePath, setConvertedFilePath] = useState<string | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mainImageAlt, setMainImageAlt] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [imprintFilter, setImprintFilter] = useState<"agph" | "agclassics">("agph");
  const [bookId, setBookId] = useState("");
  const [activeUsers, setActiveUsers] = useState<{id: number, username: string}[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [ebookCoverFile, setEbookCoverFile] = useState<File | null>(null);
  const [importedAttributes, setImportedAttributes] = useState<{name: string, value: string}[]>([]);
  const [importedAuthors, setImportedAuthors] = useState<{id: number, name: string}[]>([]);
  const [importedGallery, setImportedGallery] = useState<string[]>([]);
  const [driveImages, setDriveImages] = useState<string[]>([]);

  // 👇 ── NEW: Loader and Timer States ── 👇
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false); // <--- Image Loading State
  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds = 2 minutes
  const [aiStepIndex, setAiStepIndex] = useState(0);

  const aiSteps = [
    "🚀 Loading AI data...",
    "🧠 Analyzing book content...",
    "💻 Generating Title...",
    "📈 Generating Meta Description...",
    "🚀 Generating Keywords...",
    "Finalizing..."
  ];

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    let stepTimer: NodeJS.Timeout;

    if (isGeneratingAI) {
      // Countdown Timer
      countdownTimer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // AI Step Message Timer (changes the message every 5 seconds)
      stepTimer = setInterval(() => {
        setAiStepIndex((prev) => (prev < aiSteps.length - 1 ? prev + 1 : prev));
      }, 10000);
    } else {
      // Reset when done
      setAiStepIndex(0);
    }

    return () => {
      clearInterval(countdownTimer);
      clearInterval(stepTimer);
    };
  }, [isGeneratingAI, aiSteps.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ── Unsaved-changes guard ────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const isInitialLoad = useRef(true);
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (isInitialLoad.current) return;
    setIsDirty(true);
  }, [
    title, description, price, sellPrice, stock, sku, slug, status,
    productType, weight, length, width, height, ebookPrice, ebookSellPrice,
    selectedCategories, metaTitle, metaDescription, keywords,
    productImage, ebookFile, mainImageUrl, selectedSubjects, bookId,
    driveImages
  ]);

  // Routing Guards
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await generateLocalToken(FRONTEND_JWT_SECRET);
        const res = await fetch(`${CRMSERVER_API_URL}/api/active_users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setActiveUsers(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch active users", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href === window.location.pathname) return;
      const confirmed = window.confirm(CONFIRM_MSG);
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }
      isDirtyRef.current = false;
      setIsDirty(false);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    const guard = (original: typeof originalPushState) => (...args: Parameters<typeof originalPushState>) => {
        if (isDirtyRef.current) {
          const confirmed = window.confirm(CONFIRM_MSG);
          if (!confirmed) return;
          isDirtyRef.current = false;
          setIsDirty(false);
        }
        original(...args);
      };
    window.history.pushState = guard(originalPushState);
    window.history.replaceState = guard(originalReplaceState);
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      const confirmed = window.confirm(CONFIRM_MSG);
      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      } else {
        isDirtyRef.current = false;
        setIsDirty(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

 // ── INIT DATA FETCH ─────────────────
  useEffect(() => {
    const loadImportData = async () => {
      const importDataStr = sessionStorage.getItem("pendingProductImport");
      if (!importDataStr) {
        isInitialLoad.current = false;
        return;
      }
      setIsFetchingData(true);

      try {
        const rawData = JSON.parse(importDataStr);
        let data = rawData; 
        const idToFetch = rawData.book_id;

        if (idToFetch) {
          try {
            const token = await generateLocalToken(FRONTEND_JWT_SECRET);
            // Bypass AI for the immediate load
            const res = await fetch(`${CRMSERVER_API_URL}/api/products/import-ready/${idToFetch}?use_ai=false`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
              data = await res.json();
            }
          } catch (err) {
            console.warn("Could not fetch detailed JSON", err);
          }
        }

        setTitle(data.title || "");
        const incomingDescription = data.description || data.about_book || "";
        const defaultPublisherBlock = `
        <p><strong>About The Publisher:</strong></p>
        <p>
        AGPH Books is a professional self-book publishing house based in Central India, specializing in academic, professional, fiction, and non-fiction books in print, digital, and audio formats. The publishing house produces textbooks, research and reference works, biographies, self-help titles, children's books, literary fiction, poetry, and general interest publications. With a transparent publishing process and strong digital distribution, AGPH Books ensures global availability through Google Books,<a href="https://www.amazon.in/l/27943762031?ie=UTF8&marketplaceID=A21TJRUUN4KGV&product=9389319900&me=AMCX1E9YXP0A7" target="_blank" rel="noopener noreferrer"> Amazon</a>, <a href="https://www.flipkart.com/search?q=agph%20books&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off" target="_blank" rel="noopener noreferrer">Flipkart</a>, and its <a href="https://store.agphbooks.com/" target="_blank" rel="noopener noreferrer">official website store</a>, supporting authors and institutions in reaching a wide and diverse readership.
        </p>`;        
        let mergedDescription = incomingDescription;
        if (!incomingDescription.includes("About The Publisher:")) {
          mergedDescription = incomingDescription + defaultPublisherBlock;
        }
        
        // Run the merged description through the formatter
        setDescription(formatProductDescription(mergedDescription, data.title || ""));
        setPrice("");
        setSellPrice("");
        setStock("1"); 
        setSku(data.sku || data.isbn?.replace(/-/g, "") || `AGPH-${data.book_id}`);
        setProductType(data.product_type || "physical");
        setBookId(data.book_id || "");
        setMetaTitle(data.meta_title || "");
        setMetaDescription(data.meta_description || "");
        setKeywords(data.keywords || "");
        setEbookPrice(data.ebook_price || "");
        setEbookSellPrice(data.ebook_sell_price || "");
        
        setWeight(data.weight || "0.40");
        setLength(data.length || "22.86");
        setWidth(data.width || "15.24");
        setHeight(data.height || "1.60");

        if (data.book_id) {
          const driveCoverUrl = `${CRMSERVER_API_URL}/api/books/${data.book_id}/cover`;
          setIsImageLoading(true);
          setPreview(driveCoverUrl);
          setMainImageUrl(driveCoverUrl);
        } else if (data.image) {
          setIsImageLoading(true);
          setPreview(data.image);
          setMainImageUrl(data.image);
        } else {
          setToastMsg("Warning: No product image was found in the imported data. Please upload one.");
          setToastType("error");
          setToastOpen(true);
          setErrors((prev) => ({ ...prev, image: "Product image is missing from import" }));
        }

        if (data.authors && Array.isArray(data.authors)) {
          setImportedAuthors(data.authors);
        }
        if (data.gallery && Array.isArray(data.gallery)) {
          setImportedGallery(data.gallery);
        }

        const attrs: { name: string; value: string }[] = [];
        if (data.isbn) attrs.push({ name: "ISBN", value: data.isbn });
        if (data.no_of_pages) attrs.push({ name: "No. Of Pages", value: String(data.no_of_pages) });
        if (data.publication_date) attrs.push({ name: "Publication Date", value: data.publication_date });
        if (data.attributes && Array.isArray(data.attributes)) {
          data.attributes.forEach((a: any) => attrs.push({ name: a.name, value: a.value }));
        }
        setImportedAttributes(attrs);

        sessionStorage.removeItem("pendingProductImport");
      } catch (e) {
        console.error("Failed to parse imported product data", e);
      } finally {
        setIsFetchingData(false);
        setTimeout(() => {
          isInitialLoad.current = false;
          setIsDirty(false);
          isDirtyRef.current = false;
        }, 150);
      }
    };

    loadImportData();
  }, []);

  // ── FETCH DRIVE IMAGES FOR QUICK SELECTION ─────────────────
  useEffect(() => {
    if (!bookId) {
      setDriveImages([]);
      return;
    }
    
    const fetchDriveImages = async () => {
      try {
        const res = await fetch(`${CRMSERVER_API_URL}/api/books/${bookId}/gallery-images`);
        if (res.ok) {
          const data = await res.json();
          if (data.urls && data.urls.length > 0) {
            setDriveImages(data.urls);
            
            setPreview((currentPreview) => {
              if (!currentPreview || currentPreview.endsWith("/cover")) {
                setIsImageLoading(true);
                fetch(data.urls[0])
                  .then(r => r.blob())
                  .then(blob => {
                    const ext = blob.type.split('/')[1] || 'jpg';
                    const file = new File([blob], `drive-cover.${ext}`, { type: blob.type });
                    setProductImage(file);
                    setMainImageUrl(null); 
                  })
                  .catch(() => setIsImageLoading(false));
                return data.urls[0];
              }
              return currentPreview;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch drive images for cover selection", err);
      }
    };

    fetchDriveImages();
  }, [bookId]);

  // ── Validation ──────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Product title is required";

    if (status === "published") {
      if (!description) newErrors.description = "Description is required";
      if (!productImage && !mainImageUrl) newErrors.image = "Product image is required";
      if (!sku.trim()) newErrors.sku = "SKU is required";
      if (selectedCategories.length === 0) newErrors.categories = "At least one category is required";
      if (!String(bookId).trim()) newErrors.bookId = "MIS Book ID is required";
      if (!selectedUserId) newErrors.assignedUser = "Please assign a user to this listing";

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
        if (!ebookFile) newErrors.ebookFile = "E-book file is required";
      }

      const attributes = attributesRef.current?.getAttributes() || [];
      if (attributes.length === 0) newErrors.attributes = "At least one attribute (with name & value) is required";

      const authors = authorRef.current?.getAuthors() || [];
      if (authors.length === 0) newErrors.authors = "At least one author is required";

      if (!keywords.trim()) newErrors.keywords = "Focus keyphrase is required";
      if (!metaTitle.trim()) newErrors.metaTitle = "SEO title is required";
      if (!metaDescription.trim()) newErrors.metaDescription = "Meta description is required";
      else if (metaDescription.length < 120 || metaDescription.length > 160)
        newErrors.metaDescription = `Meta description must be 120–160 characters (currently ${metaDescription.length})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: "" }));

  const handleConvert = async () => {
    if (!ebookFile) return;
    setIsConverting(true);
    const attributes = attributesRef.current?.getAttributes() || [];
    const authors = authorRef.current?.getAuthors() || [];
    const formData = new FormData();
    formData.append("file", ebookFile);
    formData.append("title", title);
    const finalDescription = formatProductDescription(description, title);
    formData.append("description", finalDescription);
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
    formData.append("meta_title", metaTitle ? metaTitle.split('|')[0].trim() : "");
    formData.append("meta_description", metaDescription);
    formData.append("keywords", keywords);
    formData.append("subjects", JSON.stringify(selectedSubjects));
    formData.append("book_id", bookId);
    if (ebookCoverFile) {
      formData.append("ebook_cover", ebookCoverFile);
    }

    try {
      const res = await fetch(`${API_URL}/api/products/convert-doc`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setConvertedFilePath(data.epubPath);
      
      if (data.productId) {
        router.replace(`/admin/product/EditProduct?id=${data.productId}`);
      }
      setNeedsConversion(false);
    } catch (error: any) {
      setToastMsg(error.message);
      setToastType("error");
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

    if (productImage) {
      formData.append("image", productImage);
    } else if (mainImageUrl) {
      formData.append("image_url", mainImageUrl);
    }
    formData.append("title", title);
    const finalDescription = formatProductDescription(description, title);
    formData.append("description", finalDescription);
    formData.append("price", price);
    formData.append("sell_price", sellPrice);
    formData.append("stock", stock);
    formData.append("sku", sku);
    if (slug.trim()) formData.append("slug", slug);
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
    formData.append("meta_title", metaTitle ? metaTitle.split('|')[0].trim() : "");
    formData.append("meta_description", metaDescription);
    formData.append("keywords", keywords);
    formData.append("book_id", bookId);
    
    if (galleryData) {
      galleryData.newFiles.forEach((file: File) => formData.append("gallery", file));
      if (galleryData.newUrls?.length) {
        formData.append("galleryUrls", JSON.stringify(galleryData.newUrls));
      }
    }
    if (ebookCoverFile) {
      formData.append("ebook_cover", ebookCoverFile);
    }
    formData.append("subjects", JSON.stringify(selectedSubjects));

    const res = await fetch(`${API_URL}/api/products`, { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setPopup({ open: true, type: "error", title: "Error", message: data.message || "Something went wrong" });
      return;
    }

    try {
      // 1. Extract the active user from the JWT stored in localStorage
      let userName = "Admin";
      const token = localStorage.getItem("admin_token");
      
      if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.name) {
          userName = decoded.name;
        }
      }

      // 2. Determine final price 
      let finalSellPrice = sellPrice;
      if (productType === "ebook" && !sellPrice) {
        finalSellPrice = ebookSellPrice;
      }

      // 3. Determine final image URL
      // Avoid sending local 'blob:' URLs to the server. 
      // Fallback to the saved image path returned by your API (e.g., data.image) if available.
      let finalImageUrl = mainImageUrl || (preview && !preview.startsWith("blob:") ? preview : "");
      
      // NEW: Catch the image path returned from Express and attach the full domain
      if (data && data.image) {
        // If Express returned a relative path like "/uploads/products/...", prepend the API_URL
        if (data.image.startsWith("/")) {
          finalImageUrl = `${API_URL}${data.image}`;
        } else {
          finalImageUrl = data.image; // In case it's already a full Drive URL
        }
      }

      const webhookPayload = {
        book_id: bookId,
        user_id: selectedUserId,
        sell_price: finalSellPrice || 0,
        stock: stock || 0,
        product_url: `${SITE_URL}/product/${data.slug || slug}`,
        image_url: finalImageUrl // Added the image URL to the payload
      };

      // IMPORTANT: REPLACE THE URL BELOW WITH YOUR ACTUAL TARGET API URL
      const WEBHOOK_API_URL = `${CRMSERVER_API_URL}/api/store-webhook`; 
      
      fetch(WEBHOOK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload)
      })
      .then(res => console.log("Webhook triggered successfully"))
      .catch(err => console.error("Webhook failed to trigger", err));

    } catch (err) {
      console.error("Error setting up webhook", err);
    }

    setIsDirty(false);
    isDirtyRef.current = false;

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`ai_draft_${bookId}`);
    }

    setPopup({
      open: true,
      type: "success",
      title: "Success",
      message: "Ready To Go Product added successfully",
    });
  };

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data: Category[]) => {
        // Filter out AG Classics immediately so they are never stored in state
        const agphOnly = data.filter((cat) => cat.imprint === "agph");
        setCategories(agphOnly);
      });
}, []);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    clearError("categories");
  };

  const categoryTree = buildCategoryTree(categories);
  const isPublishing = status === "published";
  const filteredCategoryTree = categoryTree.filter((cat) => cat.imprint === imprintFilter);
  const imprintAutoSet = useRef(false);

  useEffect(() => {
    if (imprintAutoSet.current || categories.length === 0 || selectedCategories.length === 0) return;
    const findImprint = (cats: Category[]): "agph" | "agclassics" | null => {
      for (const cat of cats) {
        if (selectedCategories.includes(cat.id)) return cat.imprint;
        if (cat.children?.length) {
          const found = findImprint(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    const imprint = findImprint(categoryTree);
    if (imprint) {
      setImprintFilter(imprint);
      imprintAutoSet.current = true;
    }
  }, [categories, selectedCategories, categoryTree]);

  // ── AI ENHANCEMENT HANDLER ─────────────────
  // ── AI ENHANCEMENT HANDLER ─────────────────
  const handleGenerateAI = async () => {
    if (!bookId) return;
    setIsGeneratingAI(true);
    setTimeLeft(120); 
    try {
      const token = await generateLocalToken(FRONTEND_JWT_SECRET);
      const res = await fetch(`${CRMSERVER_API_URL}/api/products/import-ready/${bookId}?use_ai=true`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const newTitle = data.title || title;
        const newMetaTitle = data.meta_title || metaTitle;
        const newMetaDesc = data.meta_description || metaDescription;
        const newKeywords = data.keywords || keywords;
        
        // We need to calculate the new description format so we can save it exactly as it renders
        let newDesc = description;
        setDescription(prevDesc => {
          newDesc = formatProductDescription(prevDesc, newTitle);
          return newDesc;
        });

        if (typeof window !== "undefined") {
          const aiContent = {
            title: newTitle,
            metaTitle: newMetaTitle,
            metaDescription: newMetaDesc,
            keywords: newKeywords,
            description: newDesc
          };
          sessionStorage.setItem(`ai_draft_${bookId}`, JSON.stringify(aiContent));
        }

        setTitle(newTitle);
        setMetaTitle(newMetaTitle);
        setMetaDescription(newMetaDesc);
        setKeywords(newKeywords);
        
        setToastMsg("AI content generated successfully!");
        setToastType("success");
        setToastOpen(true);
      } else {
        throw new Error(data.message || data.error || "Failed to fetch AI data");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setPopup({
        open: true,
        type: "error",
        title: "AI Generation Failed",
        message: err.message || "Unable to fetch AI data. Please ensure the local AI service is running."
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const externalFormImages = driveImages.map((url, idx) => ({
    id: `drive-cover-${idx}`,
    url: url,
    filename: `Imported Drive Image ${idx + 1}.jpg`,
  }));

  useEffect(() => {
    if (!bookId || typeof window === "undefined") return;
    
    const savedAiContent = sessionStorage.getItem(`ai_draft_${bookId}`);
    if (savedAiContent) {
      try {
        const parsed = JSON.parse(savedAiContent);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.metaTitle) setMetaTitle(parsed.metaTitle);
        if (parsed.metaDescription) setMetaDescription(parsed.metaDescription);
        if (parsed.keywords) setKeywords(parsed.keywords);
        if (parsed.description) setDescription(parsed.description);
      } catch (e) {
        console.error("Failed to parse saved AI content", e);
      }
    }
  }, [bookId]);

  return (
    <div className="p-6 pr-2">
      <div className=" items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Import & Add Product
        </h1>
        {/* Only show "Fetching" briefly on initial load */}
       {isFetchingData && (
  <div className="flex items-center gap-2 text-sm text-gray-600 px-4 py-1.5 mt-2">
    <Loader2 className="w-4 h-4 animate-spin mr-1" />
    <span className="font-medium">Loading details...</span>
  </div>
)}

{/* Show AI countdown timer when running */}
{isGeneratingAI && (
  <div className="flex gap-3 items-center mt-3 text-sm text-blue-600 font-medium px-4 py-1.5 hover:text-gray-600 transition-colors cursor-pointer">
    <Loader2 className="w-4 h-4 animate-spin mr-1" />
    <span className="font-medium">
      {aiSteps[aiStepIndex]} {formatTime(timeLeft)}
    </span>
  </div>
)}

{/* AI Trigger Button */}
{!isFetchingData && !isGeneratingAI && bookId && (
  <button
    type="button"
    onClick={handleGenerateAI}
    className="group relative flex items-center justify-center p-[2px] rounded-full shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer mt-3"
  >
    {/* Gradient Border Wrapper */}
    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00E5FF] via-[#4D7CFF] to-[#C100FF] z-0"></span>
    
    {/* Inner White Button Container */}
    <span className="relative flex items-center gap-2 px-2 py-1 bg-white rounded-full w-full h-full z-10">
      
      {/* Custom Sparkles SVG matching the image */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2.5C10 6.642 13.358 10 17.5 10C13.358 10 10 13.358 10 17.5C10 13.358 6.642 10 2.5 10C6.642 10 10 6.642 10 2.5Z" fill="#00E5FF"/>
        <path d="M19 14C19 15.657 20.343 17 22 17C20.343 17 19 18.343 19 20C19 18.343 17.657 17 16 17C17.657 17 19 15.657 19 14Z" fill="#00E5FF"/>
        <path d="M5 16C5 17.104 5.895 18 7 18C5.895 18 5 18.895 5 20C5 18.895 4.104 18 3 18C4.104 18 5 17.104 5 16Z" fill="#00E5FF"/>
      </svg>

      {/* Gradient Text (kept your original text, easily swappable to "Generate") */}
      <span className="font-medium text-[14px] bg-gradient-to-r from-[#00E5FF] via-[#4D7CFF] to-[#C100FF] bg-clip-text text-transparent">
        Enhance Content with AI
      </span>
    </span>
  </button>
)}
      </div>

      {/* 👇 ALL CONTENT WRAPPED IN FIELDSET TO DISABLE WHILE FETCHING 👇 */}
      <fieldset disabled={isGeneratingAI} className={`group ${isGeneratingAI ? "opacity-60 pointer-events-none select-none transition-opacity duration-300" : ""}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* ══════════════ LEFT FORM ══════════════ */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border p-6 border-gray-300">
              <h2 className="mb-4 font-medium text-gray-700">Basic Information</h2>
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <div className="w-[70%]">
                        <label className="block text-sm mb-1">Product Title <Req /></label>
                        <input
                          type="text"
                          disabled={isFetchingData}
                          placeholder="Enter Product Title"
                          className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.title ? "border-red-400" : ""}`}
                          value={title}
                          onChange={(e) => { setTitle(e.target.value); clearError("title"); }}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                      </div>
                      
                      <div className="w-[15%]">
                        <label className="block text-sm mb-1">Assign User {isPublishing && <Req />}</label>
                        <select
                          disabled={isFetchingData}
                          className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.assignedUser ? "border-red-400" : ""}`}
                          value={selectedUserId}
                          onChange={(e) => { setSelectedUserId(e.target.value); clearError("assignedUser"); }}
                        >
                          <option value="">Select User...</option>
                          {activeUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                        {errors.assignedUser && <p className="text-red-500 text-xs mt-1">{errors.assignedUser}</p>}
                      </div>

                      <div className="w-[15%]">
                        <label className="block text-sm mb-1">MIS Book ID {isPublishing && <Req />}</label>
                        <input
                          type="text"
                          disabled={isFetchingData}
                          placeholder="e.g. 1583"
                          className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.bookId ? "border-red-400" : ""}`}
                          value={bookId}
                          onChange={(e) => { setBookId(e.target.value); clearError("bookId"); }}
                        />
                        {errors.bookId && <p className="text-red-500 text-xs mt-1">{errors.bookId}</p>}
                      </div>
                    </div>
                  <div>
                    <label className="block text-sm mb-1">Full Description {isPublishing && <Req />}</label>
                    <RichTextEditor
                      value={description}
                      onChange={(value) => { setDescription(value); clearError("description"); }}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h2 className="mb-4 font-medium text-gray-700">Pricing & Stock</h2>
              <div className="grid gap-5">
                {(productType === "physical" || productType === "both") && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Cost Price {isPublishing && <Req />}</label>
                      <input type="number" placeholder="₹0.00" disabled={isFetchingData}
                        className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.price ? "border-red-400" : ""}`}
                        value={price} onChange={(e) => { setPrice(e.target.value); clearError("price"); }} />
                      {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Selling Price {isPublishing && <Req />}</label>
                      <input type="number" placeholder="₹0.00" disabled={isFetchingData}
                        className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.sellPrice ? "border-red-400" : ""}`}
                        value={sellPrice} onChange={(e) => { setSellPrice(e.target.value); clearError("sellPrice"); }} />
                      {errors.sellPrice && <p className="text-red-500 text-xs mt-1">{errors.sellPrice}</p>}
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Stock {isPublishing && <Req />}</label>
                      <input type="number" placeholder="0" disabled={isFetchingData}
                        className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.stock ? "border-red-400" : ""}`}
                        value={stock} onChange={(e) => { setStock(e.target.value); clearError("stock"); }} />
                      {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">SKU {isPublishing && <Req />}</label>
                    <input type="text" placeholder="AGPH-001" disabled={isFetchingData}
                      className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.sku ? "border-red-400" : ""}`}
                      value={sku} onChange={(e) => { setSku(e.target.value); clearError("sku"); }} />
                    {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Product Type</label>
                    <select value={productType} onChange={(e) => setProductType(e.target.value as any)} disabled={isFetchingData}
                      className="w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50">
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
                <h2 className="mb-4 font-medium text-gray-700">E-book Assets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm mb-1">E-book Price {isPublishing && <Req />}</label>
                    <input type="number" placeholder="₹0.00" disabled={isFetchingData}
                      className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.ebookPrice ? "border-red-400" : ""}`}
                      value={ebookPrice} onChange={(e) => { setEbookPrice(e.target.value); clearError("ebookPrice"); }} />
                    {errors.ebookPrice && <p className="text-red-500 text-xs mt-1">{errors.ebookPrice}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">E-book Selling Price {isPublishing && <Req />}</label>
                    <input type="number" placeholder="₹0.00" disabled={isFetchingData}
                      className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.ebookSellPrice ? "border-red-400" : ""}`}
                      value={ebookSellPrice} onChange={(e) => { setEbookSellPrice(e.target.value); clearError("ebookSellPrice"); }} />
                    {errors.ebookSellPrice && <p className="text-red-500 text-xs mt-1">{errors.ebookSellPrice}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">E-book Document {isPublishing && <Req />}</label>
                    </div>
                    <label className="cursor-pointer block">
                      <div className={`flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 text-center overflow-hidden transition-colors ${errors.ebookFile ? "border-red-400" : "border-gray-300"} ${!isFetchingData ? "hover:border-blue-500 cursor-pointer" : "cursor-not-allowed"}`}>
                        <div className="text-gray-500">
                          <Upload className="mx-auto mb-2 h-6 w-6" />
                          <p className="text-sm">{ebookFile ? ebookFile.name : "Upload DOCX or EPUB"}</p>
                        </div>
                      </div>
                      <input type="file" accept=".doc,.docx,.epub" hidden disabled={isFetchingData}
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
                      <div className="mt-3 text-center">
                        <button type="button" disabled={isConverting || isFetchingData} onClick={handleConvert}
                          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                          {isConverting ? "Converting..." : "Convert to EPUB"}
                        </button>
                      </div>
                    )}
                    {convertedFilePath && (
                      <div className="mt-3 text-center">
                        <button type="button" disabled={isFetchingData}
                          onClick={() => router.push(`/admin/product/TempPreviewPage?temp=${convertedFilePath}&slug=${slug}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 cursor-pointer disabled:opacity-50">
                          Preview Converted EPUB
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">E-book Cover Image</label>
                    </div>
                    <div className="w-full">
                      <label className="cursor-pointer block">
                        <div className={`flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 text-center overflow-hidden transition-colors border-gray-300 ${!isFetchingData ? "hover:border-blue-500 cursor-pointer" : "cursor-not-allowed"}`}>
                          {ebookCoverFile ? (
                            <img src={URL.createObjectURL(ebookCoverFile)} alt="Ebook cover" className="h-full w-full object-cover" />
                          ) : (
                            <>
                              <span className="text-sm text-gray-500">Upload E-book Cover</span>
                              <span className="mt-1 text-xs text-gray-400">JPG, PNG</span>
                            </>
                          )}
                        </div>
                        <input type="file" accept="image/*" hidden disabled={isFetchingData}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setEbookCoverFile(file);
                          }} />
                      </label>
                      {ebookCoverFile && (
                        <button type="button" disabled={isFetchingData} onClick={() => { setEbookCoverFile(null); }} className="mt-2 text-xs text-red-500 hover:underline w-full text-center cursor-pointer disabled:opacity-50">
                          Remove cover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(productType === "physical" || productType === "both") && (
              <div className="bg-white rounded-xl border border-gray-300 p-6">
                <h2 className="mb-4 font-medium text-gray-700">Shipping Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Weight (kg) {isPublishing && <Req />}</label>
                    <input type="number" placeholder="0.5" disabled={isFetchingData}
                      className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.weight ? "border-red-400" : ""}`}
                      value={weight} onChange={(e) => { setWeight(e.target.value); clearError("weight"); }} />
                    {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Dimensions (cm) {isPublishing && <Req />}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <input type="number" placeholder="L" value={length} disabled={isFetchingData}
                          className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.length ? "border-red-400" : ""}`}
                          onChange={(e) => { setLength(e.target.value); clearError("length"); }} />
                        {errors.length && <p className="text-red-500 text-xs mt-1">{errors.length}</p>}
                      </div>
                      <div>
                        <input type="number" placeholder="W" value={width} disabled={isFetchingData}
                          className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.width ? "border-red-400" : ""}`}
                          onChange={(e) => { setWidth(e.target.value); clearError("width"); }} />
                        {errors.width && <p className="text-red-500 text-xs mt-1">{errors.width}</p>}
                      </div>
                      <div>
                        <input type="number" placeholder="H" value={height} disabled={isFetchingData}
                          className={`w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50 ${errors.height ? "border-red-400" : ""}`}
                          onChange={(e) => { setHeight(e.target.value); clearError("height"); }} />
                        {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ReadyToGoProductAttributes
              ref={attributesRef}
              initialAttributes={importedAttributes} 
              error={errors.attributes}
              onValidChange={() => clearError("attributes")}
            />

            <ReadyToGoProductAuthor
              ref={authorRef}
              initialAuthors={importedAuthors}
              error={errors.authors}
              onValidChange={() => clearError("authors")}
            />

            <SeoPanel
              title={title ? title.split('|')[0].trim() : ""}
              slug={slug}
              description={description}
              metaTitle={metaTitle ? metaTitle.split('|')[0].trim() : ""}
              metaDescription={metaDescription}
              keywords={keywords}
              onMetaTitleChange={(v) => { setMetaTitle(v); clearError("metaTitle"); }}
              onMetaDescriptionChange={(v) => { setMetaDescription(v); clearError("metaDescription"); }}
              onKeywordsChange={(v) => { setKeywords(v); clearError("keywords"); }}
              onSlugChange={(v) => { setSlug(v); clearError("slug"); }}
              productImages={[]}
              imprint="agph"
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

            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium text-gray-700">Product Image {isPublishing && <Req />}</h2>
              </div>
              <div className="w-full">
                <button type="button" disabled={isFetchingData} onClick={() => setMediaModalOpen(true)} className="w-full">
                  <div className={`relative flex h-60 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 text-center overflow-hidden transition-colors ${errors.image ? "border-red-400" : "border-gray-300"} ${!isFetchingData ? "hover:border-blue-500 cursor-pointer" : "cursor-not-allowed"}`}>
                    {preview ? (
                      <>
                        {/* 👇 Image Loading Overlay 👇 */}
                        {isImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 z-10">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          </div>
                        )}
                        <img 
                          src={preview} 
                          alt={mainImageAlt || "Product image"} 
                          className={`h-full w-full object-contain transition-opacity duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`} 
                          onLoad={() => setIsImageLoading(false)}
                          onError={() => {
                            setIsImageLoading(false);
                            setPreview(null);
                            setMainImageUrl(null);
                            setToastMsg("The imported cover image failed to load. Please select or upload a new image.");
                            setToastType("error");
                            setToastOpen(true);
                            setErrors((prev) => ({ ...prev, image: "Imported image failed to load" }));
                          }}
                        />
                      </>
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
                    disabled={isFetchingData}
                    onClick={() => { setPreview(null); setProductImage(null); setMainImageAlt(""); setMainImageUrl(null); setIsImageLoading(false); }}
                    className="mt-2 text-xs text-red-500 hover:underline w-full text-center cursor-pointer disabled:opacity-50">
                    Remove image
                  </button>
                )}

                {/* 👇 ── DRIVE IMAGE SELECTOR ROW ── 👇 */}
                {driveImages.length > 0 && (
                  <div className="mt-5 border-t pt-4">
                    <p className="text-xs font-medium text-gray-600 mb-3">Or select main cover from Drive:</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                      {driveImages.map((url, idx) => {
                        const isSelected = preview === url; 
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (isFetchingData) return;
                              if (preview === url) return; // Prevent unnecessary reload if already selected
                              
                              setIsImageLoading(true); // Trigger loading overlay
                              setPreview(url);
                              clearError("image");
                              
                              fetch(url)
                                .then(r => r.blob())
                                .then(blob => {
                                  const ext = blob.type.split('/')[1] || 'jpg';
                                  const file = new File([blob], `drive-cover.${ext}`, { type: blob.type });
                                  setProductImage(file);
                                  setMainImageUrl(null); 
                                })
                                .catch(() => setIsImageLoading(false)); // Cleanup if fetch strictly fails
                            }}
                            className={`flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                              isSelected 
                                ? "border-blue-500 shadow-md ring-2 ring-blue-200 scale-105" 
                                : "border-gray-200 opacity-70"
                            } ${!isFetchingData ? "cursor-pointer hover:border-blue-300 hover:opacity-100" : "cursor-not-allowed"}`}
                            style={{ width: "60px", height: "80px" }}
                          >
                            <img
                              src={url}
                              alt={`Drive cover option ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* 👆 ── END DRIVE IMAGE SELECTOR ROW ── 👆 */}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h2 className="mb-4 font-medium text-gray-700">Publish</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <select
                    disabled={isFetchingData}
                    className="rounded border px-2 py-1 text-sm disabled:bg-gray-50"
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
                <button type="button" onClick={handleSubmit} disabled={isFetchingData}
                  className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Save
                </button>
                <a href={!isFetchingData ? "/admin/products" : undefined} className={`flex-1 rounded border px-4 py-2 text-sm text-center ${!isFetchingData ? "cursor-pointer" : "cursor-not-allowed opacity-50 bg-gray-50 text-gray-400"}`}>
                  Cancel
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-300 p-4">
              <h2 className="mb-3 font-medium text-gray-700">Category {isPublishing && <Req />}</h2>
              
              <div className={`max-h-56 overflow-y-auto space-y-2 bg-gray-50 p-5 rounded-lg ${isFetchingData ? "opacity-70 pointer-events-none" : ""}`}>
                {categoryTree.length > 0 ? (
                  categoryTree.map((cat) => (
                    <CategoryNode
                      key={cat.id}
                      category={cat}
                      selectedCategories={selectedCategories}
                      toggleCategory={toggleCategory}
                      disabled={isFetchingData}
                    />
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">
                    No categories found
                  </p>
                )}
              </div>
              {errors.categories && <p className="text-red-500 text-xs mt-2">{errors.categories}</p>}
            </div>

            <ReadyToGoProductGallery
              ref={galleryRef}
              initialGalleryUrls={importedGallery}
              bookId={bookId} 
              error={errors.gallery}
              onValidChange={() => clearError("gallery")}
            />

            <ProductSubjects
              mode="add"
              selectedSubjects={selectedSubjects}
              onChange={setSelectedSubjects}
            />
          </div>
        </div>
      </fieldset>

      <PopupModal
        open={popup.open}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => {
          setPopup({ ...popup, open: false });
          if (popup.type === "success") {
            router.push(`/admin/product/ProductsPage`); 
          }
        }}
      />
      <AlertPopup open={toastOpen} message={toastMsg} type={toastType} onClose={() => setToastOpen(false)} />
      <ReadyToGoMediaLibraryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(media) => {
          const finalUrl = media.url.startsWith("http") ? media.url : `${process.env.NEXT_PUBLIC_API_URL}${media.url}`;
          if (preview !== finalUrl) {
            setIsImageLoading(true); // Trigger loading overlay
          }
          setPreview(finalUrl);
          setMainImageUrl(media.url);
          setProductImage(null);
          clearError("image");
        }}
        folder="products"
        title="Product image"
        confirmLabel="Set product image"
        externalImages={externalFormImages}
      />
    </div>
  );
};

export default ReadyToGoProductForm;