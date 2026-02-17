"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart, User, ShoppingBag, LogOut, X, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import AccountSlider from "./AccountSlider";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type UserType = {
  id: number;
  name: string;
  email: string;
};

const Header = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
  products: any[];
  authors: any[];
  }>({
    products: [],
    authors: [],
  });
  const [showSearch, setShowSearch] = useState(false);
  const [cartCount, setCartCount] = useState(0);

    // 🔥 ADD THIS HERE
  useEffect(() => {
    const openSlider = () => setSliderOpen(true);

    window.addEventListener("open-account-slider", openSlider);

    return () => {
      window.removeEventListener("open-account-slider", openSlider);
    };
  }, []);


  useEffect(() => {
    if (query.length < 2) {
      setResults({ products: [], authors: [] });
      return;
    }
  
    const delay = setTimeout(() => {
      fetch(`${API_URL}/api/search?q=${query}`)
  .then((res) => {
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  })
  .then((data) =>
    setResults({
      products: data.products || [],
      authors: data.authors || [],
    })
  )
  .catch(() =>
    setResults({ products: [], authors: [] })
  );

    }, 300);
  
    return () => clearTimeout(delay);
  }, [query]);



  /* CHECK LOGIN */
  const fetchUser = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    setUser(null);
    return;
  }

  fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.msg) setUser(data);
      else setUser(null);
    })
    .catch(() => {
      localStorage.removeItem("token");
      setUser(null);
    });
};

useEffect(() => {
  fetchUser();
  fetchCartCount();

  // 🔥 listen for login/logout
  window.addEventListener("auth-change", fetchUser);
  window.addEventListener("auth-change", fetchCartCount);

  // 🔥 listen for cart updates
  window.addEventListener("cart-change", fetchCartCount);

  return () => {
    window.removeEventListener("auth-change", fetchUser);
    window.removeEventListener("auth-change", fetchCartCount);
    window.removeEventListener("cart-change", fetchCartCount);
  };
}, []);



  const logout = () => {
  localStorage.removeItem("token");
  setUser(null);

  // 🔥 notify all components
  window.dispatchEvent(new Event("auth-change"));

  window.location.href = "/";
};

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, "gi");

  return text.split(regex).map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span
        key={i}
        className="text-blue-500 rounded"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
};


const fetchCartCount = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    setCartCount(0);
    return;
  }

  fetch(`${API_URL}/api/cart/count`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => setCartCount(data.count || 0))
    .catch(() => setCartCount(0));
};


  return (
    <header className="w-full bg-white border-b border-gray-200">

      {/* ================= TOP BAR ================= */}
      <div className="bg-gray-100 text-xs">
        <div className="mx-auto max-w-7xl px-4 py-3 flex justify-end gap-4 text-gray-700">

          {/* SOCIAL ICONS */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black"
          >
            <Facebook className="h-4 w-4" />
          </a>
      
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black"
          >
            <Instagram className="h-4 w-4" />
          </a>
      
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black"
          >
            <Linkedin  className="h-4 w-4" />
          </a>

          <div>|</div>

          {!user ? (
            <Link href="/login" className="hover:underline">
              Sign In
            </Link>
          ) : (
            <>
            <div className="flex items-center gap-3">
              <span className="font-medium">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-red-600 hover:underline"
              >
                <LogOut className="h-3 w-3" />
                Logout
              </button>
            </div>
            
          <Link href="/account/orders" className="hover:underline">
            Order Status
          </Link>
          <Link href="/my-books" className="hover:underline">
            My Books
          </Link>
            
            
            </>
            
          )}



        </div>
      </div>

      {/* ================= MAIN HEADER ================= */}
      <div className="mx-auto max-w-7xl px-4 py-5 flex items-center gap-6">

        {/* LOGO */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo/AGPH-Logo-Black-600x290.webp"
            alt="AGPH Store Logo"
            width={140}
            height={68}
            priority
          />
        </Link>

        {/* SEARCH */}
        <div className="flex-1 relative">
  <input
    type="text"
    value={query}
    onChange={(e) => {
      setQuery(e.target.value);
      setShowSearch(true);
    }}
    placeholder="Search books, authors, ebooks"
    className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-black"
  />

  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />

  {query && (
    <X
      onClick={() => {
        setQuery("");
        setShowSearch(false);
      }}
      className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
    />
  )}

  {/* ================= SEARCH DROPDOWN ================= */}
  {showSearch &&
  ((results.products?.length ?? 0) > 0 ||
    (results.authors?.length ?? 0) > 0) && (
    <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-[420px] overflow-y-auto z-50">

      {/* AUTHORS */}
      {results.authors.length > 0 && (
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Authors
          </p>

          {results.authors?.map((a: any) => (
            <Link
              key={a.id}
              href={`/author/${a.id}`}
              onClick={() => setShowSearch(false)}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
            >
              {/* <img
                src={
                  a.profile_image
                    ? `${API_URL}${a.profile_image}`
                    : "/images/avatar.png"
                }
                className="h-12 w-12 rounded-full object-cover border border-gray-300 shadow-sm"
                loading="eager"
              /> */}

              <span className="text-sm font-medium">
                {highlightMatch(a.name, query)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* PRODUCTS */}
      {results.products.length > 0 && (
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Products
          </p>

          {results.products?.map((p: any) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              onClick={() => setShowSearch(false)}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-100"
            >
              <img
                src={`${API_URL}${p.main_image}`}
                className="h-15 w-12  border border-gray-200 rounded"
              />

              <div className="leading-tight">
                <p className="text-sm font-medium">
                  {highlightMatch(p.title, query)}
                </p>

                <p className="text-xs text-gray-500">
                  {p.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )}
</div>


        {/* ICONS */}
        <div className="flex items-center gap-4 text-gray-700">
          <Link href="/wishlist">
            <Heart className="h-5 w-5 cursor-pointer hover:text-black" />
          </Link>

          <User
            className="h-5 w-5 cursor-pointer hover:text-black"
            onClick={() => setSliderOpen(true)}
          />
          <Link href="/cart" className="relative">
            <ShoppingBag className="h-5 w-5 cursor-pointer hover:text-black" />
          
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>

      {/* ================= CATEGORY NAV ================= */}
      <nav>
        <div className="mx-auto max-w-7xl px-9 py-5 flex gap-6 text-sm font-medium text-gray-800">
          <Link href="/ebooks" className="nav-link text-green-600 font-semibold">
            Books
          </Link>
          <Link href="/category/books" className="nav-link">E-Books</Link>
          <Link href="/category/books" className="nav-link">AGPH</Link>
          <Link href="/category/bestsellers" className="nav-link">New Release</Link>
          <Link href="/category/kids" className="nav-link">AGPH Kids</Link>
          <Link href="/category/kids" className="nav-link">AG Classics</Link>
          <Link href="/category/kids" className="nav-link">AG Volumes</Link>
          <Link href="/category/bestsellers" className="nav-link">Bestsellers</Link>
          <Link href="/about" className="nav-link text-red-600">
            About Us
          </Link>
        </div>
      </nav>

      <AccountSlider
        open={sliderOpen}
        onClose={() => setSliderOpen(false)}
        user={user}
        onLogout={logout}
      />

    </header>
  );
};

export default Header;
