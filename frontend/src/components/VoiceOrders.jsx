import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import apiFetch from '../utils/apiFetch'

export default function VoiceOrders() {
    const [mode, setMode] = useState('voice') // 'voice' | 'manual'
    const [manualText, setManualText] = useState('')
    const [transcription, setTranscription] = useState('')
    const [parsedOrder, setParsedOrder] = useState(null)
    const [confirmedOrder, setConfirmedOrder] = useState(null)
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [showReceipt, setShowReceipt] = useState(false)
    const fileRef = useRef(null)

    // Ã¢ââ¬Ã¢ââ¬Ã¢ââ¬ Live Mic State Ã¢ââ¬Ã¢ââ¬Ã¢ââ¬
    const [isRecording, setIsRecording] = useState(false)
    const [micStatus, setMicStatus] = useState('idle') // 'idle' | 'requesting' | 'recording' | 'processing' | 'error'
    const [micError, setMicError] = useState('')
    const [recordingSeconds, setRecordingSeconds] = useState(0)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const timerRef = useRef(null)

    // Manual order state
    const [menuItems, setMenuItems] = useState([])
    const [menuLoading, setMenuLoading] = useState(true)
    const [cart, setCart] = useState({}) // { item_id: qty }
    const [menuSearch, setMenuSearch] = useState('')
    const [menuCategory, setMenuCategory] = useState('All')

    // Load menu items for manual ordering
    const fetchMenu = useCallback(async () => {
        try {
            const res = await apiFetch('/menu/items')
            const data = await res.json()
            setMenuItems((data.items || []).filter(i => i.is_available))
        } catch (err) { console.error(err) }
        finally { setMenuLoading(false) }
    }, [])

    useEffect(() => { fetchMenu() }, [fetchMenu])

    // Ã¢ââ¬Ã¢ââ¬Ã¢ââ¬ Live Mic: Start Recording Ã¢ââ¬Ã¢ââ¬Ã¢ââ¬
    const startMic = async () => {
        setMicError('')
        setMicStatus('requesting')
        setTranscription('')
        setParsedOrder(null)
        setConfirmedOrder(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            audioChunksRef.current = []
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
            const mr = new MediaRecorder(stream, { mimeType })
            mediaRecorderRef.current = mr
            mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
            mr.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                clearInterval(timerRef.current)
                setRecordingSeconds(0)
                setIsRecording(false)
                setMicStatus('processing')
                const blob = new Blob(audioChunksRef.current, { type: mimeType })
                const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
                const formData = new FormData()
                formData.append('file', blob, `recording.${ext}`)
                try {
                    setProcessing(true)
                    setLoading(true)
                    const res = await apiFetch('/voice/transcribe', { method: 'POST', body: formData })
                    const data = await res.json()
                    const text = data.transcription || data.error || ''
                    setTranscription(text)
                    setMicStatus('idle')
                    if (data.transcription) await parseOrder(data.transcription)
                } catch {
                    setMicStatus('error')
                    setMicError('Transcription failed. Please try again.')
                } finally {
                    setProcessing(false)
                    setLoading(false)
                }
            }
            mr.start(100) // collect chunks every 100ms
            setIsRecording(true)
            setMicStatus('recording')
            setRecordingSeconds(0)
            timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
        } catch (err) {
            setMicStatus('error')
            if (err.name === 'NotAllowedError') {
                setMicError('Microphone access denied. Please allow mic access in your browser settings.')
            } else {
                setMicError(`Mic error: ${err.message}`)
            }
        }
    }

    const stopMic = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
    }

    // Cleanup on unmount
    useEffect(() => () => {
        clearInterval(timerRef.current)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
    }, [])

    // Ã¢ââ¬Ã¢ââ¬Ã¢ââ¬ Upload & Transcribe Ã¢ââ¬Ã¢ââ¬Ã¢ââ¬
    const handleFileUpload = async (file) => {
        if (!file) return
        setProcessing(true)
        setLoading(true)
        setParsedOrder(null)
        setConfirmedOrder(null)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await apiFetch('/voice/transcribe', { method: 'POST', body: formData })
            const data = await res.json()
            setTranscription(data.transcription || data.error || '')
            if (data.transcription) await parseOrder(data.transcription)
        } catch { setTranscription('Error during transcription') }
        setProcessing(false)
        setLoading(false)
    }

    // ——— Parse Order ———
    const parseOrder = async (text) => {
        setLoading(true)
        setConfirmedOrder(null)
        try {
            const res = await apiFetch('/voice/parse-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcription: text }),
            })
            const data = await res.json()
            setParsedOrder(data)
            setTranscription(text)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    // ——— Confirm Order ———
    const confirmOrder = async (acceptUpsell = false) => {
        if (!parsedOrder) return
        setLoading(true)
        try {
            const res = await apiFetch('/voice/confirm-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: parsedOrder.items,
                    upsell_accepted: acceptUpsell,
                    upsell_items: acceptUpsell ? parsedOrder.upsell_suggestion?.suggested_items : null,
                    language_detected: 'Hinglish',
                }),
            })
            const data = await res.json()
            setConfirmedOrder(data)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    // ——— Manual Order: Confirm ———
    const confirmManualOrder = async () => {
        const items = Object.entries(cart)
            .filter(([, qty]) => qty > 0)
            .map(([id, qty]) => {
                const item = menuItems.find(i => i.item_id === id)
                return { item_id: id, name: item.name, qty, modifiers: [], price: item.selling_price, match_confidence: 100 }
            })
        if (items.length === 0) return
        setLoading(true)
        try {
            const res = await apiFetch('/voice/confirm-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, upsell_accepted: false, language_detected: 'Manual' }),
            })
            const data = await res.json()
            setConfirmedOrder(data)
            setParsedOrder(null)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const reset = () => {
        setManualText('')
        setTranscription('')
        setParsedOrder(null)
        setConfirmedOrder(null)
        setCart({})
        setShowReceipt(false)
    }

    const printReceipt = () => {
        setShowReceipt(true)
        setTimeout(() => window.print(), 300)
    }

    // Cart helpers
    const addToCart = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
    const removeFromCart = (id) => setCart(c => {
        const q = (c[id] || 0) - 1
        if (q <= 0) { const n = { ...c }; delete n[id]; return n }
        return { ...c, [id]: q }
    })
    const cartItems = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => {
        const item = menuItems.find(i => i.item_id === id)
        return item ? { ...item, qty } : null
    }).filter(Boolean)
    const cartTotal = cartItems.reduce((s, i) => s + i.selling_price * i.qty, 0)
    const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

    // Menu filtering
    const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category)))]
    const filteredMenu = menuItems.filter(i => {
        const matchCat = menuCategory === 'All' || i.category === menuCategory
        const matchSearch = i.name.toLowerCase().includes(menuSearch.toLowerCase())
        return matchCat && matchSearch
    })

    // Category icons
    const catIcon = (cat) => {
        const map = { 'Burgers': 'lunch_dining', 'Pizzas': 'local_pizza', 'Starters': 'tapas', 'Beverages': 'local_cafe', 'Desserts': 'cake', 'Main Course': 'dinner_dining', 'Sides': 'restaurant' }
        return map[cat] || 'fastfood'
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            {/* ——— LEFT COLUMN ——— */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Mode Tabs */}
                <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                    {[{ id: 'voice', label: 'Voice Order', icon: 'mic' }, { id: 'manual', label: 'Manual Order', icon: 'touch_app' }].map(t => (
                        <button key={t.id} onClick={() => { setMode(t.id); reset() }} style={{
                            flex: 1, padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: mode === t.id ? 700 : 500, fontFamily: 'inherit',
                            background: mode === t.id ? 'var(--primary)' : 'transparent',
                            color: mode === t.id ? 'white' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            boxShadow: mode === t.id ? '0 2px 6px rgba(249,116,21,0.2)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ——— Voice Order Panel ——— */}
                {mode === 'voice' && (
                    <>
                        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>New Voice Order</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 32 }}>Speak or upload the customer order details</p>

                            {/* Live Mic Button */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                                    {/* Pulse rings when recording */}
                                    {isRecording && <>
                                        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.5)', animation: 'mic-ring 1.5s ease-out infinite' }} />
                                        <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.3)', animation: 'mic-ring 1.5s ease-out 0.5s infinite' }} />
                                    </>}
                                    <button
                                        className="mic-btn"
                                        onClick={isRecording ? stopMic : startMic}
                                        disabled={micStatus === 'requesting' || micStatus === 'processing'}
                                        title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
                                        style={{
                                            background: isRecording ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
                                            boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.2)' : undefined,
                                            transform: isRecording ? 'scale(1.05)' : undefined,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
                                            {isRecording ? 'stop_circle' : micStatus === 'processing' ? 'hourglass_top' : 'mic'}
                                        </span>
                                    </button>
                                </div>

                                {/* Status line */}
                                {micStatus === 'idle' && !transcription && (
                                    <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Click the mic and speak your order</p>
                                )}
                                {micStatus === 'requesting' && (
                                    <p style={{ fontSize: 14, color: '#f59e0b', fontWeight: 600 }}>⏳ Requesting microphone access...</p>
                                )}
                                {micStatus === 'recording' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'mic-ring 1s ease-out infinite', display: 'inline-block' }} />
                                            <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>Recording… {recordingSeconds}s</span>
                                        </div>
                                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Speak your order clearly, then click stop</p>
                                    </div>
                                )}
                                {micStatus === 'processing' && (
                                    <p style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>— Transcribing audio with Whisper AI…</p>
                                )}
                                {micStatus === 'error' && micError && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', maxWidth: 380, textAlign: 'left' }}>
                                        <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, margin: 0 }}>— {micError}</p>
                                        <button onClick={() => setMicStatus('idle')} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, textDecoration: 'underline' }}>Dismiss</button>
                                    </div>
                                )}
                            </div>

                            {/* Upload Zone (secondary) */}
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                                <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]) }}
                                    onClick={() => fileRef.current?.click()}>
                                    <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }}
                                        onChange={e => handleFileUpload(e.target.files?.[0])} />
                                    <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)', marginBottom: 8, display: 'block' }}>upload_file</span>
                                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Or upload an audio file</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Drag & drop or click to browse (.mp3, .wav, .webm, .ogg)</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                                <span>or type your order</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                            </div>

                            {/* Text Input */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input value={manualText} onChange={e => setManualText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && manualText.trim() && parseOrder(manualText)}
                                    placeholder='e.g. ek paneer burger aur do french fries'
                                    className="search-input" style={{ width: '100%', paddingLeft: 16 }} />
                                <button className="btn-primary" onClick={() => manualText.trim() && parseOrder(manualText)}
                                    disabled={!manualText.trim() || loading} style={{ whiteSpace: 'nowrap' }}>
                                    Parse —
                                </button>
                            </div>

                            {/* Example Prompts */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, justifyContent: 'center' }}>
                                {['ek paneer burger aur do french fries', 'two margherita pizza extra cheese', 'one cold coffee and chocolate brownie'].map(ex => (
                                    <button key={ex} onClick={() => { setManualText(ex); parseOrder(ex) }}
                                        style={{ padding: '5px 10px', fontSize: 11, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)' }}
                                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-tertiary)' }}>
                                        "{ex}"
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Transcription Display */}
                        {transcription && (
                            <div className="glass-card animate-in" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Transcription</h4>
                                    <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>AI ACTIVE</span>
                                </div>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>"{transcription}"</p>
                                {processing && (
                                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div className="skeleton" style={{ height: 12, width: '100%' }} />
                                        <div className="skeleton" style={{ height: 12, width: '75%' }} />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ——— Manual Order Panel ——— */}
                {mode === 'manual' && (
                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Select Items</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{menuItems.length} items available</p>
                            </div>
                            {cartCount > 0 && (
                                <span style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                                    {cartCount} item{cartCount > 1 ? 's' : ''} in cart
                                </span>
                            )}
                        </div>

                        {/* Search */}
                        <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
                            placeholder="Search menu..." className="search-input"
                            style={{ width: '100%', paddingLeft: 16, marginBottom: 12, boxSizing: 'border-box' }} />

                        {/* Category Pills */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                            {categories.map(c => (
                                <button key={c} onClick={() => setMenuCategory(c)} style={{
                                    padding: '5px 12px', borderRadius: 20, border: '1px solid',
                                    borderColor: menuCategory === c ? 'var(--primary)' : 'var(--border-subtle)',
                                    background: menuCategory === c ? 'var(--primary-dim)' : 'white',
                                    color: menuCategory === c ? 'var(--primary)' : 'var(--text-tertiary)',
                                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                }}>
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Menu Items Grid */}
                        {menuLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
                            </div>
                        ) : (
                            <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                                {filteredMenu.length === 0 && (
                                    <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No items match your search</p>
                                )}
                                {filteredMenu.map(item => {
                                    const qty = cart[item.item_id] || 0
                                    return (
                                        <div key={item.item_id} style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                                            border: qty > 0 ? '1px solid rgba(249,116,21,0.3)' : '1px solid var(--border-subtle)',
                                            background: qty > 0 ? 'rgba(249,116,21,0.03)' : 'white',
                                            transition: 'all 0.15s',
                                        }}>
                                            {/* Icon */}
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: qty > 0 ? 'var(--primary-dim)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: qty > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>{catIcon(item.category)}</span>
                                            </div>
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>₹{item.selling_price} · {item.category}</div>
                                            </div>
                                            {/* Qty Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                                                {qty > 0 ? (
                                                    <>
                                                        <button onClick={() => removeFromCart(item.item_id)} style={{
                                                            width: 28, height: 28, borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--accent-red)',
                                                        }}>—</button>
                                                        <span style={{ width: 32, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{qty}</span>
                                                        <button onClick={() => addToCart(item.item_id)} style={{
                                                            width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--primary)',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white',
                                                        }}>+</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => addToCart(item.item_id)} style={{
                                                        padding: '5px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'white',
                                                        cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--primary)', fontFamily: 'inherit', transition: 'all 0.15s',
                                                    }}>+ ADD</button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ——— RIGHT COLUMN — Order Summary ——— */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Empty state for voice mode */}
                {mode === 'voice' && !parsedOrder && !confirmedOrder && (
                    <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🧾</div>
                        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Parsed order will appear here</p>
                    </div>
                )}

                {/* ——— Manual Order Cart ——— */}
                {mode === 'manual' && !confirmedOrder && (
                    <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 88 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary)' }}>shopping_cart</span>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Order Summary</h3>
                        </div>

                        {cartItems.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>
                                <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>🛒</div>
                                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Add items from the menu to get started</p>
                            </div>
                        ) : (
                            <>
                                {cartItems.map(item => (
                                    <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>₹{item.selling_price} × {item.qty}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <button onClick={() => removeFromCart(item.item_id)} style={{
                                                width: 24, height: 24, borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--accent-red)',
                                            }}>—</button>
                                            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                                            <button onClick={() => addToCart(item.item_id)} style={{
                                                width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--primary)',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white',
                                            }}>+</button>
                                            <span style={{ fontWeight: 700, fontSize: 14, minWidth: 50, textAlign: 'right' }}>₹{item.selling_price * item.qty}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Totals */}
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                                        <span>Subtotal ({cartCount} items)</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                                        <span>GST (5%)</span>
                                        <span>₹{Math.round(cartTotal * 0.05)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, paddingTop: 12, borderTop: '2px solid var(--border-subtle)' }}>
                                        <span>Total</span>
                                        <span style={{ color: 'var(--primary)' }}>₹{cartTotal + Math.round(cartTotal * 0.05)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                    <button onClick={() => setCart({})} className="btn-outline" style={{ flex: 1, padding: 12 }}>
                                        Clear Cart
                                    </button>
                                    <button onClick={confirmManualOrder} disabled={loading} className="btn-primary"
                                        style={{ flex: 2, padding: 12, fontSize: 15, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(249,116,21,0.25)' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                                        {loading ? 'Processing...' : 'Place Order'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Parsed Order Card (voice mode) */}
                {parsedOrder && !confirmedOrder && mode === 'voice' && (
                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="glass-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Parsed Order</h3>
                                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', fontSize: 12, padding: '4px 8px', borderRadius: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>translate</span>
                                        Hinglish Detected
                                    </span>
                                </div>
                                <button style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                            </div>

                            {parsedOrder.items.length > 0 ? (
                                <>
                                    {parsedOrder.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                                                <div>
                                                    <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{item.name}</span>
                                                    {item.modifiers?.filter(Boolean).length > 0 && (
                                                        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                                                            {item.modifiers.filter(Boolean).map((mod, j) => (
                                                                <span key={j} style={{ fontSize: 10, background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{mod}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>₹{item.price * item.qty}</span>
                                        </div>
                                    ))}
                                    <div style={{ padding: '16px 0 0', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                                        <span>Total</span>
                                        <span>₹{parsedOrder.total + Math.round(parsedOrder.total * 0.05)}</span>
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>No items matched. Try a different phrasing.</p>
                            )}
                        </div>

                        {/* Upsell Suggestion */}
                        {parsedOrder.upsell_suggestion && (
                            <div className="glass-card animate-in" style={{ padding: 16, background: 'rgba(249,116,21,0.03)', borderColor: 'rgba(249,116,21,0.15)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <span style={{ fontSize: 24 }}>🔥</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Suggested Add-on</p>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{parsedOrder.upsell_suggestion.message}</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn-primary btn-sm" onClick={() => confirmOrder(true)}>Accept</button>
                                            <button className="btn-outline btn-sm" onClick={() => confirmOrder(false)}>Decline</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KOT Preview */}
                        {parsedOrder.items.length > 0 && (
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '0 16px', background: 'var(--bg-base)', zIndex: 1 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>KOT Preview</span>
                                </div>
                                <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 12, padding: 24, background: 'var(--bg-surface)', opacity: 0.7 }}>
                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <h4 style={{ fontSize: 14, fontWeight: 700 }}>KITCHEN ORDER TICKET</h4>
                                        <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Order #NEW &bull; {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {parsedOrder.items.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{item.qty} x {item.name}</span>
                                                <span>[V]</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Button */}
                        {parsedOrder.items.length > 0 && (
                            <button className="btn-primary"
                                style={{ width: '100%', padding: 16, fontSize: 16, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 8px 24px rgba(249,116,21,0.25)' }}
                                onClick={() => confirmOrder(false)} disabled={loading}>
                                <span className="material-symbols-outlined">send</span>
                                {loading ? 'Processing...' : 'Confirm & Send to Kitchen'}
                            </button>
                        )}
                    </div>
                )}

                {/* Confirmed Order + KOT */}
                {confirmedOrder && (
                    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="glass-card" style={{ padding: 24, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>✅</span>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>Order Confirmed!</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                        {confirmedOrder.order.order_id} · {confirmedOrder.order.timestamp?.slice(0, 19)}
                                    </p>
                                </div>
                            </div>

                            {confirmedOrder.order.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                                    <span>{item.name} ×{item.qty || 1}</span>
                                    <span>₹{item.price * (item.qty || 1)}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 8, borderTop: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: 16 }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--accent-green)' }}>₹{confirmedOrder.order.total}</span>
                            </div>
                        </div>

                        {/* KOT */}
                        <div className="glass-card" style={{ padding: 20 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🧾 Kitchen Order Ticket</h4>
                            <div className="kot-display">{confirmedOrder.kot}</div>
                        </div>

                        {/* Stock Impact */}
                        {confirmedOrder.inventory_impact && confirmedOrder.inventory_impact.depleted?.length > 0 && (
                            <div className="glass-card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>inventory_2</span>
                                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>Stock Impact</h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {confirmedOrder.inventory_impact.depleted.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: '#f8fafc' }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>-{d.subtracted} {d.unit}</span>
                                                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>→ {d.remaining} {d.unit} left</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {confirmedOrder.inventory_impact.stock_alerts?.length > 0 && (
                                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: 18 }}>warning</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
                                            Low Stock Alert: {confirmedOrder.inventory_impact.stock_alerts.map(a => a.name).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn-primary" onClick={printReceipt}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0f172a' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt</span>
                                Print Receipt
                            </button>
                            <button className="btn-outline" onClick={reset} style={{ flex: 1 }}>
                                ↩ New Order
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ━━ Receipt Print Modal ━━ */}
            {showReceipt && confirmedOrder && createPortal(
                <>
                    <style>{`
                        @media print {
                            body > *:not(#receipt-portal) { display: none !important; }
                            #receipt-portal { display: block !important; }
                            #receipt-close-btn { display: none !important; }
                            @page { size: 80mm auto; margin: 0; }
                        }
                        #receipt-portal {
                            position: fixed; inset: 0; background: rgba(15,23,42,0.7);
                            display: flex; align-items: center; justify-content: center; z-index: 99999;
                        }
                        .receipt-paper {
                            background: white; width: 300px; padding: 20px 16px;
                            font-family: 'Courier New', monospace; font-size: 12px;
                            color: #000; box-shadow: 0 24px 64px rgba(0,0,0,0.3);
                        }
                        .receipt-dashed { border-top: 1px dashed #000; margin: 8px 0; }
                        .receipt-center { text-align: center; }
                        .receipt-row { display: flex; justify-content: space-between; padding: 2px 0; }
                        .receipt-bold { font-weight: bold; }
                        .receipt-big { font-size: 15px; font-weight: bold; }
                    `}</style>
                    <div id="receipt-portal">
                        <div className="receipt-paper">
                            <div className="receipt-center receipt-bold receipt-big">PETPOOJA COPILOT</div>
                            <div className="receipt-center" style={{ fontSize: 10, marginBottom: 4 }}>AI-Powered Restaurant POS</div>
                            <div className="receipt-center" style={{ fontSize: 10 }}>Tel: +91-98001-00001</div>
                            <div className="receipt-dashed" />
                            <div className="receipt-row"><span>Order#</span><span>{confirmedOrder.order.order_id?.slice(-8)}</span></div>
                            <div className="receipt-row"><span>Date</span><span>{new Date().toLocaleDateString('en-IN')}</span></div>
                            <div className="receipt-row"><span>Time</span><span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div className="receipt-row"><span>Cashier</span><span>AI Copilot</span></div>
                            <div className="receipt-dashed" />
                            <div className="receipt-bold" style={{ marginBottom: 4 }}>ITEMS</div>
                            {confirmedOrder.order.items.map((item, i) => {
                                const qty = item.qty || 1
                                const price = item.price * qty
                                return (
                                    <div key={i}>
                                        <div>{item.name}</div>
                                        <div className="receipt-row">
                                            <span style={{ paddingLeft: 8 }}>{qty} x ₹{item.price}</span>
                                            <span>₹{price}</span>
                                        </div>
                                    </div>
                                )
                            })}
                            <div className="receipt-dashed" />
                            <div className="receipt-row"><span>Subtotal</span><span>₹{confirmedOrder.order.total}</span></div>
                            <div className="receipt-row"><span>GST (5%)</span><span>₹{Math.round(confirmedOrder.order.total * 0.05)}</span></div>
                            <div className="receipt-dashed" />
                            <div className="receipt-row receipt-bold receipt-big">
                                <span>TOTAL</span>
                                <span>₹{Math.round(confirmedOrder.order.total * 1.05)}</span>
                            </div>
                            <div className="receipt-dashed" />
                            <div className="receipt-row"><span>Payment</span><span>Cash / UPI</span></div>
                            <div className="receipt-dashed" />
                            <div className="receipt-center" style={{ marginTop: 8, fontSize: 11 }}>Thank you for dining with us!</div>
                            <div className="receipt-center" style={{ fontSize: 10, marginTop: 2 }}>Powered by Petpooja AI Copilot</div>
                            <div style={{ height: 20 }} />
                            <button id="receipt-close-btn" onClick={() => setShowReceipt(false)}
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ✕ Close
                            </button>
                        </div>
                    </div>
                </>
                , document.body)}
        </div>
    )
}

