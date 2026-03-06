import { useState } from 'react'
import './index.css'
import RevenueTable from './components/RevenueTable'
import ComboSuggestions from './components/ComboSuggestions'
import VoiceOrderPanel from './components/VoiceOrderPanel'

const TABS = [
  { id: 'revenue', label: '📊 Revenue Intelligence', icon: '📊' },
  { id: 'voice', label: '🎙️ Voice Copilot', icon: '🎙️' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('revenue')

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      {/* ─── Header ─── */}
      <header className="max-w-7xl mx-auto mb-8 animate-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-lg shadow-lg">
            🍽️
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">
              Petpooja AI Copilot
            </h1>
            <p className="text-sm text-slate-400">
              Revenue Intelligence & Voice Ordering for Restaurants
            </p>
          </div>
        </div>
      </header>

      {/* ─── Tab Navigation ─── */}
      <nav className="max-w-7xl mx-auto mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-3">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Content ─── */}
      <main className="max-w-7xl mx-auto animate-in" style={{ animationDelay: '0.2s' }}>
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <RevenueTable />
            <ComboSuggestions />
          </div>
        )}
        {activeTab === 'voice' && <VoiceOrderPanel />}
      </main>

      {/* ─── Footer ─── */}
      <footer className="max-w-7xl mx-auto mt-12 py-6 text-center text-xs text-slate-500 border-t border-slate-800">
        Petpooja AI Copilot — Built for Hackathon 2025 · Revenue Intelligence + Voice Ordering
      </footer>
    </div>
  )
}
