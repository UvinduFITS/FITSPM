import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User } from 'lucide-react'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects':  'Projects',
  '/analytics': 'Analytics',
  '/admin':     'Admin Panel',
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuth()

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/projects/') ? 'Project Detail' : 'FitsExpress PM')

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e8edf8' }}>
          <User className="w-4 h-4" style={{ color: '#1a2d6b' }} />
        </div>
        <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
      </div>
    </header>
  )
}
