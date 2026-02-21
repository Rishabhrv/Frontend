"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AlertPopup from "@/components/Popups/AlertPopup";
import SuperAdminOtpModal from "./SuperAdminOtpModal";
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function getToken() {
  return localStorage.getItem("admin_token");
}
function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

/* ─── Types ─── */
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  status: "active" | "blocked";
  provider: "local" | "google";
  created_at: string;
}
interface Address {
  id: number;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}
interface Order {
  id: number;
  total_amount: number;
  status: string;
  payment_status: string;
  coupon_code: string | null;
  coupon_discount: number;
  created_at: string;
}
interface Subscription {
  id: number;
  title: string;
  months: number;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: string;
}
interface Review {
  id: number;
  product_title: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

/* ─── Badge ─── */
function Badge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    active:           "bg-green-100 text-green-700",
    blocked:          "bg-red-100 text-red-600",
    customer:         "bg-blue-100 text-blue-600",
    admin:            "bg-purple-100 text-purple-600",
    local:            "bg-gray-100 text-gray-600",
    google:           "bg-orange-100 text-orange-600",
    pending:          "bg-yellow-100 text-yellow-700",
    paid:             "bg-green-100 text-green-700",
    success:          "bg-green-100 text-green-700",
    failed:           "bg-red-100 text-red-600",
    shipped:          "bg-blue-100 text-blue-600",
    completed:        "bg-green-100 text-green-700",
    cancelled:        "bg-red-100 text-red-600",
    approved:         "bg-green-100 text-green-700",
    expired:          "bg-gray-100 text-gray-500",
    confirmed:        "bg-blue-100 text-blue-600",
    out_for_delivery: "bg-indigo-100 text-indigo-600",
    delivered:        "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[value] ?? "bg-gray-100 text-gray-600"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const roInputCls =
  "w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
      <h2 className="text-sm font-semibold text-gray-700 pb-3 mb-5 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function EditUserPage({ userId }: { userId: string }) {
  const router = useRouter();

  const [user, setUser]           = useState<User | null>(null);
  const [address, setAddress]     = useState<Address | null>(null);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [subscriptions, setSubs]  = useState<Subscription[]>([]);
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg]   = useState("");

  // Superadmin OTP gate
  const [showOtpModal, setShowOtpModal]       = useState(false);
  const [superAdminUnlocked, setSuperAdminUnlocked] = useState(false); // true after OTP verified

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    role: "customer", status: "active",
    newPassword: "", confirmPassword: "",
  });

  const [addrForm, setAddrForm] = useState({
    address: "", city: "", state: "", country: "", pincode: "",
  });
  const [addrEditing, setAddrEditing] = useState(false);
  const [addrSaving, setAddrSaving]   = useState(false);

  const isSuperAdmin = user?.id === 1;
  // superadmin form is editable only after OTP verified
  const superAdminLocked = isSuperAdmin && !superAdminUnlocked;

  /* ── Fetch all ── */
  useEffect(() => {
    const h = authHeaders();
    Promise.all([
      fetch(`${API_URL}/api/admin/users/${userId}`, { headers: h }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/users/${userId}/addresses`, { headers: h }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/users/${userId}/orders`, { headers: h }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/users/${userId}/subscriptions`, { headers: h }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/users/${userId}/reviews`, { headers: h }).then((r) => r.json()),
    ]).then(([u, addr, ord, subs, revs]) => {
      setUser(u);
      setForm({ name: u.name, email: u.email, phone: u.phone ?? "", role: u.role, status: u.status, newPassword: "", confirmPassword: "" });

      const first = Array.isArray(addr) && addr.length > 0 ? addr[0] : null;
      setAddress(first);
      if (first) setAddrForm({ address: first.address, city: first.city, state: first.state, country: first.country, pincode: first.pincode });

      setOrders(Array.isArray(ord) ? ord : []);
      setSubs(Array.isArray(subs) ? subs : []);
      setReviews(Array.isArray(revs) ? revs : []);
      setLoading(false);
    });
  }, [userId]);

  /* ── Save profile ── */
  const saveProfile = async () => {
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setToastMsg("Passwords do not match!");
      setToastOpen(true);
      return;
    }
    setSaving(true);
    const body: Record<string, string> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: isSuperAdmin ? user!.role : form.role,
      status: isSuperAdmin ? user!.status : form.status,
    };
    if (form.newPassword) body.password = form.newPassword;

    const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { setToastMsg("Failed to update profile"); setToastOpen(true); return; }
    setForm((f) => ({ ...f, newPassword: "", confirmPassword: "" }));
    // Re-lock superadmin after save
    if (isSuperAdmin) setSuperAdminUnlocked(false);
    setToastMsg("Profile updated successfully");
    setToastOpen(true);
  };

  /* ── Save address ── */
  const saveAddress = async () => {
    setAddrSaving(true);
    if (address) {
      await fetch(`${API_URL}/api/admin/users/${userId}/addresses/${address.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(addrForm),
      });
      setAddress({ ...address, ...addrForm });
    } else {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/addresses`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(addrForm),
      });
      setAddress(await res.json());
    }
    setAddrSaving(false);
    setAddrEditing(false);
  };

  /* ── Review status ── */
  const updateReviewStatus = async (reviewId: number, status: string) => {
    await fetch(`${API_URL}/api/admin/reviews/${reviewId}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setReviews((r) => r.map((x) => (x.id === reviewId ? { ...x, status } : x)));
  };

  const totalOrderSpend = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalSubSpend   = subscriptions.reduce((s, sub) => s + Number(sub.amount_paid), 0);
  const totalSpent      = totalOrderSpend + totalSubSpend;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading user data…
      </div>
    );
  }

  const tabs = [
    { id: "profile",       label: "Profile" },
    { id: "orders",        label: `Orders (${orders.length})` },
    { id: "subscriptions", label: `Subscriptions (${subscriptions.length})` },
    { id: "reviews",       label: `Reviews (${reviews.length})` },
  ];

  const initials = user?.name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-10">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 leading-tight">
            {user?.name}
            {isSuperAdmin && (
              <span className="ml-2 text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full align-middle">
                Super Admin
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400">
            {user?.email}&nbsp;·&nbsp;Joined{" "}
            {new Date(user!.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-1.5 ml-1 flex-wrap">
          <Badge value={user!.status} />
          <Badge value={user!.role} />
          <Badge value={user!.provider} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Orders", value: orders.length },
          { label: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, sub: `Orders ₹${totalOrderSpend.toLocaleString("en-IN")} + Subs ₹${totalSubSpend.toLocaleString("en-IN")}` },
          { label: "Active Subs", value: subscriptions.filter((s) => s.status === "active").length },
          { label: "Reviews", value: reviews.length },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            {"sub" in s && s.sub && <p className="text-[10px] text-gray-300 mt-1 leading-tight">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px cursor-pointer ${
              activeTab === t.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          PROFILE TAB
      ══════════════════════════════════ */}
      {activeTab === "profile" && (
        <>
          {/* ── Superadmin OTP gate banner ── */}
          {isSuperAdmin && (
            <div className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 mb-5 border ${
              superAdminUnlocked
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <div className="flex items-center gap-2">
                {superAdminUnlocked ? (
                  <>
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4m-8 0h8m-8 0a2 2 0 00-2 2v5a2 2 0 002 2h8a2 2 0 002-2v-5a2 2 0 00-2-2" />
                    </svg>
                    <p className="text-xs text-green-800 font-medium">Profile unlocked — you can now edit and save changes.</p>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7a4 4 0 00-8 0v4H3a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1v-7a1 1 0 00-1-1h-1z" />
                    </svg>
                    <p className="text-xs text-yellow-800">
                      Super Admin profile is <strong>locked</strong>. Verify your identity via email OTP to edit.
                    </p>
                  </>
                )}
              </div>
              {!superAdminUnlocked && (
                <button
                  onClick={() => setShowOtpModal(true)}
                  className="shrink-0 text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Verify via OTP
                </button>
              )}
            </div>
          )}

          {/* Basic Info */}
          <Card title="Basic Information">
            {isSuperAdmin && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 text-xs rounded-lg px-3 py-2 mb-4">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                </svg>
                Role and status are permanently locked for the Super Admin account.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text"
                  className={superAdminLocked ? roInputCls : inputCls}
                  value={form.name}
                  readOnly={superAdminLocked}
                  onChange={(e) => !superAdminLocked && setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email"
                  className={superAdminLocked ? roInputCls : inputCls}
                  value={form.email}
                  readOnly={superAdminLocked}
                  onChange={(e) => !superAdminLocked && setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel"
                  className={superAdminLocked ? roInputCls : inputCls}
                  value={form.phone}
                  readOnly={superAdminLocked}
                  onChange={(e) => !superAdminLocked && setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>User ID</label>
                <input className={roInputCls} value={`#${user!.id}`} readOnly />
              </div>

              {/* Role — always locked for superadmin */}
              <div>
                <label className={labelCls}>Role</label>
                {isSuperAdmin ? (
                  <input className={roInputCls} value="admin" readOnly />
                ) : (
                  <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>

              {/* Status — always locked for superadmin */}
              <div>
                <label className={labelCls}>Status</label>
                {isSuperAdmin ? (
                  <input className={roInputCls} value="active" readOnly />
                ) : (
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                )}
              </div>

              <div>
                <label className={labelCls}>Provider</label>
                <input className={roInputCls} value={user!.provider} readOnly />
              </div>
              <div>
                <label className={labelCls}>Member Since</label>
                <input className={roInputCls} value={new Date(user!.created_at).toLocaleString("en-IN")} readOnly />
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card title="Address">
            {addrEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Street Address</label>
                  <textarea rows={2} className={inputCls + " resize-none"} value={addrForm.address}
                    onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input className={inputCls} value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <input className={inputCls} value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Pincode</label>
                  <input className={inputCls} value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-1">
                  <button onClick={saveAddress} disabled={addrSaving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer">
                    {addrSaving ? "Saving…" : "Save Address"}
                  </button>
                  <button onClick={() => { setAddrEditing(false); if (address) setAddrForm({ address: address.address, city: address.city, state: address.state, country: address.country, pincode: address.pincode }); }}
                    className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            ) : address ? (
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {address.address}<br />
                  {address.city}, {address.state} – {address.pincode}<br />
                  <span className="text-gray-400">{address.country}</span>
                </p>
                <button onClick={() => setAddrEditing(true)} className="text-xs text-blue-600 hover:underline font-medium shrink-0 cursor-pointer">Edit</button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-3">No address saved yet.</p>
                <button onClick={() => setAddrEditing(true)} className="text-sm text-blue-600 hover:underline font-medium cursor-pointer">+ Add Address</button>
              </div>
            )}
          </Card>

          {/* ── Change Password
               superadmin locked → greyed out fields with lock message
               superadmin unlocked → editable fields
               everyone else → normal editable fields
          ── */}
          <Card title="Change Password">
            {superAdminLocked ? (
              /* Locked state for superadmin */
              <div className="flex items-center gap-3 py-2">
                <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 10-9 0v3.5M3.75 10.5h16.5v10.25A1.25 1.25 0 0119 22H5a1.25 1.25 0 01-1.25-1.25V10.5z" />
                </svg>
                <p className="text-sm text-gray-400">Verify your identity via OTP above to change the password.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>New Password</label>
                    <input type="password" className={inputCls} placeholder="Enter new password"
                      value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Confirm Password</label>
                    <input type="password" className={inputCls} placeholder="Re-enter new password"
                      value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                    {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1.5">Passwords do not match.</p>
                    )}
                    {form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword && (
                      <p className="text-xs text-green-600 mt-1.5">✓ Passwords match.</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Leave blank to keep the current password.</p>
              </>
            )}
          </Card>

          {/* Save / Cancel — hidden for locked superadmin */}
          {!superAdminLocked && (
            <div className="flex gap-3">
              <button onClick={saveProfile} disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition cursor-pointer">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => router.push("/admin/users")}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                Cancel
              </button>
            </div>
          )}

          {/* Back to list button always visible when superadmin is locked */}
          {superAdminLocked && (
            <div className="flex gap-3">
              <button onClick={() => router.push("/admin/users")}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                ← Back to Users
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════
          ORDERS TAB
      ══════════════════════════════════ */}
      {activeTab === "orders" && (
        <Card title="Order History">
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Order ID", "Date", "Amount", "Coupon", "Status", "Payment", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-semibold text-gray-700">#{o.id}</td>
                      <td className="py-3 pr-4 text-gray-500">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">₹{Number(o.total_amount).toLocaleString("en-IN")}</td>
                      <td className="py-3 pr-4">
                        {o.coupon_code
                          ? <span className="text-xs"><code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{o.coupon_code}</code><span className="text-gray-400 ml-1">−₹{o.coupon_discount}</span></span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 pr-4"><Badge value={o.status} /></td>
                      <td className="py-3 pr-4"><Badge value={o.payment_status} /></td>
                      <td className="py-3">
                        <button onClick={() => router.push(`/admin/orders/${o.id}`)} className="text-xs text-blue-600 hover:underline font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════════════
          SUBSCRIPTIONS TAB
      ══════════════════════════════════ */}
      {activeTab === "subscriptions" && (
        <Card title="Subscriptions">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No subscriptions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Plan", "Duration", "Amount Paid", "Start Date", "End Date", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-semibold text-gray-700">{s.title}</td>
                      <td className="py-3 pr-4 text-gray-600">{s.months} month{s.months !== 1 ? "s" : ""}</td>
                      <td className="py-3 pr-4 font-medium text-gray-800">₹{Number(s.amount_paid).toLocaleString("en-IN")}</td>
                      <td className="py-3 pr-4 text-gray-500">{new Date(s.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 pr-4 text-gray-500">{new Date(s.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 pr-4"><Badge value={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════════════════
          REVIEWS TAB
      ══════════════════════════════════ */}
      {activeTab === "reviews" && (
        <Card title="Reviews Written">
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No reviews found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Product", "Rating", "Comment", "Date", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 pr-4 font-medium text-gray-700 max-w-[160px] truncate">{r.product_title}</td>
                      <td className="py-3 pr-4 text-base tracking-wider">
                        <span className="text-yellow-400">{"★".repeat(r.rating)}</span>
                        <span className="text-gray-200">{"★".repeat(5 - r.rating)}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 max-w-[220px] truncate">{r.comment}</td>
                      <td className="py-3 pr-4 text-gray-400">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 pr-4"><Badge value={r.status} /></td>
                      <td className="py-3">
                        {r.status === "pending" ? (
                          <button onClick={() => updateReviewStatus(r.id, "approved")} className="text-xs text-green-600 hover:underline font-medium">Approve</button>
                        ) : (
                          <button onClick={() => updateReviewStatus(r.id, "pending")} className="text-xs text-gray-500 hover:underline font-medium">Unpublish</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />

      {/* OTP gate modal — only for superadmin */}
      {showOtpModal && isSuperAdmin && (
        <SuperAdminOtpModal
          adminEmail={user!.email}
          onClose={() => setShowOtpModal(false)}
          onVerified={() => setSuperAdminUnlocked(true)}
          onSuccess={(msg) => { setToastMsg(msg); setToastOpen(true); }}
          onError={(msg) => { setToastMsg(msg); setToastOpen(true); }}
        />
      )}
    </div>
  );
}