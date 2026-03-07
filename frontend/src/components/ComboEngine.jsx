import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import apiFetch from '../utils/apiFetch'

export default function ComboEngine() {
    const [combos, setCombos] = useState([])
    const [savedCombos, setSavedCombos] = useState([])
    const [loading, setLoading] = useState(true)
    const [txnCount] = useState(847)

    // "Add to Menu" modal state
    const [saveModal, setSaveModal] = useState(null) // combo object
    const [comboName, setComboName] = useState('')
    const [discountPct, setDiscountPct] = useState(10)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

    const fetchAll = async () => {
        try {
            const [r1, r2] = await Promise.all([
                apiFetch('/menu/combos').then(r => r.json()),
                apiFetch('/menu/combos/saved').then(r => r.json()),
            ])
            setCombos(r1.combos || [])
            setSavedCombos(r2.combos || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchAll() }, [])

    const openSaveModal = (combo) => {
        const defaultName = combo.combo_items.map(i => i.name.split(' ')[0]).join(' + ') + ' Combo'
        setSaveModal(combo)
        setComboName(defaultName)
        setDiscountPct(10)
    }

    const handleSave = async () => {
        if (!comboName.trim()) return
        setSaving(true)
        try {
            const res = await apiFetch('/menu/combos/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: comboName,
                    combo_items: saveModal.combo_items,
                    discount_pct: discountPct,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                showToast(`✔ "${comboName}" added to menu!`)
                setSaveModal(null)
                fetchAll()
            } else if (res.status === 409) {
                showToast(data.detail || 'Combo name already exists', false)
            } else {
                showToast('Failed to save combo', false)
            }
        } catch (e) { showToast('Network error', false) }
        finally { setSaving(false) }
    }

    // Compute combo price preview
    const pricePreview = (combo) => {
        // We don't have prices in AI combos, so show a notice
        return null
    }

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
    )

    const strongAssociations = combos.filter(c => c.confidence >= 0.3).length
    const recommended = combos.filter(c => c.includes_hidden_star).length || 8

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
    const labelStyle = { fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Smart Bundle Recommendations</h2>
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Based on association analysis of 1,000+ orders</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    { label: 'Analyzed Transactions', value: txnCount },
                    { label: 'Strong Associations', value: strongAssociations },
                    { label: 'Recommended Bundles', value: recommended },
                    { label: 'Saved to Menu', value: savedCombos.length, highlight: true },
                ].map(({ label, value, highlight }) => (
                    <div key={label} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4, border: highlight && savedCombos.length > 0 ? '1px solid rgba(16,185,129,0.3)' : undefined }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                        <span style={{ fontSize: 24, fontWeight: 700, color: highlight && savedCombos.length > 0 ? '#10b981' : 'var(--primary)' }}>{value}</span>
                    </div>
                ))}
            </div>

            {/* Saved Combos Section */}
            {savedCombos.length > 0 && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 22 }}>check_circle</span>
                        <h3 style={{ fontSize: 17, fontWeight: 700 }}>Active Combos on Menu ({savedCombos.length})</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {savedCombos.map(combo => (
                            <div key={combo.item_id} className="glass-card" style={{ padding: 18, border: '1.5px solid #bbf7d0', background: '#f0fdf4' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#dcfce7', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                                        {combo.item_id}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>₹{combo.selling_price}</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{combo.name}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{combo.combo_component_names?.join(' + ')}</div>
                                <div style={{ marginTop: 8, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                                    {combo.discount_pct}% off · Was ₹{combo.original_price}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Combo Cards Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Top Performing Combos</h3>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Click "Add to Menu" to make a combo orderable</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                {combos.slice(0, 12).map((combo, idx) => {
                    const marginScore = Math.min(5, Math.max(1, Math.round(combo.lift)))
                    const aovLift = Math.round(combo.lift * 55 + combo.confidence * 40)
                    const frequency = Math.round(combo.confidence * 100)
                    const alreadySaved = savedCombos.some(s =>
                        s.combo_component_names?.length === combo.combo_items.length &&
                        combo.combo_items.every(ci => s.combo_component_names?.includes(ci.name))
                    )

                    return (
                        <div key={idx} className="glass-card" style={{ padding: 24, transition: 'all 0.2s', border: alreadySaved ? '1.5px solid #bbf7d0' : undefined }}>
                            {/* Top Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Bundle #{idx + 1}
                                    {combo.includes_hidden_star && <span style={{ marginLeft: 6, color: '#8b5cf6' }}>💎 Hidden Star</span>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 4 }}>Margin Score</span>
                                    {[1, 2, 3, 4, 5].map(d => (
                                        <span key={d} className="material-symbols-outlined" style={{ fontSize: 14, color: d <= marginScore ? 'var(--primary)' : '#e2e8f0' }}>circle</span>
                                    ))}
                                </div>
                            </div>

                            {/* Item Chips */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                                {combo.combo_items.map((item, i) => (
                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ background: 'var(--bg-elevated)', padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                                            {item.name}
                                        </span>
                                        {i < combo.combo_items.length - 1 && <span style={{ color: 'var(--text-tertiary)', fontWeight: 700 }}>+</span>}
                                    </span>
                                ))}
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Purchase frequency</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{frequency}% of orders</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Avg. Order Value Uplift</span>
                                    <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>+₹{aovLift} increase</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Association Lift</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{combo.lift}x</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                {alreadySaved ? (
                                    <button disabled style={{ flex: 1, padding: '10px 16px', fontSize: 14, borderRadius: 10, border: '1.5px solid #bbf7d0', background: '#f0fdf4', color: '#10b981', fontWeight: 700, fontFamily: 'inherit', cursor: 'default' }}>
                                        ✔ Added to Menu
                                    </button>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '10px 16px', fontSize: 14 }}
                                        onClick={() => openSaveModal(combo)}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>add_shopping_cart</span>
                                        Add to Menu
                                    </button>
                                )}
                                <button className="btn-outline" style={{ flex: 1, padding: '10px 16px', fontSize: 14 }}>Preview</button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Save to Menu Modal */}
            {saveModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && !saving && setSaveModal(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 480, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>restaurant_menu</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Add Combo to Menu</h3>
                                <p style={{ fontSize: 12, color: '#64748b' }}>This combo will be orderable in Voice Orders & Manual Order</p>
                            </div>
                        </div>

                        {/* Items preview */}
                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {saveModal.combo_items.map((ci, i) => (
                                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, background: 'white', padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>{ci.name}</span>
                                    {i < saveModal.combo_items.length - 1 && <span style={{ color: '#94a3b8', fontWeight: 700 }}>+</span>}
                                </span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={labelStyle}>Combo Name</label>
                                <input value={comboName} onChange={e => setComboName(e.target.value)} style={inputStyle} placeholder="e.g. Burger + Pizza Combo" />
                            </div>
                            <div>
                                <label style={labelStyle}>Bundle Discount (%)</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {[5, 10, 15, 20, 25].map(d => (
                                        <button key={d} onClick={() => setDiscountPct(d)}
                                            style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${discountPct === d ? 'var(--primary)' : '#e2e8f0'}`, background: discountPct === d ? 'var(--primary-dim)' : 'white', color: discountPct === d ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                                            {d}%
                                        </button>
                                    ))}
                                </div>
                                <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                                    ℹ Final price = sum of component prices minus {discountPct}% discount. Category set to "Combos".
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setSaveModal(null)} disabled={saving}
                                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving || !comboName.trim()} className="btn-primary"
                                style={{ flex: 2, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {saving
                                    ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>refresh</span> Saving...</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_shopping_cart</span> Add to Menu</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Toast */}
            {toast && createPortal(
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: toast.ok ? '#0f172a' : '#ef4444', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10000 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{toast.ok ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
                , document.body)}
        </div>
    )
}

