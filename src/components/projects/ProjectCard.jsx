import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User, ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge'

function parseTechStack(value) {
  if (Array.isArray(value)) return value
  return (value || '').split(',').map((t) => t.trim()).filter(Boolean)
}

export default function ProjectCard({ project }) {
  const techStack = parseTechStack(project.tech_stack)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      {project.client_name && (
        <p className="text-xs text-gray-400 mb-2">{project.client_name}</p>
      )}

      {project.description && (
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{project.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {techStack.slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-md font-medium"
          >
            {tech}
          </span>
        ))}
        {techStack.length > 4 && (
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md">
            +{techStack.length - 4} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {project.project_handler}
          </span>
          {project.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(project.start_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
        <Link
          to={`/projects/${project.id}`}
          className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
        >
          View <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
