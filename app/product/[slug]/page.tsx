"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import ReviewSection from "@/components/reviews/ReviewSection";
import CategoryBookSection from "@/components/books/CategoryBookSection";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Attribute = { name: string; value: string };
type GalleryImage = { image_path: string };
type Author = {
  id: number;
  name: string;
  image: string | null;
  bio?: string | null;
};

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  sell_price: number;
  stock: number;
  product_type: "ebook" | "physical" | "both";
  main_image: string;

  weight?: number;
  length?: number;
  width?: number;
  height?: number;

  ebook_price?: number;
  ebook_sell_price?: number;

  authors: Author[];
  attributes: Attribute[];
  gallery: GalleryImage[];
  categories: Category[];

};


type Category = {
  id: number;
  name: string;
  slug: string;
};



export default function ProductPage() {
const params = useParams<{ slug: string }>();

if (!params?.slug) {
  return null; // or a loader / skeleton
}

const slug = params.slug;
  const [product, setProduct] = useState<Product | null>(null);
  const [liked, setLiked] = useState(false);
  const [activeImage, setActiveImage] = useState("");
  const [format, setFormat] = useState<"paperback" | "ebook">("paperback");
  const [qty, setQty] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [expandedAuthors, setExpandedAuthors] = useState<Record<number, boolean>>({});



  useEffect(() => {
  if (!product || product.gallery.length === 0) return;

  const images = [{ image_path: product.main_image }, ...product.gallery];
  const visibleCount = 5;

  const interval = setInterval(() => {
    setGalleryIndex((prev) => {
      if (prev >= images.length - visibleCount) {
        return 0; // loop back
      }
      return prev + 1;
    });
  }, 3000); // 3 seconds

  return () => clearInterval(interval);
}, [product]);



  useEffect(() => {
    fetch(`${API_URL}/api/products/slug/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setActiveImage(data.main_image);
        if (data.product_type === "ebook") setFormat("ebook");
      });
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/wishlist/check/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setLiked(d.liked));
  }, [product]);

  const toggleWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/login");

    await fetch(
      `${API_URL}/api/wishlist/${product?.id}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );

    setLiked(!liked);
  };

  if (!product) return null;

  const paperbackDiscount =
    product.price > product.sell_price
      ? Math.round(((product.price - product.sell_price) / product.price) * 100)
      : 0;

  const ebookDiscount =
    product.ebook_price &&
    product.ebook_sell_price &&
    product.ebook_price > product.ebook_sell_price
      ? Math.round(
          ((product.ebook_price - product.ebook_sell_price) /
            product.ebook_price) *
            100
        )
      : 0;

  const authorLine =
    product.authors.length > 0
      ? product.authors.map((a) => a.name).join(", ")
      : "";


  const descriptionWords = product.description.split(" ");
  const shortDescription = descriptionWords.slice(0, 200).join(" ");
  const isLongDescription = descriptionWords.length > 200;

  const getShortBio = (text: string, limit = 100) => {
    const words = text.split(" ");
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(" ");
  };

  const addToCart = async () => {
  const token = localStorage.getItem("token");

  // 🔐 NOT LOGGED IN → REDIRECT TO LOGIN
  if (!token) {
    window.location.href = "/login";
    return; // ⛔ stop function execution
  }

  try {
    const res = await fetch(`${API_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: product!.id,
        format: format === "ebook" ? "ebook" : "paperback",
        quantity: format === "ebook" ? 1 : qty,
      }),
    });

    if (!res.ok) {
      throw new Error("Add to cart failed");
    }
window.dispatchEvent(new Event("cart-change"));
    alert("Added to cart");
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};



      

  return (
    <div className="max-w-7xl mx-auto px-25 py-6">

      {/* ================= BREADCRUMB ================= */}
      <nav className="text-sm text-gray-500 mb-6 border-b border-t border-gray-300 py-4">
        <ol className="flex items-center gap-2">
          <li><a href="/" className="hover:underline">Home</a></li>
          <li>/</li>
          <li className="text-gray-800 font-medium">{product.title}</li>
        </ol>
      </nav>

      {/* ================= TOP ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-14">

        {/* LEFT IMAGES */}
        <div>
          <div className="relative flex justify-center">
            <Image
              src={`${API_URL}${activeImage}`}
              alt={product.title}
              width={360}
              height={520}
              className="object-contain"
              unoptimized
            />

            <button
              onClick={toggleWishlist}
              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
            >
              <Heart
                className={liked ? "text-red-600 fill-red-600" : "text-gray-600"}
              />
            </button>
          </div>

          {/* GALLERY SLIDER */}
          {product.gallery.length > 0 && (() => {
          
            const images = [{ image_path: product.main_image }, ...product.gallery];
            const visibleCount = 5;
          
            const canPrev = galleryIndex > 0;
            const canNext = galleryIndex < images.length - visibleCount;
          
            return (
              <div className="mt-4 flex items-center gap-3">
          
                {/* LEFT ARROW */}
                <button
                  onClick={() => canPrev && setGalleryIndex(galleryIndex - 1)}
                  disabled={!canPrev}
                  className={`px-3 text-lg rounded-full shadow-lg rounded ${
                    canPrev ? "hover:bg-gray-100" : "opacity-30 cursor-not-allowed"
                  }`}
                >
                  ‹
                </button>
          
                {/* SLIDER WINDOW */}
                <div className="overflow-hidden ">
                  <div
                    className="flex gap-3 transition-transform duration-300"
                    style={{
                      transform: `translateX(-${galleryIndex * 78}px)`,
                    }}
                  >
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(img.image_path)}
                        className={`border rounded p-1 flex-shrink-0 ${
                          activeImage === img.image_path
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      >
                        <Image
                          src={`${API_URL}${img.image_path}`}
                          width={70}
                          height={100}
                          className="h-24 w-[70px] object-cover"
                          unoptimized
                          alt=""
                        />
                      </button>
                    ))}
                  </div>
                </div>
          
                {/* RIGHT ARROW */}
                <button
                  onClick={() => canNext && setGalleryIndex(galleryIndex + 1)}
                  disabled={!canNext}
                  className={`px-3 text-lg rounded-full  shadow-lg rounded ${
                    canNext ? "hover:bg-gray-100" : "opacity-30 cursor-not-allowed"
                  }`}
                >
                  ›
                </button>
          
              </div>
            );
          })()}

        </div>

        {/* RIGHT */}
        <div>
          <h1 className="text-2xl font-serif mb-2">{product.title}</h1>

          {product.authors.length > 0 && (
            <p className="text-sm text-gray-600 mb-2">
              by{" "}
              <span className="font-medium text-gray-800">
                {authorLine}
              </span>
            </p>
          )}

          {/* STARS */}
          <div className="flex items-center gap-1 text-yellow-500 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} fill="currentColor" />
            ))}
            <span className="text-sm text-gray-500 ml-2">(4.8)</span>
          </div>

          {/* ================= PRICE SWITCHER ================= */}
          <div className="mb-6 space-y-4">

            {/* MAIN PRICE */}
            <div className="flex items-end gap-3">
              <span className="text-3xl font-semibold text-red-600">
                ₹
                {format === "paperback"
                  ? product.sell_price
                  : product.ebook_sell_price}
              </span>

              {format === "paperback" &&
                product.price > product.sell_price && (
                  <span className="text-lg line-through text-gray-400">
                    ₹{product.price}
                  </span>
                )}
            </div>

            <p className="text-xs text-gray-500">
                Order now for delivery in 6 to 7 days
            </p>

            {/* DISCOUNT STRIP */}
            {format === "paperback" && paperbackDiscount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2 rounded">
                <span>Save up to {paperbackDiscount}% Off on this book</span>
                <button className="underline text-xs">Learn More</button>
              </div>
            )}

            {/* FORMAT BOXES */}
            <div className="flex gap-3">
              {product.product_type !== "ebook" && (
                <button
                  onClick={() => setFormat("paperback")}
                  className={`border rounded-md px-4 py-3 w-40 text-left ${
                    format === "paperback"
                      ? "border-black shadow-sm"
                      : "border-gray-300"
                  }`}
                >
                  <p className="text-xs text-gray-500">Paperback</p>
                  <p className="font-semibold">₹{product.sell_price}</p>
                </button>
              )}

              {product.product_type !== "physical" && (
                <button
                  onClick={() => setFormat("ebook")}
                  className={`border rounded-md px-4 py-3 w-40 text-left ${
                    format === "ebook"
                      ? "border-black shadow-sm"
                      : "border-gray-300"
                  }`}
                >
                  <p className="text-xs text-gray-500">eBook</p>
                  <p className="font-semibold">
                    ₹{product.ebook_sell_price}
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* ================= ACTIONS ================= */}
          <div className="flex flex-col gap-6 mb-10">

            {/* CONTROLS ROW */}
            <div className="flex  flex-wrap items-center gap-4">
          
              {/* QUANTITY → ONLY FOR PAPERBACK */}
              {format === "paperback" && (
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() =>
                      setQty((q) => (q > 1 ? q - 1 : 1))
                    }
                    className="px-3 py-2 text-lg hover:bg-gray-100"
                  >
                    −
                  </button>
          
                  <span className="px-4 py-2 min-w-[40px] text-center">
                    {qty}
                  </span>
          
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="px-3 py-2 text-lg hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              )}
          
              {/* ADD TO CART */}
              <button
                onClick={addToCart}
                className="flex items-center gap-2 bg-black text-white px-30 py-3 rounded-md hover:bg-gray-800 transition"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
          
          </div>
          

            {/* TRUST STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-gray-200">
          
              {/* QUALITY */}
              <div className="flex items-center gap-4">
                <div className="h-15 w-15 flex items-center justify-center rounded-full">
                  <img src="/images/icons/quality.png" className=""  alt="" />
                </div>
                <div>
                  <p className="text-xs  font-medium whitespace-nowrap">
                    Premium Quality
                  </p>
                  <p className="text-[10px] text-gray-500">
                    High-grade paper & binding
                  </p>
                </div>
              </div>
          
              {/* SHIPPING */}
              <div className="flex items-center gap-4">
                <div className="h-15 w-15 flex items-center justify-center rounded-full">
                    <img src="/images/icons/fast_delivery.png" alt="" />
                </div>
                <div>
                  <p className="text-xs font-medium whitespace-nowrap">
                    Fast Shipping
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Dispatch in 24–48 hours
                  </p>
                </div>
              </div>
          
              {/* PRICE */}
              <div className="flex items-center gap-4">
                <div className="h-15 w-15 flex items-center justify-center rounded-full">
                  <img src="/images/icons/best_price.png" alt="" />
                </div>
                <div>
                  <p className="text-xs  font-medium whitespace-nowrap">
                    Best Price
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Direct publisher pricing
                  </p>
                </div>
              </div>
          
            </div>
          </div>

        </div>
      </div>

      {/* ================= DESCRIPTION ================= */}
      <div className="mt-14 border-y border-gray-300 py-8">
        <h2 className="text-xl font-semibold mb-3">Description</h2>
        <p className="text-gray-700 text-sm leading-relaxed text-justify">
          {showFullDesc || !isLongDescription
            ? product.description
            : shortDescription + "..."}
        </p>
        
        {isLongDescription && (
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="mt-2 text-sm font-medium text-black hover:underline cursor-pointer"
          >
            {showFullDesc ? "Read Less" : "Read More"}
          </button>
        )}
      </div>

      {/* ================= ATTRIBUTES ================= */}
      {product.attributes.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Product Details</h2>
          <div className="">
            {product.attributes.map((a, i) => (
              <div key={i} className=" py-1 text-sm">
                <span className="font-semibold">{a.name} : </span>
                <span className="text-gray-500">{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SHIPPING ================= */}
      {(product.weight || product.length) && (
        <div className="mt-5 border-b border-gray-300 pb-10">
          <h2 className="text-xl font-semibold mb-4">Shipping Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {product.weight && <div>Weight : {product.weight} kg</div>}
            {product.length && <div>Length : {product.length} cm</div>}
            {product.width && <div>Width : {product.width} cm</div>}
            {product.height && <div>Height : {product.height} cm</div>}
          </div>
        </div>
      )}

      {/* ================= AUTHORS ================= */}
      {product.authors.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">About the author</h2>
          <div className="">
            {product.authors.map((a) => (
             <div key={a.id} className="flex items-start gap-4 rounded p-3">
  
              {/* IMAGE WRAPPER (FIXED SIZE) */}
              <div className="flex-shrink-0 w-[80px] h-[80px]">
                <Image
                  src={
                    a.image
                      ? `${API_URL}${a.image}`
                      : "/images/avatar.png"
                  }
                  width={60}
                  height={60}
                  className="w-[80px] h-[80px] rounded-full object-cover"
                  unoptimized
                  alt={a.name}
                />
              </div>
            
              {/* TEXT CONTENT */}
              <div className="flex-1 min-w-0">
                <span className="font-medium block">{a.name}</span>
            
                {a.bio && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed break-words">
                    {expandedAuthors[a.id]
                      ? a.bio
                      : getShortBio(a.bio, 60) + (a.bio.split(" ").length > 60 ? "..." : "")
                    }
                  </p>
                )}
            
                {a.bio && a.bio.split(" ").length > 60 && (
                  <button
                    onClick={() =>
                      setExpandedAuthors((prev) => ({
                        ...prev,
                        [a.id]: !prev[a.id],
                      }))
                    }
                    className="mt-1 text-sm font-medium text-black hover:underline"
                  >
                    {expandedAuthors[a.id] ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            
            </div>

            ))}
          </div>
        </div>
      )}
       {product && <ReviewSection productId={product.id} />}

       {/* CATEGORY SECTION */}
        {product.categories?.length > 0 && (
          <CategoryBookSection
            title={product.categories[0].name}
            categorySlug={product.categories[0].slug}
                    visibleCount={5}

          />
        )}

   


    </div>
  );
}
