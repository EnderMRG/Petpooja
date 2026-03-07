import { useState, useEffect, useCallback, useRef } from 'react'
import apiFetch from '../utils/apiFetch'

/* â”€â”€â”€ Thermal Receipt (print only) â”€â”€â”€ */
const RECEIPT_CSS = `
@media print {
  body > *:not(#kreceipt) { display: none !important; }
  #kreceipt { display: block !important; font-family: 'Courier New',monospace; width:280px; margin:0 auto; font-size:13px; color:#000; }
}
#kreceipt { display: none; }
`

function PrintReceipt({ order, restaurantName, onClose }) {
    const subtotal = (order.total || 0) / 1.05
    const gst = (order.total || 0) - subtotal
    const now = new Date()

    const print = () => {
        const el = document.createElement('div')
        el.id = 'kreceipt'
        el.innerHTML = document.getElementById('rcpt-body').innerHTML
        document.body.appendChild(el)
        window.print()
        setTimeout(() => el.remove(), 2000)
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', borderRadius: 20, width: 360, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
                <div id="rcpt-body" style={{ fontFamily: "'Courier New',monospace", fontSize: 13, padding: 24 }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 17, fontWeight: 900 }}>{restaurantName || 'Restaurant'}</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Powered by Petpooja Copilot</div>
                        <div style={{ fontSize: 11, marginTop: 6 }}>{now.toLocaleDateString('en-IN')} · {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>Order #{order.order_id}</div>
                    </div>
                    {(order.items || []).map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span>{it.name} × {it.qty || 1}</span>
                            <span>₹{((it.price || 0) * (it.qty || 1)).toFixed(0)}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: '1px dashed #ccc', marginTop: 10, paddingTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 12 }}><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 12 }}><span>GST (5%)</span><span>₹{gst.toFixed(0)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 16, marginTop: 6 }}><span>TOTAL</span><span>₹{(order.total || 0).toFixed(0)}</span></div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 12, borderTop: '1px dashed #ccc', paddingTop: 10, fontSize: 11, color: '#777' }}>Thank you for dining with us!</div>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
                    <button onClick={print} style={{ flex: 1, padding: 12, background: 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>🖨 Print</button>
                    <button onClick={onClose} style={{ flex: 1, padding: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
                </div>
            </div>
        </div>
    )
}

export default function CustomerMenu({ user, onLogout }) {
    const [menu, setMenu] = useState([])
    const [loading, setLoading] = useState(true)
    const [cart, setCart] = useState({})
    const [selectedCat, setSelectedCat] = useState('All')
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('menu') // 'menu' | 'voice'
    const [orderedOrder, setOrderedOrder] = useState(null)
    const [showReceipt, setShowReceipt] = useState(false)
    const [placingOrder, setPlacingOrder] = useState(false)

    // Voice state
    const [isRecording, setIsRecording] = useState(false)
    const [micStatus, setMicStatus] = useState('idle')
    const [micError, setMicError] = useState('')
    const [recSecs, setRecSecs] = useState(0)
    const [transcription, setTranscription] = useState('')
    const [parsedItems, setParsedItems] = useState([])
    const [manualText, setManualText] = useState('')
    const [voiceLoading, setVoiceLoading] = useState(false)
    const mrRef = useRef(null)
    const chunksRef = useRef([])
    const timerRef = useRef(null)

    const totalQty = Object.values(cart).reduce((s, v) => s + v.qty, 0)
    const totalPrice = Object.values(cart).reduce((s, v) => s + v.item.selling_price * v.qty, 0)

    useEffect(() => {
        const s = document.createElement('style')
        s.id = 'rcss'; s.textContent = RECEIPT_CSS
        document.head.appendChild(s)
        return () => document.getElementById('rcss')?.remove()
    }, [])

    const fetchMenu = useCallback(async () => {
        try {
            const res = await apiFetch('/menu/items')
            const data = await res.json()
            setMenu((data.items || []).filter(i => i.is_available !== false))
        } catch { setMenu([]) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchMenu() }, [fetchMenu])
    useEffect(() => () => clearInterval(timerRef.current), [])

    const categories = ['All', ...Array.from(new Set(menu.map(i => i.category).filter(Boolean)))]
    const filtered = menu.filter(i => {
        const mc = selectedCat === 'All' || i.category === selectedCat
        const ms = !search || i.name.toLowerCase().includes(search.toLowerCase())
        return mc && ms
    })

    const addToCart = (item) => setCart(p => ({ ...p, [item.item_id]: { item, qty: (p[item.item_id]?.qty || 0) + 1 } }))
    const removeFromCart = (id) => setCart(p => {
        const e = p[id]; if (!e || e.qty <= 1) { const n = { ...p }; delete n[id]; return n }
        return { ...p, [id]: { ...e, qty: e.qty - 1 } }
    })

    // â”€â”€ Voice: parse text â”€â”€
    const parseText = async (text) => {
        if (!text.trim()) return
        setVoiceLoading(true)
        try {
            const res = await apiFetch('/voice/parse-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcription: text }),
            })
            const data = await res.json()
            const items = data.items || []
            setParsedItems(items)
            setCart(prev => {
                const updated = { ...prev }
                items.forEach(item => {
                    const menuItem = menu.find(m => m.item_id === item.item_id)
                    if (menuItem) updated[item.item_id] = { item: menuItem, qty: (updated[item.item_id]?.qty || 0) + (item.qty || 1) }
                })
                return updated
            })
        } catch { setParsedItems([]) }
        finally { setVoiceLoading(false) }
    }

    // â”€â”€ Voice: mic recording â”€â”€
    const startMic = async () => {
        setMicError(''); setTranscription(''); setParsedItems([])
        setMicStatus('requesting')
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            chunksRef.current = []
            const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
            const mr = new MediaRecorder(stream, { mimeType: mime })
            mrRef.current = mr
            mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            mr.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                clearInterval(timerRef.current); setRecSecs(0); setIsRecording(false)
                setMicStatus('processing')
                const blob = new Blob(chunksRef.current, { type: mime })
                const fd = new FormData(); fd.append('file', blob, 'rec.webm')
                try {
                    const tRes = await apiFetch('/voice/transcribe', { method: 'POST', body: fd })
                    const tData = await tRes.json()
                    const text = tData.transcription || ''
                    setTranscription(text)
                    if (text) await parseText(text)
                    setMicStatus('idle')
                } catch { setMicStatus('error'); setMicError('Transcription failed. Try again.') }
            }
            mr.start(100); setIsRecording(true); setMicStatus('recording'); setRecSecs(0)
            timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000)
        } catch (err) {
            setMicStatus('error')
            setMicError(err.name === 'NotAllowedError' ? 'Mic access denied.' : err.message)
        }
    }
    const stopMic = () => { if (mrRef.current?.state !== 'inactive') mrRef.current.stop() }

    // â”€â”€ Place order â”€â”€
    const placeOrder = async () => {
        if (!totalQty) return
        setPlacingOrder(true)
        try {
            const items = Object.values(cart).map(({ item, qty }) => ({
                item_id: item.item_id, name: item.name, qty,
                modifiers: [], price: item.selling_price, match_confidence: 100,
            }))
            const res = await apiFetch('/voice/confirm-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, upsell_accepted: false, language_detected: 'Customer' }),
            })
            const data = await res.json()
            setOrderedOrder(data.order)
            setCart({}); setTranscription(''); setParsedItems([])
        } catch { }
        finally { setPlacingOrder(false) }
    }

    // â”€â”€ Order success screen â”€â”€
    if (orderedOrder) {
        return (
            <>
                {showReceipt && <PrintReceipt order={orderedOrder} restaurantName={user?.restaurant_name} onClose={() => { setShowReceipt(false); setOrderedOrder(null) }} />}
                <div style={{ minHeight: '100vh', width: '100vw', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
                    <div style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(16,185,129,0.25)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#10b981' }}>check_circle</span>
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Order Placed!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                            Order # <strong style={{ color: 'var(--primary)' }}>{orderedOrder.order_id}</strong>
                        </p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 28 }}>Your order has been sent to the kitchen.</p>

                        <div className="glass-card" style={{ padding: 20, marginBottom: 20, textAlign: 'left' }}>
                            {(orderedOrder.items || []).map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 14 }}>
                                    <span>×{item.qty || 1} {item.name}</span>
                                    <span>₹{((item.price || 0) * (item.qty || 1)).toFixed(0)}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, fontSize: 18 }}>
                                <span>Total</span><span style={{ color: 'var(--primary)' }}>₹{(orderedOrder.total || 0).toFixed(0)}</span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 16px', color: '#059669', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
                            ✔ Kitchen has been notified in real-time
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setShowReceipt(true)}
                                style={{ flex: 1, padding: 14, background: '#fff', border: '1.5px solid var(--border-subtle)', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                                🖨 Print Bill
                            </button>
                            <button onClick={() => setOrderedOrder(null)}
                                style={{ flex: 1, padding: 14, background: 'var(--primary)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Order More
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div style={{ minHeight: '100vh', maxHeight: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'var(--text-primary)' }}>

            {/* — Header — */}
            <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px', height: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>restaurant</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>{user?.restaurant_name || 'Our Menu'}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>Self-Service Kiosk</div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 10, padding: 4, border: '1px solid var(--border-subtle)' }}>
                    {[{ id: 'menu', icon: 'restaurant_menu', label: 'Browse' }, { id: 'voice', icon: 'mic', label: 'Voice Order' }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? 'var(--primary)' : 'var(--text-secondary)', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {totalQty > 0 && (
                        <div style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary-glow)', borderRadius: 10, padding: '6px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>shopping_cart</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 14 }}>{totalQty} · ₹{totalPrice.toFixed(0)}</span>
                        </div>
                    )}
                    <button onClick={onLogout}
                        style={{ padding: '7px 14px', background: '#fff', border: '1.5px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
                        Exit
                    </button>
                </div>
            </div>

            {/* — Content area — */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* ———— BROWSE TAB ———— */}
                {tab === 'menu' && (
                    <>
                        {/* Search + category chips */}
                        <div style={{ padding: '14px 24px 0', flexShrink: 0, background: '#fff', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>search</span>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for dishes…"
                                    style={{ width: '100%', padding: '10px 14px 10px 38px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 14 }}>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCat(cat)}
                                        style={{ padding: '6px 16px', borderRadius: 99, border: `1.5px solid ${selectedCat === cat ? 'var(--primary)' : 'var(--border-subtle)'}`, background: selectedCat === cat ? 'var(--primary-dim)' : '#fff', color: selectedCat === cat ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu grid */}
                        <div style={{ padding: '16px 24px', paddingBottom: totalQty > 0 ? 120 : 24 }}>
                            {loading ? (
                                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 80 }}>Loading menu…</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                    {filtered.map(item => {
                                        const inCart = cart[item.item_id]
                                        const isCombo = item.is_combo || item.category === 'Combos'
                                        return (
                                            <div key={item.item_id} className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, border: isCombo ? '1.5px solid var(--primary-glow)' : undefined }}>
                                                <div>
                                                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                                        {isCombo && <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--primary-dim)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--primary-glow)' }}>COMBO</span>}
                                                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99 }}>{item.category}</span>
                                                    </div>
                                                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                                                    {item.description && <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{item.description}</div>}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 20 }}>₹{item.selling_price}</span>
                                                    {!inCart ? (
                                                        <button onClick={() => addToCart(item)}
                                                            style={{ padding: '8px 20px', background: 'var(--primary)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                            + Add
                                                        </button>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--primary-dim)', border: '1.5px solid var(--primary-glow)', borderRadius: 10, padding: '5px 12px' }}>
                                                            <button onClick={() => removeFromCart(item.item_id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 900, fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>−</button>
                                                            <span style={{ fontWeight: 800, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{inCart.qty}</span>
                                                            <button onClick={() => addToCart(item)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 900, fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>+</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ———— VOICE ORDER TAB ———— */}
                {tab === 'voice' && (
                    <div style={{ flex: 1, display: 'flex', gap: 32, padding: '32px 60px', paddingBottom: totalQty > 0 ? 120 : 32, alignItems: 'flex-start', justifyContent: 'center', maxWidth: 900, margin: '0 auto', width: '100%' }}>

                        {/* Left: Mic + result */}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Voice Order</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Tap the mic and speak your order in English or Hindi. Items are added to your cart automatically.</p>

                            {/* Mic button */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                                <div style={{ position: 'relative', marginBottom: 16 }}>
                                    {isRecording && <>
                                        <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.3)', animation: 'pulse 1.5s ease-out infinite' }} />
                                        <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.15)', animation: 'pulse 1.5s ease-out 0.5s infinite' }} />
                                    </>}
                                    <button onClick={isRecording ? stopMic : startMic}
                                        disabled={micStatus === 'requesting' || micStatus === 'processing' || voiceLoading}
                                        style={{
                                            width: 100, height: 100, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                            background: isRecording ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, var(--primary), #c2410c)',
                                            boxShadow: isRecording ? '0 8px 30px rgba(239,68,68,0.4)' : '0 8px 30px rgba(249,116,21,0.35)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s', transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                                        }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#fff' }}>
                                            {isRecording ? 'stop_circle' : micStatus === 'processing' || voiceLoading ? 'hourglass_top' : 'mic'}
                                        </span>
                                    </button>
                                </div>
                                <div style={{ textAlign: 'center', minHeight: 48 }}>
                                    {micStatus === 'idle' && !transcription && <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Tap to start recording</p>}
                                    {micStatus === 'requesting' && <p style={{ color: '#f59e0b', fontWeight: 700 }}>Requesting mic…</p>}
                                    {micStatus === 'recording' && <div>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                                            <span style={{ color: '#ef4444', fontWeight: 800 }}>Recording {recSecs}s</span>
                                        </div>
                                        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Tap stop when done</p>
                                    </div>}
                                    {micStatus === 'processing' && <p style={{ color: 'var(--primary)', fontWeight: 700 }}>🔄 Processing with Whisper AI…</p>}
                                    {micStatus === 'error' && <p style={{ color: '#dc2626', fontSize: 13 }}>⚠ {micError}</p>}
                                    {voiceLoading && micStatus === 'idle' && <p style={{ color: 'var(--primary)', fontWeight: 700 }}>Parsing order…</p>}
                                </div>
                            </div>

                            {/* Transcription result */}
                            {transcription && (
                                <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Transcription</div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontStyle: 'italic' }}>"{transcription}"</p>
                                    {parsedItems.length > 0 && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 8 }}>✔ Added to cart</div>
                                            {parsedItems.map((it, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                    <span>×{it.qty || 1} {it.name}</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{((it.price || 0) * (it.qty || 1)).toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {parsedItems.length === 0 && micStatus === 'idle' && !voiceLoading && (
                                        <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>⚠ No items matched. Try again or use Browse tab.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Manual text + examples */}
                        <div style={{ width: 340, flexShrink: 0 }}>
                            <div className="glass-card" style={{ padding: 20 }}>
                                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Or type your order</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <input value={manualText} onChange={e => setManualText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && manualText.trim() && parseText(manualText)}
                                        placeholder="e.g. two paneer burger and one cold coffee"
                                        style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                                    <button onClick={() => manualText.trim() && parseText(manualText)} disabled={!manualText.trim() || voiceLoading}
                                        style={{ padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: manualText.trim() ? 1 : 0.5 }}>
                                        Parse & Add to Cart →
                                    </button>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 16, paddingTop: 14 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, fontWeight: 600 }}>Try these examples</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        {['ek paneer burger aur do french fries', 'two cold coffee', 'one margherita pizza extra cheese', 'teen chicken wings aur mojito'].map(ex => (
                                            <button key={ex} onClick={() => { setManualText(ex); parseText(ex) }}
                                                style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s' }}>
                                                "{ex}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* â”€â”€ Sticky checkout bar â”€â”€ */}
            {totalQty > 0 && (
                <div style={{ flexShrink: 0, background: '#fff', borderTop: '1.5px solid var(--border-subtle)', padding: '14px 24px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, maxWidth: 900, margin: '0 auto' }}>
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', flex: 1 }}>
                            {Object.values(cart).map(({ item, qty }) => (
                                <div key={item.item_id} style={{ flexShrink: 0, background: 'var(--bg-elevated)', borderRadius: 8, padding: '5px 10px', display: 'flex', gap: 5, alignItems: 'center', border: '1px solid var(--border-subtle)', fontSize: 13 }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>×{qty}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{totalQty} item{totalQty !== 1 ? 's' : ''}</div>
                                <div style={{ fontWeight: 900, fontSize: 22 }}>₹{totalPrice.toFixed(0)}</div>
                            </div>
                            <button onClick={placeOrder} disabled={placingOrder}
                                style={{ padding: '14px 32px', background: 'var(--primary)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px var(--primary-glow)', whiteSpace: 'nowrap', opacity: placingOrder ? 0.7 : 1 }}>
                                {placingOrder ? 'Placing…' : `Place Order · ₹${totalPrice.toFixed(0)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

