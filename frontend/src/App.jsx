import { useState } from 'react'
import './index.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import MenuIntelligence from './pages/MenuIntelligence'
import ComboEngine from './pages/ComboEngine'
import VoiceOrders from './pages/VoiceOrders'
import OrderHistory from './pages/OrderHistory'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const pageLabels = {
    dashboard: 'Dashboard',
    menu: 'Menu Intelligence',
    combo: 'Combo Engine',
    voice: 'Voice Orders',
    history: 'Order History',
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onPageChange={setActivePage} />

      {/* Main Content */}
      <main className="ml-64 flex-1 bg-gradient-to-b from-slate-950 to-slate-900 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-2xl font-bold text-white">{pageLabels[activePage]}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="h-2 w-2 rounded-full bg-green-500 pulse-badge" />
                <span className="text-xs font-semibold text-green-400">Live Demo</span>
              </div>
              <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
                ⟲ Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="animate-in" key={activePage}>
            {activePage === 'dashboard' && <Dashboard />}
            {activePage === 'menu' && <MenuIntelligence />}
            {activePage === 'combo' && <ComboEngine />}
            {activePage === 'voice' && <VoiceOrders />}
            {activePage === 'history' && <OrderHistory />}
          </div>
        </div>
      </main>
    </div>
  )
}
