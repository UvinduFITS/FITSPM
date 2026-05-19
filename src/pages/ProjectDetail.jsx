import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import StatusBadge from '../components/projects/StatusBadge'
import { ArrowLeft, Calendar, User, Building2, FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react'

function parseTechStack(value) {
  if (Array.isArray(value)) return value
  return (value || '').split(',').map((t) => t.trim()).filter(Boolean)
}

function Field({ label, value, icon: Icon }) {
  if (!value) return null
  return (
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="flex items-center gap-1.5 text-gray-700 text-sm">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        {value}
      </p>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject]     = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_documents').select('*').eq('project_id', id).order('uploaded_at', { ascending: false }),
    ]).then(([{ data: proj }, { data: docs }]) => {
      setProject(proj)
      setDocuments(docs || [])
      setLoading(false)
    })
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { toast.error('Failed to delete project') }
    else { toast.success('Project deleted'); navigate('/projects') }
  }

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-4xl">
      <div className="h-6 bg-gray-200 rounded w-32" />
      <div className="h-64 bg-gray-200 rounded-xl" />
      <div className="h-40 bg-gray-200 rounded-xl" />
    </div>
  )

  if (!project) return (
    <div className="text-center py-20 text-gray-400">
      <p className="font-medium">Project not found.</p>
      <Link to="/projects" className="text-sm mt-2 inline-block hover:underline" style={{ color: '#1a2d6b' }}>
        Back to projects
      </Link>
    </div>
  )

  const techStack = parseTechStack(project.tech_stack)
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.client_name && (
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {project.client_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={project.status} />
            {project.project_url && (
              <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1a2d6b' }}>
                <ExternalLink className="w-4 h-4" /> View Project
              </a>
            )}
            <Link to={`/admin?edit=${project.id}`}
              className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
              <Pencil className="w-4 h-4" />
            </Link>
            <button onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {project.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-5">{project.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Handler"    value={project.project_handler} icon={User}     />
          <Field label="Start Date" value={fmt(project.start_date)} icon={Calendar} />
          <Field label="End Date"   value={fmt(project.end_date)}   icon={Calendar} />
        </div>

        {techStack.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech}
                  className="text-sm px-3 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: '#e8edf8', color: '#1a2d6b' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" /> Documentation
          </h2>
          <span className="text-xs text-gray-400">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No documents linked yet.{' '}
            <Link to={`/admin?edit=${project.id}`} className="hover:underline" style={{ color: '#1a2d6b' }}>
              Add one
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8edf8' }}>
                    <FileText className="w-4 h-4" style={{ color: '#1a2d6b' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{doc.file_name || 'Document'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#1a2d6b' }}>
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
