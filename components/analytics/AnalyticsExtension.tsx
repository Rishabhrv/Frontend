"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { Source, Period } from "@/pages/admin/analytics/AnalyticsPage"; // Assuming your page is located here. Or just import types if separate.

interface AnalyticsExtensionProps {
  source: "all" | "apgh" | "agclassics";
  period: "all" | "week" | "month";
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface HourlyRow { hour: number; sessions: number; }
interface DailyRow { date: string; sessions: number; newUsers: number; }
interface FunnelData { visitors: number; registered: number; ordered: number; subscribed: number; }
interface RevenueRegionRow { state: string; country: string; orders: number; revenue: number; }
interface StateRow { state: string; sessions: number; }
interface ProviderData { local: number; google: number; }
interface DowRow { day: string; sessions: number; }
interface SectionProps { title: string; sub?: string; children: ReactNode; className?: string; }

// ── Mock Data (Fallback) ───────────────────────────────────────────────────────
const MOCK_HOURLY: HourlyRow[] = Array.from({ length: 24 }, (_, h) => ({ hour: h, sessions: Math.floor(20 + Math.sin((h - 6) * 0.4) * 40 + Math.random() * 15) }));
const MOCK_DAILY: DailyRow[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return { date: d.toISOString().slice(0, 10), sessions: Math.floor(180 + Math.sin(i * 0.35) * 80 + Math.random() * 40), newUsers: Math.floor(30 + Math.random() * 40) };
});
const MOCK_PROVIDER: ProviderData = { local: 2140, google: 1101 };
const MOCK_DOW: DowRow[] = [
  { day: "Mon", sessions: 1820 }, { day: "Tue", sessions: 2140 }, { day: "Wed", sessions: 2380 }, { day: "Thu", sessions: 2110 }, { day: "Fri", sessions: 1960 }, { day: "Sat", sessions: 1340 }, { day: "Sun", sessions: 1120 }
];

const fmt = (n: number): string => Number(n).toLocaleString();

function Section({ title, sub, children, className = "" }: SectionProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <div className="text-[15px] font-bold text-gray-900">{title}</div>
        {sub && <div className="font-mono text-[10px] text-gray-600 tracking-widest uppercase mt-1">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────────────
function HourlyChart({ data }: { data: HourlyRow[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.sessions), 1);
  const now = new Date().getHours();

  return (
    <Section title="Hourly Traffic Today" sub="Unique sessions per hour">
      <div className="flex items-end gap-[3px] h-[120px] pb-6 relative">
        {data.map(({ hour, sessions }) => {
          const pct = sessions / max; const isNow = hour === now; const isHov = hovered === hour;
          return (
            <div key={hour} onMouseEnter={() => setHovered(hour)} onMouseLeave={() => setHovered(null)} className="flex-1 flex flex-col items-center h-full justify-end cursor-default relative">
              {isHov && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-md px-2 py-1 font-mono text-[10px] whitespace-nowrap z-10 mb-1 shadow-md">
                  {String(hour).padStart(2, "0")}:00 — {sessions}
                </div>
              )}
              <div 
                className={`w-full rounded-t-[3px] transition-all duration-150 ${isNow ? "bg-gradient-to-t from-green-500 to-green-400 opacity-100" : isHov ? "bg-gradient-to-t from-blue-600 to-blue-500 opacity-100" : "bg-gradient-to-t from-blue-500 to-blue-300 opacity-70"}`}
                style={{ height: `${Math.max(pct * 96, 4)}px` }} 
              />
              {hour % 6 === 0 && <div className="absolute -bottom-5 font-mono text-[9px] text-gray-600 tracking-wider">{String(hour).padStart(2, "0")}h</div>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500" /><span className="font-mono text-[9px] text-gray-600 tracking-wider uppercase">Current hour</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500" /><span className="font-mono text-[9px] text-gray-600 tracking-wider uppercase">Past hours</span></div>
      </div>
    </Section>
  );
}

interface TrendPoint extends DailyRow { x: number; y: number; }

function DailyTrend({ data }: { data: DailyRow[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 600, H = 90, PAD = 8;
  const max = Math.max(...data.map(d => d.sessions), 1);

  const pts: TrendPoint[] = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2), y: H - PAD - (d.sessions / max) * (H - PAD * 2), ...d,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const totalSessions = data.reduce((s, d) => s + d.sessions, 0);
  const avg = Math.round(totalSessions / (data.length || 1));

  return (
    <Section title="Visitor Trend" sub="Daily unique sessions over selected period">
      <div className="flex gap-6 mb-3">
        {[
          { label: "Total Sessions", val: fmt(totalSessions), col: "text-blue-600" },
          { label: "Daily Avg",      val: fmt(avg),           col: "text-purple-600" },
          { label: "Peak Day",       val: fmt(Math.max(...data.map(d => d.sessions))), col: "text-amber-500" },
        ].map(({ label, val, col }) => (
          <div key={label}>
            <div className="font-mono text-[9px] text-gray-600 tracking-widest uppercase mb-0.5">{label}</div>
            <div className={`font-mono text-lg font-bold ${col}`}>{val}</div>
          </div>
        ))}
      </div>
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block overflow-visible" onMouseLeave={() => setHovered(null)}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#areaGrad)" />
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <rect x={p.x - 6} y={0} width={12} height={H} fill="transparent" onMouseEnter={() => setHovered(i)} className="cursor-crosshair" />
              {hovered === i && (
                <>
                  <line x1={p.x} y1={0} x2={p.x} y2={H} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3,3" />
                  <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" />
                  <rect x={Math.min(p.x - 50, W - 110)} y={p.y - 38} width={100} height={32} rx={6} fill="#111827" />
                  <text x={Math.min(p.x - 50, W - 110) + 8} y={p.y - 23} fill="#9ca3af" fontSize={8}  fontFamily="monospace">{p.date.slice(5)}</text>
                  <text x={Math.min(p.x - 50, W - 110) + 8} y={p.y - 11} fill="white"   fontSize={10} fontFamily="monospace" fontWeight="bold">{fmt(p.sessions)}</text>
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
    </Section>
  );
}

function UserQuality({ dow }: { provider: ProviderData; dow: DowRow[] }) {
  const dowMax = Math.max(...dow.map(d => d.sessions), 1);
  return (
    <Section title="Day-of-Week Traffic" sub="Average sessions by weekday" className="h-full">
      <div className="flex items-end gap-1.5 h-[100px]">
        {dow.map(({ day, sessions }) => {
          const pct = (sessions / dowMax) * 100; const isWeekend = day === "Sat" || day === "Sun";
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div 
                className={`w-full rounded-t-sm opacity-90 ${isWeekend ? "bg-gradient-to-t from-purple-600 to-purple-400" : "bg-gradient-to-t from-blue-600 to-blue-400"}`} 
                style={{ height: `${Math.max(pct * 0.84, 5)}px` }}
              />
              <div className="font-mono text-[9px] text-gray-600 tracking-wider">{day}</div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2.5">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500" /><span className="font-mono text-[9px] text-gray-600 tracking-wider uppercase">Weekday</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-purple-500" /><span className="font-mono text-[9px] text-gray-600 tracking-wider uppercase">Weekend</span></div>
      </div>
    </Section>
  );
}

// ── API response shapes ────────────────────────────────────────────────────────
interface ApiResponse<T> { success: boolean; data?: T; }

// ── Root Component ─────────────────────────────────────────────────────────────
export default function AnalyticsExtension({ source, period }: AnalyticsExtensionProps) {
  const [hourly,   setHourly]   = useState<HourlyRow[]>([]);
  const [daily,    setDaily]    = useState<DailyRow[]>([]);
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [dow,      setDow]      = useState<DowRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

    // Dynamically calculate days based on period prop
    const daysParam = period === "week" ? 7 : period === "month" ? 30 : 90;

    const get = (path: string) => {
      const separator = path.includes("?") ? "&" : "?";
      return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}${separator}source=${source}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).catch(() => null);
    };

    const [hourlyRes, dailyRes, provRes, dowRes] =
      await Promise.allSettled([
        get("/api/admin/analytics/hourly"),
        get(`/api/admin/analytics/daily?days=${daysParam}`),
        get("/api/admin/analytics/provider"),
        get("/api/admin/analytics/dow"),
      ]);

    const val = <T,>(r: PromiseSettledResult<T>) => r.status === "fulfilled" ? r.value : null;

    const h  = val(hourlyRes)  as ApiResponse<HourlyRow[]>       | null;
    const d  = val(dailyRes)   as ApiResponse<DailyRow[]>        | null;
    const p  = val(provRes)    as { success: boolean, local: number, google: number } | null;
    const dw = val(dowRes)     as ApiResponse<DowRow[]>          | null;

    setHourly(   h?.success  && h.data  ? h.data  : MOCK_HOURLY);
    setDaily(    d?.success  && d.data  ? d.data  : MOCK_DAILY);
    setProvider( p?.success             ? p       : MOCK_PROVIDER);
    setDow(      dw?.success && dw.data ? dw.data : MOCK_DOW);
    
    setLoading(false);
  }, [source, period]); // Now correctly reacts to both source and period

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center font-mono text-gray-600 text-xs tracking-widest uppercase mt-10">
        Loading Analytics…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-6 font-sans">
      
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="font-mono text-[10px] text-gray-500 tracking-widest uppercase font-bold whitespace-nowrap">
          ◈ Deep Analytics / Charts
        </div>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <HourlyChart data={hourly} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          <DailyTrend data={daily} />
          <UserQuality provider={provider!} dow={dow} />
      </div>

    </div>
  );
}