import React, { useEffect, useState } from 'react'
import { Pie, Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement, Filler,
} from 'chart.js'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Code2, Layers, Users, TrendingUp, Calendar, Building2, Clock } from 'lucide-react'

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement, Filler,
)

function parseTechStack(value) {
  if (Array.isArray(value)) return value
  return (value || '').split(',').map((t) => t.trim()).filter(Boolean)
}

const STATUS_COLORS = {
  Ongoing:   '#3B82F6',
  Completed: '#16A34A',
  'On Hold': '#EAB308',
  Cancelled: '#EF4444',
}
const PALETTE = ['#1a2d6b','#dc2626','#243685','#ef4444','#2d4a9e','#3b5adb','#6366f1','#0ea5e9','#14b8a6','#f59e0b']

function SectionTitle({ icon: Icon, title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color: '#1a2d6b' }} /> {title}
      </h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Analytics() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => {
      setProjects(data || [])
      setLoading(false)
    })
  }, [])

  /* ── Status distribution ── */
  const statusData = {
    Ongoing:   projects.filter((p) => p.status === 'ongoing').length,
    Completed: projects.filter((p) => p.status === 'completed').length,
    'On Hold': projects.filter((p) => p.status === 'on-hold').length,
    Cancelled: projects.filter((p) => p.status === 'cancelled').length,
  }
  const nonZero = Object.entries(statusData).filter(([, v]) => v > 0)
  const pieData = {
    labels: nonZero.map(([k]) => k),
    datasets: [{ data: nonZero.map(([, v]) => v), backgroundColor: nonZero.map(([k]) => STATUS_COLORS[k]), borderWidth: 0 }],
  }

  /* ── Tech stack frequency ── */
  const techCounts = {}
  projects.forEach((p) => parseTechStack(p.tech_stack).forEach((t) => { techCounts[t] = (techCounts[t] || 0) + 1 }))
  const allTechs  = Object.entries(techCounts).sort((a, b) => b[1] - a[1])
  const topTechs  = allTechs.slice(0, 10)
  const top6Techs = allTechs.slice(0, 6)

  const barData = {
    labels: topTechs.map(([t]) => t),
    datasets: [{ label: 'Projects', data: topTechs.map(([, c]) => c), backgroundColor: topTechs.map((_, i) => PALETTE[i % PALETTE.length]), borderRadius: 6 }],
  }
  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } },
  }

  const doughnutData = {
    labels: top6Techs.map(([t]) => t),
    datasets: [{ data: top6Techs.map(([, c]) => c), backgroundColor: PALETTE.slice(0, 6), borderWidth: 0 }],
  }

  /* ── Tech stack × status ── */
  const techByStatus = {}
  projects.forEach((p) => {
    parseTechStack(p.tech_stack).forEach((t) => {
      if (!techByStatus[t]) techByStatus[t] = { ongoing: 0, completed: 0, 'on-hold': 0, cancelled: 0 }
      techByStatus[t][p.status] = (techByStatus[t][p.status] || 0) + 1
    })
  })
  const topTechsByStatus = Object.entries(techByStatus)
    .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
    .slice(0, 8)
  const stackedBarData = {
    labels: topTechsByStatus.map(([t]) => t),
    datasets: [
      { label: 'Ongoing',   data: topTechsByStatus.map(([, v]) => v.ongoing    || 0), backgroundColor: '#3B82F6' },
      { label: 'Completed', data: topTechsByStatus.map(([, v]) => v.completed  || 0), backgroundColor: '#16A34A' },
      { label: 'On Hold',   data: topTechsByStatus.map(([, v]) => v['on-hold'] || 0), backgroundColor: '#EAB308' },
      { label: 'Cancelled', data: topTechsByStatus.map(([, v]) => v.cancelled  || 0), backgroundColor: '#EF4444' },
    ],
  }
  const stackedOpts = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } } },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
    },
  }

  /* ── Handler breakdown ── */
  const handlerCounts = {}
  projects.forEach((p) => { const h = p.project_handler || 'Unknown'; handlerCounts[h] = (handlerCounts[h] || 0) + 1 })
  const topHandlers = Object.entries(handlerCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  /* ── Client breakdown ── */
  const clientCounts = {}
  projects.forEach((p) => { const c = p.client_name || 'Internal'; clientCounts[c] = (clientCounts[c] || 0) + 1 })
  const topClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const clientBarData = {
    labels: topClients.map(([c]) => c),
    datasets: [{ label: 'Projects', data: topClients.map(([, c]) => c), backgroundColor: PALETTE.slice(0, topClients.length), borderRadius: 6 }],
  }

  /* ── Projects started per month (last 12 months) ── */
  const now      = new Date()
  const months   = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) }
  })
  const monthlyCounts = {}
  projects.forEach((p) => {
    if (!p.start_date) return
    const key = p.start_date.slice(0, 7)
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1
  })
  const lineData = {
    labels: months.map((m) => m.label),
    datasets: [{
      label: 'Projects Started',
      data: months.map((m) => monthlyCounts[m.key] || 0),
      borderColor: '#1a2d6b',
      backgroundColor: 'rgba(26,45,107,0.08)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#1a2d6b',
      pointRadius: 4,
    }],
  }
  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } },
  }

  /* ── Average project duration (completed only) ── */
  const completed = projects.filter((p) => p.status === 'completed' && p.start_date && p.end_date)
  const avgDays = completed.length
    ? Math.round(completed.reduce((sum, p) => {
        const diff = new Date(p.end_date) - new Date(p.start_date)
        return sum + diff / (1000 * 60 * 60 * 24)
      }, 0) / completed.length)
    : null

  /* ── Tech combinations (co-occurrence) ── */
  const comboCounts = {}
  projects.forEach((p) => {
    const techs = parseTechStack(p.tech_stack)
    for (let i = 0; i < techs.length; i++) {
      for (let j = i + 1; j < techs.length; j++) {
        const key = [techs[i], techs[j]].sort().join(' + ')
        comboCounts[key] = (comboCounts[key] || 0) + 1
      }
    }
  })
  const topCombos = Object.entries(comboCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )

  if (projects.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
      <p className="font-medium">No data to display</p>
      <p className="text-sm mt-1">
        <Link to="/admin" className="hover:underline font-medium" style={{ color: '#1a2d6b' }}>Add projects</Link> to see analytics
      </p>
    </div>
  )

  const totalTechs = Object.keys(techCounts).length

  return (
    <div className="space-y-8">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(statusData).map(([label, count]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: STATUS_COLORS[label] }}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Section 1: Status + Tech usage ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1a2d6b' }}>Overview</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Layers} title="Status Distribution" sub={`${projects.length} total projects`} />
            <div className="flex justify-center">
              <div style={{ width: 240, height: 240 }}>
                <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } } } }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Code2} title="Tech Stack Usage" sub={`${totalTechs} unique technologies`} />
            {topTechs.length === 0 ? <p className="text-gray-400 text-sm">No data</p> : <Bar data={barData} options={barOptions} />}
          </div>
        </div>
      </div>

      {/* ── Section 2: Timeline ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1a2d6b' }}>Timeline</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:col-span-2">
            <SectionTitle icon={Calendar} title="Projects Started per Month" sub="Last 12 months" />
            <Line data={lineData} options={lineOptions} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Clock} title="Completion Stats" />
            <div className="space-y-4 mt-2">
              <div className="text-center py-4 rounded-xl" style={{ backgroundColor: '#f5f7ff' }}>
                <p className="text-4xl font-bold" style={{ color: '#1a2d6b' }}>
                  {avgDays !== null ? avgDays : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Avg days to complete</p>
              </div>
              <div className="text-center py-4 bg-gray-50 rounded-xl">
                <p className="text-4xl font-bold text-green-600">{completed.length}</p>
                <p className="text-xs text-gray-500 mt-1">Projects with tracked dates</p>
              </div>
              <div className="text-center py-4 bg-gray-50 rounded-xl">
                <p className="text-4xl font-bold text-blue-600">
                  {projects.filter((p) => p.status === 'ongoing').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Currently in progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Tech deep-dive ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1a2d6b' }}>Tech Stack Deep-Dive</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={TrendingUp} title="Tech Stack by Project Status" sub="Each technology broken down by status" />
            {topTechsByStatus.length === 0 ? <p className="text-gray-400 text-sm">No data</p> : <Bar data={stackedBarData} options={stackedOpts} />}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Code2} title="Top 6 Tech Share" sub="Relative usage proportion" />
            {top6Techs.length === 0 ? <p className="text-gray-400 text-sm">No data</p> : (
              <div className="flex justify-center">
                <div style={{ width: 240, height: 240 }}>
                  <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 } } } }, cutout: '60%' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 4: Tech combinations ── */}
      {topCombos.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1a2d6b' }}>Tech Combinations</p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Code2} title="Most Common Tech Pairs" sub="Technologies that appear together most often" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topCombos.map(([combo, count], idx) => (
                <div key={combo} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#f5f7ff' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {combo.split(' + ').map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: '#e8edf8', color: '#1a2d6b' }}>{t}</span>
                    ))}
                  </div>
                  <span className="text-sm font-bold ml-3 flex-shrink-0" style={{ color: '#1a2d6b' }}>{count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 5: People & Clients ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1a2d6b' }}>People & Clients</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Handler */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Users} title="Projects by Handler" sub="Workload distribution" />
            <div className="space-y-3">
              {topHandlers.map(([handler, count]) => {
                const pct = Math.round((count / projects.length) * 100)
                return (
                  <div key={handler}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{handler}</span>
                      <span className="text-gray-400 text-xs">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#1a2d6b' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Clients */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionTitle icon={Building2} title="Projects by Client" sub="Top clients by project count" />
            {topClients.length === 0 ? (
              <p className="text-gray-400 text-sm">No client data</p>
            ) : (
              <Bar data={clientBarData} options={{ ...barOptions, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } }, y: { grid: { display: false } } } }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Section 6: Full tech table ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#1a2d6b' }}>Full Tech Reference</p>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Code2 className="w-4 h-4" style={{ color: '#1a2d6b' }} />
            <h2 className="font-semibold text-gray-800">All Technologies</h2>
            <span className="ml-auto text-xs text-gray-400">{totalTechs} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ backgroundColor: '#f5f7ff' }}>
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-4 py-3">Technology</th>
                  <th className="text-left px-4 py-3">Projects</th>
                  <th className="text-left px-4 py-3">Usage</th>
                  <th className="text-left px-4 py-3">Ongoing</th>
                  <th className="text-left px-4 py-3">Completed</th>
                  <th className="text-left px-4 py-3">On Hold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allTechs.map(([tech, count], idx) => {
                  const pct      = Math.round((count / projects.length) * 100)
                  const byStatus = techByStatus[tech] || {}
                  return (
                    <tr key={tech} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: '#e8edf8', color: '#1a2d6b' }}>{tech}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{count}</td>
                      <td className="px-4 py-3 w-44">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#1a2d6b' }} />
                          </div>
                          <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{byStatus.ongoing    || 0}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{byStatus.completed  || 0}</td>
                      <td className="px-4 py-3 text-yellow-600 font-medium">{byStatus['on-hold'] || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
