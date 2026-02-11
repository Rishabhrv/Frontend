"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type CartItem = {
  id: number;
  title: string;
  slug: string;
  main_image: string;
  format: "ebook" | "paperback";
  quantity: number;
  price: number;
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];


export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAddress, setSaveAddress] = useState(false);
  const [originalUser, setOriginalUser] = useState({
  first_name: "",
  last_name: "",
  phone: "",
});
const [shipping, setShipping] = useState(0);
const [form, setForm] = useState({
  first_name: "",
  last_name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
});
const [couponCode, setCouponCode] = useState("");
const [couponDiscount, setCouponDiscount] = useState<number>(0);
const [couponError, setCouponError] = useState("");
const [couponApplied, setCouponApplied] = useState(false);
const [couponInfo, setCouponInfo] = useState<{
  eligible_items?: string[];
  applicable_on?: string;
}>({});


const hasPaperback = cart.some(i => i.format === "paperback");

  const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (hasPaperback) {
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.address1.trim()) newErrors.address1 = "Street address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.pincode.trim()) newErrors.pincode = "PIN code is required";
    if (!/^\d{6}$/.test(form.pincode))
      newErrors.pincode = "Enter valid 6-digit PIN code";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!/^\d{10}$/.test(form.phone))
      newErrors.phone = "Enter valid 10-digit phone number";
  }

  if (!form.email.trim())
    newErrors.email = "Email address is required";
  else if (!/^\S+@\S+\.\S+$/.test(form.email))
    newErrors.email = "Enter a valid email address";

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

useEffect(() => {
  if (!hasPaperback || !form.state) {
    setShipping(0);
    return;
  }

  const token = localStorage.getItem("token");

  fetch(`${API_URL}/api/checkout/shipping-cost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ state: form.state }),
  })
    .then(res => res.json())
    .then(data => {
      setShipping(data.shipping || 0);
    });
}, [form.state, hasPaperback]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`${API_URL}/api/checkout/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
  const first = data.name?.split(" ")[0] || "";
  const last = data.name?.split(" ").slice(1).join(" ") || "";

  setForm(prev => ({
    ...prev,
    first_name: first,
    last_name: last,
    email: data.email || "",
    phone: data.phone || "",
    address1: data.address || "",
    city: data.city || "",
    state: data.state || "",
    pincode: data.pincode || "",
  }));

  setOriginalUser({
    first_name: first,
    last_name: last,
    phone: data.phone || "",
  });
});

}, []);


const loadRazorpay = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });





  /* 🔐 FETCH CART */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API_URL}/api/cart/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCart(data))
      .finally(() => setLoading(false));
  }, []);

  const handlePayment = async () => {
  if (!validateForm()) return;

  const token = localStorage.getItem("token")!;

  /* 🔹 CREATE ORDER IN DB */
  const orderRes = await fetch(`${API_URL}/api/checkout/create`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json", // ✅ REQUIRED
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ shipping }),
});
 const orderData = await orderRes.json();

const rpRes = await fetch(`${API_URL}/api/payment/create-order`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    amount: orderData.total, // ✅ backend-trusted amount
    order_id: orderData.order_id,
  }),
});

  const rpOrder = await rpRes.json();

  await loadRazorpay();

  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: rpOrder.amount,
    currency: "INR",
    name: "AGPH Store",
    description: "Order Payment",
    order_id: rpOrder.id,
    handler: async (response: any) => {
      await fetch(`${API_URL}/api/payment/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...response,
          order_id: orderData.order_id,
        }),
      });

      window.location.href = "/orders";
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
};



  if (loading) return <p className="p-10">Loading checkout…</p>;


  const subtotal = cart.reduce(
    (s, i) => s + i.price * i.quantity,
    0
  );

 const applyCoupon = async () => {
  setCouponError("");

  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/checkout/apply-coupon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code: couponCode }),
  });

  const data = await res.json();

  if (!res.ok) {
    setCouponError(data.msg);
    return;
  }

  setCouponDiscount(Number(data.discount || 0));

  setCouponInfo({
    eligible_items: data.eligible_items,
    applicable_on: data.applicable_on,
  });
  setCouponApplied(true);
};



  
  const total = subtotal + shipping - couponDiscount;


  return (
    <div className="max-w-7xl mx-auto px-20 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* ================= LEFT : BILLING ================= */}
        <div className="lg:col-span-2">

          <h2 className="text-lg font-semibold mb-6 border-b border-gray-300 pb-3">
            Shipping details
          </h2>

          {!hasPaperback && (
            <p className="text-sm text-gray-500 mb-6">
              This order contains only eBooks. No shipping address is required.
            </p>
          )}

          {hasPaperback && (
            <div className="space-y-4 ">

              {/* NAME */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                     className="input"
                     value={form.first_name}
                     onChange={e =>
                       setForm({ ...form, first_name: e.target.value })
                     }
                   />
                   {errors.first_name && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.first_name}
                     </p>
                   )}

                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input"
                    value={form.last_name}
                    onChange={e =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                  />
                  {errors.last_name && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.last_name}
                     </p>
                   )}
                </div>
              </div>


              {/* ADDRESS */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Street address <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={form.address1}
                  onChange={e =>
                    setForm({ ...form, address1: e.target.value })
                  }
                />
                {errors.address1 && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.address1}
                     </p>
                   )}
              </div>

              {/* CITY + PIN */}
              <div className="grid grid-cols-3 gap-4">
                  {/* CITY */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Town / City <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      value={form.city}
                      onChange={e =>
                        setForm({ ...form, city: e.target.value })
                      }
                    />
                    {errors.city && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.city}
                     </p>
                   )}
                  </div>
                
                  {/* STATE */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                  
                    <select
                      className="input"
                      value={form.state}
                      onChange={e =>
                        setForm({ ...form, state: e.target.value })
                      }
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                     {errors.state && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.state}
                     </p>
                   )}
                  </div>

                
                  {/* PINCODE */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      value={form.pincode}
                      onChange={e =>
                        setForm({ ...form, pincode: e.target.value })
                      }
                    />
                    {errors.pincode && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.pincode}
                     </p>
                   )}
                  </div>
                </div>
                

              {/* PHONE */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={e =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
                {errors.phone && (
                     <p className="text-xs text-red-600 mt-1">
                       {errors.phone}
                     </p>
                   )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  className="input bg-gray-100 cursor-not-allowed"
                  value={form.email}
                  readOnly
                />

              </div>
              <label className="flex items-center gap-2 text-sm mt-4">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={e => setSaveAddress(e.target.checked)}
                />
                Save this address for future orders
              </label>
            </div>
            
          )}


        </div>

        {/* ================= RIGHT : ORDER SUMMARY ================= */}
        <div className="border border-gray-300 rounded p-6 bg-white">

          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">
            Your order
          </h3>

          {/* PRODUCTS */}
          <div className="space-y-4 text-sm">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between">
                <div className="flex gap-3">
                  <Image
                    src={`${API_URL}${item.main_image}`}
                    width={50}
                    height={70}
                    alt=""
                    unoptimized
                  />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {item.format === "ebook"
                        ? "eBook"
                        : `Paperback × ${item.quantity}`}
                    </p>
                  </div>
                </div>
                <span>₹{item.price}</span>
              </div>
            ))}
          </div>

          <hr className="my-4 border-gray-200" />
          {/* COUPON */}
          <div className="my-4">
            <label className="text-sm font-medium block mb-1">Have a coupon?</label>
          
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="border px-3 py-2 rounded w-full text-sm"
                disabled={couponApplied}
              />
          
              <button
                onClick={applyCoupon}
                disabled={couponApplied}
                className="bg-black text-white px-4 rounded text-sm"
              >
                Apply
              </button>
            </div>
          
            {couponError && (
              <p className="text-xs text-red-600 mt-1">{couponError}</p>
            )}

          
{couponApplied && couponInfo.eligible_items && (
  <p className="text-xs text-green-600 mt-1">
    Coupon applied on: {couponInfo.eligible_items.join(", ")}
  </p>
)}

          </div>


          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {hasPaperback && (
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
            )}

          </div>

          <hr className="my-4 border-gray-200" />
          
          {couponApplied && (
  <div className="flex justify-between text-sm text-green-700">
    <span>Coupon Discount</span>
    <span>-₹{couponDiscount.toFixed(2)}</span>
  </div>
)}


          <div className="flex justify-between font-semibold mb-4">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>



          {/* PAYMENT */}
          <div className="text-sm mb-4">
            <p className="font-medium mb-2">
              Credit Card / Debit Card / NetBanking
            </p>
            <p className="text-gray-500">
              Pay securely using Razorpay.
            </p>
          </div>

          {/* EBOOK NOTICE */}
          {cart.some(i => i.format === "ebook") && (
            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 p-3 rounded mb-4">
              📘 <strong>eBook delivery:</strong>  
              After successful payment, your eBooks will be available instantly
              in <strong>My Orders</strong>.
            </div>
          )}

          <label className="flex items-start gap-2 text-xs mb-4">
            <input type="checkbox" />
            <span>
              I have read and agree to the{" "}
              <span className="underline">terms and conditions</span>
            </span>
          </label>

         <button
  onClick={handlePayment}
  className="w-full bg-black text-white py-3 rounded font-medium hover:bg-blue-600"
>
  PAY ₹{total.toFixed(2)}
</button>


        </div>
      </div>
    </div>
  );
}
