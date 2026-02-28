"use client";

import { useEffect, useState, Suspense  } from "react";
import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AlertPopup from "@/components/Popups/AlertPopup";


/* ================= TYPES ================= */
type PlanKey = "monthly" | "quarterly" | "yearly";

type Plan = {
  label: string;
  basePrice: number;
  durationLabel: string;
  savings?: string;
};

/* ================= PLANS ================= */
const PLANS: Record<PlanKey, Plan> = {
  monthly: {
    label: "Monthly Plan",
    basePrice: 1,
    durationLabel: "per month",
  },
  quarterly: {
    label: "3 Months Plan",
    basePrice: 399,
    durationLabel: "per 3 months",
    savings: "Save ₹48",
  },
  yearly: {
    label: "Yearly Plan",
    basePrice: 1499,
    durationLabel: "per year",
    savings: "Save ₹289",
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function SubscriptionPaymentPage() {

  const searchParams = useSearchParams();
  const urlPlan = searchParams ? (searchParams.get("plan") as PlanKey | null) : null;


  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [months, setMonths] = useState(1); // only for monthly
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");


  /* ===== Read plan from URL ONCE ===== */
  useEffect(() => {
    if (urlPlan && PLANS[urlPlan]) {
      setPlan(urlPlan);
    }
  }, [urlPlan]);
  useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.body.appendChild(script);
}, []);

  /* ===== Reset months if plan changes ===== */
  useEffect(() => {
    if (plan !== "monthly") {
      setMonths(1);
    }
  }, [plan]);

  const selected = PLANS[plan];

  /* ===== PRICE CALCULATION ===== */
  let totalPrice = selected.basePrice;

  if (plan === "monthly") {
    totalPrice = selected.basePrice * months;
  }

   /* =============================
     🔥 PAYMENT CONNECTION
  ============================== */
const startPayment = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
        setToastMsg("Please login first");
        setToastOpen(true);
      return;
    }

    /* 1️⃣ CREATE SUBSCRIPTION (JWT AUTH) */
    const res = await fetch(
      `${API_URL}/api/subscription-payment/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, months }),
      }
    );

    const sub = await res.json();

    if (!sub.subscription_id) {
      console.error(sub.msg || "Failed to create subscription");
      return;
    }

    /* 2️⃣ OPEN RAZORPAY */
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: sub.amount * 100,
      currency: "INR",
      name: "E-Book Subscription",
      description: `${plan} subscription`,
      handler: async (response: any) => {
        /* 3️⃣ SAVE PAYMENT */
        await fetch(
          `${API_URL}/api/subscription-payment/success`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              subscription_id: sub.subscription_id,
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id || null,
              amount: sub.amount,
            }),
          }
        );

          setToastMsg("Subscription activated successfully");
          setToastOpen(true);
        window.location.href = "/account/subscription";
      },
      theme: { color: "#2563eb" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
      setToastMsg("Payment failed");
      setToastOpen(true);
  } finally {
    setLoading(false);
  }
};


  /* ================= UI ================= */
  return (
    
    <div className=" bg-gray-50 flex items-center justify-center p-15">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ================= LEFT (2 COLS) ================= */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 md:col-span-2">
          <h1 className="text-2xl font-bold">
            Choose your subscription
          </h1>

          {/* PLAN TOGGLE */}
          <div className="grid grid-cols-3 rounded-lg border border-gray-200 overflow-hidden">
            {(["monthly", "quarterly", "yearly"] as PlanKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`py-2 text-sm font-medium cursor-pointer transition ${
                  plan === p
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p === "quarterly" ? "3 Months" : p}
              </button>
            ))}
          </div>

          {/* PLAN INFO */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <p className="font-semibold">{selected.label}</p>
            <p className="text-gray-600 text-sm">
              Unlimited access to all eBooks
            </p>
            {selected.savings && (
              <span className="inline-block text-xs font-medium text-green-700 bg-green-100 rounded px-2 py-1">
                {selected.savings}
              </span>
            )}
          </div>

          {/* MONTH SELECTOR (ONLY MONTHLY) */}
          {plan === "monthly" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Select number of months
              </label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
                  <option key={m} value={m}>
                    {m} month{m > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FEATURES */}
          <ul className="space-y-2 text-sm">
            {[
              "Unlimited eBook access",
              "Read on mobile & desktop",
              "Cancel anytime",
              "New books added regularly",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* ================= RIGHT (1 COL) ================= */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 md:col-span-1">
          <h2 className="text-xl font-semibold">
            Order Summary
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Plan</span>
              <span>{selected.label}</span>
            </div>

            {plan === "monthly" && (
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{months} month(s)</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Price</span>
              <span>₹{totalPrice}</span>
            </div>

            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹0</span>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{totalPrice}</span>
            </div>
          </div>

          {/* PAY BUTTON */}

          <button
            disabled={loading}
            onClick={startPayment}
            className={`w-full py-3 rounded cursor-pointer text-white ${
              loading ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            {loading ? "Processing..." : `Pay ₹${totalPrice}`}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Secure payment • Cancel anytime
          </p>
        </div>
      </div>
            <AlertPopup
              open={toastOpen}
              message={toastMsg}
              onClose={() => setToastOpen(false)}
            />
    </div>
  );
}
