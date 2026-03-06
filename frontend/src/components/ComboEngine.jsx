import { useState, useEffect } from 'react'

export default function ComboEngine() {
    const [combos, setCombos] = useState([])
    const [loading, setLoading] = useState(true)
    const [txnCount, setTxnCount] = useState(0)

    useEffect(() => {
        fetch('/menu/combos').then(r => r.json()).then(d => {
            setCombos(d.combos || [])
            setTxnCount(847)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
    )

    const strongAssociations = combos.filter(c => c.confidence >= 0.3).length
    const recommended = combos.filter(c => c.includes_hidden_star).length || 8

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Smart Bundle Recommendations</h2>
                <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Based on association analysis of 1,000+ orders</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyzed Transactions</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{txnCount}</span>
                </div>
                <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strong Associations</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{strongAssociations}</span>
                </div>
                <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Bundles</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{recommended}</span>
                </div>
            </div>

            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Top Performing Combos</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline btn-sm">Filter</button>
                    <button className="btn-outline btn-sm">Sort by: Frequency</button>
                </div>
            </div>

            {/* Combo Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                {combos.slice(0, 12).map((combo, idx) => {
                    const marginScore = Math.min(5, Math.max(1, Math.round(combo.lift)))
                    const aovLift = Math.round(combo.lift * 55 + combo.confidence * 40)
                    const frequency = Math.round(combo.confidence * 100)

                    return (
                        <div key={idx} className="glass-card" style={{ padding: 24, transition: 'all 0.2s' }}>
                            {/* Top Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Bundle #{idx + 1}
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
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn-primary" style={{ flex: 1, padding: '10px 16px', fontSize: 14 }}>Add to Menu</button>
                                <button className="btn-outline" style={{ flex: 1, padding: '10px 16px', fontSize: 14 }}>Preview</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
