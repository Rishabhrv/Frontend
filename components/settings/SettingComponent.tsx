"use client";

import React, { useEffect, useState } from "react";
import { 
  Shield, 
  Mail, 
  Save, 
  User, 
  Phone, 
  Calendar, 
  Activity,
  BellRing,
  Loader2
} from "lucide-react";

type TabKey = "admin" | "notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function SettingComponent() {
  const [activeTab, setActiveTab] = useState<TabKey>("admin");

  // Sidebar navigation items
  const tabs = [
    { id: "admin", label: "Admin Profile", icon: Shield },
    { id: "notifications", label: "Notifications", icon: BellRing },
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Account Settings
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your platform preferences and view your profile details.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* ══ SIDEBAR ══ */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabKey)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 text-left ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"} 
                  />
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ══ MAIN CONTENT AREA ══ */}
        <main className="flex-1 rounded-2xl bg-white sm:p-8">
          {activeTab === "admin" && <AdminSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
        </main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB COMPONENTS
══════════════════════════════════════════════════════════ */

interface AdminData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

function AdminSettings() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch(`${API_URL}/api/admin/settings/admin`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAdmin(data.data);
      })
      .catch((err) => console.error("Failed to fetch admin details:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminSkeletonLoader />;
  if (!admin) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Shield className="h-12 w-12 text-red-200 mb-4" />
      <p className="text-sm font-medium text-red-600">Failed to load admin profile.</p>
    </div>
  );

  // Get initials for Avatar
  const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Admin Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Super admin details (Read-only).</p>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Profile Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gray-900 text-2xl font-bold text-white shadow-sm">
            {initials}
          </div>

          <div className="pt-12">
            <h3 className="text-xl font-bold text-gray-900">{admin.name}</h3>
            <span className="inline-flex items-center mt-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
              {admin.role.toUpperCase()}
            </span>
          </div>

          {/* Details Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DetailItem icon={Mail} label="Email Address" value={admin.email} />
            <DetailItem icon={Phone} label="Phone Number" value={admin.phone || "Not provided"} />
            <DetailItem 
              icon={Calendar} 
              label="Joined Date" 
              value={new Date(admin.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric"
              })} 
            />
            <DetailItem 
              icon={Activity} 
              label="Account Status" 
              value={
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                  admin.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  {admin.status}
                </span>
              } 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    fetch(`${API_URL}/api/admin/settings/notifications`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEmail(data.adminMail || "");
      })
      .catch((err) => console.error("Failed to fetch notification settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("admin_token");
    
    try {
      const res = await fetch(`${API_URL}/api/admin/settings/notifications`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ adminMail: email })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Notification email updated successfully!");
      } else {
        alert(data.msg || "Failed to update email.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <NotificationSkeletonLoader />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Order Notifications</h2>
        <p className="text-sm text-gray-500 mt-1">Configure where "New Order" alerts and updates are sent.</p>
      </div>

      <div className="max-w-xl rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Admin Alert Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., alerts@agphbooks.com"
                className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <BellRing size={14} className="text-gray-400" />
              This email will receive notifications when a new order is marked as "Confirmed".
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving Changes..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HELPER COMPONENTS
══════════════════════════════════════════════════════════ */

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100 text-gray-500">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <div className="mt-1 text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function AdminSkeletonLoader() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-gray-200"></div>
        <div className="h-4 w-64 rounded bg-gray-200"></div>
      </div>
      <div className="h-80 w-full rounded-2xl bg-gray-100"></div>
    </div>
  );
}

function NotificationSkeletonLoader() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-gray-200"></div>
        <div className="h-4 w-72 rounded bg-gray-200"></div>
      </div>
      <div className="h-48 max-w-xl rounded-2xl bg-gray-100"></div>
    </div>
  );
}