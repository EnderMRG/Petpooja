import { useState, useRef } from 'react'

export default function VoiceOrderPanel() {
    const [transcription, setTranscription] = useState('')
    const [parsedOrder, setParsedOrder] = useState(null)
    const [confirmedOrder, setConfirmedOrder] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('input') // input | parsed | confirmed
    const [dragOver, setDragOver] = useState(false)
    const [manualText, setManualText] = useState('')
    const [showOrders, setShowOrders] = useState(false)
    const fileRef = useRef(null)

    // ─── Upload & Transcribe audio ───
    const handleFileUpload = async (file) => {
        if (!file) return
        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/voice/transcribe', { method: 'POST', body: formData })
            const data = await res.json()
            if (data.error) {
                // Whisper not available — show error
                setTranscription(`[Whisper unavailable] ${data.error}`)
                setLoading(false)
                return
            }
            setTranscription(data.transcription)
            // Auto-parse
            await parseOrder(data.transcription)
        } catch (err) {
            setTranscription('Error during transcription')
        }
        setLoading(false)
    }

    // ─── Parse order from text ───
    const parseOrder = async (text) => {
        setLoading(true)
        try {
            const res = await fetch('/voice/parse-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcription: text }),
            })
            const data = await res.json()
            setParsedOrder(data)
            setStep('parsed')
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    // ─── Confirm order ───
    const confirmOrder = async (acceptUpsell = false) => {
        if (!parsedOrder) return
        setLoading(true)
        try {
            const body = {
                items: parsedOrder.items,
                upsell_accepted: acceptUpsell,
                upsell_items: acceptUpsell && parsedOrder.upsell_suggestion?.suggested_items
                    ? parsedOrder.upsell_suggestion.suggested_items
                    : null,
                language_detected: 'Hinglish',
            }
            const res = await fetch('/voice/confirm-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            setConfirmedOrder(data)
            setStep('confirmed')
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    // ─── Fetch all orders ───
    const fetchOrders = async () => {
        const res = await fetch('/voice/orders')
        const data = await res.json()
        setOrders(data.orders || [])
        setShowOrders(true)
    }

    // ─── Reset ───
    const reset = () => {
        setTranscription('')
        setParsedOrder(null)
        setConfirmedOrder(null)
        setStep('input')
        setManualText('')
    }

    return (
        <div className="space-y-6">
            {/* ─── Top bar ─── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">🎙️ Voice Order Copilot</h2>
                    <p className="text-sm text-slate-400">Upload audio or type an order in English / Hindi / Hinglish</p>
                </div>
                <div className="flex gap-3">
                    {step !== 'input' && (
                        <button onClick={reset}
                            className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer">
                            ↩ New Order
                        </button>
                    )}
                    <button onClick={fetchOrders}
                        className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer">
                        📋 Order History
                    </button>
                </div>
            </div>

            {/* ─── Step: Input ─── */}
            {step === 'input' && (
                <div className="space-y-6 animate-in">
                    {/* Audio Upload */}
                    <div
                        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]) }}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={e => handleFileUpload(e.target.files?.[0])}
                        />
                        <div className="text-4xl mb-3">🎤</div>
                        <p className="text-slate-300 font-medium">Drop audio file here or click to upload</p>
                        <p className="text-xs text-slate-500 mt-1">Supports WAV, MP3, M4A — Powered by Whisper (local)</p>
                    </div>

                    {/* Or manual text */}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span>or type your order</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    <div className="flex gap-3">
                        <input
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && manualText.trim() && parseOrder(manualText)}
                            placeholder="e.g. ek paneer burger aur do french fries dena extra cheese"
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                        />
                        <button
                            onClick={() => manualText.trim() && parseOrder(manualText)}
                            disabled={!manualText.trim() || loading}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? '...' : 'Parse →'}
                        </button>
                    </div>

                    {/* Example prompts */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            'ek paneer burger aur do french fries',
                            'two margherita pizza with extra cheese',
                            'one cold coffee and a chocolate brownie please',
                            'teen chicken wings aur ek mojito',
                        ].map(ex => (
                            <button key={ex} onClick={() => { setManualText(ex); parseOrder(ex) }}
                                className="px-3 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-purple-500/30 transition-all cursor-pointer">
                                "{ex}"
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Step: Parsed Order ─── */}
            {step === 'parsed' && parsedOrder && (
                <div className="space-y-4 animate-in">
                    {/* Transcription */}
                    {transcription && (
                        <div className="glass-card p-4">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Transcription</span>
                            <p className="text-white mt-1">"{transcription}"</p>
                        </div>
                    )}

                    {/* Parsed Items */}
                    <div className="glass-card p-5">
                        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                            🧾 Parsed Order
                            {parsedOrder.items.length > 0 && (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                    {parsedOrder.items.length} item{parsedOrder.items.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>

                        {parsedOrder.items.length > 0 ? (
                            <div className="space-y-2">
                                {parsedOrder.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-sm font-bold text-purple-300">
                                                x{item.qty}
                                            </span>
                                            <div>
                                                <span className="text-sm font-medium text-white">{item.name}</span>
                                                <div className="flex gap-2 mt-0.5">
                                                    {item.modifiers?.map((mod, j) => (
                                                        <span key={j} className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">
                                                            {mod}
                                                        </span>
                                                    ))}
                                                    <span className="text-xs text-slate-500">
                                                        Confidence: {item.match_confidence}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-400">₹{item.price * item.qty}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-3 border-t border-slate-700/50 mt-2">
                                    <span className="font-semibold text-slate-300">Total</span>
                                    <span className="font-bold text-lg text-emerald-400">₹{parsedOrder.total}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">No items matched. Try a different phrasing.</p>
                        )}
                    </div>

                    {/* Clarifications */}
                    {parsedOrder.clarifications?.length > 0 && (
                        <div className="glass-card p-5 border-amber-500/20">
                            <h4 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Needs Clarification</h4>
                            {parsedOrder.clarifications.map((c, i) => (
                                <div key={i} className="p-3 bg-amber-500/5 rounded-lg mb-2">
                                    <p className="text-sm text-slate-300">{c.message}</p>
                                    <p className="text-xs text-slate-500 mt-1">You said: "{c.spoken_text}"</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upsell Suggestion */}
                    {parsedOrder.upsell_suggestion && (
                        <div className="glass-card p-5 border-purple-500/20 bg-gradient-to-br from-purple-600/5 to-blue-600/5">
                            <h4 className="text-sm font-semibold text-purple-400 mb-2">💎 Upsell Suggestion</h4>
                            <p className="text-sm text-slate-300 mb-3">{parsedOrder.upsell_suggestion.message}</p>
                            <div className="flex gap-2">
                                {parsedOrder.upsell_suggestion.suggested_items.map((si, i) => (
                                    <span key={i} className="text-xs bg-purple-500/15 text-purple-300 px-2 py-1 rounded-lg">
                                        {si.name} — ₹{si.price} {si.is_hidden_star ? '💎' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    {parsedOrder.items.length > 0 && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => confirmOrder(false)}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? '⏳ Confirming...' : '✅ Confirm Order'}
                            </button>
                            {parsedOrder.upsell_suggestion && (
                                <button
                                    onClick={() => confirmOrder(true)}
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? '⏳...' : '💎 Confirm + Add Upsell'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Step: Confirmed ─── */}
            {step === 'confirmed' && confirmedOrder && (
                <div className="space-y-4 animate-in">
                    <div className="glass-card p-5 border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">✅</span>
                            <div>
                                <h3 className="font-semibold text-emerald-400">Order Confirmed!</h3>
                                <p className="text-xs text-slate-400">
                                    {confirmedOrder.order.order_id} · {confirmedOrder.order.timestamp?.slice(0, 19)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            {confirmedOrder.order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-slate-300">{item.name} x{item.qty || 1}</span>
                                    <span className="text-emerald-400">₹{item.price * (item.qty || 1)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t border-slate-700/50 font-bold">
                                <span>Total</span>
                                <span className="text-emerald-400">₹{confirmedOrder.order.total}</span>
                            </div>
                        </div>

                        {confirmedOrder.order.upsell_accepted && (
                            <p className="text-xs text-purple-400">💎 Upsell item added to order</p>
                        )}
                    </div>

                    {/* KOT */}
                    <div className="glass-card p-5">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            🧾 Kitchen Order Ticket (KOT)
                        </h4>
                        <div className="kot-display">{confirmedOrder.kot}</div>
                    </div>

                    {/* Order JSON */}
                    <div className="glass-card p-5">
                        <h4 className="text-sm font-semibold mb-3">📄 Order JSON (PoS Push)</h4>
                        <pre className="text-xs bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-cyan-300 leading-relaxed">
                            {JSON.stringify(confirmedOrder.order, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* ─── Order History Modal ─── */}
            {showOrders && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowOrders(false)}>
                    <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 mx-4"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">📋 Order History</h3>
                            <button onClick={() => setShowOrders(false)}
                                className="text-slate-400 hover:text-white text-lg cursor-pointer">✕</button>
                        </div>
                        {orders.length === 0 ? (
                            <p className="text-slate-400 text-sm">No orders placed yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {orders.slice().reverse().map((order, i) => (
                                    <div key={i} className="p-4 bg-slate-800/40 rounded-xl">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium text-purple-400">{order.order_id}</span>
                                            <span className="text-xs text-slate-500">{order.timestamp?.slice(0, 19)}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {order.items?.map((item, j) => (
                                                <div key={j} className="flex justify-between text-xs text-slate-300">
                                                    <span>{item.name} x{item.qty || 1}</span>
                                                    <span>₹{item.price * (item.qty || 1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/50 text-sm font-semibold">
                                            <span>Total</span>
                                            <span className="text-emerald-400">₹{order.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Loading overlay ─── */}
            {loading && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="glass-card p-8 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-300">Processing...</p>
                    </div>
                </div>
            )}
        </div>
    )
}
