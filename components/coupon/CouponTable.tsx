'use client'

import { useState, useEffect, useCallback } from 'react'

import Sidebar,      { fetchCompanies,    type Company      } from './components/Sidebar'
import Header                                                  from './components/Header'
import KpiCards,     { fetchDashboardStats, fetchOverdueCount, type Stats } from './components/KpiCards'
import LeadSources,  { fetchLeadsBySource,  type SourceRow  } from './components/LeadSources'
import FollowUpsList,{ fetchTodaysFollowups,type FollowUpRow } from './components/FollowUpsList'
import StatusDonut,  { fetchLeadsByStatus,  type StatusRow  } from './components/StatusDonut'
import RecentLeads,  { fetchRecentLeads,    type LeadRow    } from './components/RecentLeads'

// ─── PAGE-LEVEL STATE SHAPE ───────────────────────────────────────────────────
interface DashState {
  stats:     Stats | null
  statuses:  StatusRow[]
  sources:   SourceRow[]
  leads:     LeadRow[]
  followups: FollowUpRow[]
  overdue:   number
}

const EMPTY: DashState = {
  stats:     null,
  statuses:  [],
  sources:   [],
  leads:     [],
  followups: [],
  overdue:   0,
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data,      setData]      = useState<DashState>(EMPTY)
  const [loading,   setLoading]   = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCo,  setActiveCo]  = useState('')
  const [activeNav, setActiveNav] = useState(0)

  // ── Load companies once ────────────────────────────────────────────────────
  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

  // ── Load all dashboard data — each fetch is its own call ──────────────────
  const loadAll = useCallback(async (companyId?: string) => {
    setLoading(true)
    const id = companyId ?? activeCo || undefined

    const [stats, statuses, sources, leads, followups, overdue] = await Promise.all([
      fetchDashboardStats(id),
      fetchLeadsByStatus(id),
      fetchLeadsBySource(id),
      fetchRecentLeads(id),
      fetchTodaysFollowups(id),
      fetchOverdueCount(id),
    ])

    setData({ stats, statuses, sources, leads, followups, overdue })
    setLoading(false)
  }, [activeCo])

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Company switch ─────────────────────────────────────────────────────────
  const handleCompanyChange = (id: string) => {
    setActiveCo(id)
    loadAll(id)
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .skeleton {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar
          companies={companies}
          activeCo={activeCo}
          onCompanyChange={handleCompanyChange}
          data={{ totalLeads: data.stats?.total_leads, overdue: data.overdue }}
          activeNav={activeNav}
          onNavChange={setActiveNav}
        />

        {/* Main */}
        <main className="ml-56 flex-1 flex flex-col">

          {/* Header */}
          <Header loading={loading} onRefresh={() => loadAll()} />

          {/* Body */}
          <div className="p-7 flex flex-col gap-4">

            {/* KPI row */}
            <KpiCards
              stats={data.stats}
              overdue={data.overdue}
              loading={loading}
            />

            {/* Middle row */}
            <div className="flex gap-3.5">
              <div className="flex-1 min-w-0">
                <LeadSources sources={data.sources} loading={loading} />
              </div>
              <div className="w-[264px] flex-shrink-0">
                <FollowUpsList followups={data.followups} loading={loading} />
              </div>
              <div className="w-[264px] flex-shrink-0">
                <StatusDonut statuses={data.statuses} loading={loading} />
              </div>
            </div>

            {/* Leads table */}
            <RecentLeads leads={data.leads} loading={loading} />

          </div>
        </main>
      </div>
    </div>
  )
}