import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'

/* ─── Animated counter hook ─── */
function useCountUp(target, duration = 1200) {
    const [val, setVal] = useState(0)
    const ref = useRef()
    useEffect(() => {
        if (target === 0) { setVal(0); return }
        let start = 0
        const step = target / (duration / 16)
        clearInterval(ref.current)
        ref.current = setInterval(() => {
            start += step
            if (start >= target) { setVal(target); clearInterval(ref.current) }
            else setVal(Math.round(start))
        }, 16)
        return () => clearInterval(ref.current)
    }, [target, duration])
    return val
}

const PIE_COLORS = ['#f97415', '#fb923c', '#94a3b8', '#f87171']

export default function Dashboard({ onNavigate }) {
    const [data, setData] = useState([])
    const [combos, setCombos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch('/menu/analysis').then(r => r.json()),
            fetch('/menu/combos').then(r => r.json()),
        ]).then(([analysis, comboData]) => {
            setData(analysis.items || [])
            setCombos(comboData.combos || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const counts = useMemo(() => {
        const c = { Star: 0, 'Hidden Star': 0, Plowhorse: 0, Dog: 0 }
        data.forEach(i => { if (c[i.classification] !== undefined) c[i.classification]++ })
        return c
    }, [data])

    const avgMargin = useMemo(() =>
        data.length ? Math.round(data.reduce((s, i) => s + i.margin_pct, 0) / data.length) : 0
        , [data])

    const top10 = useMemo(() =>
        [...data].sort((a, b) => b.margin - a.margin).slice(0, 5).map(i => ({
            name: i.name.length > 20 ? i.name.slice(0, 18) + '…' : i.name,
            margin: i.margin,
        }))
        , [data])

    const pieData = useMemo(() => [
        { name: 'Stars', value: counts.Star },
        { name: 'Hidden Stars', value: counts['Hidden Star'] },
        { name: 'Plowhorses', value: counts.Plowhorse },
        { name: 'Dogs', value: counts.Dog },
    ], [counts])

    const totalItems = pieData.reduce((s, d) => s + d.value, 0)

    const hiddenCount = useCountUp(counts['Hidden Star'])
    const riskCount = useCountUp(counts.Plowhorse)
    const marginVal = useCountUp(avgMargin)
    const orderVal = useCountUp(127)

    const hiddenStarItems = useMemo(() => data.filter(i => i.classification === 'Hidden Star'), [data])
    const riskItems = useMemo(() => data.filter(i => i.classification === 'Plowhorse'), [data])
    const [modalData, setModalData] = useState(null) // { title, icon, color, items }

    const statCards = [
        { label: 'Hidden Stars Found', value: hiddenCount, icon: 'grade', color: 'orange', change: '+12%', up: true, clickData: { title: 'Hidden Stars', icon: 'grade', color: '#f59e0b', items: hiddenStarItems } },
        { label: 'Risk Items', value: riskCount, icon: 'warning', color: 'red', change: '-2%', up: false, clickData: { title: 'At-Risk Items (Plowhorses)', icon: 'warning', color: '#ef4444', items: riskItems } },
        { label: 'Avg Contribution Margin', value: `${marginVal}%`, icon: 'trending_up', color: 'green', change: '+5%', up: true },
        { label: 'Orders Today', value: orderVal, icon: 'shopping_bag', color: 'blue', change: '+18%', up: true },
    ]

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* ─── Stat Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                {statCards.map(card => (
                    <div key={card.label} className="glass-card stat-card"
                        style={{ position: 'relative', cursor: card.clickData ? 'pointer' : 'default' }}
                        onClick={() => card.clickData && setModalData(card.clickData)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div className={`stat-icon ${card.color}`}>
                                <span className="material-symbols-outlined fill-1">{card.icon}</span>
                            </div>
                            <span className={`stat-badge ${card.up ? 'up' : 'down'}`}>{card.change}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 4 }}>{card.label}</p>
                        <h3 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{card.value}</h3>
                        {card.clickData && <p style={{ fontSize: 11, color: 'var(--primary)', marginTop: 8, fontWeight: 600 }}>Click to view details →</p>}
                    </div>
                ))}
            </div>

            {/* ─── Detail Modal (portal) ─── */}
            {modalData && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setModalData(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 640, maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${modalData.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined fill-1" style={{ color: modalData.color, fontSize: 20 }}>{modalData.icon}</span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{modalData.title}</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{modalData.items.length} items</p>
                                </div>
                            </div>
                            <button onClick={() => setModalData(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>close</span>
                            </button>
                        </div>
                        {/* Table */}
                        <div style={{ maxHeight: 'calc(80vh - 70px)', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Name</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalData.items.map((item, i) => (
                                        <tr key={item.name} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                                <span style={{ background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{item.category}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>₹{item.selling_price}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>₹{item.food_cost}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>₹{item.margin}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                                    background: item.margin_pct >= 50 ? 'var(--accent-green-dim)' : item.margin_pct >= 30 ? 'var(--accent-orange-dim)' : 'var(--accent-red-dim)',
                                                    color: item.margin_pct >= 50 ? 'var(--accent-green)' : item.margin_pct >= 30 ? '#d97706' : 'var(--accent-red)',
                                                }}>{item.margin_pct}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* ─── Charts Row ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Bar Chart */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Top Items by Contribution Margin</h4>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Profitability</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {top10.map((item, idx) => {
                            const maxMargin = top10[0]?.margin || 1
                            const pct = Math.round((item.margin / maxMargin) * 100)
                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                                        <span>{item.name}</span>
                                        <span>₹{item.margin} avg</span>
                                    </div>
                                    <div style={{ width: '100%', background: '#f1f5f9', height: 10, borderRadius: 999, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #fb923c, #f97415)', borderRadius: 999, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Menu Category Breakdown</h4>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio Matrix</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: 192, height: 192, marginBottom: 24 }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                {totalItems > 0 && pieData.map((d, i) => {
                                    const pct = (d.value / totalItems) * 100
                                    const offset = pieData.slice(0, i).reduce((s, p) => s + (p.value / totalItems) * 100, 0)
                                    return (
                                        <circle key={i} cx="18" cy="18" r="16" fill="none"
                                            stroke={PIE_COLORS[i]} strokeWidth="3"
                                            strokeDasharray={`${pct} ${100 - pct}`}
                                            strokeDashoffset={`${-offset}`}
                                        />
                                    )
                                })}
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{totalItems > 0 ? Math.round((counts.Star / totalItems) * 100) : 0}%</span>
                                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500 }}>STARS</span>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', width: '100%', maxWidth: 280 }}>
                            {pieData.map((d, i) => (
                                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: PIE_COLORS[i] }} />
                                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                                        {d.name} ({totalItems > 0 ? Math.round((d.value / totalItems) * 100) : 0}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Top Combo Suggestions ─── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Today's Top Combo Suggestions</h4>
                    <a onClick={() => onNavigate('combos')} style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        View Engine <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                    </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {combos.slice(0, 3).map((combo, idx) => {
                        const labels = ['High Conversion', 'Dinner Special', 'Snack Combo']
                        const aovLift = Math.round(combo.lift * 55 + combo.confidence * 40)
                        return (
                            <div key={idx} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                                    {labels[idx] || `Bundle ${idx + 1}`}
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.5 }}>
                                    {combo.combo_items.map(i => i.name).join(' + ')}
                                </p>
                                <p style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
                                    Lift AOV by +₹{aovLift}
                                </p>
                                <button
                                    className="btn-outline btn-sm"
                                    style={{ marginTop: 'auto', width: '100%', padding: '10px 16px', borderWidth: 2, borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
                                    onClick={() => onNavigate('combos')}
                                >
                                    Promote
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
