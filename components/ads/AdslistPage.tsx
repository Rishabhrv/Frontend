"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, BarChart2, Eye,
  Trash2, Pencil, ChevronLeft, ChevronRight,
  Megaphone, LayoutTemplate, X, AlertTriangle, Loader2,
  Clock4, WifiOff, LayoutGrid, List, Activity, RefreshCw,
  ChevronRight as Arrow, Zap, Target,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Ad {
  id: string | number;
  title: string;
  ad_type: string;
  status: string;
  show_on: string;
  target_imprint: string;
  priority: number;
  created_at: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  link_url?: string;
}

export interface DailyStat {
  stat_date: string;
  impressions: number;
}

export interface AdStats {
  total_impressions: number;
  total_clicks: number;
  daily: DailyStat[];
}

type ViewMode = "list" | "grid";

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────

const AD_TYPE_META: Record<string, { label: string; icon: string; colorClass: string; bgClass: string }> = {
  popup:         { label: "Popup",         icon: "◉", colorClass: "text-violet-600", bgClass: "bg-violet-50" },
  top_banner:    { label: "Top Banner",    icon: "⬆", colorClass: "text-sky-700",    bgClass: "bg-sky-50" },
  bottom_banner: { label: "Bottom Banner", icon: "⬇", colorClass: "text-blue-700",   bgClass: "bg-blue-50" },
  sidebar:       { label: "Sidebar",       icon: "▐", colorClass: "text-teal-700",   bgClass: "bg-teal-50" },
};

const STATUS_META: Record<string, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  active:    { label: "Active",    dotClass: "bg-green-500", bgClass: "bg-green-50", textClass: "text-green-700" },
  inactive:  { label: "Draft",     dotClass: "bg-slate-400", bgClass: "bg-slate-50", textClass: "text-slate-500" },
  scheduled: { label: "Scheduled", dotClass: "bg-amber-500", bgClass: "bg-amber-50", textClass: "text-amber-700" },
};

function ctr(imp: number, clk: number): string {
  if (!imp) return "—";
  return ((clk / imp) * 100).toFixed(2) + "%";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function authHeaders(): Record<string, string> {
  const t = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function MiniBar({ data }: { data: DailyStat[] }) {
  if (!data?.length) return <div className="h-6" />;
  const max = Math.max(...data.map((d) => d.impressions), 1);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.slice(-14).map((d, i) => (
        <div key={i} className={`flex-1 rounded-[2px] ${d.impressions > 0 ? "bg-blue-600" : "bg-slate-200"}`} style={{
          height: Math.max(2, (d.impressions / max) * 24),
          opacity: 0.35 + (i / 14) * 0.65,
        }} />
      ))}
    </div>
  );
}

function DeleteModal({ ad, onCancel, onConfirm, deleting }: { ad: Ad; onCancel: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/35 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[400px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-[popIn_0.18s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <p className="text-center font-bold text-base text-slate-900 mb-2">Delete Ad?</p>
        <p className="text-center text-sm text-slate-500 leading-relaxed mb-6">
          <strong className="text-slate-700">"{ad.title}"</strong> and its stats will be permanently removed.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-semibold text-sm cursor-pointer hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} className={`flex-1 py-2.5 rounded-lg border-none bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors ${deleting ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-red-600"}`}>
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsPanel({ ad, stats, loading, onClose }: { ad: Ad; stats: AdStats | null; loading: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex">
      <div onClick={onClose} className="flex-1 bg-slate-900/20" />
      <div className="w-[380px] bg-white h-full flex flex-col overflow-y-auto animate-[slideIn_0.22s_cubic-bezier(0.22,1,0.36,1)] border-l border-[#e8ecf0]">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-[#fafbfc]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Activity size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900 m-0">{ad.title}</p>
                <p className="text-[11px] text-gray-700 m-0">Last 30 days</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
              <X size={13} className="text-slate-500" />
            </button>
          </div>
        </div>

        {loading || !stats ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-100 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Views",  value: fmt(stats.total_impressions), colorClass: "text-blue-600", bgClass: "bg-blue-50" },
                { label: "Clicks", value: fmt(stats.total_clicks),      colorClass: "text-green-600", bgClass: "bg-green-50" },
                { label: "CTR",    value: ctr(stats.total_impressions, stats.total_clicks), colorClass: "text-amber-600", bgClass: "bg-amber-50" },
              ].map((s) => (
                <div key={s.label} className={`${s.bgClass} rounded-[10px] py-3 px-2.5`}>
                  <p className={`text-lg font-extrabold ${s.colorClass} mb-1 leading-none`}>{s.value}</p>
                  <p className="text-[10px] text-gray-700 m-0 font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {stats.daily.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-600 mb-3 uppercase tracking-wider">Daily Impressions</p>
                <div className="flex items-end gap-[3px] h-[72px]">
                  {(() => {
                    const max = Math.max(...stats.daily.map((d) => d.impressions), 1);
                    return stats.daily.map((d) => (
                      <div key={d.stat_date} className={`flex-1 rounded-t-[3px] opacity-70 ${d.impressions > 0 ? "bg-blue-600" : "bg-slate-200"}`} style={{ height: Math.max(3, (d.impressions / max) * 64) }} />
                    ));
                  })()}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-300">{stats.daily[0]?.stat_date}</span>
                  <span className="text-[10px] text-slate-300">{stats.daily[stats.daily.length - 1]?.stat_date}</span>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-600 m-0 uppercase tracking-wider">Details</p>
              </div>
              {[
                { k: "Type",     v: AD_TYPE_META[ad.ad_type]?.label ?? ad.ad_type },
                { k: "Status",   v: STATUS_META[ad.status]?.label ?? ad.status },
                { k: "Show On",  v: ad.show_on },
                { k: "Imprint",  v: ad.target_imprint === "all" ? "Both" : ad.target_imprint?.toUpperCase() },
                { k: "Priority", v: String(ad.priority) },
                { k: "Created",  v: new Date(ad.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
                ...(ad.start_date ? [{ k: "Schedule", v: `${ad.start_date} → ${ad.end_date}` }] : []),
              ].map(({ k, v }, i, arr) => (
                <div key={k} className={`flex justify-between items-center py-2 px-4 ${i < arr.length - 1 ? "border-b border-slate-50" : ""}`}>
                  <span className="text-xs text-gray-700 font-medium">{k}</span>
                  <span className="text-xs text-slate-700 font-semibold capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function AdsListPage() {
  const router = useRouter();
  const LIMIT = 12;

  const [ads, setAds]               = useState<Ad[]>([]);
  const [total, setTotal]           = useState<number>(0);
  const [page, setPage]             = useState<number>(1);
  const [loading, setLoading]       = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode]     = useState<ViewMode>("list");

  const [search,       setSearch]       = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType,   setFilterType]   = useState<string>("");

  const [statsCache,   setStatsCache]   = useState<Record<string, AdStats>>({});
  const [statsLoading, setStatsLoading] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting,     setDeleting]     = useState<boolean>(false);
  const [statsAd,      setStatsAd]      = useState<Ad | null>(null);

  const fetchAds = useCallback(async (p: number = 1) => {
    setLoading(true); setFetchError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT),
        ...(filterStatus && { status: filterStatus }), ...(filterType && { ad_type: filterType }) });
      const res = await fetch(`${API_URL}/api/admin/ads?${params}`, { headers: authHeaders() });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.msg ?? `HTTP ${res.status}`); }
      const data = await res.json();
      setAds(Array.isArray(data.data) ? data.data : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(p);
    } catch (e: any) { setFetchError(e?.message ?? "Unknown error"); setAds([]); }
    finally { setLoading(false); }
  }, [filterStatus, filterType]);

  useEffect(() => { fetchAds(1); }, [fetchAds]);

  useEffect(() => {
    if (!ads.length) return;
    ads.forEach((ad) => {
      const adId = String(ad.id);
      if (statsCache[adId] !== undefined || statsLoading[adId]) return;
      setStatsLoading((p) => ({ ...p, [adId]: true }));
      fetch(`${API_URL}/api/admin/ads/${adId}/stats`, { headers: authHeaders() })
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((s) => setStatsCache((p) => ({ ...p, [adId]: s })))
        .catch(() => setStatsCache((p) => ({ ...p, [adId]: { total_impressions: 0, total_clicks: 0, daily: [] } })))
        .finally(() => setStatsLoading((p) => ({ ...p, [adId]: false })));
    });
  }, [ads, statsCache, statsLoading]);

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    const targetId = String(deleteTarget.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/ads/${targetId}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      setDeleteTarget(null);
      setStatsCache((p) => { const n = { ...p }; delete n[targetId]; return n; });
      fetchAds(page);
    } catch {} finally { setDeleting(false); }
  };

  const openStats = (ad: Ad) => {
    setStatsAd(ad);
    const adId = String(ad.id);
    if (statsCache[adId] !== undefined || statsLoading[adId]) return;
    setStatsLoading((p) => ({ ...p, [adId]: true }));
    fetch(`${API_URL}/api/admin/ads/${adId}/stats`, { headers: authHeaders() })
      .then((r) => r.json()).then((s) => setStatsCache((p) => ({ ...p, [adId]: s })))
      .catch(() => {}).finally(() => setStatsLoading((p) => ({ ...p, [adId]: false })));
  };

  const visible     = search ? ads.filter((a) => a.title.toLowerCase().includes(search.toLowerCase())) : ads;
  const totalPages  = Math.ceil(total / LIMIT);
const pageImp = Object.values(statsCache).reduce((s, v) => s + (Number(v.total_impressions) || 0), 0);
  const pageClk = Object.values(statsCache).reduce((s, v) => s + (Number(v.total_clicks) || 0), 0);
  const activeCount = ads.filter((a) => a.status === "active").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes popIn   { from { transform: scale(0.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
      `}</style>

      <div className=" w-full flex flex-col min-h-screen " style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ══ HEADER ══ */}
        <div className="bg-white border-b border-[#e8ecf0] px-6 h-[58px] flex items-center justify-between  gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="">
              <Megaphone size={15} className="text-blue-600" />
            </div>
            <span className="text-[15px] font-extrabold text-slate-900 tracking-tight">Ads Manager</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns…"
                className="w-[210px] py-[7px] pr-7 pl-[30px] border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-slate-50 outline-none focus:border-blue-300 transition-colors"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 flex bg-none border-none cursor-pointer"><X size={12} className="text-gray-700 hover:text-slate-600" /></button>}
            </div>

            {/* View mode */}
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-[3px]">
              {[{ m: "list" as ViewMode, ico: <List size={13} /> }, { m: "grid" as ViewMode, ico: <LayoutGrid size={13} /> }].map(({ m, ico }) => (
                <button key={m} onClick={() => setViewMode(m)} className={`w-7 h-7 border-none rounded-md cursor-pointer flex items-center justify-center transition-all duration-150 ${viewMode === m ? "bg-white text-blue-600 shadow-sm" : "bg-transparent text-gray-700 hover:bg-slate-200"}`}>
                  {ico}
                </button>
              ))}
            </div>

            <button onClick={() => fetchAds(page)} className="w-[34px] h-[34px] border border-slate-200 rounded-lg bg-white cursor-pointer flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
              <RefreshCw size={13} />
            </button>

            <button onClick={() => router.push("/admin/ads/CreateAds")}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer tracking-tight hover:bg-blue-700 transition-colors"
            ><Plus size={14} strokeWidth={2.5} /> New Ad</button>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="flex flex-1 min-h-0">

          {/* ── SIDEBAR ── */}
          <aside className="w-[224px] bg-white border-r border-[#e8ecf0] px-3 py-5 flex flex-col gap-6 shrink-0 overflow-y-auto sticky top-[58px] h-[calc(100vh-58px)]">

            

            {/* Status filter */}
            <div>
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 pl-1.5">Status</p>
              {[
                { v: "",          label: "All",       dotClass: "bg-slate-400" },
                { v: "active",    label: "Active",    dotClass: "bg-green-500" },
                { v: "inactive",  label: "Draft",     dotClass: "bg-slate-400" },
                { v: "scheduled", label: "Scheduled", dotClass: "bg-amber-500" },
              ].map((s) => (
                <div key={s.v} className={`cursor-pointer flex items-center gap-2 py-[7px] px-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${filterStatus === s.v ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}
                  onClick={() => { setFilterStatus(s.v); fetchAds(1); }}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dotClass}`} />
                  <span>{s.label}</span>
                  {filterStatus === s.v && <Arrow size={11} className="ml-auto opacity-50" />}
                </div>
              ))}
            </div>

            {/* Type filter */}
            <div>
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 pl-1.5">Type</p>
              {[
                { v: "",              label: "All Types" },
                { v: "popup",         label: "Popup" },
                { v: "top_banner",    label: "Top Banner" },
                { v: "bottom_banner", label: "Bottom Banner" },
                { v: "sidebar",       label: "Sidebar" },
              ].map((t) => {
                const m = AD_TYPE_META[t.v];
                return (
                  <div key={t.v} className={`cursor-pointer flex items-center gap-2 py-[7px] px-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${filterType === t.v ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}
                    onClick={() => { setFilterType(t.v); fetchAds(1); }}>
                    <span className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] shrink-0 ${m?.bgClass ?? "bg-slate-100"} ${m?.colorClass ?? "text-slate-500"}`}>
                      {m?.icon ?? "◎"}
                    </span>
                    <span>{t.label}</span>
                    {filterType === t.v && <Arrow size={11} className="ml-auto opacity-50" />}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="flex-1 p-5 sm:p-6 overflow-y-auto min-w-0 flex flex-col gap-4">
            {/* Stats */}
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-2.5 pl-1.5">Overview</p>
            <div className="flex gap-2">
              {[
                { label: "Total Ads",   value: total,        colorClass: "text-blue-600",   bgClass: "bg-blue-50",   icon: <LayoutTemplate size={13} /> },
                { label: "Active",      value: activeCount,  colorClass: "text-green-600",  bgClass: "bg-green-50",  icon: <Zap size={13} /> },
                { label: "Impressions", value: fmt(pageImp), colorClass: "text-violet-600", bgClass: "bg-violet-50", icon: <Eye size={13} /> },
                { label: "Clicks",      value: fmt(pageClk), colorClass: "text-amber-600",  bgClass: "bg-amber-50",  icon: <Target size={13} /> },
              ].map((s) => (
                <div key={s.label} className="w-full flex items-center gap-2.5 py-[19px] px-2.5 rounded-[9px] mb-1 bg-slate-50">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${s.bgClass} ${s.colorClass}`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold text-slate-900 leading-none mb-0.5">{s.value}</p>
                    <p className="text-[10px] text-gray-700 font-medium m-0">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error */}
            {fetchError && (
              <div className="flex items-start gap-3 py-3.5 px-4 bg-red-50 border border-red-200 rounded-[10px]">
                <WifiOff size={15} className="text-red-500 shrink-0 mt-[2px]" />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-red-600 m-0">Failed to load ads</p>
                  <p className="text-xs text-red-400 mt-0.5 m-0">{fetchError}</p>
                </div>
                <button onClick={() => fetchAds(1)} className="flex items-center gap-1.5 py-1.5 px-2.5 bg-red-500 text-white border-none rounded-md text-xs font-semibold cursor-pointer shrink-0 hover:bg-red-600 transition-colors">
                  <RefreshCw size={11} /> Retry
                </button>
              </div>
            )}

            {/* Page heading */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight m-0">
                  {filterStatus ? STATUS_META[filterStatus]?.label
                    : filterType ? AD_TYPE_META[filterType]?.label
                    : "All Campaigns"}
                </h2>
                <p className="text-xs text-gray-700 mt-1 m-0">
                  {loading ? "Loading…" : `${total} ad${total !== 1 ? "s" : ""}`}
                  {(filterStatus || filterType) ? " · filtered" : ""}
                </p>
              </div>
              {(filterStatus || filterType) && (
                <div className="flex gap-1.5">
                  {filterStatus && (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs font-semibold text-blue-700">
                      {STATUS_META[filterStatus]?.label}
                      <button onClick={() => { setFilterStatus(""); fetchAds(1); }} className="bg-none border-none cursor-pointer flex p-0 hover:text-blue-900"><X size={10} className="text-blue-600" /></button>
                    </span>
                  )}
                  {filterType && (
                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs font-semibold text-blue-700">
                      {AD_TYPE_META[filterType]?.label}
                      <button onClick={() => { setFilterType(""); fetchAds(1); }} className="bg-none border-none cursor-pointer flex p-0 hover:text-blue-900"><X size={10} className="text-blue-600" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-[72px] gap-3.5">
                <div className="w-9 h-9 rounded-full border-[2.5px] border-blue-100 border-t-blue-600 animate-spin" />
                <p className="text-[13px] text-gray-700 m-0">Loading campaigns…</p>
              </div>

            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[72px] gap-3">
                <div className="w-[52px] h-[52px] rounded-xl bg-slate-100 flex items-center justify-center">
                  <Megaphone size={22} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-600 m-0">No ads found</p>
                  <p className="text-[13px] text-gray-700 mt-1 m-0">Create your first campaign to get started</p>
                </div>
                <button onClick={() => router.push("/admin/ads/CreateAds")} className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
                  <Plus size={14} /> Create Ad
                </button>
              </div>

            ) : viewMode === "list" ? (
              /* ── LIST ── */
              <div className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-[44px_1fr_118px_105px_74px_120px_96px_88px] gap-2.5 py-2.5 px-4 bg-slate-50 border-b border-[#e8ecf0]">
                  {["", "Campaign", "Type", "Status", "Imprint", "Impressions", "Clicks", "Actions"].map((h) => (
                    <span key={h} className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{h}</span>
                  ))}
                </div>

                {visible.map((ad, idx) => {
                  const s   = statsCache[String(ad.id)];
                  const ldr = statsLoading[String(ad.id)];
                  const tm  = AD_TYPE_META[ad.ad_type];
                  const sm  = STATUS_META[ad.status];
                  return (
                    <div key={ad.id} className="animate-[fadeUp_0.18s_ease_both] transition-colors duration-150 hover:bg-slate-50 grid grid-cols-[44px_1fr_118px_105px_74px_120px_96px_88px] gap-2.5 py-3 px-4 items-center border-b border-slate-100 last:border-none" style={{ animationDelay: `${idx * 30}ms` }}>
                      {/* Thumb */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 border border-[#e8ecf0] shrink-0">
                        {ad.image_url
                          ? <img src={`${API_URL}${ad.image_url}`} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><LayoutTemplate size={13} className="text-slate-300" /></div>
                        }
                      </div>

                      {/* Title */}
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate m-0">{ad.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ad.link_url && <span className="text-[11px] text-gray-700 truncate max-w-[150px]">{ad.link_url}</span>}
                          {ad.start_date && <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5 shrink-0"><Clock4 size={9} />{ad.start_date}</span>}
                        </div>
                      </div>

                      {/* Type */}
                      <span className={`inline-flex items-center gap-1.5 py-[3px] px-[9px] ${tm?.bgClass ?? "bg-slate-100"} rounded-md text-[11px] font-semibold ${tm?.colorClass ?? "text-slate-500"} w-fit`}>
                        <span className="text-[10px]">{tm?.icon}</span>{tm?.label ?? ad.ad_type}
                      </span>

                      {/* Status */}
                      <span className={`inline-flex items-center gap-1.5 py-[3px] px-[9px] ${sm?.bgClass ?? "bg-slate-50"} rounded-md text-[11px] font-semibold ${sm?.textClass ?? "text-slate-500"} w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sm?.dotClass ?? "bg-slate-400"}`} />
                        {sm?.label ?? ad.status}
                      </span>

                      {/* Imprint */}
                      <span className="text-xs text-slate-500 font-medium capitalize">
                        {ad.target_imprint === "all" ? "Both" : ad.target_imprint?.toUpperCase()}
                      </span>

                      {/* Impressions */}
                      <div className="flex items-center gap-2">
                        {ldr ? <div className="w-3 h-3 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
                          : s ? <>
                            <span className="text-sm font-bold text-slate-900">{fmt(s.total_impressions)}</span>
                            {s.daily.length > 0 && <MiniBar data={s.daily} />}
                          </> : <span className="text-slate-200">—</span>
                        }
                      </div>

                      {/* Clicks */}
                      <div>
                        {ldr ? <div className="w-3 h-3 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
                          : s ? <>
                            <p className="text-sm font-bold text-slate-900 leading-none m-0">{fmt(s.total_clicks)}</p>
                            <p className="text-[11px] text-gray-700 mt-0.5 font-medium m-0">{ctr(s.total_impressions, s.total_clicks)}</p>
                          </> : <span className="text-slate-200">—</span>
                        }
                      </div>

                      {/* Actions */}
                      <div className="flex gap-[3px]">
                        {[
                          { ico: <BarChart2 size={13} />, action: () => openStats(ad), hoverClass: "hover:bg-blue-50 hover:text-blue-600" },
                          { ico: <Pencil size={13} />, action: () => router.push(`/admin/ads/EditAds?id=${ad.id}`), hoverClass: "hover:bg-amber-50 hover:text-amber-600" },
                          { ico: <Trash2 size={13} />,    action: () => setDeleteTarget(ad), hoverClass: "hover:bg-red-50 hover:text-red-500" },
                        ].map((btn, bi) => (
                          <button key={bi} onClick={btn.action} className={`w-[30px] h-[30px] border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-gray-700 transition-colors duration-150 ${btn.hoverClass}`}>
                            {btn.ico}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : (
              /* ── GRID ── */
              <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-3.5">
                {visible.map((ad, idx) => {
                  const s   = statsCache[String(ad.id)];
                  const ldr = statsLoading[String(ad.id)];
                  const tm  = AD_TYPE_META[ad.ad_type];
                  const sm  = STATUS_META[ad.status];
                  return (
                    <div key={ad.id} className="bg-white rounded-xl border border-[#e8ecf0] overflow-hidden flex flex-col animate-[fadeUp_0.2s_ease_both] transition-all duration-150 hover:shadow-[0_6px_24px_rgba(37,99,235,0.09)] hover:-translate-y-[2px]" style={{ animationDelay: `${idx * 40}ms` }}>
                      {/* Image */}
                      <div className="h-[110px] bg-slate-50 relative overflow-hidden">
                        {ad.image_url
                          ? <img src={`${API_URL}${ad.image_url}`} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><LayoutTemplate size={28} className="text-slate-200" /></div>
                        }
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          <span className={`inline-flex items-center gap-1 py-[3px] px-[7px] bg-white/90 rounded-[5px] text-[10px] font-bold ${tm?.colorClass ?? "text-slate-600"}`}>
                            <span className="text-[10px]">{tm?.icon}</span>{tm?.label ?? ad.ad_type}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`inline-flex items-center gap-1 py-[3px] px-[7px] bg-white/90 rounded-[5px] text-[10px] font-bold ${sm?.textClass}`}>
                            <span className={`w-[5px] h-[5px] rounded-full ${sm?.dotClass}`} />{sm?.label ?? ad.status}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="py-3 px-3.5 flex-1">
                        <p className="text-[13px] font-bold text-slate-900 truncate mb-2.5">{ad.title}</p>
                        <div className="grid grid-cols-3 gap-[7px] mb-2.5">
                          {[
                            { label: "Views",  value: s ? fmt(s.total_impressions) : "—", colorClass: "text-blue-600", bgClass: "bg-blue-50" },
                            { label: "Clicks", value: s ? fmt(s.total_clicks)      : "—", colorClass: "text-green-600", bgClass: "bg-green-50" },
                            { label: "CTR",    value: s ? ctr(s.total_impressions, s.total_clicks) : "—", colorClass: "text-amber-600", bgClass: "bg-amber-50" },
                          ].map((st) => (
                            <div key={st.label} className={`${st.bgClass} rounded-[7px] py-[7px] px-2`}>
                              {ldr
                                ? <div className="h-3.5 bg-slate-200 rounded-[3px] mb-1" />
                                : <p className={`text-[13px] font-extrabold ${st.colorClass} leading-none mb-1 m-0`}>{st.value}</p>
                              }
                              <p className="text-[9px] text-gray-700 font-semibold uppercase tracking-wider m-0">{st.label}</p>
                            </div>
                          ))}
                        </div>
                        {s?.daily?.length > 0 && <MiniBar data={s.daily} />}
                      </div>

                      {/* Footer */}
                      <div className="py-2.5 px-3.5 border-t border-slate-100 flex gap-1.5">
                        <button onClick={() => openStats(ad)} className="flex-1 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-blue-600 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors hover:bg-blue-50 hover:border-blue-200">
                          <BarChart2 size={11} /> Stats
                        </button>
                        {[
                          { ico: <Pencil size={13} />, action: () => router.push(`/admin/ads/EditAds?id=${ad.id}`), hoverClass: "hover:bg-amber-50 hover:text-amber-600" },
                          { ico: <Trash2 size={12} />, action: () => setDeleteTarget(ad), hoverClass: "hover:bg-red-50 hover:text-red-500" },
                        ].map((btn, bi) => (
                          <button key={bi} onClick={btn.action} className={`w-8 h-8 border border-slate-200 rounded-md bg-slate-50 text-gray-700 cursor-pointer flex items-center justify-center transition-colors ${btn.hoverClass}`}>
                            {btn.ico}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="flex items-center justify-between py-3.5 px-4 bg-white rounded-[10px] border border-[#e8ecf0]">
                <p className="text-[13px] text-slate-500 m-0">
                  <strong className="text-slate-900 font-bold">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}</strong> of <strong className="text-slate-900 font-bold">{total}</strong>
                </p>
                <div className="flex gap-1.5 items-center">
                  <button onClick={() => fetchAds(page - 1)} disabled={page === 1} className={`w-8 h-8 border border-slate-200 rounded-md bg-white text-slate-600 flex items-center justify-center ${page === 1 ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-50"}`}><ChevronLeft size={13} /></button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} onClick={() => fetchAds(p)} className={`w-8 h-8 border rounded-md text-[13px] cursor-pointer transition-colors ${p === page ? "border-blue-600 bg-blue-600 text-white font-bold" : "border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50"}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => fetchAds(page + 1)} disabled={page === totalPages} className={`w-8 h-8 border border-slate-200 rounded-md bg-white text-slate-600 flex items-center justify-center ${page === totalPages ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-slate-50"}`}><ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {deleteTarget && <DeleteModal ad={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />}
      {statsAd && <StatsPanel ad={statsAd} stats={statsCache[String(statsAd.id)] ?? null} loading={!!statsLoading[String(statsAd.id)]} onClose={() => setStatsAd(null)} />}
    </>
  );
}