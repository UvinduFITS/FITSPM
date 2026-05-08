import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import StatusBadge from '../components/projects/StatusBadge'
import { Plus, Pencil, Trash2, Upload, X, Save } from 'lucide-react'

const EMPTY_FORM = {
  name: '', tech_stack: '', project_handler: '', status: 'ongoing',
  start_date: '', end_date: '', description: '', client_name: '',
}

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
  const [file, setFile]             = useState(null)
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

  const openEdit = (project) => {
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
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelForm = () => {
    setShowForm(false); setEditingId(null)
    setForm(EMPTY_FORM); setFile(null)
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

    if (file && savedId) {
      const ext = file.name.split('.').pop()
      const filePath = `${savedId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('project-documents').upload(filePath, file)
      if (uploadError) {
        toast.error(`File upload failed: ${uploadError.message}`)
      } else {
        const { data: { publicUrl } } = supabase.storage.from('project-documents').getPublicUrl(filePath)
        await supabase.from('project_documents').insert({ project_id: savedId, file_url: publicUrl, file_name: file.name })
        toast.success('Document uploaded')
      }
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
                <input name="client_name" value={form.client_name} onChange={handleChange}
                  className={inputCls} {...focusStyle} placeholder="e.g. FitsExpress" />
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
                Upload Document <span className="text-gray-400 font-normal">(PDF, Word, Excel, etc.)</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-600">
                  <Upload className="w-4 h-4 text-gray-400" />
                  {file ? <span className="font-medium" style={{ color: '#1a2d6b' }}>{file.name}</span> : 'Choose file'}
                  <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg" />
                </label>
                {file && (
                  <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
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
