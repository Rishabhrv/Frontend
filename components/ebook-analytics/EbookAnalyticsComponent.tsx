"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock, BookOpen, Users, Filter, Search, X, ChevronRight,
  BarChart2, ArrowLeft, Eye, TrendingUp, Hash, Calendar
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtTime = (s: number) => {
  if (!s) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ─── types ───────────────────────────────────────────────────────────────────
interface Book  { id: number; title: string; main_image: string; total_seconds: number; }
interface User  { id: number; name: string; email: string; total_seconds: number; unique_books_read: number; }
interface Log   { id: number; user_name: string; email: string; book_title: string; duration_seconds: number; created_at: string; }
interface Data  { topBooks: Book[]; topUsers: User[]; logs: Log[]; }

// ─── mini bar ────────────────────────────────────────────────────────────────
const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="h-1.5 w-full rounded-full bg-gray-200 mt-2">
    <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
);

// ─── avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ name }: { name: string }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const styles = [
    "bg-gray-100 text-gray-700",
    "bg-slate-100 text-slate-700",
    "bg-zinc-100 text-zinc-700",
    "bg-neutral-100 text-neutral-700",
    "bg-stone-100 text-stone-700"
  ];
  const c = styles[(name?.charCodeAt(0) || 0) % styles.length];
  return (
    <div className={`w-9 h-9 rounded-full ${c} flex items-center justify-center text-xs font-bold shrink-0 border border-gray-200`}>
      {initials}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
export default function EbookAnalyticsDashboard() {
  const [data, setData] = useState<Data>({ topBooks: [], topUsers: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all");
  const [imprint, setImprint] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "books" | "readers" | "sessions">("overview");
  const [drillBook, setDrillBook] = useState<Book | null>(null);
  const [drillUser, setDrillUser] = useState<User | null>(null);

  // fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
      const q = new URLSearchParams({ timeframe, imprint, userId: "" });
      const res = await fetch(`${API_URL}/api/admin/ebook-analytics/data?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const r = await res.json();
      setData({ topBooks: r.topBooks || [], topUsers: r.topUsers || [], logs: r.logs || [] });
    } catch { setData({ topBooks: [], topUsers: [], logs: [] }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [timeframe, imprint]);

  // ── derived data ─────────────────────────────────────────────────────────
  const maxBookSec  = Math.max(...data.topBooks.map(b => b.total_seconds), 1);
  const maxUserSec  = Math.max(...data.topUsers.map(u => u.total_seconds), 1);

  // Safely filtered data for ALL tabs
  const filteredBooks = useMemo(() =>
    data.topBooks.filter(b => (b.title || "").toLowerCase().includes(search.toLowerCase())),
    [data.topBooks, search]
  );
  
  const filteredUsers = useMemo(() =>
    data.topUsers.filter(u =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    ),
    [data.topUsers, search]
  );

  const filteredLogs = useMemo(() =>
    data.logs.filter(l =>
      (l.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.book_title || "").toLowerCase().includes(search.toLowerCase())
    ),
    [data.logs, search]
  );

  // who read the drilled book
  const bookReaders = useMemo(() => {
    if (!drillBook) return [];
    const map = new Map<string, { email: string; name: string; sessions: number; total: number }>();
    data.logs.filter(l => l.book_title === drillBook.title).forEach(l => {
      const key = l.email;
      const cur = map.get(key) || { email: l.email, name: l.user_name, sessions: 0, total: 0 };
      cur.sessions++; cur.total += l.duration_seconds;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [drillBook, data.logs]);

  // sessions per day for drilled book
  const bookDailyActivity = useMemo(() => {
    if (!drillBook) return [];
    const map = new Map<string, { sessions: number; users: Set<string>; total: number }>();
    data.logs.filter(l => l.book_title === drillBook.title).forEach(l => {
      const day = new Date(l.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const cur = map.get(day) || { sessions: 0, users: new Set(), total: 0 };
      cur.sessions++; cur.users.add(l.email); cur.total += l.duration_seconds;
      map.set(day, cur);
    });
    return [...map.entries()].map(([day, v]) => ({ day, sessions: v.sessions, uniqueUsers: v.users.size, total: v.total }));
  }, [drillBook, data.logs]);

  // what drilled user read
  const userBooks = useMemo(() => {
    if (!drillUser) return [];
    const map = new Map<string, { title: string; sessions: number; total: number }>();
    data.logs.filter(l => l.email === drillUser.email).forEach(l => {
      const cur = map.get(l.book_title) || { title: l.book_title, sessions: 0, total: 0 };
      cur.sessions++; cur.total += l.duration_seconds;
      map.set(l.book_title, cur);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [drillUser, data.logs]);

  // summary stats
  const totalSessions = data.logs.length;
  const totalReadTime = data.logs.reduce((a, l) => a + l.duration_seconds, 0);
  const uniqueReaders = new Set(data.logs.map(l => l.email)).size;
  const uniqueBooks   = new Set(data.logs.map(l => l.book_title)).size;

  // ─── render helpers ───────────────────────────────────────────────────────
  const BookCover = ({ book, rank, onClick }: { book: Book; rank: number; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-200"
    >
      <span className="text-gray-400 font-mono text-sm w-5 shrink-0">{String(rank).padStart(2, "0")}</span>
      <div className="w-12 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-200">
        {book.main_image
          ? <img src={`${API_URL}${book.main_image}`} alt={book.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><BookOpen size={18} className="text-gray-400" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{book.title}</p>
        <Bar pct={(book.total_seconds / maxBookSec) * 100} color="bg-gray-800" />
        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={11} className="text-gray-500" />
          <span className="text-xs text-gray-600 font-mono">{fmtTime(book.total_seconds)}</span>
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-900 transition-colors shrink-0" />
    </div>
  );

  const TABS = [
    { key: "overview",  label: "Overview",  icon: BarChart2 },
    { key: "books",     label: "Books",     icon: BookOpen  },
    { key: "readers",   label: "Readers",   icon: Users     },
    { key: "sessions",  label: "Sessions",  icon: Clock     },
  ] as const;

  // ─── DRILL: BOOK DETAIL ───────────────────────────────────────────────────
  if (drillBook) return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
      <button onClick={() => setDrillBook(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Analytics
      </button>

      <div className="flex items-start gap-6 mb-8">
        <div className="w-24 h-32 rounded-lg overflow-hidden bg-white shrink-0 shadow-md border border-gray-200">
          {drillBook.main_image
            ? <img src={`${API_URL}${drillBook.main_image}`} alt={drillBook.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><BookOpen size={28} className="text-gray-400" /></div>
          }
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Book Deep Dive</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">{drillBook.title}</h1>
          <div className="flex flex-wrap gap-4">
            {[
              { icon: Clock,    label: "Total Read Time",    val: fmtTime(drillBook.total_seconds) },
              { icon: Users,    label: "Unique Readers",     val: bookReaders.length },
              { icon: Hash,     label: "Total Sessions",     val: bookDailyActivity.reduce((a,d)=>a+d.sessions,0) },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm min-w-[130px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={13} className="text-gray-500" />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Activity */}
      {bookDailyActivity.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">Daily Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="py-2 text-left font-medium">Date</th>
                  <th className="py-2 text-center font-medium">Sessions</th>
                  <th className="py-2 text-center font-medium">Unique Readers</th>
                  <th className="py-2 text-right font-medium">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookDailyActivity.map(row => (
                  <tr key={row.day} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-mono text-gray-700">{row.day}</td>
                    <td className="py-3 text-center">
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-mono border border-gray-200">{row.sessions}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-mono border border-gray-200">{row.uniqueUsers}</span>
                    </td>
                    <td className="py-3 text-right text-gray-900 font-mono text-xs">{fmtTime(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Who Read This Book */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Readers of this Book</h2>
          <span className="ml-auto text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">{bookReaders.length} readers</span>
        </div>
        {!bookReaders.length ? (
          <p className="text-gray-500 text-sm">No reading sessions recorded in this time range.</p>
        ) : (
          <div className="space-y-2">
            {bookReaders.map((r, i) => (
              <div key={r.email} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <span className="text-gray-400 font-mono text-xs w-5">{i + 1}</span>
                <Avatar name={r.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.name || "Unknown"}</p>
                  <p className="text-xs text-gray-500 truncate">{r.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end text-gray-900 text-sm font-mono">
                    <Clock size={12} className="text-gray-500" />{fmtTime(r.total)}
                  </div>
                  <p className="text-xs text-gray-500">{r.sessions} session{r.sessions !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── DRILL: USER DETAIL ───────────────────────────────────────────────────
  if (drillUser) return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans max-w-[1100px] mx-auto">
      <button onClick={() => setDrillUser(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Analytics
      </button>

      <div className="flex items-center gap-5 mb-8">
        <Avatar name={drillUser.name} />
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Reader Profile</p>
          <h1 className="text-2xl font-bold text-gray-900">{drillUser.name || "Unknown"}</h1>
          <p className="text-sm text-gray-500">{drillUser.email}</p>
        </div>
        <div className="ml-auto flex gap-4">
          {[
            { label: "Total Time",   val: fmtTime(drillUser.total_seconds) },
            { label: "Books Read",   val: drillUser.unique_books_read },
            { label: "Sessions",     val: data.logs.filter(l => l.email === drillUser.email).length },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm text-center min-w-[100px]">
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-xl font-bold text-gray-900">{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Books This Reader Has Read</h2>
        </div>
        {!userBooks.length ? (
          <p className="text-gray-500 text-sm">No sessions found.</p>
        ) : (
          <div className="space-y-2">
            {userBooks.map((b, i) => {
              const bookObj = data.topBooks.find(bk => bk.title === b.title);
              const maxT = Math.max(...userBooks.map(x => x.total), 1);
              return (
                <div key={b.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                  onClick={() => { const bk = data.topBooks.find(x => x.title === b.title); if (bk) { setDrillUser(null); setDrillBook(bk); } }}>
                  <span className="text-gray-400 font-mono text-xs w-5">{i + 1}</span>
                  <div className="w-10 h-14 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {bookObj?.main_image
                      ? <img src={`${API_URL}${bookObj.main_image}`} alt={b.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-gray-400" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>
                    <Bar pct={(b.total / maxT) * 100} color="bg-gray-800" />
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-800 font-mono flex items-center gap-1"><Clock size={10} className="text-gray-500" />{fmtTime(b.total)}</span>
                      <span className="text-xs text-gray-500">{b.sessions} session{b.sessions !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent sessions for this user */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
        </div>
        <div className="space-y-2">
          {data.logs.filter(l => l.email === drillUser.email).slice(0, 20).map(l => (
            <div key={l.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
              <Calendar size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 font-mono w-32 shrink-0">{fmtDate(l.created_at)}</span>
              <span className="text-sm text-gray-800 flex-1 truncate">{l.book_title}</span>
              <span className="text-xs text-gray-900 font-mono shrink-0">{fmtTime(l.duration_seconds)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── MAIN DASHBOARD ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">E-Book Reading Analytics</h1>
        </div>

        {/* Filters */}
        <div className="md:ml-auto flex flex-wrap items-center gap-2">
<div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
            <Filter size={13} className="text-gray-500" />
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              // Use border-0, border-transparent, and shadow-none here:
              className="bg-transparent border-0 border-transparent focus:border-transparent focus:ring-0 shadow-none text-gray-700 text-sm cursor-pointer py-0 pl-1 pr-7"
            >
              <option value="all">All Time</option>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
            <select
              value={imprint}
              onChange={e => setImprint(e.target.value)}
              // Use border-0, border-transparent, and shadow-none here:
              className="bg-transparent  border-0 border-transparent focus:border-transparent focus:ring-0 shadow-none text-gray-700 text-sm cursor-pointer py-0 pl-1 pr-7 "
            >
              <option value="all">All Imprints</option>
              <option value="agph">AGPH</option>
              <option value="agclassics">AG Classics</option>
            </select>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={tab === "readers" ? "Search readers…" : "Search here..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg pl-8 pr-8 py-1.5 w-44 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 placeholder:text-gray-400 transition-shadow"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={12} className="text-gray-400 hover:text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Clock,    label: "Total Read Time",   val: fmtTime(totalReadTime), sub: `across all sessions` },
                    { icon: Users,    label: "Active Readers",    val: uniqueReaders,          sub: `unique users` },
                    { icon: BookOpen, label: "Books Being Read",  val: uniqueBooks,            sub: `distinct titles` },
                    { icon: TrendingUp, label: "Total Sessions",  val: totalSessions,          sub: `reading sessions` },
                  ].map(({ icon: Icon, label, val, sub }) => (
                    <div key={label} className={`bg-white border border-gray-200 shadow-sm rounded-2xl p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={16} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
                      </div>
                      <p className={`text-3xl font-bold text-gray-900 leading-none`}>{val}</p>
                      <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Top 5 Books + Top 5 Readers side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Books */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-gray-600" />
                        <h2 className="font-semibold text-gray-800">Top Books</h2>
                      </div>
                      <button onClick={() => setTab("books")} className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium">
                        See all <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="p-3 space-y-1">
                      {!filteredBooks.length
                        ? <p className="p-2 text-sm text-gray-500">No books found</p>
                        : filteredBooks.slice(0, 5).map((b, i) => (
                            <BookCover key={b.id} book={b} rank={i + 1} onClick={() => setDrillBook(b)} />
                          ))
                      }
                    </div>
                  </div>

                  {/* Top Readers */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-600" />
                        <h2 className="font-semibold text-gray-800">Top Readers</h2>
                      </div>
                      <button onClick={() => setTab("readers")} className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium">
                        See all <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="p-3 space-y-1">
                      {!filteredUsers.length
                        ? <p className="p-2 text-sm text-gray-500">No readers found</p>
                        : filteredUsers.slice(0, 5).map((u, i) => (
                            <div key={u.id} onClick={() => setDrillUser(u)}
                              className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-200">
                              <span className="text-gray-400 font-mono text-sm w-5">{String(i + 1).padStart(2, "0")}</span>
                              <Avatar name={u.name} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{u.name || "Unknown"}</p>
                                <Bar pct={(u.total_seconds / maxUserSec) * 100} color="bg-gray-800" />
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-xs text-gray-700 font-mono flex items-center gap-1"><Clock size={10} className="text-gray-400" />{fmtTime(u.total_seconds)}</span>
                                  <span className="text-xs text-gray-500">{u.unique_books_read} books</span>
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-900 transition-colors shrink-0" />
                            </div>
                          ))
                      }
                    </div>
                  </div>
                </div>

                {/* Recent Sessions Preview */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-gray-600" />
                      <h2 className="font-semibold text-gray-800">Recent Reading Activity</h2>
                    </div>
                    <button onClick={() => setTab("sessions")} className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 font-medium">
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase border-b border-gray-200 bg-white">
                          <th className="px-5 py-3 text-left font-medium">When</th>
                          <th className="px-5 py-3 text-left font-medium">Reader</th>
                          <th className="px-5 py-3 text-left font-medium">Book</th>
                          <th className="px-5 py-3 text-right font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {!filteredLogs.length 
                          ? <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">No activity found</td></tr>
                          : filteredLogs.slice(0, 8).map(l => (
                          <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{fmtDate(l.created_at)}</td>
                            <td className="px-5 py-3">
                              <button onClick={() => { const u = data.topUsers.find(u => u.email === l.email); if (u) setDrillUser(u); }} className="flex items-center gap-2 hover:text-gray-600 text-left transition-colors group/btn">
                                <Avatar name={l.user_name} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 group-hover/btn:text-gray-600">{l.user_name || "Unknown"}</p>
                                  <p className="text-xs text-gray-500">{l.email}</p>
                                </div>
                              </button>
                            </td>
                            <td className="px-5 py-3">
                              <button onClick={() => { const b = data.topBooks.find(b => b.title === l.book_title); if (b) setDrillBook(b); }} className="flex items-center gap-2 hover:text-gray-600 text-left transition-colors group/btn max-w-[260px]">
                                <div className="w-8 h-11 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                  {data.topBooks.find(b => b.title === l.book_title)?.main_image
                                    ? <img src={`${API_URL}${data.topBooks.find(b => b.title === l.book_title)!.main_image}`} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={10} className="text-gray-400" /></div>
                                  }
                                </div>
                                <span className="text-sm text-gray-900 group-hover/btn:text-gray-600 line-clamp-2">{l.book_title}</span>
                              </button>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className="text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2 py-1 rounded-full font-mono">{fmtTime(l.duration_seconds)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── BOOKS TAB ── */}
            {tab === "books" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {!filteredBooks.length
                  ? <div className="col-span-3 text-center py-12 text-gray-500">No books found</div>
                  : filteredBooks.map((book, i) => {
                      const readers = new Set(data.logs.filter(l => l.book_title === book.title).map(l => l.email)).size;
                      const sessions = data.logs.filter(l => l.book_title === book.title).length;
                      return (
                        <div key={book.id} onClick={() => setDrillBook(book)}
                          className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl overflow-hidden cursor-pointer group transition-all hover:shadow-md">
                          <div className="relative h-40 bg-gray-100 overflow-hidden border-b border-gray-100">
                            {book.main_image
                              ? <img src={`${API_URL}${book.main_image}`} alt={book.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                              : <div className="w-full h-full flex items-center justify-center"><BookOpen size={36} className="text-gray-300" /></div>
                            }
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                            <span className="absolute top-3 left-3 text-xs font-mono text-gray-700 bg-white/90 border border-gray-200 shadow-sm px-2 py-0.5 rounded">#{i + 1}</span>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">{book.title}</h3>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: "Read Time", val: fmtTime(book.total_seconds) },
                                { label: "Readers",   val: readers },
                                { label: "Sessions",  val: sessions },
                              ].map(({ label, val }) => (
                                <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-center">
                                  <p className={`text-sm font-bold text-gray-800`}>{val}</p>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                                </div>
                              ))}
                            </div>
                            <Bar pct={(book.total_seconds / maxBookSec) * 100} color="bg-gray-800" />
                            <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                              <Eye size={12} className="text-gray-400" /> Click to see all readers
                            </p>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* ── READERS TAB ── */}
            {tab === "readers" && (
              <div className="space-y-2">
                {!filteredUsers.length
                  ? <div className="text-center py-12 text-gray-500">No readers found</div>
                  : filteredUsers.map((user, i) => {
                      const sessions = data.logs.filter(l => l.email === user.email).length;
                      return (
                        <div key={user.id} onClick={() => setDrillUser(user)}
                          className="bg-white border border-gray-200 hover:border-gray-300 shadow-sm rounded-xl p-4 cursor-pointer group transition-all flex items-center gap-4">
                          <span className="text-gray-400 font-mono text-sm w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                          <Avatar name={user.name} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{user.name || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <Bar pct={(user.total_seconds / maxUserSec) * 100} color="bg-gray-800" />
                          </div>
                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-center hidden sm:block">
                              <p className="text-lg font-bold text-gray-800 font-mono">{fmtTime(user.total_seconds)}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">total time</p>
                            </div>
                            <div className="text-center hidden sm:block">
                              <p className="text-lg font-bold text-gray-800">{user.unique_books_read}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">books</p>
                            </div>
                            <div className="text-center hidden md:block">
                              <p className="text-lg font-bold text-gray-800">{sessions}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">sessions</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            )}

            {/* ── SESSIONS TAB ── */}
            {tab === "sessions" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                        <th className="px-5 py-3 text-left font-medium">Time</th>
                        <th className="px-5 py-3 text-left font-medium">Reader</th>
                        <th className="px-5 py-3 text-left font-medium">Book</th>
                        <th className="px-5 py-3 text-right font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {!filteredLogs.length
                        ? <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-500">No sessions found</td></tr>
                        : filteredLogs.map(l => (
                            <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{fmtDate(l.created_at)}</td>
                              <td className="px-5 py-3">
                                <button onClick={() => { const u = data.topUsers.find(u => u.email === l.email); if (u) setDrillUser(u); }}
                                  className="flex items-center gap-2 hover:text-gray-600 text-left transition-colors group/btn">
                                  <Avatar name={l.user_name} />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 group-hover/btn:text-gray-600">{l.user_name || "Unknown"}</p>
                                    <p className="text-xs text-gray-500">{l.email}</p>
                                  </div>
                                </button>
                              </td>
                              <td className="px-5 py-3">
                                <button onClick={() => { const b = data.topBooks.find(b => b.title === l.book_title); if (b) setDrillBook(b); }}
                                  className="flex items-center gap-2 hover:text-gray-600 text-left transition-colors group/btn max-w-[260px]">
                                  <div className="w-8 h-11 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                    {data.topBooks.find(b => b.title === l.book_title)?.main_image
                                      ? <img src={`${API_URL}${data.topBooks.find(b => b.title === l.book_title)!.main_image}`} className="w-full h-full object-cover" />
                                      : <div className="w-full h-full flex items-center justify-center"><BookOpen size={10} className="text-gray-400" /></div>
                                    }
                                  </div>
                                  <span className="text-sm text-gray-900 group-hover/btn:text-gray-600 line-clamp-2">{l.book_title}</span>
                                </button>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2 py-1 rounded-full font-mono">{fmtTime(l.duration_seconds)}</span>
                              </td>
                            </tr>
                          ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}