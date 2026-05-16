"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "../../../app/globals.css";
import AdminGuard from "@/components/admin/AdminGuard";
import AnalyticsComponent from "@/components/analytics/AnalyticsComponent";
import AnalyticsExtension from "@/components/analytics/AnalyticsExtension";
import { Filter } from "lucide-react";

export type Source = "all" | "apgh" | "agclassics";
export type Period = "all" | "week" | "month";

export default function AnalyticsPage() {
  const [source, setSource] = useState<Source>("all");
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    document.title = "Manage Analytics | Admin Panel";
  }, []);

  return (
    <AdminGuard pageKey="analytics">
      <div className="bg-gray-50 text-gray-700 min-h-screen font-sans">
        <div className="flex">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />

            {/* Global Dashboard Container */}
            <div className="mt-4 flex flex-col gap-6 p-5">
              
              {/* ── GLOBAL FILTER BAR ── */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5">
                    <Filter size={13} className="text-blue-500" /> Global Control
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    Analytics Dashboard
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* SOURCE FILTER */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    {[
                      { key: "all", label: "All Projects" },
                      { key: "apgh", label: "AGPH" },
                      { key: "agclassics", label: "AG Classics" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSource(key as Source)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          source === key
                            ? "bg-blue-600 shadow-sm text-white"
                            : "text-gray-500 hover:text-gray-800 border border-transparent"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* PERIOD FILTER */}
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    {[
                      { key: "all", label: "All Time" },
                      { key: "week", label: "Last 7 Days" },
                      { key: "month", label: "Last 30 Days" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setPeriod(key as Period)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                          period === key
                            ? "bg-white border border-gray-200 shadow-sm text-gray-900"
                            : "text-gray-500 hover:text-gray-800 border border-transparent"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PASS STATE TO CHILDREN ── */}
              <AnalyticsComponent source={source} period={period} />
              <AnalyticsExtension source={source} period={period} />

            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}