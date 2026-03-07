import { useState, useEffect } from 'react'

const ROLE_CONFIG = {
    manager: { icon: 'manage_accounts', label: 'Manager', color: '#f97415', bg: 'rgba(249,116,21,0.08)', desc: 'Full system access' },
    cashier: { icon: 'point_of_sale', label: 'Cashier', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', desc: 'Orders & menu view' },
    kitchen: { icon: 'soup_kitchen', label: 'Kitchen Staff', color: '#10b981', bg: 'rgba(16,185,129,0.08)', desc: 'Order display & status' },
    customer: { icon: 'restaurant_menu', label: 'Customer', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', desc: 'Browse menu & order' },
}

// ── Step 1: pick restaurant ──────────────────────────────────────────────────
function RestaurantPicker({ restaurants, onSelect, onCreateRestaurant, onGoLanding }) {
    const [search, setSearch] = useState('')
    const filtered = restaurants.filter(r =>
        r.restaurant_name.toLowerCase().includes(search.toLowerCase())
    )
    return (
        <div style={{ width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
                Select Restaurant
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Choose the restaurant you want to log into
            </p>

            {restaurants.length > 5 && (
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search restaurants…"
                    style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                        border: '1.5px solid var(--border-subtle)', background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)', marginBottom: 16, fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                {filtered.map(r => (
                    <button key={r.restaurant_id} onClick={() => onSelect(r)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                            borderRadius: 14, border: '1.5px solid var(--border-subtle)',
                            background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97415'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,116,21,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: 'rgba(249,116,21,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#f97415' }}>restaurant</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{r.restaurant_name}</div>
                            {r.owner_name && <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>Owner: {r.owner_name}</div>}
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-tertiary)', flexShrink: 0 }}>chevron_right</span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 32, fontSize: 14 }}>
                        No restaurants found
                    </div>
                )}
            </div>

            {onCreateRestaurant && (
                <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-tertiary)' }}>
                    New here?{' '}
                    <button onClick={onCreateRestaurant} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}>
                        Create a new restaurant account
                    </button>
                </p>
            )}
        </div>
    )
}

// ── Step 2: choose login method ──────────────────────────────────────────────
export default function Login({ onLogin, onGoLanding, onCreateRestaurant }) {
    const [restaurants, setRestaurants] = useState(null) // null = loading
    const [selectedRestaurant, setSelectedRestaurant] = useState(null)
    const [loginMode, setLoginMode] = useState(null) // 'email' | 'pin'
    const [selectedRole, setSelectedRole] = useState(null)

    // Email/pass form
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)

    // PIN form
    const [pin, setPin] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Load all restaurants on mount
    useEffect(() => {
        fetch('/auth/restaurants')
            .then(r => r.json())
            .then(d => setRestaurants(d.restaurants || []))
            .catch(() => setRestaurants([]))
    }, [])

    const reset = (to = null) => { setError(''); setPin(''); setEmail(''); setPassword(''); setLoginMode(to); setSelectedRole(null) }

    // ── Email/Password login ──────────────────────────────────────────────────
    const handleEmailLogin = async () => {
        if (!email || !password) return
        setLoading(true); setError('')
        try {
            const res = await fetch('/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Invalid credentials')
            onLogin(data)
        } catch (e) { setError(e.message) }
        finally { setLoading(false) }
    }

    // ── PIN login ─────────────────────────────────────────────────────────────
    const handlePinKey = key => {
        if (key === 'del') { setPin(p => p.slice(0, -1)); setError('') }
        else if (pin.length < 8) setPin(p => p + key)
    }

    const handlePinLogin = async () => {
        if (pin.length < 4) return
        setLoading(true); setError('')
        try {
            const res = await fetch('/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Invalid PIN')
            if (selectedRole && data.role !== selectedRole) throw new Error('Incorrect PIN for this role')
            onLogin(data)
        } catch (e) { setError(e.message); setPin('') }
        finally { setLoading(false) }
    }

    const rc = selectedRole ? ROLE_CONFIG[selectedRole] : null
    const restName = selectedRestaurant?.restaurant_name || ''

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh', width: '100vw', overflow: 'hidden',
            background: 'var(--bg-base)',
            display: 'flex', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'var(--text-primary)',
        }}>
            {/* ── Left branding panel ── */}
            <div style={{
                flex: '0 0 38%', background: 'linear-gradient(160deg, #f97415 0%, #c2410c 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                padding: '48px 52px', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                <div>
                    <div onClick={() => onGoLanding?.()} title="Back to home"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52, cursor: onGoLanding ? 'pointer' : 'default', width: 'fit-content' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#fff' }}>restaurant</span>
                        </div>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em' }}>Petpooja</span>
                    </div>

                    <h1 style={{ color: '#fff', fontSize: 38, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
                        AI-Powered<br />Restaurant<br />Copilot
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7 }}>
                        Revenue intelligence, voice ordering,<br />kitchen coordination — all in one place.
                    </p>
                </div>

                <div>
                    {selectedRestaurant && (
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(4px)', marginBottom: 16 }}>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Selected Restaurant</div>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{restName}</div>
                            {selectedRestaurant.owner_name && (
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>Owner: {selectedRestaurant.owner_name}</div>
                            )}
                        </div>
                    )}
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>&copy; 2025 Petpooja Copilot</p>
                </div>
            </div>

            {/* ── Right panel ── */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', overflowY: 'auto' }}>

                {/* Loading */}
                {restaurants === null && (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Loading restaurants…</div>
                )}

                {/* Step 1: Pick restaurant */}
                {restaurants !== null && !selectedRestaurant && (
                    <RestaurantPicker
                        restaurants={restaurants}
                        onSelect={r => { setSelectedRestaurant(r); reset() }}
                        onCreateRestaurant={onCreateRestaurant}
                        onGoLanding={onGoLanding}
                    />
                )}

                {/* Step 2: Choose login method */}
                {selectedRestaurant && !loginMode && (
                    <div style={{ width: '100%', maxWidth: 480 }}>
                        <button onClick={() => setSelectedRestaurant(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, padding: 0, fontFamily: 'inherit' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                            Change restaurant
                        </button>

                        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Welcome back</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
                            How would you like to sign in to <strong>{restName}</strong>?
                        </p>

                        {/* Email/password for owner */}
                        <button onClick={() => { reset('email') }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                padding: '18px 20px', borderRadius: 14, border: '1.5px solid var(--border-subtle)',
                                background: '#fff', cursor: 'pointer', marginBottom: 12, transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97415'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,116,21,0.12)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249,116,21,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#f97415' }}>mail</span>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>Owner / Manager Login</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>Sign in with email & password</div>
                            </div>
                        </button>

                        {/* PIN for roles */}
                        <button onClick={() => { reset('pin') }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                padding: '18px 20px', borderRadius: 14, border: '1.5px solid var(--border-subtle)',
                                background: '#fff', cursor: 'pointer', marginBottom: 12, transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.12)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#8b5cf6' }}>pin</span>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>Staff PIN Login</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>Cashier or kitchen staff</div>
                            </div>
                        </button>

                        {/* Customer kiosk */}
                        <button onClick={() => onLogin({ role: 'customer', label: 'Customer', restaurant_id: selectedRestaurant.restaurant_id, restaurant_name: restName })}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                                padding: '18px 20px', borderRadius: 14, border: '1.5px solid var(--border-subtle)',
                                background: '#fff', cursor: 'pointer', transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.12)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#3b82f6' }}>restaurant_menu</span>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>Customer Kiosk</div>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>Browse menu & order — no PIN needed</div>
                            </div>
                        </button>

                        {onCreateRestaurant && (
                            <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-tertiary)' }}>
                                New here?{' '}
                                <button onClick={onCreateRestaurant} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}>
                                    Create a new restaurant account
                                </button>
                            </p>
                        )}
                    </div>
                )}

                {/* Step 3a: Email/Password */}
                {selectedRestaurant && loginMode === 'email' && (
                    <div style={{ width: '100%', maxWidth: 420 }}>
                        <button onClick={() => reset()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, padding: 0, fontFamily: 'inherit' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                            Back
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '16px 18px', background: 'rgba(249,116,21,0.06)', borderRadius: 14, border: '1px solid rgba(249,116,21,0.15)' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#f97415' }}>manage_accounts</span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>Owner Login</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{restName}</div>
                            </div>
                        </div>

                        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>&#9888; {error}</div>}

                        <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                                placeholder="owner@restaurant.com"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, border: '1.5px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#f97415'}
                                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                            />
                        </div>

                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10, fontSize: 14, border: '1.5px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                                    onFocus={e => e.target.style.borderColor = '#f97415'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                                />
                                <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        <button onClick={handleEmailLogin} disabled={!email || !password || loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: email && password ? 'linear-gradient(135deg, #f97415, #ea6700)' : 'var(--border-subtle)',
                                color: email && password ? '#fff' : 'var(--text-tertiary)',
                                fontWeight: 800, fontSize: 15, fontFamily: 'inherit', transition: 'all 0.2s',
                                boxShadow: email && password ? '0 4px 16px rgba(249,116,21,0.3)' : 'none',
                            }}>
                            {loading ? 'Signing in…' : 'Sign In as Owner'}
                        </button>
                    </div>
                )}

                {/* Step 3b: Role + PIN */}
                {selectedRestaurant && loginMode === 'pin' && !selectedRole && (
                    <div style={{ width: '100%', maxWidth: 480 }}>
                        <button onClick={() => reset()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, padding: 0, fontFamily: 'inherit' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                            Back
                        </button>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Select your role</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>at <strong>{restName}</strong></p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {['cashier', 'kitchen'].map(role => {
                                const cfg = ROLE_CONFIG[role]
                                return (
                                    <button key={role} onClick={() => setSelectedRole(role)}
                                        style={{ background: '#fff', border: '1.5px solid var(--border-subtle)', borderRadius: 16, padding: '20px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 10 }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.boxShadow = `0 4px 20px ${cfg.color}20` }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none' }}
                                    >
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${cfg.color}30` }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 22, color: cfg.color }}>{cfg.icon}</span>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{cfg.label}</div>
                                            <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{cfg.desc}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Step 3b PIN pad */}
                {selectedRestaurant && loginMode === 'pin' && selectedRole && (
                    <div style={{ width: '100%', maxWidth: 380 }}>
                        <button onClick={() => setSelectedRole(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, padding: 0, fontFamily: 'inherit' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                            Back to roles
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, padding: '16px 18px', background: rc.bg, borderRadius: 14, border: `1px solid ${rc.color}25` }}>
                            <div style={{ width: 46, height: 46, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 22, color: rc.color }}>{rc.icon}</span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{rc.label}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Enter your PIN to continue</div>
                            </div>
                        </div>

                        {/* PIN dots */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
                            {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
                                <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < pin.length ? rc.color : 'transparent', border: `2px solid ${i < pin.length ? rc.color : 'var(--border-subtle)'}`, transition: 'all 0.15s' }} />
                            ))}
                        </div>

                        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>&#9888; {error}</div>}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 280, margin: '0 auto 14px' }}>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (
                                <button key={i} onClick={() => k && handlePinKey(k)} disabled={!k || loading}
                                    style={{ padding: '16px', borderRadius: 12, fontSize: k === 'del' ? 17 : 22, fontWeight: 700, cursor: k ? 'pointer' : 'default', border: '1.5px solid', borderColor: k ? 'var(--border-subtle)' : 'transparent', background: k ? '#fff' : 'transparent', color: k === 'del' ? '#ef4444' : 'var(--text-primary)', boxShadow: k ? '0 1px 3px rgba(0,0,0,0.04)' : 'none', transition: 'all 0.12s', fontFamily: 'inherit' }}
                                    onMouseEnter={e => k && (e.currentTarget.style.borderColor = rc.color)}
                                    onMouseLeave={e => k && (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                                >
                                    {k === 'del' ? '⌫' : k}
                                </button>
                            ))}
                        </div>

                        <div style={{ maxWidth: 280, margin: '0 auto' }}>
                            <button onClick={handlePinLogin} disabled={pin.length < 4 || loading}
                                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', background: pin.length >= 4 ? `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)` : 'var(--border-subtle)', color: pin.length >= 4 ? '#fff' : 'var(--text-tertiary)', fontWeight: 800, fontSize: 15, fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: pin.length >= 4 ? `0 4px 16px ${rc.color}30` : 'none' }}>
                                {loading ? 'Verifying…' : `Sign in as ${rc.label}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
