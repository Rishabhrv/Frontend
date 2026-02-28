"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir",
  "Ladakh","Puducherry",
];

/* ── Shared input class (replaces broken .input class) ── */
const INPUT_CLS =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 transition bg-white";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart,           setCart]           = useState<CartItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [placing,        setPlacing]        = useState(false); // ✅ FIX: was missing
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [saveAddress,    setSaveAddress]    = useState(false);
  const [shipping,       setShipping]       = useState(0);
  const [couponCode,     setCouponCode]     = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError,    setCouponError]    = useState("");
  const [couponApplied,  setCouponApplied]  = useState(false);
  const [couponInfo,     setCouponInfo]     = useState<{ eligible_items?: string[]; applicable_on?: string }>({});
  const [agreed,         setAgreed]         = useState(false);

  const [form, setForm] = useState({
    first_name: "", last_name: "",
    address1: "",
    city: "", state: "", pincode: "",
    phone: "", email: "",
  });

  const hasPaperback = cart.some(i => i.format === "paperback");
  const subtotal     = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const total        = subtotal + shipping - couponDiscount;

  /* ── Prefill from /me ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/checkout/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const first = data.name?.split(" ")[0] || "";
        const last  = data.name?.split(" ").slice(1).join(" ") || "";
        setForm(prev => ({
          ...prev,
          first_name: first,
          last_name:  last,
          email:   data.email   || "",
          phone:   data.phone   || "",
          address1: data.address || "",
          city:    data.city    || "",
          state:   data.state   || "",
          pincode: data.pincode || "",
        }));
      });
  }, []);

  /* ── Fetch cart ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

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
  }, []);

  /* ── Shipping cost on state change ── */
  useEffect(() => {
    if (!hasPaperback || !form.state) { setShipping(0); return; }

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/checkout/shipping-cost`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: form.state }),
    })
      .then(r => r.json())
      .then(data => setShipping(data.shipping || 0));
  }, [form.state, hasPaperback]);

  /* ── Validation ── */
  const validateForm = () => {
    const e: Record<string, string> = {};

    if (hasPaperback) {
      if (!form.first_name.trim()) e.first_name = "First name is required";
      if (!form.last_name.trim())  e.last_name  = "Last name is required";
      if (!form.address1.trim())   e.address1   = "Street address is required";
      if (!form.city.trim())       e.city       = "City is required";
      if (!form.state.trim())      e.state      = "State is required";
      if (!form.pincode.trim())    e.pincode    = "PIN code is required";
      else if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter valid 6-digit PIN code";
      if (!form.phone.trim())      e.phone      = "Phone number is required";
      else if (!/^\d{10}$/.test(form.phone))  e.phone  = "Enter valid 10-digit phone";
    }

    if (!form.email.trim())                    e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Load Razorpay script ── */
  const loadRazorpay = () =>
    new Promise(resolve => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src     = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload  = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  /* ── Apply coupon ── */
  const applyCoupon = async () => {
    setCouponError("");
    const token = localStorage.getItem("token");

    const res  = await fetch(`${API_URL}/api/checkout/apply-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: couponCode }),
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

  /* ── handlePayment ── */
  const handlePayment = async () => {
    // ✅ FIX: both guards were missing
    if (!validateForm()) return;
    if (!agreed) return;

    setPlacing(true);
    const token = localStorage.getItem("token")!;

    try {
      /* 1️⃣ Optionally save address */
      if (saveAddress && hasPaperback) {
        await fetch(`${API_URL}/api/checkout/save-address`, {  // ✅ FIX: was never sent
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            address: form.address1,
            city:    form.city,
            state:   form.state,
            pincode: form.pincode,
          }),
        });
      }

      /* 2️⃣ Create DB order */
      const orderRes  = await fetch(`${API_URL}/api/checkout/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shipping,
          couponCode: couponApplied ? couponCode : null,
          address: {
            first_name: form.first_name,
            last_name:  form.last_name,
            address:    form.address1,
            city:       form.city,
            state:      form.state,
            pincode:    form.pincode,
            phone:      form.phone,
            email:      form.email,
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
      const rpRes   = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderData.order_id }),
      });
      const rpOrder = await rpRes.json();

      await loadRazorpay();

      /* 4️⃣ Open Razorpay modal */
      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rpOrder.amount,
        currency:    "INR",
        name:        "AGPH Store",
        description: "Order Payment",
        order_id:    rpOrder.id,

        handler: async (response: any) => {
          // ✅ FIX: verifyRes was used but never declared — now properly assigned
          const verifyRes  = await fetch(`${API_URL}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...response, order_id: orderData.order_id }),
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
          name:    `${form.first_name} ${form.last_name}`,
          email:   form.email,
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

  if (loading) return (
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

        {/* ══════════ LEFT: SHIPPING FORM ══════════ */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-6 border-b border-gray-300 pb-3">
            Shipping details
          </h2>

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
                  {/* ✅ FIX: .input replaced with real Tailwind classes */}
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

              {/* Save address */}
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={e => setSaveAddress(e.target.checked)}
                  className="w-4 h-4"
                />
                Save this address for future orders
              </label>
            </div>
          )}

          {/* Email — always shown, read-only */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Email address <span className="text-red-500">*</span></label>
            <input
              className={`${INPUT_CLS} bg-gray-100 cursor-not-allowed text-gray-500`}
              value={form.email}
              readOnly
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* ══════════ RIGHT: ORDER SUMMARY ══════════ */}
        <div className="border border-gray-300 rounded-xl p-6 bg-white h-fit sticky top-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2">Your order</h3>

          {/* Cart items */}
          <div className="space-y-4 text-sm mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-3">
                <div className="flex gap-3">
                  <Image
                    src={`${API_URL}${item.main_image}`}
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
                {/* ✅ FIX: show total price per line, not just unit price */}
                <span className="font-medium text-xs whitespace-nowrap">
                  ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-gray-200 mb-4" />

          {/* Coupon */}
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
          </div>

          <hr className="border-gray-200 mb-4" />

          {/* Totals */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {hasPaperback && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {shipping > 0
                  ? <span>₹{shipping.toLocaleString("en-IN")}</span>
                  : <span className="text-green-600 font-medium">Free</span>
                }
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

          {/* Payment method info */}
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
            {/* ✅ FIX: loading spinner while placing */}
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              `PAY ₹${total.toLocaleString("en-IN")}`
            )}
          </button>
        </div>

      </div>
    </div>
  );
}