import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import StatusBadge from '../components/projects/StatusBadge'
import { Plus, Pencil, Trash2, X, Save, Link2 } from 'lucide-react'

const EMPTY_FORM = {
  name: '', tech_stack: '', project_handler: '', status: 'ongoing',
  start_date: '', end_date: '', description: '', client_name: '', project_url: '',
}

const CLIENT_OPTIONS = [
  'AirPark',
  'Fits Cargo',
  'Fits Express Parcel Delivery LLC',
  'Fits Express Pvt Ltd',
  'Fits Retail Pvt Ltd',
  'World Travel Island',
]

const emptyDoc = () => ({ id: Date.now() + Math.random(), name: '', url: '' })

function parseTechStack(value) {
  if (Array.isArray(value)) return value.join(', ')
  return value || ''
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white'
const focusStyle = {
  onFocus: (e) => (e.target.style.boxShadow = '0 0 0 2px #1a2d6b40'),
  onBlur:  (e) => (e.target.style.boxShadow = ''),
}

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editIdParam = searchParams.get('edit')

  const [projects, setProjects]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [editingId, setEditingId]   = useState(null)
  const [docs, setDocs]             = useState([emptyDoc()])
  const [saving, setSaving]         = useState(false)
  const [showForm, setShowForm]     = useState(!!editIdParam)

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  useEffect(() => {
    if (editIdParam && projects.length > 0) {
      const project = projects.find((p) => String(p.id) === editIdParam)
      if (project) openEdit(project)
    }
  }, [editIdParam, projects]) // eslint-disable-line

  const openEdit = async (project) => {
    setEditingId(project.id)
    setForm({
      name:             project.name || '',
      tech_stack:       parseTechStack(project.tech_stack),
      project_handler:  project.project_handler || '',
      status:           project.status || 'ongoing',
      start_date:       project.start_date || '',
      end_date:         project.end_date || '',
      description:      project.description || '',
      client_name:      project.client_name || '',
      project_url:      project.project_url || '',
    })
    // Load existing documents as link rows
    const { data: existingDocs } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', project.id)
      .order('uploaded_at', { ascending: true })
    if (existingDocs && existingDocs.length > 0) {
      setDocs(existingDocs.map((d) => ({ id: d.id, name: d.file_name || '', url: d.file_url || '' })))
    } else {
      setDocs([emptyDoc()])
    }
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelForm = () => {
    setShowForm(false); setEditingId(null)
    setForm(EMPTY_FORM); setDocs([emptyDoc()])
    setSearchParams({})
  }

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name:            form.name,
      tech_stack:      form.tech_stack.split(',').map((t) => t.trim()).filter(Boolean),
      project_handler: form.project_handler,
      status:          form.status,
      description:     form.description || null,
      client_name:     form.client_name || null,
      project_url:     form.project_url ? form.project_url.trim() : null,
      start_date:      form.start_date || null,
      end_date:        form.end_date || null,
    }

    let savedId = editingId

    if (editingId) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editingId)
      if (error) { toast.error('Failed to update project'); setSaving(false); return }
      toast.success('Project updated')
    } else {
      const { data, error } = await supabase.from('projects').insert(payload).select().single()
      if (error) { toast.error('Failed to create project'); setSaving(false); return }
      savedId = data.id
      toast.success('Project created')
    }

    // Save document links (only rows that have both a name and a URL)
    const validDocs = docs.filter((d) => d.name.trim() && d.url.trim())
    if (validDocs.length > 0 && savedId) {
      // For edits: delete old docs then re-insert
      if (editingId) {
        await supabase.from('project_documents').delete().eq('project_id', savedId)
      }
      const docRows = validDocs.map((d) => ({
        project_id: savedId,
        file_name:  d.name.trim(),
        file_url:   d.url.trim(),
      }))
      const { error: docError } = await supabase.from('project_documents').insert(docRows)
      if (docError) toast.error('Failed to save some documents')
      else toast.success(`${validDocs.length} document${validDocs.length !== 1 ? 's' : ''} saved`)
    }

    setSaving(false); cancelForm(); fetchProjects()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { toast.error('Delete failed') } else { toast.success('Project deleted'); fetchProjects() }
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? '…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1a2d6b' }}
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-800 text-lg">
              {editingId ? 'Edit Project' : 'New Project'}
            </h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className={inputCls} {...focusStyle} placeholder="e.g. FitsExpress Mobile App" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Name</label>
                <select name="client_name" value={form.client_name} onChange={handleChange}
                  className={inputCls} {...focusStyle}>
                  <option value="">— Select client —</option>
                  {CLIENT_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Handler *</label>
                <input name="project_handler" value={form.project_handler} onChange={handleChange} required
                  className={inputCls} {...focusStyle} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status *</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className={inputCls} {...focusStyle}>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                  className={inputCls} {...focusStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange}
                  className={inputCls} {...focusStyle} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tech Stack <span className="text-gray-400 font-normal">(comma-separated) *</span>
              </label>
              <input name="tech_stack" value={form.tech_stack} onChange={handleChange} required
                className={inputCls} {...focusStyle} placeholder="e.g. React, Node.js, PostgreSQL, Supabase" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className={`${inputCls} resize-none`} {...focusStyle} placeholder="Brief project overview…" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Project URL <span className="text-gray-400 font-normal">(link to live site / repo)</span>
              </label>
              <input type="url" name="project_url" value={form.project_url} onChange={handleChange}
                className={inputCls} {...focusStyle} placeholder="https://example.com" />
            </div>

            {/* Document Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-600">
                  Documents <span className="text-gray-400 font-normal">(Google Drive links)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDocs((d) => [...d, emptyDoc()])}
                  className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#1a2d6b' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              </div>
              <div className="space-y-2">
                {docs.map((doc, i) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => setDocs((d) => d.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder="Document name"
                      className="w-40 flex-shrink-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
                      {...focusStyle}
                    />
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="url"
                        value={doc.url}
                        onChange={(e) => setDocs((d) => d.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                        placeholder="https://drive.google.com/..."
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
                        {...focusStyle}
                      />
                    </div>
                    {docs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDocs((d) => d.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60 hover:opacity-90"
                style={{ backgroundColor: '#1a2d6b' }}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : editingId ? 'Update Project' : 'Create Project'}
              </button>
              <button type="button" onClick={cancelForm}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Projects</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-14 text-center text-gray-400 text-sm">
            No projects yet. Click "Add Project" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ backgroundColor: '#f5f7ff' }}>
                  <th className="text-left px-6 py-3">Project</th>
                  <th className="text-left px-4 py-3">Handler</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Tech Stack</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((project) => {
                  const techs = Array.isArray(project.tech_stack)
                    ? project.tech_stack
                    : (project.tech_stack || '').split(',').map((t) => t.trim()).filter(Boolean)
                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        {project.client_name && <p className="text-xs text-gray-400">{project.client_name}</p>}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{project.project_handler}</td>
                      <td className="px-4 py-4"><StatusBadge status={project.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {techs.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded"
                              style={{ backgroundColor: '#e8edf8', color: '#1a2d6b' }}>
                              {t}
                            </span>
                          ))}
                          {techs.length > 3 && <span className="text-xs text-gray-400">+{techs.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(project)}
                            className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(project.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
