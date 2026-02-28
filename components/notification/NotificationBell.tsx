"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, ShoppingBag, Star, CreditCard, Check, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type NotifType = "order" | "review" | "subscription";

interface AdminNotification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  ref_id: number | null;
  is_read: 0 | 1;
  created_at: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const POLL_INTERVAL = 30_000; // 30 seconds

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: typeof ShoppingBag; color: string; bg: string; link: string }> = {
  order:        { icon: ShoppingBag, color: "text-orange-600",  bg: "bg-orange-50",  link: "/admin/orders"        },
  review:       { icon: Star,        color: "text-yellow-600",  bg: "bg-yellow-50",  link: "/admin/reviews"       },
  subscription: { icon: CreditCard,  color: "text-indigo-600",  bg: "bg-indigo-50",  link: "/admin/subscriptions" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotifType | "all">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  // ── Auth helper ────────────────────────────────────────────────────────────
  const authHeader = useCallback(() => {
    const token = localStorage.getItem("admin_token");
    return { Authorization: `Bearer ${token}` };
  }, []);

  // ── Fetch full list ────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/adminnotifications?limit=30`, {
        headers: authHeader(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(typeof data.unread === "number" ? data.unread : 0);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  // ── Poll for unread count only (lightweight) ───────────────────────────────
  const pollUnread = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/adminnotifications/unread-count`, {
        headers: authHeader(),
      });
      if (!res.ok) return;
      const { unread: count } = await res.json();

      // If new notifications arrived, re-fetch full list + play sound
      if (count > prevUnreadRef.current && prevUnreadRef.current !== 0) {
        fetchNotifications();
        playChime();
      }
      prevUnreadRef.current = count;
      setUnread(count);
    } catch {}
  }, [authHeader, fetchNotifications]);

  // ── Chime ──────────────────────────────────────────────────────────────────
  function playChime() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  // ── Mark one as read ───────────────────────────────────────────────────────
  const markRead = useCallback(async (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnread(prev => Math.max(0, prev - 1));
    await fetch(`${API_URL}/api/admin/adminnotifications/${id}/read`, {
      method: "PATCH",
      headers: authHeader(),
    });
  }, [authHeader]);

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 as const })));
    setUnread(0);
    await fetch(`${API_URL}/api/admin/adminnotifications/mark-all-read`, {
      method: "DELETE",
      headers: authHeader(),
    });
  }, [authHeader]);

  // ── Delete one ─────────────────────────────────────────────────────────────
  const deleteNotif = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.is_read) setUnread(prev => Math.max(0, prev - 1));
    await fetch(`${API_URL}/api/admin/adminnotifications/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
  }, [authHeader, notifications]);


  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(pollUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollUnread]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const filters: { key: NotifType | "all"; label: string }[] = [
    { key: "all",          label: "All"           },
    { key: "order",        label: "Orders"        },
    { key: "review",       label: "Reviews"       },
    { key: "subscription", label: "Subscriptions" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative rounded-full border border-gray-200 p-2 hover:bg-gray-100 cursor-pointer transition"
        aria-label="Notifications"
      >
        <Bell size={18} className={unread > 0 ? "text-gray-700" : "text-gray-400"} />

        {/* Badge */}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              {unread > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100 px-3 pt-2 gap-1">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-t-lg transition border-b-2 -mb-px ${
                  activeFilter === f.key
                    ? "border-orange-500 text-orange-600 bg-orange-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                <span className="mt-2 text-xs">Loading…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell size={28} className="mb-2 opacity-30" />
                <span className="text-sm">No notifications</span>
              </div>
            ) : (
              <ul>
                {filtered.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type];
                  const Icon = cfg.icon;
                  const unreadNotif = !notif.is_read;

                  return (
                    <li
                      key={notif.id}
                      className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-gray-50 border-b border-gray-50 last:border-0 ${
                        unreadNotif ? "bg-orange-50/40" : ""
                      }`}
                    >
                      {/* Unread dot */}
                      {unreadNotif && (
                        <span className="absolute left-2 top-4 h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}

                      {/* Icon */}
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                        <Icon size={14} className={cfg.color} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold text-gray-800 leading-tight ${unreadNotif ? "text-gray-900" : ""}`}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="mt-1 inline-block text-[10px] text-gray-400">
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>

                      {/* Delete (shown on hover) */}
                      <button
                        onClick={(e) => deleteNotif(notif.id, e)}
                        className="ml-1 shrink-0 rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition"
                        aria-label="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  );
}