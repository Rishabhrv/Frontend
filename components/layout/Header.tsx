"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Heart, User, ShoppingBag, LogOut, X,
  Facebook, Instagram, Twitter, Linkedin, Youtube, Menu,
} from "lucide-react";
import AccountSlider from "./AccountSlider";
import { usePathname } from "next/navigation";
import { getGuestCart } from "@/utils/guestStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type UserType = { id: number; name: string; email: string };

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/product-category/agph", label: "Academic Books" },
  { href: "/product-category/agvolumes", label: "Edited Books" },
  { href: "/product-category/agkids", label: "Kids" },
  { href: "/ebooks", label: "E-Books" },
  { href: "/new-release", label: "New Release" },
  { href: "https://agphbooks.com/contact-us/", label: "Contact Us", external: true },
];

const Header = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ products: any[]; authors: any[] }>({ products: [], authors: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // <-- Added isSearching state
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname() ?? "";
  const headerRef = useRef<HTMLElement>(null);

  /* ── scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" ? "text-green-600 font-semibold" : "hover:text-green-600";
    return pathname.startsWith(path) ? "text-green-600 font-semibold" : "hover:text-green-600";
  };

  useEffect(() => {
    const openSlider = () => setSliderOpen(true);
    window.addEventListener("open-account-slider", openSlider);
    return () => window.removeEventListener("open-account-slider", openSlider);
  }, []);

  /* ── search logic with loading state ── */
  useEffect(() => {
    if (query.length < 2) { 
      setResults({ products: [], authors: [] }); 
      return; 
    }
    
    setIsSearching(true); // Start loading

    const delay = setTimeout(() => {
      fetch(`${API_URL}/api/search?q=${query}`)
        .then(res => { if (!res.ok) throw new Error("Search failed"); return res.json(); })
        .then(data => {
          setResults({ products: data.products || [], authors: data.authors || [] });
          setIsSearching(false); // Stop loading on success
        })
        .catch(() => {
          setResults({ products: [], authors: [] });
          setIsSearching(false); // Stop loading on error
        });
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const fetchUser = () => {
    const token = localStorage.getItem("token");
    if (!token) { setUser(null); return; }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (!data.msg) setUser(data); else setUser(null); })
      .catch(() => { localStorage.removeItem("token"); setUser(null); });
  };

  // ── Cart count: server for logged-in users, localStorage for guests ───────
  const fetchCartCount = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Guest: sum quantities from localStorage
      const total = getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
      return;
    }

    fetch(`${API_URL}/api/cart/count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCartCount(data.count || 0))
      .catch(() => setCartCount(0));
  };

  useEffect(() => {
    fetchUser();
    fetchCartCount();
    window.addEventListener("auth-change", fetchUser);
    window.addEventListener("auth-change", fetchCartCount);
    window.addEventListener("cart-change", fetchCartCount);
    window.addEventListener("guest-cart-change", fetchCartCount); // ← guest updates
    return () => {
      window.removeEventListener("auth-change", fetchUser);
      window.removeEventListener("auth-change", fetchCartCount);
      window.removeEventListener("cart-change", fetchCartCount);
      window.removeEventListener("guest-cart-change", fetchCartCount);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <span key={i} className="text-blue-500 rounded">{part}</span>
        : part
    );
  };

  const sharedSearchProps = { query, setQuery, showSearch, setShowSearch, results, highlightMatch, isSearching };

  
useEffect(() => {
  const trackVisit = async () => {
    let sessionId = localStorage.getItem("guest_session_id");
    if (!sessionId) {
      sessionId = "guest_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("guest_session_id", sessionId);
    }

    const userId = user?.id || null;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ADDED 'source' HERE 👇
        body: JSON.stringify({ sessionId, userId, source: "apgh" }) 
      });
    } catch (error) {
      // Fail silently
    }
  };

  trackVisit();
}, [user]);

  return (
    <>
      {/* ═══════════════════════════════════════
          MAIN HEADER
      ═══════════════════════════════════════ */}
      <header ref={headerRef} className="w-full bg-white border-b border-gray-200 relative">

        {/* TOP BAR */}
        <div className="bg-gray-100 text-xs">
          <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-3 text-gray-700 flex-wrap">
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/agphbooks/" aria-label="AGPH Books Facebook" target="_blank" rel="noopener noreferrer" className="hover:text-black"><Facebook className="h-4 w-4" /></a>
              <a href="https://www.instagram.com/agphbooks/" aria-label="AGPH Books Instagram" target="_blank" rel="noopener noreferrer" className="hover:text-black"><Instagram className="h-4 w-4" /></a>
              <a href="https://in.linkedin.com/company/agphbooks" aria-label="AGPH Books LinkedIn" target="_blank" rel="noopener noreferrer" className="hover:text-black"><Linkedin className="h-4 w-4" /></a>
              <a href="https://www.youtube.com/@agphbooks" aria-label="AGPH Books Youtube" target="_blank" rel="noopener noreferrer" className="hover:text-black"><Youtube className="h-4 w-4" /></a>
              <a href="https://x.com/agphbooks" aria-label="AGPH Books Twitter" target="_blank" rel="noopener noreferrer" className="hover:text-black">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.9 2H22l-7.4 8.5L23 22h-6.8l-5.3-6.9L4.8 22H2l8-9.2L2 2h6.9l4.8 6.3L18.9 2z" />
                </svg>
              </a>
            </div>
            <div className="flex items-center gap-3">
              {!user ? (
                <Link href="/login" className="hover:underline">Sign In</Link>
              ) : (
                <>
                  <span className="font-medium">Hi, {user.name.split(" ")[0]}</span>
                  <button onClick={logout} className="flex items-center gap-1 text-red-600 hover:underline cursor-pointer">
                    <LogOut className="h-3 w-3" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                  <Link href="/account/orders" className="hover:underline hidden sm:inline">Order Status</Link>
                  <Link href="/my-books" className="hover:underline hidden sm:inline">My Books</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* LOGO + SEARCH + ICONS */}
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
          <button
            className="md:hidden flex items-center justify-center p-1 text-gray-700 hover:text-black shrink-0"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="flex items-center shrink-0 ml-10 md:ml-0 flex-1 justify-center md:flex-none md:justify-start">
            <Image
              src="/images/logo/AGPH-Logo-Black-600x290.webp"
              alt="AGPH Store Logo"
              width={110} height={54} priority
              className="w-[110px] md:w-[140px] h-auto"
            />
          </Link>

          <div className="flex-1 relative hidden md:block">
            <SearchBox {...sharedSearchProps} />
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-gray-700 shrink-0">
            <Link href="/wishlist" aria-label="Wishlist"><Heart className="h-5 w-5 cursor-pointer hover:text-black" /></Link>
            <button aria-label="Account" onClick={() => setSliderOpen(true)}><User className="h-5 w-5 cursor-pointer hover:text-black" /></button>
            <Link href="/cart" className="relative" aria-label="Cart">
              <ShoppingBag className="h-5 w-5 cursor-pointer hover:text-black" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className="md:hidden px-4 pb-3">
          <SearchBox {...sharedSearchProps} />
        </div>

        {/* DESKTOP NAV */}
        <nav className="hidden md:block border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-4 py-3 flex gap-6 lg:gap-10 text-sm font-medium text-gray-800 justify-center overflow-x-auto">
            {NAV_LINKS.map(({ href, label, external }) => (
              <Link
                key={href} href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={`nav-link whitespace-nowrap ${!external ? isActive(href) : "hover:text-green-600"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-sm absolute left-0 right-0 z-50">
            <nav className="flex flex-col px-4 py-2">
              {NAV_LINKS.map(({ href, label, external }) => (
                <Link
                  key={href} href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 text-sm font-medium border-b border-gray-100 last:border-0 ${!external ? isActive(href) : "hover:text-green-600"}`}
                >
                  {label}
                </Link>
              ))}
              {user && (
                <div className="flex gap-4 py-3 text-xs text-gray-600 sm:hidden">
                  <span className="font-medium">Hi, {user.name.split(" ")[0]}</span>
                  <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className="hover:underline">Order Status</Link>
                  <Link href="/my-books" onClick={() => setMobileMenuOpen(false)} className="hover:underline">My Books</Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-1 text-red-600 hover:underline">
                    <LogOut className="h-3 w-3" /> Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════
          COMPACT STICKY BAR
      ═══════════════════════════════════════ */}
      <div
        className={`
          fixed top-0 left-0 right-0 z-[60] bg-white border-b border-gray-200 shadow-sm
          transition-all duration-300 ease-in-out
          ${scrolled ? "translate-y-0 opacity-100 pointer-events-auto" : "-translate-y-full opacity-0 pointer-events-none"}
        `}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center gap-3">
          <Link href="/" className="hidden md:flex shrink-0 items-center mr-2">
            <Image
              src="/images/logo/AGPH-Logo-Black-600x290.webp"
              alt="AGPH Store Logo"
              width={100} height={54}
              className="w-[110px] h-auto"
            />
          </Link>

          <div className="flex-1 relative">
            <SearchBox {...sharedSearchProps} />
          </div>

          <div className="flex items-center gap-3 text-gray-700 shrink-0">
            <Link href="/wishlist" aria-label="Wishlist" className="hidden sm:block">
              <Heart className="h-5 w-5 hover:text-black" />
            </Link>
            <button aria-label="Account" onClick={() => setSliderOpen(true)}>
              <User className="h-5 w-5 hover:text-black" />
            </button>
            <Link href="/cart" className="relative" aria-label="Cart">
              <ShoppingBag className="h-5 w-5 hover:text-black" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <AccountSlider
        open={sliderOpen}
        onClose={() => setSliderOpen(false)}
        user={user}
        onLogout={logout}
      />
    </>
  );
};

/* ── SearchBox ── */
type SearchBoxProps = {
  query: string;
  setQuery: (v: string) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  results: { products: any[]; authors: any[] };
  highlightMatch: (text: string, query: string) => any;
  isSearching: boolean;
};

const SearchBox = ({ query, setQuery, showSearch, setShowSearch, results, highlightMatch, isSearching }: SearchBoxProps) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  
  // Only show the dropdown if search is focused and query has 2+ characters
  const shouldShowDropdown = showSearch && query.length >= 2;
  const hasNoResults = results.products.length === 0 && results.authors.length === 0;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setShowSearch(true); }}
        placeholder="Search books, authors, ebooks"
        className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-black"
      />
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
      {query && (
        <X
          onClick={() => { setQuery(""); setShowSearch(false); }}
          className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
        />
      )}

      {/* DROPDOWN LOGIC */}
      {shouldShowDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-[420px] overflow-y-auto z-50">
          
          {isSearching ? (
            <div className="p-4 text-sm text-center text-gray-500">
              Searching...
            </div>
          ) : (
            <>
              {results.authors.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Authors</p>
                  {results.authors.map((a: any) => (
                    <Link key={a.id} href={`/author/${a.slug}`} onClick={() => setShowSearch(false)}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-100">
                      <span className="text-sm font-medium">{highlightMatch(a.name, query)}</span>
                    </Link>
                  ))}
                </div>
              )}
              {results.products.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Products</p>
                  {results.products.map((p: any) => (
                    <Link key={p.id} href={`/product/${p.slug}`} onClick={() => setShowSearch(false)}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-100">
                      <img src={`${API_URL}${p.main_image}`} className="h-12 w-10 border border-gray-200 rounded object-cover" alt={p.title} />
                      <div className="leading-tight">
                        <p className="text-sm font-medium">{highlightMatch(p.title, query)}</p>
                        <p className="text-xs text-gray-500">{p.author}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* NO RESULTS FOUND MESSAGE */}
              {hasNoResults && (
                <div className="p-4 text-sm text-center text-gray-500">
                  No result found for &quot;<span className="font-semibold text-gray-800">{query}</span>&quot;
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;