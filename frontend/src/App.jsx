import { useState, useCallback, useEffect, Component } from 'react'
import './index.css'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MenuIntelligence from './components/MenuIntelligence'
import ComboEngine from './components/ComboEngine'
import CuratedMenu from './components/CuratedMenu'
import VoiceOrders from './components/VoiceOrders'
import OrderHistory from './components/OrderHistory'
import Settings from './components/Settings'
import InventoryManager from './components/InventoryManager'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Setup from './components/Setup'
import KitchenDisplay from './components/KitchenDisplay'
import CustomerMenu from './components/CustomerMenu'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  menu: 'Menu Intelligence',
  combos: 'Combo Engine',
  curated: 'Curated Menu Generator',
  voice: 'Orders',
  history: 'Order History',
  inventory: 'Inventory Manager',
  kitchen: 'Kitchen Display',
  settings: 'Settings',
}

// Pages visible per role (manager sees everything)
const CASHIER_PAGES = new Set(['menu', 'voice', 'history', 'combos', 'curated'])

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{ background: '#f8f7f5', padding: 16, borderRadius: 8, fontSize: 13, textAlign: 'left', overflow: 'auto', maxWidth: 600, margin: '0 auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#f97415', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showLanding, setShowLanding] = useState(true)
  const [forceSetup, setForceSetup] = useState(false) // triggered by "Create new restaurant"

  // Auth state
  const [authStatus, setAuthStatus] = useState(null) // null = loading, {is_setup, restaurant_name}
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pp_user')) } catch { return null }
  })

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), [])

  // Check if restaurant has been set up
  useEffect(() => {
    fetch('/auth/status')
      .then(r => r.json())
      .then(d => setAuthStatus(d))
      .catch(() => setAuthStatus({ is_setup: true })) // fallback — show login
  }, [])

  const handleLogin = (userData) => {
    if (userData) {
      sessionStorage.setItem('pp_user', JSON.stringify(userData))
      setUser(userData)
    }
    // null means "show login" (from Setup's "already have account" link)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('pp_user')
    setUser(null)
  }

  const handleSetupComplete = (userData) => {
    if (userData) {
      // Re-fetch status and log in as manager
      setAuthStatus(a => ({ ...a, is_setup: true, restaurant_name: userData.restaurant_name }))
      sessionStorage.setItem('pp_user', JSON.stringify(userData))
      setUser(userData)
    } else {
      // "Login instead" clicked — just mark setup as done so we go to Login
      setAuthStatus(a => ({ ...a, is_setup: true }))
    }
  }

  // ── Loading auth status ──
  if (!authStatus) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
        <span style={{ color: '#6b7280' }}>Loading…</span>
      </div>
    )
  }

  // ── Landing page (shown first) ──
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />
  }

  // ── Force new restaurant setup ──
  if (forceSetup) {
    return <Setup onComplete={(d) => { setForceSetup(false); handleSetupComplete(d) }} />
  }

  // ── First-time setup ──
  if (!authStatus.is_setup) {
    return <Setup onComplete={handleSetupComplete} />
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        onGoLanding={() => setShowLanding(true)}
        onCreateRestaurant={() => setForceSetup(true)}
      />
    )
  }

  // ── Kitchen role: dedicated full-screen KDS ──
  if (user.role === 'kitchen') {
    return <KitchenDisplay user={user} onLogout={handleLogout} />
  }

  // ── Customer role: dedicated kiosk ──
  if (user.role === 'customer') {
    return <CustomerMenu user={user} onLogout={handleLogout} />
  }

  // ── Cashier page guard ──
  const effectivePage = user.role === 'cashier' && !CASHIER_PAGES.has(activePage) ? 'voice' : activePage

  return (
    <ErrorBoundary>
      <Sidebar activePage={effectivePage} onNavigate={setActivePage} userRole={user.role} onLogoClick={handleLogout} />

      <div className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <h1>{PAGE_TITLES[effectivePage]}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Role badge */}
            <div style={{
              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
              background: user.role === 'manager' ? 'rgba(249,116,21,0.15)' : 'rgba(139,92,246,0.15)',
              color: user.role === 'manager' ? '#f97415' : '#8b5cf6',
              border: `1px solid ${user.role === 'manager' ? 'rgba(249,116,21,0.3)' : 'rgba(139,92,246,0.3)'}`,
            }}>
              {user.label}
            </div>
            <div className="live-badge">Live Demo</div>
            <button onClick={handleRefresh} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Refresh
            </button>
            <button onClick={handleLogout}
              style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content animate-in" key={effectivePage + refreshKey}>
          {effectivePage === 'dashboard' && <Dashboard onNavigate={setActivePage} />}
          {effectivePage === 'menu' && <MenuIntelligence />}
          {effectivePage === 'combos' && <ComboEngine />}
          {effectivePage === 'curated' && <CuratedMenu />}
          {effectivePage === 'voice' && <VoiceOrders />}
          {effectivePage === 'history' && <OrderHistory />}
          {effectivePage === 'inventory' && <InventoryManager />}
          {effectivePage === 'kitchen' && <KitchenDisplay user={user} onLogout={handleLogout} embedded />}
          {effectivePage === 'settings' && <Settings />}
        </div>
      </div>
    </ErrorBoundary>
  )
}
