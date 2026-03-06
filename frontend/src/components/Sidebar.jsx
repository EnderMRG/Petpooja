import React from 'react'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'menu', label: 'Menu Intelligence', icon: '🍽️' },
  { id: 'combo', label: 'Combo Engine', icon: '📦' },
  { id: 'voice', label: 'Voice Orders', icon: '🎙️' },
  { id: 'history', label: 'Order History', icon: '⏱️' },
]

export default function Sidebar({ activePage, onPageChange }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800 flex flex-col p-6 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-lg shadow-lg">
          🔥
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Petpooja</h1>
          <p className="text-xs text-slate-400">Copilot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageChange(page.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activePage === page.id
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="text-lg">{page.icon}</span>
            <span>{page.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Badge */}
      <div className="mt-8 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <p className="text-xs font-semibold text-orange-400 text-center">Hackathon Build</p>
      </div>
    </aside>
  )
}
