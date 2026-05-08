import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, BarChart2, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderOpen,      label: 'Projects'  },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics' },
  { to: '/admin',     icon: Settings,         label: 'Admin Panel'},
]

export default function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="w-64 flex flex-col flex-shrink-0" style={{ backgroundColor: '#1a2d6b' }}>
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-white/10">
        <div className="bg-white rounded-xl px-3 py-2 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="FitsExpress"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <span
            className="hidden text-brand-navy font-extrabold text-lg tracking-tight"
          >
            FitsExpress
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
