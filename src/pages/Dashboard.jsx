import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FolderOpen, TrendingUp, CheckCircle, PauseCircle } from 'lucide-react'
import { Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

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

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('projects').select('*').then(({ data }) => {
      setProjects(data || [])
      setLoading(false)
    })
  }, [])

  const stats = {
    total:     projects.length,
    ongoing:   projects.filter((p) => p.status === 'ongoing').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    onHold:    projects.filter((p) => p.status === 'on-hold').length,
  }

  /* ── Status pie ── */
  const statusData = {
    Ongoing:   stats.ongoing,
    Completed: stats.completed,
    'On Hold': stats.onHold,
    Cancelled: projects.filter((p) => p.status === 'cancelled').length,
  }
  const nonZero = Object.entries(statusData).filter(([, v]) => v > 0)
  const pieData = {
    labels: nonZero.map(([k]) => k),
    datasets: [{
      data: nonZero.map(([, v]) => v),
      backgroundColor: nonZero.map(([k]) => STATUS_COLORS[k]),
      borderWidth: 0,
    }],
  }

  /* ── Tech stack bar ── */
  const techCounts = {}
  projects.forEach((p) => parseTechStack(p.tech_stack).forEach((t) => { techCounts[t] = (techCounts[t] || 0) + 1 }))
  const topTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const barData = {
    labels: topTechs.map(([t]) => t),
    datasets: [{
      label: 'Projects',
      data: topTechs.map(([, c]) => c),
      backgroundColor: '#1a2d6b',
      hoverBackgroundColor: '#243685',
      borderRadius: 5,
    }],
  }
  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

  /* ── Handler breakdown ── */
  const handlerCounts = {}
  projects.forEach((p) => { const h = p.project_handler || 'Unknown'; handlerCounts[h] = (handlerCounts[h] || 0) + 1 })
  const topHandlers = Object.entries(handlerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const statCards = [
    { label: 'Total Projects', value: stats.total,     icon: FolderOpen,  bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Ongoing',        value: stats.ongoing,   icon: TrendingUp,  bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'Completed',      value: stats.completed, icon: CheckCircle, bg: '#dcfce7', color: '#16a34a' },
    { label: 'On Hold',        value: stats.onHold,    icon: PauseCircle, bg: '#fef9c3', color: '#ca8a04' },
  ]

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics row 1: Pie + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Status Distribution</h2>
          <p className="text-xs text-gray-400 mb-4">{projects.length} total projects</p>
          {nonZero.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No project data yet</p>
          ) : (
            <div className="flex justify-center">
              <div style={{ width: 220, height: 220 }}>
                <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } } } }} />
              </div>
            </div>
          )}
        </div>

        {/* Tech stack usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Top Tech Stacks</h2>
          <p className="text-xs text-gray-400 mb-4">{Object.keys(techCounts).length} unique technologies</p>
          {topTechs.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No tech stack data yet</p>
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>
      </div>

      {/* Analytics row 2: Handler + Status breakdown table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Handler breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Projects by Handler</h2>
          {topHandlers.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topHandlers.map(([handler, count]) => {
                const pct = Math.round((count / projects.length) * 100)
                return (
                  <div key={handler}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{handler}</span>
                      <span className="text-gray-400 text-xs">{count} project{count !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#1a2d6b' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status breakdown table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Status Breakdown</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">Status</th>
                <th className="text-right pb-2">Count</th>
                <th className="text-right pb-2">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(statusData).map(([label, count]) => {
                const pct = projects.length ? Math.round((count / projects.length) * 100) : 0
                return (
                  <tr key={label}>
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[label] }} />
                      <span className="text-gray-700">{label}</span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-gray-800">{count}</td>
                    <td className="py-2.5 text-right text-gray-400">{pct}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
