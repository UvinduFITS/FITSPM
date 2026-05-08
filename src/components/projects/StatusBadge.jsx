import React from 'react'

const configs = {
  ongoing:   { label: 'Ongoing',   cls: 'bg-blue-100 text-blue-700'   },
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
  'on-hold': { label: 'On Hold',   cls: 'bg-yellow-100 text-yellow-700'},
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700'     },
}

export default function StatusBadge({ status }) {
  const cfg = configs[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
