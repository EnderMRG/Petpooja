import { useState } from 'react'

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Items' },
  { id: 'star', label: 'Stars' },
  { id: 'hidden', label: 'Hidden Stars' },
  { id: 'plowhorse', label: 'Plowhorses' },
  { id: 'dog', label: 'Dogs' },
]

export default function MenuFilters({ activeFilter, onFilterChange, searchTerm, onSearchChange }) {
  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeFilter === filter.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>
    </div>
  )
}
