"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AlertPopup from "@/components/Popups/AlertPopup";
import {
  getGuestCart,
  GuestCartItem,
  mergeGuestDataOnLogin,
} from "@/utils/guestStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const LOCKOUT_MINUTES = 15;

type CartItem = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
  format: "ebook" | "paperback";
  quantity: number;
  price: number;
  category_imprints?: string;
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Puducherry",
];

/* ── Shared input class (unchanged — used by shipping fields) ── */
const INPUT_CLS =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 transition bg-white";

/* ── New: input class for the redesigned auth section (icon padding + disabled state) ── */
const AUTH_INPUT_CLS =
  "w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

/* ── Small inline icons used only in the auth card ── */
const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════════
   CHECKOUT PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function CheckoutPage() {
  const router = useRouter();

  /* ── Auth state ── */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);

  /* ── Cart / checkout state ── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAddress, setSaveAddress] = useState(false);
  const [shipping, setShipping] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponInfo, setCouponInfo] = useState<{ eligible_items?: string[]; applicable_on?: string }>({});
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    first_name: "", last_name: "",
    address1: "",
    city: "", state: "", pincode: "",
    phone: "", email: "",
  });

  /* ── Inline auth state ── */
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regStep, setRegStep] = useState<"details" | "otp">("details");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [regLoading, setRegLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  // Shared
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("error");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const hasPaperback = cart.some(i => i.format === "paperback");
  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const total = subtotal + shipping - couponDiscount;

  /* ────────────────────────────────────────────────────────────────────────────
     EFFECTS
     ──────────────────────────────────────────────────────────────────────────── */

  /* ── Check auth on mount ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setAuthChecked(true);
  }, []);

  /* ── Hide success banner after 3 seconds ── */
  useEffect(() => {
    if (isLoggedIn && showSuccessBanner) {
      const timer = setTimeout(() => setShowSuccessBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, showSuccessBanner]);

  /* ── Load cart (guest or logged-in) ── */
  useEffect(() => {
    if (!authChecked) return;

    if (new URLSearchParams(window.location.search).get("buyNow") === "true") {
      const stored = sessionStorage.getItem("buyNowItem");
      if (stored) {
        try {
          const item = JSON.parse(stored);
          setCart([{ ...item, id: 0, main_image: item.image || item.main_image }]); // Ensure id exists for mapping
          setLoading(false);
          return;
        } catch (e) { }
      }
    }

    if (isLoggedIn) {
      loadLoggedInCart();
    } else {
      loadGuestCart();
    }
  }, [authChecked, isLoggedIn]);

  /* ── Prefill from /me when logged in ── */
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/checkout/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const first = data.name?.split(" ")[0] || "";
        const last = data.name?.split(" ").slice(1).join(" ") || "";

        // Only overwrite fields that have saved data from the DB
        // If the user already typed something as a guest, keep it
        setForm(prev => ({
          ...prev,
          first_name: data.name ? first : prev.first_name,
          last_name: data.name ? last : prev.last_name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          address1: data.address || prev.address1,
          city: data.city || prev.city,
          state: data.state || prev.state,
          pincode: data.pincode || prev.pincode,
        }));
      });
  }, [isLoggedIn]);

  /* ── Load Available Coupons ── */
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/coupons/available`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableCoupons(data);
      })
      .catch(console.error);
  }, [isLoggedIn]);

  /* ── Shipping cost on state change ── */
  /* ── Shipping cost on state change ── */
  useEffect(() => {
    // Abort if no paperback is in the cart, state is missing, or cart is empty.
    if (!hasPaperback || !form.state || cart.length === 0) {
      setShipping(0);
      return;
    }

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    // Attach token if the user happens to be logged in
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${API_URL}/api/checkout/shipping-cost`, {
      method: "POST",
      headers,
      body: JSON.stringify({ state: form.state, items: cart }), // Sending cart items for guests!
    })
      .then(r => r.json())
      .then(data => {
        console.log("Shipping Data:", data); // Helps you debug if it still says 0
        setShipping(data.shipping || 0);
      })
      .catch(() => setShipping(0));
  }, [form.state, hasPaperback, cart]); // Added cart to dependencies

  /* ── Lockout countdown ── */
  useEffect(() => {
    if (countdown <= 0) { setLocked(false); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* ── Resend OTP countdown ── */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  /* ────────────────────────────────────────────────────────────────────────────
     CART LOADERS
     ──────────────────────────────────────────────────────────────────────────── */

  function loadGuestCart() {
    const guestItems: CartItem[] = getGuestCart()
      .filter((i: GuestCartItem) =>
        !i.category_imprints || i.category_imprints.split(",").includes("agph")
      )
      .map((i: GuestCartItem, idx: number) => ({
        id: idx,
        title: i.title,
        slug: i.slug,
        main_image: i.image,
        format: i.format,
        quantity: i.quantity,
        price: i.price,
        category_imprints: i.category_imprints,
      }));
    setCart(guestItems);
    setLoading(false);
  }

  function loadLoggedInCart() {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      fetch(`${API_URL}/api/cart/my`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${API_URL}/api/categories`).then(r => r.json()),
    ])
      .then(([cartData]) => {
        const filtered = Array.isArray(cartData)
          ? cartData.filter((item: CartItem) =>
            item.category_imprints?.split(",").includes("agph")
          )
          : [];
        setCart(filtered);
      })
      .finally(() => setLoading(false));
  }

  /* ────────────────────────────────────────────────────────────────────────────
     POST-LOGIN HANDLER (shared by login, register, Google)
     ──────────────────────────────────────────────────────────────────────────── */

  async function handlePostLogin(token: string) {
    localStorage.setItem("token", token);
    await mergeGuestDataOnLogin(token);
    window.dispatchEvent(new Event("auth-change"));
    window.dispatchEvent(new Event("cart-change"));

    // Save the guest-typed form values so they survive the /me prefill
    // The prefill effect will only overwrite if the DB has saved data
    setIsLoggedIn(true);
    setLoading(true);
    // Cart & form will re-fetch via the useEffects that depend on isLoggedIn
  }

  /* ────────────────────────────────────────────────────────────────────────────
     INLINE LOGIN
     ──────────────────────────────────────────────────────────────────────────── */

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || loginLoading) return;

    setLoginError("");
    setRemaining(null);
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.locked) {
          setLocked(true);
          setCountdown((data.minutesLeft ?? LOCKOUT_MINUTES) * 60);
        } else {
          setRemaining(data.remaining ?? null);
        }
        setLoginError(data.msg || "Login failed.");
        return;
      }

      setToastMsg("Signed in successfully!");
      setToastType("success");
      setToastOpen(true);
      await handlePostLogin(data.token);

    } catch {
      setToastMsg("Network error. Please try again.");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setLoginLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────────
     INLINE REGISTER (2-step OTP)
     ──────────────────────────────────────────────────────────────────────────── */

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);

    const res = await fetch(`${API_URL}/api/auth/send-register-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail }),
    });
    const data = await res.json();
    setRegLoading(false);

    if (!res.ok) {
      setToastMsg(data.msg);
      setToastType("error");
      setToastOpen(true);
      return;
    }

    setRegStep("otp");
    setResendTimer(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setToastMsg("Please enter the complete 6-digit code.");
      setToastType("error");
      setToastOpen(true);
      return;
    }

    setRegLoading(true);
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, otp: otpString }),
    });
    const data = await res.json();
    setRegLoading(false);

    if (!res.ok) {
      setToastMsg(data.msg);
      setToastType("error");
      setToastOpen(true);
      return;
    }

    // After registration, auto-login
    setRegLoading(true);
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: regPassword }),
    });
    const loginData = await loginRes.json();
    setRegLoading(false);

    if (!loginRes.ok) {
      setToastMsg("Account created! Please sign in.");
      setToastType("success");
      setToastOpen(true);
      setAuthTab("login");
      setLoginEmail(regEmail);
      return;
    }

    setToastMsg("Account created & signed in!");
    setToastType("success");
    setToastOpen(true);
    await handlePostLogin(loginData.token);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setRegLoading(true);
    const res = await fetch(`${API_URL}/api/auth/send-register-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail }),
    });
    const data = await res.json();
    setRegLoading(false);
    setToastMsg(res.ok ? "New OTP sent!" : data.msg);
    setToastType(res.ok ? "success" : "error");
    setToastOpen(true);
    if (res.ok) {
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────────
     GOOGLE SIGN-IN
     ──────────────────────────────────────────────────────────────────────────── */

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Try login first, fall back to register
      let res = await fetch(`${API_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          google_id: user.uid,
        }),
      });
      let data = await res.json();

      if (!res.ok) {
        // Try register
        res = await fetch(`${API_URL}/api/auth/google/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.displayName,
            email: user.email,
            google_id: user.uid,
          }),
        });
        data = await res.json();
      }

      if (!res.ok) {
        setToastMsg(data.msg || "Google sign-in failed.");
        setToastType("error");
        setToastOpen(true);
        return;
      }

      setToastMsg("Signed in with Google!");
      setToastType("success");
      setToastOpen(true);
      await handlePostLogin(data.token);

    } catch (err) {
      console.error("Google sign-in failed:", err);
      setToastMsg("Google sign-in failed. Please try again.");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────────
     CHECKOUT LOGIC (unchanged)
     ──────────────────────────────────────────────────────────────────────────── */

  const validateForm = () => {
    const e: Record<string, string> = {};

    if (hasPaperback) {
      if (!form.first_name.trim()) e.first_name = "First name is required";
      if (!form.last_name.trim()) e.last_name = "Last name is required";
      if (!form.address1.trim()) e.address1 = "Street address is required";
      if (!form.city.trim()) e.city = "City is required";
      if (!form.state.trim()) e.state = "State is required";
      if (!form.pincode.trim()) e.pincode = "PIN code is required";
      else if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter valid 6-digit PIN code";
      if (!form.phone.trim()) e.phone = "Phone number is required";
      else if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter valid 10-digit phone";
    }

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadRazorpay = () =>
    new Promise(resolve => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const applyCoupon = async (overrideCode?: string | React.MouseEvent) => {
    const code = typeof overrideCode === "string" ? overrideCode : couponCode;
    if (typeof overrideCode === "string") setCouponCode(code);

    setCouponError("");
    const token = localStorage.getItem("token");

    const isBuyNow = new URLSearchParams(window.location.search).get("buyNow") === "true";
    const buyNowItemStr = isBuyNow ? sessionStorage.getItem("buyNowItem") : null;
    let buyNowItem = null;
    if (buyNowItemStr) {
      try { buyNowItem = JSON.parse(buyNowItemStr); } catch (e) { }
    }

    const res = await fetch(`${API_URL}/api/checkout/apply-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, buyNowItem }),
    });
    const data = await res.json();

    if (!res.ok) { setCouponError(data.msg); return; }

    setCouponDiscount(Number(data.discount || 0));
    setCouponInfo({ eligible_items: data.eligible_items, applicable_on: data.applicable_on });
    setCouponApplied(true);
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError("");
    setCouponInfo({});
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    if (!agreed) return;

    setPlacing(true);
    const token = localStorage.getItem("token")!;

    try {
      /* 1️⃣ Optionally save address */
      if (saveAddress && hasPaperback) {
        await fetch(`${API_URL}/api/checkout/save-address`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            address: form.address1,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          }),
        });
      }

      /* 2️⃣ Create DB order */
      const isBuyNow = new URLSearchParams(window.location.search).get("buyNow") === "true";
      const buyNowItemStr = isBuyNow ? sessionStorage.getItem("buyNowItem") : null;
      let buyNowItem = null;
      if (buyNowItemStr) {
        try { buyNowItem = JSON.parse(buyNowItemStr); } catch (e) { }
      }

      const orderRes = await fetch(`${API_URL}/api/checkout/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shipping,
          couponCode: couponApplied ? couponCode : null,
          buyNowItem,
          address: {
            first_name: form.first_name,
            last_name: form.last_name,
            address: form.address1,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            phone: form.phone,
            email: form.email,
          },
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        alert(orderData.msg || "Failed to create order");
        setPlacing(false);
        return;
      }

      /* 3️⃣ Create Razorpay order */
      const rpRes = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderData.order_id }),
      });
      const rpOrder = await rpRes.json();

      await loadRazorpay();

      /* 4️⃣ Open Razorpay modal */
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: "INR",
        name: "AGPH Store",
        description: "Order Payment",
        order_id: rpOrder.id,

        handler: async (response: any) => {
          const getCookie = (name: string) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return match[2];
            return undefined;
          };

          const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              ...response, 
              order_id: orderData.order_id, 
              is_buy_now: isBuyNow,
              fbp: getCookie("_fbp"),
              fbc: getCookie("_fbc")
            }),
          });
          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            alert(verifyData.msg || "Payment verification failed");
            setPlacing(false);
            return;
          }

          router.push(`/order-confirmed?order_id=${verifyData.order_id}`);
        },

        modal: {
          ondismiss: () => setPlacing(false),
        },

        prefill: {
          name: `${form.first_name} ${form.last_name}`,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Payment error:", err);
      alert("Something went wrong. Please try again.");
      setPlacing(false);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────────────────────────── */

  if (!authChecked || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading checkout…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* ══════════ LEFT: AUTH + SHIPPING ══════════ */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── SHIPPING DETAILS (always visible) ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-base font-semibold text-gray-900">Shipping details</h2>
            </div>

            {!hasPaperback && (
              <p className="text-sm text-gray-500 mb-6 bg-blue-50 border border-blue-100 rounded p-3">
                📘 This order contains only eBooks — no shipping address needed.
              </p>
            )}

            {hasPaperback && (
              <div className="space-y-4">

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First name <span className="text-red-500">*</span></label>
                    <input
                      className={INPUT_CLS}
                      value={form.first_name}
                      onChange={e => { setForm(p => ({ ...p, first_name: e.target.value })); setErrors(p => ({ ...p, first_name: "" })); }}
                    />
                    {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last name <span className="text-red-500">*</span></label>
                    <input
                      className={INPUT_CLS}
                      value={form.last_name}
                      onChange={e => { setForm(p => ({ ...p, last_name: e.target.value })); setErrors(p => ({ ...p, last_name: "" })); }}
                    />
                    {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>}
                  </div>
                </div>

                {/* Street address */}
                <div>
                  <label className="block text-sm font-medium mb-1">Street address <span className="text-red-500">*</span></label>
                  <input
                    className={INPUT_CLS}
                    value={form.address1}
                    onChange={e => { setForm(p => ({ ...p, address1: e.target.value })); setErrors(p => ({ ...p, address1: "" })); }}
                  />
                  {errors.address1 && <p className="text-xs text-red-600 mt-1">{errors.address1}</p>}
                </div>

                {/* City / State / PIN */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Town / City <span className="text-red-500">*</span></label>
                    <input
                      className={INPUT_CLS}
                      value={form.city}
                      onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setErrors(p => ({ ...p, city: "" })); }}
                    />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">State <span className="text-red-500">*</span></label>
                    <select
                      className={INPUT_CLS}
                      value={form.state}
                      onChange={e => { setForm(p => ({ ...p, state: e.target.value })); setErrors(p => ({ ...p, state: "" })); }}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">PIN Code <span className="text-red-500">*</span></label>
                    <input
                      className={INPUT_CLS}
                      value={form.pincode}
                      maxLength={6}
                      onChange={e => { setForm(p => ({ ...p, pincode: e.target.value })); setErrors(p => ({ ...p, pincode: "" })); }}
                    />
                    {errors.pincode && <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">Phone <span className="text-red-500">*</span></label>
                  <input
                    className={INPUT_CLS}
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: "" })); }}
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>

                {/* Save address — only when logged in */}
                {isLoggedIn && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={e => setSaveAddress(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Save this address for future orders
                  </label>
                )}
              </div>
            )}

            {/* Email — editable for guests, read-only for logged-in */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Email address <span className="text-red-500">*</span></label>
              {isLoggedIn ? (
                <input
                  className={`${INPUT_CLS} bg-gray-100 cursor-not-allowed text-gray-500`}
                  value={form.email}
                  readOnly
                />
              ) : (
                <input
                  className={INPUT_CLS}
                  type="email"
                  value={form.email}
                  placeholder="you@example.com"
                  onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: "" })); }}
                />
              )}
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
          </div>


          {/* ── ACCOUNT (auth section — redesigned) ── */}
          {!isLoggedIn ? (
            <div className="relative  bg-white  overflow-hidden">
              <div className="h-[3px] bg-black" />

              <div className="">

                {/* Sliding segmented tab */}
                <div className="relative grid grid-cols-2 bg-gray-100 rounded-full p-1 mb-7 ">
                  <span
                    aria-hidden
                    className="absolute top-1 bottom-1 left-1 w-[calc(5=30%-4px)] rounded-full bg-black transition-transform duration-300 ease-out"
                    style={{ transform: authTab === "register" ? "translateX(100%)" : "translateX(0%)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setAuthTab("login")}
                    className={`relative z-10 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer ${authTab === "login" ? "text-white bg-gray-600" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab("register"); setRegStep("details"); }}
                    className={`relative z-10 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer ${authTab === "register" ? "text-white bg-gray-600" : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* ── LOGIN TAB ── */}
                {authTab === "login" && (
                  <form onSubmit={handleLogin}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MailIcon />
                          </span>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            className={AUTH_INPUT_CLS}
                            value={loginEmail}
                            onChange={e => { setLoginEmail(e.target.value); setLoginError(""); }}
                            disabled={locked}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <LockIcon />
                          </span>
                          <input
                            type="password"
                            placeholder="Enter your password"
                            className={AUTH_INPUT_CLS}
                            value={loginPassword}
                            onChange={e => { setLoginPassword(e.target.value); setLoginError(""); }}
                            disabled={locked}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mb-4">
                      <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-black transition underline-offset-2 hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    {loginError && (
                      <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${locked
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-amber-50 border border-amber-200 text-amber-700"
                        }`}>
                        <p className="font-medium">{loginError}</p>
                        {locked && countdown > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className="text-xs">
                              Try again in{" "}
                              <span className="font-mono font-bold text-sm">{fmt(countdown)}</span>
                            </span>
                          </div>
                        )}
                        {!locked && remaining !== null && remaining > 0 && (
                          <p className="mt-1 text-xs">
                            {remaining} attempt{remaining !== 1 ? "s" : ""} remaining before your account is temporarily locked.
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={locked || loginLoading}
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all mb-3 ${locked
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        : loginLoading
                          ? "bg-gray-800 text-white cursor-wait opacity-75"
                          : "bg-black text-white hover:bg-gray-800 cursor-pointer"
                        }`}
                    >
                      {locked
                        ? `Locked — ${fmt(countdown)}`
                        : loginLoading
                          ? "Signing in…"
                          : "Sign In & Continue"}
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-2.5 border border-gray-300 rounded-lg py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition cursor-pointer disabled:opacity-50"
                    >
                      <img src="./google-color.svg" alt="Google" className="w-4.5 h-4.5" />
                      {googleLoading ? "Connecting…" : "Continue with Google"}
                    </button>
                  </form>
                )}

                {/* ── REGISTER TAB — DETAILS ── */}
                {authTab === "register" && regStep === "details" && (
                  <form onSubmit={handleSendOtp}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <UserIcon />
                          </span>
                          <input
                            type="text"
                            placeholder="John Doe"
                            className={AUTH_INPUT_CLS}
                            value={regName}
                            onChange={e => setRegName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MailIcon />
                          </span>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            className={AUTH_INPUT_CLS}
                            value={regEmail}
                            onChange={e => setRegEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <LockIcon />
                          </span>
                          <input
                            type="password"
                            placeholder="Min. 8 characters"
                            className={AUTH_INPUT_CLS}
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            minLength={8}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer mb-3"
                    >
                      {regLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Sending code…
                        </>
                      ) : (
                        "Send Verification Code →"
                      )}
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-2.5 border border-gray-300 rounded-lg py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition cursor-pointer disabled:opacity-50"
                    >
                      <img src="./google-color.svg" alt="Google" className="w-4.5 h-4.5" />
                      {googleLoading ? "Connecting…" : "Continue with Google"}
                    </button>
                  </form>
                )}

                {/* ── REGISTER OTP STEP ── */}
                {authTab === "register" && regStep === "otp" && (
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                          <MailIcon />
                        </span>
                        <p className="text-sm text-gray-600 truncate">
                          Code sent to <span className="font-semibold text-gray-900">{regEmail}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setRegStep("details"); setOtp(["", "", "", "", "", ""]); }}
                        className="text-xs text-gray-500 hover:text-black underline underline-offset-2 cursor-pointer shrink-0"
                      >
                        Change
                      </button>
                    </div>

                    {/* OTP boxes */}
                    <div className="flex flex-col items-center gap-3">
                      <label className="text-xs font-medium text-gray-600">Enter the 6-digit verification code</label>
                      <div className="flex gap-2" onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={el => { otpRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpChange(idx, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                            className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2
                              transition-all duration-150 outline-none
                              ${digit
                                ? "border-black bg-black text-white scale-105"
                                : "border-gray-200 focus:ring-2 focus:ring-black/10 focus:border-gray-400 bg-white text-gray-800"
                              }`}
                          />
                        ))}
                      </div>

                      {/* Resend */}
                      {resendTimer > 0 ? (
                        <p className="text-xs text-gray-400">
                          Resend in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={regLoading}
                          className="text-xs text-gray-500 hover:text-black underline underline-offset-2 disabled:opacity-50 cursor-pointer"
                        >
                          Didn&apos;t receive it? Resend code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading || otp.join("").length < 6}
                      className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {regLoading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Creating account…
                        </>
                      ) : (
                        "Verify & Continue"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : showSuccessBanner ? (
            /* ── Signed-in confirmation ── */
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50/60 shadow-sm px-5 py-4">
              <span className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-green-900">Signed in</p>
                <p className="text-xs text-green-700">{form.email}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ══════════ RIGHT: ORDER SUMMARY ══════════ */}
        <div className="border border-gray-300 rounded-xl p-6 bg-white h-fit sticky top-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2">Your order</h3>

          {/* Cart items */}
          <div className="space-y-4 text-sm mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Your cart is empty.</p>
            ) : (
              cart.map(item => (
                <div key={`${item.id}-${item.format}`} className="flex justify-between items-start gap-3">
                  <div className="flex gap-3">
                    <Image
                      src={item.main_image?.startsWith("http") ? item.main_image : `${API_URL}${item.main_image}`}
                      width={50} height={70}
                      alt={item.title}
                      unoptimized
                      className="rounded object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-xs leading-snug line-clamp-2">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.format === "ebook" ? "eBook" : `Paperback × ${item.quantity}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-xs whitespace-nowrap">
                    ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>

          <hr className="border-gray-200 mb-4" />

          {/* Coupon — only when logged in */}
          {isLoggedIn && (
            <>
              <div className="mb-4">
                <label className="text-sm font-medium block mb-1">Have a coupon?</label>
                {!couponApplied ? (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      placeholder="ENTER CODE"
                      className="border border-gray-300 px-3 py-2 rounded w-full text-sm outline-none focus:ring-2 focus:ring-black/20"
                    />
                    <button
                      onClick={applyCoupon}
                      className="bg-black text-white px-4 rounded text-sm hover:bg-gray-800 transition whitespace-nowrap cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-green-700">{couponCode} applied ✓</p>
                      {couponInfo.eligible_items && (
                        <p className="text-xs text-green-600 mt-0.5">
                          On: {couponInfo.eligible_items.join(", ")}
                        </p>
                      )}
                    </div>
                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline ml-3 cursor-pointer transition">
                      Remove
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}

                {/* Available Coupons List */}
                {!couponApplied && availableCoupons.length > 0 && (
                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Coupons</p>
                      {availableCoupons.length > 2 && (
                        <Link href="/account/coupons" className="text-xs font-medium text-blue-600 hover:underline">
                          See all ({availableCoupons.length})
                        </Link>
                      )}
                    </div>
                    <div className="space-y-3 pr-1">
                      {availableCoupons.slice(0, 2).map((c, i) => (
                        <div key={i} className="flex items-center justify-between border border-dashed border-gray-300 rounded-lg p-2 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-gray-800 tracking-tight">{c.code}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.discount_type === "percent" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                              {c.min_cart_value > 0 ? ` on orders above ₹${c.min_cart_value}` : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => applyCoupon(c.code)}
                            className="text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-3.5 py-1.5 rounded hover:bg-black hover:text-white hover:border-black transition-all shadow-sm cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-200 mb-4" />
            </>
          )}

          {/* Totals */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {hasPaperback && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {!form.state ? (
                  <span className="text-gray-400 text-xs">Enter state to calculate</span>
                ) : shipping > 0 ? (
                  <span>₹{shipping.toLocaleString("en-IN")}</span>
                ) : (
                  <span className="text-green-600 font-medium">Free</span>
                )}
              </div>
            )}
            {couponApplied && couponDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>−₹{couponDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment section — only when logged in */}
          {isLoggedIn && (
            <>
              <div className="text-sm mb-4 bg-gray-50 border border-gray-200 rounded p-3">
                <p className="font-medium mb-1">Credit / Debit Card · NetBanking · UPI</p>
                <p className="text-gray-500 text-xs">Pay securely via Razorpay.</p>
              </div>

              {/* eBook notice */}
              {cart.some(i => i.format === "ebook") && (
                <div className="text-xs text-gray-600 bg-blue-50 border border-blue-100 p-3 rounded mb-4">
                  📘 <strong>eBook delivery:</strong> Available instantly in <strong>My Orders</strong> after payment.
                </div>
              )}

              {/* Terms checkbox */}
              <label className="flex items-start gap-2 text-xs mb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link href="/terms-and-conditions" className="underline">terms and conditions</Link>
                </span>
              </label>

              {/* Pay button */}
              <button
                onClick={handlePayment}
                disabled={!agreed || placing}
                className={`w-full py-3 rounded font-semibold text-sm transition
                  ${agreed && !placing
                    ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : (
                  `PAY ₹${total.toLocaleString("en-IN")}`
                )}
              </button>
            </>
          )}

          {/* When not logged in, show disabled pay button */}
          {!isLoggedIn && (
            <div className="text-center">
              <button
                disabled
                className="w-full py-3 rounded font-semibold text-sm bg-gray-200 text-gray-400 cursor-not-allowed"
              >
                Sign in to pay
              </button>
              <p className="text-xs text-gray-400 mt-2">Fill your details above, then sign in to proceed.</p>
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      <AlertPopup
        open={toastOpen}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}