import { useState } from 'react'

export default function Setup({ onComplete }) {
    const [mode, setMode] = useState('signup') // 'signup' | 'login'

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [restaurantName, setRestaurantName] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [pin, setPin] = useState('')
    const [pinConfirm, setPinConfirm] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState(1) // For signup only

    const canSubmitLogin = email.trim() && password.length >= 4
    const canNextStep1 = restaurantName.trim() && ownerName.trim() && email.trim() && password.length >= 4
    const canSubmitSignup = pin.length >= 4 && pin === pinConfirm

    const handleLogin = async () => {
        setError('')
        setLoading(true)
        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Login failed.')
            onComplete(data)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async () => {
        setError('')
        setLoading(true)
        try {
            const res = await fetch('/auth/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurant_name: restaurantName,
                    owner_name: ownerName,
                    email: email,
                    password: password,
                    manager_pin: pin
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Setup failed.')
            onComplete(data)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif",
            padding: '20px' // Fix ratio padding for small screens
        }}>
            {/* Background blobs */}
            <div style={{ position: 'fixed', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(249,116,21,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: 440 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 56, height: 56, borderRadius: 16, marginBottom: 12,
                        background: 'linear-gradient(135deg, #f97415, #e85d04)',
                        boxShadow: '0 8px 32px rgba(249,116,21,0.4)',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#fff' }}>restaurant</span>
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Petpooja HQ</h1>
                    <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 6 }}>
                        {mode === 'login' ? 'Sign in to access your restaurant' : "Set up your restaurant's digital twin"}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)',
                }}>

                    {/* Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
                        <button onClick={() => { setMode('login'); setError('') }} style={{ ...styles.toggleBtn, background: mode === 'login' ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode === 'login' ? '#fff' : '#9ca3af' }}>Log In</button>
                        <button onClick={() => { setMode('signup'); setStep(1); setError('') }} style={{ ...styles.toggleBtn, background: mode === 'signup' ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode === 'signup' ? '#fff' : '#9ca3af' }}>Sign Up</button>
                    </div>

                    {mode === 'login' && (
                        <>
                            <label style={styles.label}>Email Address</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="owner@restaurant.com" style={styles.input}
                            />

                            <label style={styles.label}>Password</label>
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                onKeyDown={e => e.key === 'Enter' && canSubmitLogin && handleLogin()}
                                style={{ ...styles.input, marginBottom: 8 }}
                            />

                            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, textAlign: 'center' }}>⚠ {error}</p>}

                            <button
                                onClick={handleLogin} disabled={!canSubmitLogin || loading}
                                style={{ ...styles.btn, marginTop: 24, opacity: canSubmitLogin && !loading ? 1 : 0.4 }}
                            >
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </>
                    )}

                    {mode === 'signup' && step === 1 && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                                <div>
                                    <label style={styles.label}>Restaurant Name</label>
                                    <input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="Spice Garden" style={{ ...styles.input, marginBottom: 0 }} />
                                </div>
                                <div>
                                    <label style={styles.label}>Owner Name</label>
                                    <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Rajesh Kumar" style={{ ...styles.input, marginBottom: 0 }} />
                                </div>
                                <div>
                                    <label style={styles.label}>Email Address</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rajesh@spicegarden.com" style={{ ...styles.input, marginBottom: 0 }} />
                                </div>
                                <div>
                                    <label style={styles.label}>HQ Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                                        onKeyDown={e => e.key === 'Enter' && canNextStep1 && setStep(2)}
                                        style={{ ...styles.input, marginBottom: 0 }} />
                                </div>
                            </div>

                            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, textAlign: 'center' }}>⚠ {error}</p>}

                            <button
                                onClick={() => { setStep(2); setError('') }} disabled={!canNextStep1}
                                style={{ ...styles.btn, marginTop: 24, opacity: canNextStep1 ? 1 : 0.4 }}
                            >
                                Next Step →
                            </button>
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <span style={{ fontSize: 12, color: '#6b7280' }}>Step 1 of 2: Basic Info</span>
                            </div>
                        </>
                    )}

                    {mode === 'signup' && step === 2 && (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                    <span className="material-symbols-outlined" style={{ color: '#fff' }}>dialpad</span>
                                </div>
                                <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Manager PIN</h2>
                                <p style={{ color: '#9ca3af', fontSize: 12 }}>Used by staff for quick tablet access</p>
                            </div>

                            <label style={styles.label}>Create PIN (4+ digits)</label>
                            <input
                                type="password" inputMode="numeric" maxLength={8}
                                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••" style={styles.input}
                            />

                            <label style={styles.label}>Confirm PIN</label>
                            <input
                                type="password" inputMode="numeric" maxLength={8}
                                value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                onKeyDown={e => e.key === 'Enter' && canSubmitSignup && handleSignup()}
                                style={{ ...styles.input, borderColor: pinConfirm && pin !== pinConfirm ? '#ef4444' : 'rgba(255,255,255,0.12)', marginBottom: 0 }}
                            />
                            {pinConfirm && pin !== pinConfirm && (
                                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>PINs don't match</p>
                            )}

                            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, textAlign: 'center' }}>⚠ {error}</p>}

                            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                                <button onClick={() => setStep(1)} style={{ ...styles.btnGhost }}>← Back</button>
                                <button
                                    onClick={handleSignup} disabled={!canSubmitSignup || loading}
                                    style={{ ...styles.btn, flex: 1, opacity: canSubmitSignup && !loading ? 1 : 0.4 }}
                                >
                                    {loading ? 'Creating…' : '🚀 Create Account'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 24 }}>
                    Looking for staff login?{' '}
                    <button onClick={() => onComplete(null)} style={{ color: '#f97415', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Enter PIN instead
                    </button>
                </p>
            </div>
        </div>
    )
}

const styles = {
    toggleBtn: {
        flex: 1, padding: '8px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
    },
    label: { display: 'block', color: '#d1d5db', fontSize: 12, fontWeight: 600, marginBottom: 6 },
    input: {
        width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14,
        marginBottom: 16, boxSizing: 'border-box', outline: 'none', fontFamily: "'Inter', sans-serif",
        transition: 'border-color 0.2s',
    },
    btn: {
        width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f97415, #e85d04)',
        border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14,
        cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'opacity 0.2s',
    },
    btnGhost: {
        padding: '13px 20px', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#d1d5db',
        fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
    }
}
