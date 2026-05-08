import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, SlidersHorizontal, ArrowUpDown, Eye } from 'lucide-react'
import StatusBadge from '../components/projects/StatusBadge'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'ongoing',   label: 'Ongoing'      },
  { value: 'completed', label: 'Completed'    },
  { value: 'on-hold',   label: 'On Hold'      },
  { value: 'cancelled', label: 'Cancelled'    },
]

function parseTechStack(value) {
  if (Array.isArray(value)) return value
  return (value || '').split(',').map((t) => t.trim()).filter(Boolean)
}

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data || [])
        setLoading(false)
      })
  }, [])

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = projects
    .filter((p) => {
      const q = search.toLowerCase()
      const techs = parseTechStack(p.tech_stack).join(' ').toLowerCase()
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        techs.includes(q) ||
        (p.project_handler || '').toLowerCase().includes(q) ||
        (p.client_name || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let av = a[sortField] ?? ''
      let bv = b[sortField] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 group transition-colors hover:text-blue-800"
    >
      {label}
      <ArrowUpDown
        className={`w-3.5 h-3.5 transition-colors ${
          sortField === field ? 'text-blue-700' : 'text-gray-300 group-hover:text-blue-400'
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tech stack, handler, client…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #1a2d6b40'}
            onBlur={(e) => e.target.style.boxShadow = ''}
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white appearance-none cursor-pointer"
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #1a2d6b40'}
            onBlur={(e) => e.target.style.boxShadow = ''}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
          </p>
          <Link
            to="/admin"
            className="text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#1a2d6b' }}
          >
            + Add Project
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ backgroundColor: '#f5f7ff' }}>
                <th className="text-left px-5 py-3 w-[22%]"><SortButton field="name" label="Project Name" /></th>
                <th className="text-left px-4 py-3 w-[13%]"><SortButton field="client_name" label="Client" /></th>
                <th className="text-left px-4 py-3 w-[22%]">Tech Stack</th>
                <th className="text-left px-4 py-3 w-[12%]"><SortButton field="project_handler" label="Handler" /></th>
                <th className="text-left px-4 py-3 w-[10%]"><SortButton field="status" label="Status" /></th>
                <th className="text-left px-4 py-3 w-[10%]"><SortButton field="start_date" label="Start" /></th>
                <th className="text-left px-4 py-3 w-[10%]"><SortButton field="end_date" label="End" /></th>
                <th className="px-4 py-3 w-[5%]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                    <p className="font-medium">No projects found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                filtered.map((project) => {
                  const techs = parseTechStack(project.tech_stack)
                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {project.client_name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {techs.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-xs px-2 py-0.5 rounded-md font-medium"
                              style={{ backgroundColor: '#e8edf8', color: '#1a2d6b' }}
                            >
                              {t}
                            </span>
                          ))}
                          {techs.length > 3 && (
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md">
                              +{techs.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{project.project_handler}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={project.status} /></td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(project.start_date)}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(project.end_date)}</td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center gap-1 text-xs font-medium whitespace-nowrap hover:opacity-70 transition-opacity"
                          style={{ color: '#1a2d6b' }}
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
