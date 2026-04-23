import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import "../../app/globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type PageKey =
  | "products" | "orders"   | "category"      | "subject"
  | "author"   | "users"    | "reviews"        | "shipping"
  | "subscriptions" | "payment" | "coupons"    | "ads";

// Same order as sidebar — first match wins for redirect
const PAGE_ROUTES: Record<PageKey, string> = {
  products:      "/admin/product/ProductsPage",
  orders:        "/admin/orders/OrdersPage",
  category:      "/admin/category/addcategories",
  subject:       "/admin/subject/SubjectPage",
  author:        "/admin/author/productauthortable",
  users:         "/admin/users/UsersPage",
  reviews:       "/admin/reviews/ReviewsPage",
  shipping:      "/admin/shipping/ShippingZone",
  subscriptions: "/admin/subscriptions/SubscriptionPage",
  payment:       "/admin/payment/PaymentPage",
  coupons:       "/admin/coupon/CouponPage",
  ads:           "/admin/ads/AdPage",
};

/** Returns the first route the admin has access to */
function getFirstAllowedRoute(pages: PageKey[], isSuperAdmin: boolean): string {
  if (isSuperAdmin) return PAGE_ROUTES["products"]; // super admin always lands on products
  const first = pages.find((p) => PAGE_ROUTES[p]);
  return first ? PAGE_ROUTES[first] : "/admin/unauthorized";
}

export default function Login() {
  const router = useRouter();

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // true while verifying existing token
  const [dark, setDark]       = useState(false);

  useEffect(() => {
    document.title = "Admin Login | Admin Panel";
  }, []);

  /* ─── If already logged in, redirect to first allowed page ─── */
  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      setChecking(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Step 1 — verify token is still valid
    fetch(`${API_URL}/api/admin/me`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");

        // Step 2 — get their permissions to know where to send them
        const permRes = await fetch(
          `${API_URL}/api/admin/permissions/my-permissions`,
          { headers }
        );

        if (!permRes.ok) throw new Error("no perms");

        const data = await permRes.json();
        const route = getFirstAllowedRoute(data.pages ?? [], data.isSuperAdmin);
        router.replace(route);
      })
      .catch(() => {
        // Token invalid or expired — clear and show login form
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin");
        setChecking(false);
      });
  }, []);

  /* ─── Login submit ─── */
  const login = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || "Login failed");
        return;
      }

      // Store token
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));

      // Fetch permissions to decide where to land
      const permRes = await fetch(
        `${API_URL}/api/admin/permissions/my-permissions`,
        { headers: { Authorization: `Bearer ${data.token}` } }
      );

      if (permRes.ok) {
        const permData = await permRes.json();
        const route = getFirstAllowedRoute(permData.pages ?? [], permData.isSuperAdmin);
        router.push(route);
      } else {
        // Fallback — let AdminGuard handle the block
        router.push("/admin/unauthorized");
      }
    } catch {
      setLoading(false);
      setError("Server not responding");
    }
  };

  /* ─── While checking existing token, show a full-screen loader ─── */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Admin Login
            </h2>
            <button
              onClick={() => setDark(!dark)}
              className="text-sm text-blue-500 hover:text-blue-700 transition cursor-pointer"
            >
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <p className="mb-4 text-red-500 text-sm bg-red-100 dark:bg-red-900/40 p-2 rounded">
              {error}
            </p>
          )}

          <form onSubmit={(e) => { e.preventDefault(); if (!loading) login(); }}>

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Admin Email"
              className="w-full p-3 mb-4 rounded border dark:bg-gray-700 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* PASSWORD */}
            <div className="relative mb-4">
              <input
                type={show ? "text" : "password"}
                placeholder="Password"
                className="w-full p-3 rounded border dark:bg-gray-700 dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                onClick={() => setShow(!show)}
                className="absolute right-3 top-3 cursor-pointer text-sm text-blue-500"
              >
                {show ? "Hide" : "Show"}
              </span>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-xs text-center text-gray-500 mt-6">
            Authorized admin access only
          </p>

        </div>
      </div>
    </div>
  );
}