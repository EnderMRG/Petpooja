import { useState, useEffect, useRef, useMemo } from 'react'
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

    const hiddenStarItems = useMemo(() => data.filter(i => i.classification === 'Hidden Star').map(i => i.name), [data])
    const riskItems = useMemo(() => data.filter(i => i.classification === 'Plowhorse').map(i => i.name), [data])
    const [hoverCard, setHoverCard] = useState(null)

    const statCards = [
        { label: 'Hidden Stars Found', value: hiddenCount, icon: 'grade', color: 'orange', change: '+12%', up: true, tooltipItems: hiddenStarItems },
        { label: 'Risk Items', value: riskCount, icon: 'warning', color: 'red', change: '-2%', up: false, tooltipItems: riskItems },
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
                    <div key={card.label} className="glass-card stat-card" style={{ position: 'relative' }}
                        onMouseEnter={() => setHoverCard(card.label)}
                        onMouseLeave={() => setHoverCard(null)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div className={`stat-icon ${card.color}`}>
                                <span className="material-symbols-outlined fill-1">{card.icon}</span>
                            </div>
                            <span className={`stat-badge ${card.up ? 'up' : 'down'}`}>{card.change}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 4 }}>{card.label}</p>
                        <h3 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{card.value}</h3>

                        {hoverCard === card.label && card.tooltipItems && card.tooltipItems.length > 0 && (
                            <div className="animate-in" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, zIndex: 100, width: 'max-content', maxWidth: 240, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', pointerEvents: 'none' }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Items in this category</p>
                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {card.tooltipItems.slice(0, 4).map(item => <li key={item} style={{ fontWeight: 500 }}>{item}</li>)}
                                    {card.tooltipItems.length > 4 && <li><i style={{ color: 'var(--text-tertiary)' }}>+ {card.tooltipItems.length - 4} more items</i></li>}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
