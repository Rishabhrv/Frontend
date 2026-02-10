import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import "../../app/globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;


export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);



  // 🔐 If admin is already logged in, VERIFY token first
useEffect(() => {
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  fetch(`${API_URL}/api/admin/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (res.ok) {
        // ✅ token is valid → go to admin panel
        router.replace("/admin/product/ProductsPage");
      } else {
        throw new Error();
      }
    })
    .catch(() => {
      // ❌ invalid / expired token → clear storage
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin");
    });
}, []);


  const login = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.msg || "Login failed");
        return;
      }

      // ✅ Store admin auth
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));

      router.push("/admin/product/ProductsPage");
    } catch (err) {
      setLoading(false);
      setError("Server not responding");
    }
  };

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
              className="text-sm text-blue-500"
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

         <form
  onSubmit={(e) => {
    e.preventDefault();
    if (!loading) login();
  }}
>
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
    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition disabled:opacity-60"
  >
    {loading ? "Logging in..." : "Login"}
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
