import { useState, useCallback } from 'react'
import './index.css'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MenuIntelligence from './components/MenuIntelligence'
import ComboEngine from './components/ComboEngine'
import VoiceOrders from './components/VoiceOrders'
import OrderHistory from './components/OrderHistory'
import Settings from './components/Settings'
import LandingPage from './components/LandingPage'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  menu: 'Menu Intelligence',
  combos: 'Combo Engine',
  voice: 'Voice Orders',
  history: 'Order History',
  settings: 'Settings',
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showLanding, setShowLanding] = useState(true)

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), [])

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />
  }

  return (
    <>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <h1>{PAGE_TITLES[activePage]}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="live-badge">Live Demo</div>
            <button onClick={handleRefresh} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Refresh
            </button>
            <button style={{ padding: '6px', borderRadius: 8, background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)' }}>notifications</span>
            </button>
            <button className="btn-primary btn-sm">
              Download Report
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content animate-in" key={activePage + refreshKey}>
          {activePage === 'dashboard' && <Dashboard onNavigate={setActivePage} />}
          {activePage === 'menu' && <MenuIntelligence />}
          {activePage === 'combos' && <ComboEngine />}
          {activePage === 'voice' && <VoiceOrders />}
          {activePage === 'history' && <OrderHistory />}
          {activePage === 'settings' && <Settings />}
        </div>
      </div>
    </>
  )
}
